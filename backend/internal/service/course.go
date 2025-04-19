package service

import (
	"errors"
	"github.com/MORFEUSik/projectschool/backend/internal/db"
	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/repository" // Проверяем этот импорт
	"gorm.io/gorm"
)

// CourseService определяет интерфейс для работы с курсами
type CourseService interface {
	Create(course *model.Course) error
	List(limit, offset int) ([]model.Course, error)
	Get(id uint) (*model.Course, error)
	PreloadTeacher(course *model.Course) error
	Enroll(userID, courseID uint) error
	Unenroll(userID, courseID uint) error
	Delete(userID, courseID uint) error
	GetStats(courseID uint) (map[string]interface{}, error)
}

// courseService реализует CourseService
type courseService struct {
	repo repository.CourseRepository
	db   *gorm.DB
}

// NewCourseService создаёт новый экземпляр CourseService
func NewCourseService(repo repository.CourseRepository) CourseService {
	return &courseService{
		repo: repo,
		db:   db.DB,
	}
}

// Create создаёт новый курс
func (s *courseService) Create(course *model.Course) error {
	return s.repo.Create(course)
}

// List возвращает список курсов с пагинацией
func (s *courseService) List(limit, offset int) ([]model.Course, error) {
	var courses []model.Course
	err := s.db.Preload("Teacher").Limit(limit).Offset(offset).Find(&courses).Error
	return courses, err
}

// Get возвращает курс по ID
func (s *courseService) Get(id uint) (*model.Course, error) {
	var course model.Course
	err := s.db.Preload("Teacher").First(&course, id).Error
	return &course, err
}

// PreloadTeacher подгружает данные учителя для курса
func (s *courseService) PreloadTeacher(course *model.Course) error {
	return s.db.Preload("Teacher").First(course, course.ID).Error
}

// Enroll записывает пользователя на курс
func (s *courseService) Enroll(userID, courseID uint) error {
	logger.Log.Infof("User %d enrolling in course %d", userID, courseID)

	// Проверка: существует ли курс
	course, err := s.repo.FindByID(courseID)
	if err != nil {
		logger.Log.Errorf("Course %d not found: %v", courseID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("курс не найден")
		}
		return err
	}

	// Проверка: существует ли пользователь
	var user model.User
	if err := s.db.First(&user, userID).Error; err != nil {
		logger.Log.Errorf("User %d not found: %v", userID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("пользователь не найден")
		}
		return err
	}

	// Проверка: является ли пользователь студентом
	if user.Role != model.Student {
		logger.Log.Warnf("User %d is not a student", userID)
		return errors.New("только студенты могут записываться на курсы")
	}

	// Проверка: не записан ли пользователь уже
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

	// Создание записи
	enrollment = model.Enrollment{
		UserID:   userID,
		CourseID: courseID,
	}
	if err := s.db.Create(&enrollment).Error; err != nil {
		logger.Log.Errorf("Failed to create enrollment: %v", err)
		return err
	}

	// Создание уведомления
	notificationService := NewNotificationService(repository.NewNotificationRepository())
	if err := notificationService.Create(userID, "Вы записались на курс: "+course.Title); err != nil {
		logger.Log.Errorf("Failed to create notification for user %d: %v", userID, err)
		// Не прерываем выполнение, так как уведомление не критично
	}

	logger.Log.Infof("User %d enrolled in course %d", userID, courseID)
	return nil
}

// Unenroll отменяет запись пользователя на курс
func (s *courseService) Unenroll(userID, courseID uint) error {
	logger.Log.Infof("User %d unenrolling from course %d", userID, courseID)

	// Проверка: существует ли курс
	_, err := s.repo.FindByID(courseID)
	if err != nil {
		logger.Log.Errorf("Course %d not found: %v", courseID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("курс не найден")
		}
		return err
	}

	// Проверка: существует ли пользователь
	var user model.User
	if err := s.db.First(&user, userID).Error; err != nil {
		logger.Log.Errorf("User %d not found: %v", userID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("пользователь не найден")
		}
		return err
	}

	// Проверка: является ли пользователь студентом
	if user.Role != model.Student {
		logger.Log.Warnf("User %d is not a student", userID)
		return errors.New("только студенты могут отменять запись на курсы")
	}

	// Проверка: записан ли пользователь
	var enrollment model.Enrollment
	err = s.db.Where("user_id = ? AND course_id = ?", userID, courseID).First(&enrollment).Error
	if err != nil {
		logger.Log.Errorf("Enrollment not found for user %d in course %d: %v", userID, courseID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("пользователь не записан на курс")
		}
		return err
	}

	// Удаление записи
	if err := s.db.Delete(&enrollment).Error; err != nil {
		logger.Log.Errorf("Failed to delete enrollment: %v", err)
		return err
	}

	logger.Log.Infof("User %d unenrolled from course %d", userID, courseID)
	return nil
}

// Delete удаляет курс
func (s *courseService) Delete(userID, courseID uint) error {
	logger.Log.Infof("User %d deleting course %d", userID, courseID)

	// Проверка: существует ли курс
	course, err := s.repo.FindByID(courseID)
	if err != nil {
		logger.Log.Errorf("Course %d not found: %v", courseID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("курс не найден")
		}
		return err
	}

	// Проверка: имеет ли пользователь права
	var user model.User
	if err := s.db.First(&user, userID).Error; err != nil {
		logger.Log.Errorf("User %d not found: %v", userID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("пользователь не найден")
		}
		return err
	}
	if user.Role == model.Teacher && course.TeacherID != userID {
		logger.Log.Warnf("Teacher %d does not own course %d", userID, courseID)
		return errors.New("нет прав для удаления курса")
	}
	if user.Role != model.Teacher && user.Role != model.Admin {
		logger.Log.Warnf("User %d does not have permission to delete course", userID)
		return errors.New("недостаточно прав")
	}

	// Удаление курса
	if err := s.repo.Delete(courseID); err != nil {
		logger.Log.Errorf("Failed to delete course %d: %v", courseID, err)
		return err
	}

	logger.Log.Infof("Course %d deleted by user %d", courseID, userID)
	return nil
}

// GetStats возвращает статистику по курсу
func (s *courseService) GetStats(courseID uint) (map[string]interface{}, error) {
	logger.Log.Infof("Fetching stats for course %d", courseID)

	// Проверка: существует ли курс
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
