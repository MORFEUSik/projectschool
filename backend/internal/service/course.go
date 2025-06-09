package service

import (
	"context"
	"errors"
	"fmt"
	"strconv"
	"time"

	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/repository"
	"gorm.io/gorm"
)

type CourseService interface {
	Create(course *model.Course) error
	List(ctx context.Context, limit, offset int, userID uint) ([]model.Course, int, error)
	Get(id uint) (*model.Course, error)
	PreloadTeacher(course *model.Course) error
	Enroll(userID, courseID uint) error
	Unenroll(userID, courseID uint) error
	Delete(userID, courseID uint) error
	GetStats(courseID uint) (map[string]interface{}, error)
	GetProgress(userID, courseID uint) (map[string]interface{}, error)
	CheckDeadlines() error
}

type courseService struct {
	repo             repository.CourseRepository
	userRepo         repository.UserRepository
	notificationRepo repository.NotificationRepository
	logRepo          repository.ActionLogRepository // Добавляем
	db               *gorm.DB
}

func NewCourseService(
	repo repository.CourseRepository,
	notificationRepo repository.NotificationRepository,
	userRepo repository.UserRepository,
	logRepo repository.ActionLogRepository, // Добавляем
	db *gorm.DB,
) CourseService {
	return &courseService{
		repo:             repo,
		userRepo:         userRepo,
		notificationRepo: notificationRepo,
		logRepo:          logRepo, // Добавляем
		db:               db,
	}
}

func (s *courseService) Create(course *model.Course) error {
	logger.Log.Infof("Creating course: %s", course.Title)
	if err := course.Validate(); err != nil {
		logger.Log.Errorf("Course validation failed: %v", err)
		return fmt.Errorf("ошибка валидации: %v", err)
	}
	err := s.repo.Create(course)
	if err != nil {
		logger.Log.Errorf("Failed to create course: %v", err)
		return err
	}
	logger.Log.Infof("Course %s created successfully", course.Title)
	return nil
}

func (s *courseService) List(ctx context.Context, limit, offset int, userID uint) ([]model.Course, int, error) {
	logger.Log.Infof("Получение курсов с лимитом %d, смещением %d для пользователя %d", limit, offset, userID)
	var courses []model.Course
	var total int64

	user, err := s.userRepo.FindByID(userID)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		logger.Log.Errorf("Не удалось найти пользователя %d: %v", userID, err)
		return nil, 0, err
	}

	query := s.db.WithContext(ctx).Model(&model.Course{}).Preload("Teacher")

	// Обработка фильтра class_number
	skipClassFilter := false
	if raw := ctx.Value("class_number"); raw != nil {
		strVal := fmt.Sprintf("%v", raw)
		logger.Log.Infof("Получен class_number из контекста: %s", strVal)

		if strVal == "all" {
			skipClassFilter = true
			logger.Log.Infof("class_number=all: фильтрация по классу отключена")
		} else if num, err := strconv.Atoi(strVal); err == nil && num >= 1 && num <= 11 {
			query = query.Where("class_number = ?", num)
			logger.Log.Infof("Применён фильтр по классу: %d", num)
			skipClassFilter = true
		} else {
			logger.Log.Warnf("Некорректный class_number: %v", strVal)
		}
	} else {
		logger.Log.Info("class_number не указан в контексте")
	}

	// Если фильтр не был применён и это студент, фильтруем по его классу
	if !skipClassFilter && user != nil && user.Role == model.Student && user.ClassNumber >= 1 && user.ClassNumber <= 11 {
		query = query.Where("class_number = ?", user.ClassNumber)
		logger.Log.Infof("Фильтр по классу студента: %d", user.ClassNumber)
	}

	if err := query.Count(&total).Error; err != nil {
		logger.Log.Errorf("Ошибка при подсчёте курсов: %v", err)
		return nil, 0, err
	}

	query = query.Order("subject ASC, class_number ASC, created_at DESC")

	if err := query.Limit(limit).Offset(offset).Find(&courses).Error; err != nil {
		logger.Log.Errorf("Ошибка при получении курсов: %v", err)
		return nil, 0, err
	}

	logger.Log.Infof("Получено %d курсов из %d всего", len(courses), total)
	return courses, int(total), nil
}

func (s *courseService) Get(id uint) (*model.Course, error) {
	logger.Log.Infof("Fetching course %d", id)
	var course model.Course
	err := s.db.Preload("Teacher").First(&course, id).Error
	if err != nil {
		logger.Log.Errorf("Failed to fetch course %d: %v", id, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("курс не найден")
		}
		return nil, err
	}
	logger.Log.Infof("Fetched course %d", id)
	return &course, nil
}

func (s *courseService) PreloadTeacher(course *model.Course) error {
	logger.Log.Infof("Preloading teacher for course %d", course.ID)
	err := s.db.Preload("Teacher").First(course, course.ID).Error
	if err != nil {
		logger.Log.Errorf("Failed to preload teacher for course %d: %v", course.ID, err)
		return err
	}
	return nil
}

func (s *courseService) Enroll(userID, courseID uint) error {
	logger.Log.Infof("User %d enrolling in course %d", userID, courseID)

	course, err := s.repo.FindByID(courseID)
	if err != nil {
		logger.Log.Errorf("Course %d not found: %v", courseID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("курс не найден")
		}
		return err
	}

	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		logger.Log.Errorf("User %d not found: %v", userID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("пользователь не найден")
		}
		return err
	}

	if user.Role != model.Student {
		logger.Log.Warnf("User %d is not a student", userID)
		return errors.New("только студенты могут записываться на курсы")
	}

	var enrollment model.Enrollment
	err = s.db.Where("user_id = ? AND course_id = ?", userID, courseID).First(&enrollment).Error
	if err == nil {
		logger.Log.Warnf("User %d already enrolled in course %d", userID, courseID)
		return errors.New("пользователь уже записан на курс")
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		logger.Log.Errorf("Error checking enrollment: %v", err)
		return err
	}

	enrollment = model.Enrollment{
		UserID:     userID,
		CourseID:   courseID,
		EnrolledAt: time.Now(),
	}
	if err := s.db.Create(&enrollment).Error; err != nil {
		logger.Log.Errorf("Failed to create enrollment: %v", err)
		return err
	}

	notification := &model.Notification{
		UserID:    userID,
		Message:   fmt.Sprintf("Вы записались на курс: %s", course.Title),
		IsRead:    false,
		CreatedAt: time.Now(),
	}
	if err := s.notificationRepo.Create(notification); err != nil {
		logger.Log.Errorf("Failed to create enrollment notification for user %d: %v", userID, err)
	}

	achievementService := NewAchievementService(s.db, s.userRepo, s.logRepo)
	var submissions []model.Submission
	if err := s.db.Where("user_id = ?", userID).Find(&submissions).Error; err != nil {
		logger.Log.Errorf("Failed to fetch submissions for user %d: %v", userID, err)
	}
	var courseCount int64
	if err := s.db.Model(&model.Enrollment{}).Where("user_id = ?", userID).Count(&courseCount).Error; err != nil {
		logger.Log.Errorf("Failed to count courses for user %d: %v", userID, err)
	}
	newAchievements, err := achievementService.AwardAchievements(userID, user.Points, submissions, int(courseCount))
	if err != nil {
		logger.Log.Errorf("Failed to award achievements for user %d: %v", userID, err)
	} else if len(newAchievements) > 0 {
		logger.Log.Infof("Awarded %d new achievements to user %d", len(newAchievements), userID)
		for _, ach := range newAchievements {
			notification := &model.Notification{
				UserID:    userID,
				Message:   fmt.Sprintf("Вы заработали достижение: %s", ach.Title),
				IsRead:    false,
				CreatedAt: time.Now(),
			}
			if err := s.notificationRepo.Create(notification); err != nil {
				logger.Log.Errorf("Failed to create achievement notification for user %d: %v", userID, err)
			}
		}
	}

	logger.Log.Infof("User %d enrolled in course %d", userID, courseID)
	return nil
}

func (s *courseService) Unenroll(userID, courseID uint) error {
	logger.Log.Infof("User %d unenrolling from course %d", userID, courseID)

	_, err := s.repo.FindByID(courseID)
	if err != nil {
		logger.Log.Errorf("Course %d not found: %v", courseID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("курс не найден")
		}
		return err
	}

	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		logger.Log.Errorf("User %d not found: %v", userID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("пользователь не найден")
		}
		return err
	}

	if user.Role != model.Student {
		logger.Log.Warnf("User %d is not a student", userID)
		return errors.New("только студенты могут отменять запись на курсы")
	}

	var enrollment model.Enrollment
	err = s.db.Where("user_id = ? AND course_id = ?", userID, courseID).First(&enrollment).Error
	if err != nil {
		logger.Log.Errorf("Enrollment not found for user %d in course %d: %v", userID, courseID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("пользователь не записан на курс")
		}
		return err
	}

	if err := s.db.Delete(&enrollment).Error; err != nil {
		logger.Log.Errorf("Failed to delete enrollment: %v", err)
		return err
	}

	logger.Log.Infof("User %d unenrolled from course %d", userID, courseID)
	return nil
}

func (s *courseService) Delete(userID, courseID uint) error {
	logger.Log.Infof("User %d deleting course %d", userID, courseID)

	course, err := s.repo.FindByID(courseID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("курс не найден")
		}
		return err
	}

	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("пользователь не найден")
		}
		return err
	}

	if user.Role != model.Admin && (user.Role != model.Teacher || course.TeacherID != userID) {
		return errors.New("нет прав для удаления курса")
	}

	if err := s.repo.Delete(courseID); err != nil {
		return fmt.Errorf("ошибка при удалении курса: %w", err)
	}

	logger.Log.Infof("Course %d deleted by user %d", courseID, userID)
	return nil
}

func (s *courseService) GetStats(courseID uint) (map[string]interface{}, error) {
	logger.Log.Infof("Fetching stats for course %d", courseID)

	_, err := s.repo.FindByID(courseID)
	if err != nil {
		logger.Log.Errorf("Course %d not found: %v", courseID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("курс не найден")
		}
		return nil, err
	}

	stats, err := s.repo.GetStats(courseID)
	if err != nil {
		logger.Log.Errorf("Failed to fetch stats for course %d: %v", courseID, err)
		return nil, err
	}

	logger.Log.Infof("Stats fetched for course %d", courseID)
	return stats, nil
}

func (s *courseService) GetProgress(userID, courseID uint) (map[string]interface{}, error) {
	logger.Log.Infof("Fetching progress for user %d in course %d", userID, courseID)

	var enrollment model.Enrollment
	if err := s.db.Where("user_id = ? AND course_id = ?", userID, courseID).First(&enrollment).Error; err != nil {
		logger.Log.Errorf("User %d not enrolled in course %d: %v", userID, courseID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("пользователь не записан на курс")
		}
		return nil, err
	}

	var course model.Course
	if err := s.db.Preload("Assignments.Submissions").First(&course, courseID).Error; err != nil {
		logger.Log.Errorf("Course %d not found: %v", courseID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("курс не найден")
		}
		return nil, err
	}

	totalAssignments := len(course.Assignments)
	var completedAssignments int
	var totalPoints float64

	for _, assignment := range course.Assignments {
		for _, submission := range assignment.Submissions {
			if submission.UserID == userID && submission.Grade != 0 {
				completedAssignments++
				totalPoints += submission.Grade * float64(assignment.MaxScore) / 5.0
			}
		}
	}

	completionRate := 0.0
	if totalAssignments > 0 {
		completionRate = float64(completedAssignments) / float64(totalAssignments) * 100
	}

	logger.Log.Infof("Progress for user %d in course %d: %d/%d assignments, %.2f points, %.2f%% completion",
		userID, courseID, completedAssignments, totalAssignments, totalPoints, completionRate)

	return map[string]interface{}{
		"total_assignments":     totalAssignments,
		"completed_assignments": completedAssignments,
		"completion_rate":       fmt.Sprintf("%.2f", completionRate),
		"total_points":          fmt.Sprintf("%.2f", totalPoints),
	}, nil
}

func (s *courseService) CheckDeadlines() error {
	deadlineThreshold := time.Now().Add(24 * time.Hour)
	var assignments []model.Assignment
	if err := s.db.
		Where("due_date BETWEEN ? AND ?", time.Now(), deadlineThreshold).
		Preload("Course").
		Find(&assignments).Error; err != nil {
		return err
	}
	for _, assignment := range assignments {
		var enrollments []model.Enrollment
		if err := s.db.Where("course_id = ?", assignment.CourseID).Find(&enrollments).Error; err != nil {
			continue
		}
		for _, enrollment := range enrollments {
			msg := fmt.Sprintf("Дедлайн задания '%s' на курсе '%s' приближается (%s)!", assignment.Title, assignment.Course.Title, assignment.DueDate.Format(time.RFC1123))
			_ = s.notificationRepo.Create(&model.Notification{
				UserID:    enrollment.UserID,
				Message:   msg,
				IsRead:    false,
				CreatedAt: time.Now(),
			})
		}
	}
	return nil
}
