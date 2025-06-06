package service

import (
	"context"
	"errors"
	"fmt"
	"math"
	"strings"
	"time"

	"github.com/MORFEUSik/projectschool/backend/internal/db"
	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/repository"
	"gorm.io/gorm"
)

type SubmissionService interface {
	Create(submission *model.Submission) error
	SetGrade(submissionID, userID uint, grade float64) error
	ProcessQuizSubmission(assignmentID, userID uint, answers []model.SubtaskSubmission) (map[string]interface{}, error)
	GetByUserID(userID uint) ([]model.Submission, error)
	GetByAssignment(assignmentID uint) ([]model.Submission, error)
	GetUserSubmissions(ctx context.Context, userID uint) ([]model.Submission, error)
}

type submissionService struct {
	repo             repository.SubmissionRepository
	userRepo         repository.UserRepository
	assignmentRepo   repository.AssignmentRepository
	notificationRepo repository.NotificationRepository
	db               *gorm.DB
}

func NewSubmissionService(
	repo repository.SubmissionRepository,
	userRepo repository.UserRepository,
	assignmentRepo repository.AssignmentRepository,
	notificationRepo repository.NotificationRepository,
) SubmissionService {
	return &submissionService{
		repo:             repo,
		userRepo:         userRepo,
		assignmentRepo:   assignmentRepo,
		notificationRepo: notificationRepo,
		db:               db.DB,
	}
}

func (s *submissionService) Create(submission *model.Submission) error {
	logger.Log.Infof("Creating submission for user %d, assignment %d", submission.UserID, submission.AssignmentID)

	_, err := s.userRepo.FindByID(submission.UserID)
	if err != nil {
		logger.Log.Errorf("User %d not found: %v", submission.UserID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("пользователь не найден")
		}
		return err
	}

	assignment, err := s.assignmentRepo.FindByID(submission.AssignmentID)
	if err != nil {
		logger.Log.Errorf("Assignment %d not found: %v", submission.AssignmentID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("задание не найдено")
		}
		return err
	}

	var enrollment model.Enrollment
	err = s.db.Where("user_id = ? AND course_id = ?", submission.UserID, assignment.CourseID).First(&enrollment).Error
	if err != nil {
		logger.Log.Errorf("User %d not enrolled in course %d: %v", submission.UserID, assignment.CourseID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("пользователь не записан на курс")
		}
		return err
	}

	var existingSubmission model.Submission
	err = s.db.Where("user_id = ? AND assignment_id = ?", submission.UserID, submission.AssignmentID).First(&existingSubmission).Error
	if err == nil {
		logger.Log.Warnf("Submission already exists for user %d, assignment %d", submission.UserID, submission.AssignmentID)
		return errors.New("решение уже отправлено")
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		logger.Log.Errorf("Error checking existing submission: %v", err)
		return err
	}

	if err := s.repo.Create(submission); err != nil {
		logger.Log.Errorf("Failed to create submission: %v", err)
		return err
	}

	notification := &model.Notification{
		UserID:    submission.UserID,
		Message:   fmt.Sprintf("Вы отправили решение для задания #%d", submission.AssignmentID),
		IsRead:    false,
		CreatedAt: time.Now(),
	}
	if err := s.notificationRepo.Create(notification); err != nil {
		logger.Log.Errorf("Failed to create submission notification: %v", err)
	} else {
		logger.Log.Infof("Created submission notification for user %d: %s", submission.UserID, notification.Message)
	}

	logger.Log.Infof("Submission created for user %d, assignment %d", submission.UserID, submission.AssignmentID)
	return nil
}

func (s *submissionService) SetGrade(submissionID, userID uint, grade float64) error {
	logger.Log.Infof("Setting grade %f for submission %d by user %d", grade, submissionID, userID)

	var submission model.Submission
	if err := s.db.First(&submission, submissionID).Error; err != nil {
		logger.Log.Errorf("Submission %d not found: %v", submissionID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("решение не найдено")
		}
		return err
	}

	var user model.User
	if err := s.db.First(&user, userID).Error; err != nil {
		logger.Log.Errorf("User %d not found: %v", userID, err)
		return err
	}
	if user.Role != model.Teacher && user.Role != model.Admin {
		logger.Log.Warnf("User %d does not have permission to grade", userID)
		return errors.New("нет прав для оценки")
	}

	var assignment model.Assignment
	if err := s.db.First(&assignment, submission.AssignmentID).Error; err != nil {
		logger.Log.Errorf("Assignment %d not found: %v", submission.AssignmentID, err)
		return err
	}
	var course model.Course
	if err := s.db.First(&course, assignment.CourseID).Error; err != nil {
		logger.Log.Errorf("Course %d not found: %v", assignment.CourseID, err)
		return err
	}
	if user.Role == model.Teacher && course.TeacherID != userID {
		logger.Log.Warnf("Teacher %d does not own course %d", userID, assignment.CourseID)
		return errors.New("нет прав для оценки")
	}

	var submissionUser model.User
	var points uint
	err := s.db.Transaction(func(tx *gorm.DB) error {
		submission.Grade = grade
		if err := tx.Save(&submission).Error; err != nil {
			return err
		}

		if err := tx.First(&submissionUser, submission.UserID).Error; err != nil {
			return err
		}
		points = uint(math.Round(grade * float64(assignment.MaxScore) / 5.0))
		submissionUser.Points += points
		if err := tx.Save(&submissionUser).Error; err != nil {
			return err
		}
		logger.Log.Infof("Grade %f set for submission %d, added %d points to user %d", grade, submissionID, points, submission.UserID)
		return nil
	})
	if err != nil {
		logger.Log.Errorf("Failed to set grade and update points: %v", err)
		return err
	}

	notification := &model.Notification{
		UserID:    submission.UserID,
		Message:   fmt.Sprintf("Ваше решение для задания #%d оценено: %.2f", submission.AssignmentID, grade),
		IsRead:    false,
		CreatedAt: time.Now(),
	}
	if err := s.notificationRepo.Create(notification); err != nil {
		logger.Log.Errorf("Failed to create grade notification: %v", err)
	}

	achievementService := NewAchievementService(s.db)
	var submissions []model.Submission
	if err := s.db.Where("user_id = ?", submission.UserID).Find(&submissions).Error; err != nil {
		logger.Log.Errorf("Failed to fetch submissions for user %d: %v", submission.UserID, err)
		return err
	}
	var courseCount int64
	if err := s.db.Model(&model.Enrollment{}).Where("user_id = ?", submission.UserID).Count(&courseCount).Error; err != nil {
		logger.Log.Errorf("Failed to count courses for user %d: %v", submission.UserID, err)
		return err
	}
	newAchievements, err := achievementService.AwardAchievements(submission.UserID, submissionUser.Points, submissions, int(courseCount))
	if err != nil {
		logger.Log.Errorf("Failed to award achievements for user %d: %v", submission.UserID, err)
		return err
	}

	for _, ach := range newAchievements {
		notification := &model.Notification{
			UserID:    submission.UserID,
			Message:   fmt.Sprintf("Вы заработали достижение: %s", ach.Title),
			IsRead:    false,
			CreatedAt: time.Now(),
		}
		if err := s.notificationRepo.Create(notification); err != nil {
			logger.Log.Errorf("Failed to create achievement notification: %v", err)
		}
	}

	return nil
}

func (s *submissionService) GetByUserID(userID uint) ([]model.Submission, error) {
	logger.Log.Infof("Fetching submissions for user %d", userID)

	var submissions []model.Submission
	err := s.db.Preload("User").Preload("Assignment.Course").Where("user_id = ?", userID).Find(&submissions).Error
	if err != nil {
		logger.Log.Errorf("Failed to fetch submissions for user %d: %v", userID, err)
		return nil, err
	}

	logger.Log.Infof("Fetched %d submissions for user %d", len(submissions), userID)
	return submissions, nil
}

func (s *submissionService) GetByAssignment(assignmentID uint) ([]model.Submission, error) {
	logger.Log.Infof("Fetching submissions for assignment %d", assignmentID)

	// Проверяем существование задания
	_, err := s.assignmentRepo.FindByID(assignmentID)
	if err != nil {
		logger.Log.Errorf("Assignment %d not found: %v", assignmentID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("задание не найдено")
		}
		return nil, err
	}

	var submissions []model.Submission
	err = s.db.Preload("User").Preload("Assignment.Course").Where("assignment_id = ?", assignmentID).Find(&submissions).Error
	if err != nil {
		logger.Log.Errorf("Failed to fetch submissions for assignment %d: %v", assignmentID, err)
		return nil, err
	}

	logger.Log.Infof("Fetched %d submissions for assignment %d", len(submissions), assignmentID)
	return submissions, nil
}

func (s *submissionService) GetUserSubmissions(ctx context.Context, userID uint) ([]model.Submission, error) {
	logger.Log.Infof("Fetching submissions for user %d", userID)

	var submissions []model.Submission
	err := s.db.WithContext(ctx).
		Preload("User").
		Preload("Assignment.Course").
		Where("user_id = ?", userID).
		Find(&submissions).Error
	if err != nil {
		logger.Log.Errorf("Failed to fetch submissions for user %d: %v", userID, err)
		return nil, fmt.Errorf("failed to get user submissions: %w", err)
	}

	logger.Log.Infof("Fetched %d submissions for user %d", len(submissions), userID)
	return submissions, nil
}

func (s *submissionService) ProcessQuizSubmission(assignmentID, userID uint, answers []model.SubtaskSubmission) (map[string]interface{}, error) {
	logger.Log.Infof("Processing quiz submission for user %d, assignment %d", userID, assignmentID)

	assignment, err := s.assignmentRepo.FindByID(assignmentID)
	if err != nil {
		logger.Log.Errorf("Assignment %d not found: %v", assignmentID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("задание не найдено")
		}
		return nil, err
	}

	if assignment.DueDate.Before(time.Now()) {
		logger.Log.Warnf("Submission deadline passed for assignment %d", assignmentID)
		return nil, errors.New("дедлайн задания истёк")
	}

	var existingSubmission model.Submission
	err = s.db.Where("user_id = ? AND assignment_id = ?", userID, assignmentID).First(&existingSubmission).Error
	if err == nil {
		logger.Log.Warnf("Submission already exists for user %d, assignment %d", userID, assignmentID)
		return nil, errors.New("решение уже отправлено")
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		logger.Log.Errorf("Error checking existing submission: %v", err)
		return nil, err
	}

	var subtasks []model.Subtask
	if err := s.db.Where("assignment_id = ?", assignmentID).Find(&subtasks).Error; err != nil {
		logger.Log.Errorf("Failed to fetch subtasks for assignment %d: %v", assignmentID, err)
		return nil, err
	}
	if len(subtasks) == 0 {
		logger.Log.Errorf("No subtasks found for assignment %d", assignmentID)
		return nil, errors.New("подзадания не найдены")
	}
	subtaskMap := make(map[uint]model.Subtask)
	for _, st := range subtasks {
		subtaskMap[st.ID] = st
	}

	var totalScore float64
	responseAnswers := make([]map[string]interface{}, 0, len(answers))
	var totalWeight float64
	for _, st := range subtasks {
		if st.InputType == "text_input" {
			totalWeight += 2.0 // Учитывается как 2 обычных
		} else {
			totalWeight += 1.0
		}
	}
	subtaskScore := float64(assignment.MaxScore) / totalWeight

	for i, answer := range answers {
		subtask, ok := subtaskMap[answer.SubtaskID]
		if !ok {
			logger.Log.Warnf("Subtask %d not found for answer index %d", answer.SubtaskID, i)
			continue
		}

		// Проверяем наличие сохранённой попытки
		var subtaskSubmission model.SubtaskSubmission
		err = s.db.Where("user_id = ? AND subtask_id = ?", userID, answer.SubtaskID).First(&subtaskSubmission).Error
		if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			logger.Log.Errorf("Error checking subtask submission for SubtaskID %d: %v", answer.SubtaskID, err)
			return nil, err
		}

		isCorrect := strings.TrimSpace(strings.ToLower(answer.Answer)) == strings.TrimSpace(strings.ToLower(subtask.Answer))
		attempts := answer.Attempts
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			attempts = subtaskSubmission.Attempts
		}

		var weight float64
		if subtask.InputType == "text_input" {
			weight = 2.0
		} else {
			weight = 1.0
			numOptions := len(subtask.Options)
			if numOptions < 2 || numOptions > 6 {
				logger.Log.Errorf("Invalid number of options for SubtaskID %d: %d", answer.SubtaskID, numOptions)
				return nil, errors.New("некорректное количество вариантов ответа")
			}
		}

		// Подсчёт баллов
		var score float64
		if isCorrect {
			if attempts == 1 {
				score = subtaskScore * weight // полный балл
			} else if subtask.InputType != "text_input" && attempts < len(subtask.Options) {
				score = subtaskScore * weight * float64(len(subtask.Options)-attempts) / float64(len(subtask.Options)-1)
			} else {
				score = 0
			}
		}

		totalScore += score

		logger.Log.Infof("Processing answer for SubtaskID %d: UserAnswer='%s', CorrectAnswer='%s', IsCorrect=%v, Attempts=%d, Score=%.2f",
			answer.SubtaskID, answer.Answer, subtask.Answer, isCorrect, attempts, score)

		// Формируем ответ для клиента
		responseAnswer := map[string]interface{}{
			"SubtaskID": answer.SubtaskID,
			"Answer":    answer.Answer,
			"IsCorrect": isCorrect,
			"Attempts":  attempts,
			"Score":     score,
		}
		if !isCorrect {
			responseAnswer["CorrectAnswer"] = subtask.Answer
		}
		responseAnswers = append(responseAnswers, responseAnswer)

		// Сохраняем или обновляем подзадачу
		if errors.Is(err, gorm.ErrRecordNotFound) {
			answers[i].IsCorrect = isCorrect
			answers[i].UserID = userID
			if err := s.db.Create(&answers[i]).Error; err != nil {
				logger.Log.Errorf("Failed to save subtask submission for SubtaskID %d: %v", answer.SubtaskID, err)
				return nil, err
			}
		} else {
			if err := s.db.Model(&subtaskSubmission).Updates(map[string]interface{}{
				"answer":     answer.Answer,
				"is_correct": isCorrect,
				"attempts":   attempts,
			}).Error; err != nil {
				logger.Log.Errorf("Failed to update subtask submission for SubtaskID %d: %v", answer.SubtaskID, err)
				return nil, err
			}
		}
	}

	percent := totalScore / float64(assignment.MaxScore) * 100
	var grade float64
	switch {
	case percent >= 80:
		grade = 5
	case percent >= 60:
		grade = 4
	case percent >= 40:
		grade = 3
	case percent >= 20:
		grade = 2
	default:
		grade = 1
	}

	submission := model.Submission{
		AssignmentID: assignmentID,
		UserID:       userID,
		Grade:        grade,
	}
	if err := s.db.Create(&submission).Error; err != nil {
		logger.Log.Errorf("Failed to save submission: %v", err)
		return nil, err
	}

	points := uint(math.Round(totalScore))
	s.db.Model(&model.User{}).Where("id = ?", userID).Update("points", gorm.Expr("points + ?", points))

	msg := fmt.Sprintf("Ваше задание #%d оценено: %.1f", assignmentID, grade)
	s.notificationRepo.Create(&model.Notification{
		UserID:    userID,
		Message:   msg,
		IsRead:    false,
		CreatedAt: time.Now(),
	})

	response := map[string]interface{}{
		"grade":      grade,
		"totalScore": totalScore,
		"answers":    responseAnswers,
	}

	logger.Log.Infof("Quiz submission processed for user %d, assignment %d: grade=%.1f, totalScore=%.1f, answers=%+v",
		userID, assignmentID, grade, totalScore, responseAnswers)
	return response, nil
}
