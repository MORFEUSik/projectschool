package service

import (
	"errors"

	"github.com/MORFEUSik/projectschool/backend/internal/db"
	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/repository"
	"gorm.io/gorm"
)

type SubmissionService interface {
	Create(submission *model.Submission) error
}

type submissionService struct {
	repo       repository.SubmissionRepository
	userRepo   repository.UserRepository
	assignRepo repository.AssignmentRepository
	db         *gorm.DB
}

func NewSubmissionService(repo repository.SubmissionRepository, userRepo repository.UserRepository, assignRepo repository.AssignmentRepository) SubmissionService {
	return &submissionService{
		repo:       repo,
		userRepo:   userRepo,
		assignRepo: assignRepo,
		db:         db.DB,
	}
}

func (s *submissionService) Create(submission *model.Submission) error {
	logger.Log.Infof("Attempting to create submission for user %d, assignment %d, grade %.2f", submission.UserID, submission.AssignmentID, submission.Grade)

	// Проверка: существует ли задание
	logger.Log.Info("Checking assignment existence")
	assignment, err := s.assignRepo.FindByID(submission.AssignmentID)
	if err != nil {
		logger.Log.Errorf("Assignment %d not found: %v", submission.AssignmentID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("задание не найдено")
		}
		return err
	}
	logger.Log.Infof("Assignment %d found: %s", assignment.ID, assignment.Title)

	// Проверка: только одно решение на задание
	logger.Log.Info("Checking for existing submission")
	_, err = s.repo.FindByAssignmentAndUser(submission.AssignmentID, submission.UserID)
	if err == nil {
		logger.Log.Warnf("User %d already submitted for assignment %d", submission.UserID, submission.AssignmentID)
		return errors.New("решение уже отправлено")
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		logger.Log.Errorf("Error checking submission: %v", err)
		return err
	}
	logger.Log.Info("No existing submission found")

	// Транзакция
	logger.Log.Info("Starting transaction")
	return s.db.Transaction(func(tx *gorm.DB) error {
		logger.Log.Info("Creating submission in transaction")
		if err := tx.Create(submission).Error; err != nil {
			logger.Log.Errorf("Failed to create submission: %v", err)
			return err
		}

		logger.Log.Info("Fetching user for points update")
		var user model.User
		if err := tx.First(&user, submission.UserID).Error; err != nil {
			logger.Log.Errorf("Failed to find user %d: %v", submission.UserID, err)
			return err
		}
		logger.Log.Infof("User %d found: %s", user.ID, user.Username)

		if submission.Grade >= 4.0 {
			points := uint(submission.Grade * 2)
			user.Points += points
			logger.Log.Infof("Adding %d points to user %d", points, user.ID)
			if err := tx.Save(&user).Error; err != nil {
				logger.Log.Errorf("Failed to update user %d points: %v", user.ID, err)
				return err
			}
			logger.Log.Infof("Added %d points to user %d, new total: %d", points, user.ID, user.Points)
		} else {
			logger.Log.Infof("No points added for user %d, grade %.2f is too low", user.ID, submission.Grade)
		}

		logger.Log.Infof("Submission created successfully for user %d, assignment %d", submission.UserID, submission.AssignmentID)
		return nil
	})
}
