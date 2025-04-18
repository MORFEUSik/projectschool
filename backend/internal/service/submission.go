package service

import (
	"errors"
	"math"

	"github.com/MORFEUSik/projectschool/backend/internal/db"
	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/repository"
	"gorm.io/gorm"
)

type SubmissionService interface {
	Create(submission *model.Submission) error
	SetGrade(submissionID, userID uint, grade float64) error
	GetByUserID(userID uint) ([]model.Submission, error)
}

type submissionService struct {
	repo            repository.SubmissionRepository
	userRepo        repository.UserRepository
	assignmentRepo  repository.AssignmentRepository
	achievementRepo repository.AchievementRepository
	db              *gorm.DB
}

func NewSubmissionService(
	repo repository.SubmissionRepository,
	userRepo repository.UserRepository,
	assignmentRepo repository.AssignmentRepository,
	achievementRepo repository.AchievementRepository,
) SubmissionService {
	return &submissionService{
		repo:            repo,
		userRepo:        userRepo,
		assignmentRepo:  assignmentRepo,
		achievementRepo: achievementRepo,
		db:              db.DB,
	}
}

func (s *submissionService) Create(submission *model.Submission) error {
	logger.Log.Infof("Creating submission for user %d, assignment %d", submission.UserID, submission.AssignmentID)

	// Проверка: существует ли пользователь
	_, err := s.userRepo.FindByID(submission.UserID)
	if err != nil {
		logger.Log.Errorf("User %d not found: %v", submission.UserID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("пользователь не найден")
		}
		return err
	}

	// Проверка: существует ли задание
	assignment, err := s.assignmentRepo.FindByID(submission.AssignmentID)
	if err != nil {
		logger.Log.Errorf("Assignment %d not found: %v", submission.AssignmentID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("задание не найдено")
		}
		return err
	}

	// Проверка: принадлежит ли пользователь курсу
	var enrollment model.Enrollment
	err = s.db.Where("user_id = ? AND course_id = ?", submission.UserID, assignment.CourseID).First(&enrollment).Error
	if err != nil {
		logger.Log.Errorf("User %d not enrolled in course %d: %v", submission.UserID, assignment.CourseID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("пользователь не записан на курс")
		}
		return err
	}

	// Проверка: не отправлено ли решение ранее
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

	// Создание решения
	if err := s.repo.Create(submission); err != nil {
		logger.Log.Errorf("Failed to create submission: %v", err)
		return err
	}

	logger.Log.Infof("Submission created for user %d, assignment %d", submission.UserID, submission.AssignmentID)
	return nil
}

func (s *submissionService) SetGrade(submissionID, userID uint, grade float64) error {
	logger.Log.Infof("Setting grade %f for submission %d by user %d", grade, submissionID, userID)

	// Проверка: существует ли решение
	var submission model.Submission
	if err := s.db.First(&submission, submissionID).Error; err != nil {
		logger.Log.Errorf("Submission %d not found: %v", submissionID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("решение не найдено")
		}
		return err
	}

	// Проверка: имеет ли пользователь права (учитель или админ)
	var user model.User
	if err := s.db.First(&user, userID).Error; err != nil {
		logger.Log.Errorf("User %d not found: %v", userID, err)
		return err
	}
	if user.Role != model.Teacher && user.Role != model.Admin {
		logger.Log.Warnf("User %d does not have permission to grade", userID)
		return errors.New("нет прав для оценки")
	}

	// Проверка: принадлежит ли задание курсу, где пользователь — учитель
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

	// Установка оценки и начисление баллов в транзакции
	var submissionUser model.User
	var points uint
	err := s.db.Transaction(func(tx *gorm.DB) error {
		// Установка оценки
		submission.Grade = grade
		if err := tx.Save(&submission).Error; err != nil {
			return err
		}

		// Начисление баллов пользователю
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

	// Проверка достижений
	achievementService := NewAchievementService(s.achievementRepo)
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
	if err := achievementService.AwardAchievements(submission.UserID, submissionUser.Points, submissions, int(courseCount)); err != nil {
		logger.Log.Errorf("Failed to award achievements for user %d: %v", submission.UserID, err)
		return err
	}

	return nil
}

func (s *submissionService) GetByUserID(userID uint) ([]model.Submission, error) {
	logger.Log.Infof("Fetching submissions for user %d", userID)

	var submissions []model.Submission
	err := s.db.Where("user_id = ?", userID).Find(&submissions).Error
	if err != nil {
		logger.Log.Errorf("Failed to fetch submissions for user %d: %v", userID, err)
		return nil, err
	}

	logger.Log.Infof("Fetched %d submissions for user %d", len(submissions), userID)
	return submissions, nil
}
