package service

import (
	"errors"

	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/repository"
	"gorm.io/gorm"
)

type NotificationService interface {
	Create(notification *model.Notification) error
	GetByUserID(userID uint) ([]model.Notification, error)
	MarkAsRead(id uint, userID uint) error
}

type notificationService struct {
	repo repository.NotificationRepository
	db   *gorm.DB
}

func NewNotificationService(repo repository.NotificationRepository, db *gorm.DB) NotificationService {
	return &notificationService{repo: repo, db: db}
}

func (s *notificationService) Create(notification *model.Notification) error {
	return s.repo.Create(notification)
}

func (s *notificationService) GetByUserID(userID uint) ([]model.Notification, error) {
	return s.repo.FindByUserID(userID)
}

func (s *notificationService) MarkAsRead(id uint, userID uint) error {
	var notification model.Notification
	if err := s.db.First(&notification, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("уведомление не найдено")
		}
		return err
	}
	if notification.UserID != userID {
		return errors.New("недостаточно прав")
	}
	return s.repo.MarkAsRead(id)
}
