package service

import (
	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/repository"
)

type NotificationService interface {
	Create(userID uint, message string) error
	GetByUserID(userID uint) ([]model.Notification, error)
}

type notificationService struct {
	repo repository.NotificationRepository
}

func NewNotificationService(repo repository.NotificationRepository) NotificationService {
	return &notificationService{repo: repo}
}

func (s *notificationService) Create(userID uint, message string) error {
	logger.Log.Infof("Creating notification for user %d: %s", userID, message)
	notification := &model.Notification{
		UserID:  userID,
		Message: message,
	}
	if err := notification.Validate(); err != nil {
		logger.Log.Errorf("Notification validation failed: %v", err)
		return err
	}
	if err := s.repo.Create(notification); err != nil {
		logger.Log.Errorf("Failed to create notification: %v", err)
		return err
	}
	logger.Log.Infof("Notification created for user %d", userID)
	return nil
}

func (s *notificationService) GetByUserID(userID uint) ([]model.Notification, error) {
	logger.Log.Infof("Fetching notifications for user %d", userID)
	notifications, err := s.repo.FindByUserID(userID)
	if err != nil {
		logger.Log.Errorf("Failed to fetch notifications for user %d: %v", userID, err)
		return nil, err
	}
	logger.Log.Infof("Fetched %d notifications for user %d", len(notifications), userID)
	return notifications, nil
}
