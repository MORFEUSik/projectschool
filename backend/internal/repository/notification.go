package repository

import (
	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"gorm.io/gorm"
)

type NotificationRepository interface {
	Create(notification *model.Notification) error
	FindByUserID(userID uint) ([]model.Notification, error)
	MarkAsRead(id uint) error
}

type notificationRepository struct {
	db *gorm.DB
}

func NewNotificationRepository(db *gorm.DB) NotificationRepository {
	return &notificationRepository{db: db}
}

func (r *notificationRepository) Create(notification *model.Notification) error {
	err := r.db.Create(notification).Error
	if err != nil {
		logger.Log.Errorf("Failed to create notification for user %d: %v", notification.UserID, err)
		return err
	}
	logger.Log.Infof("Created notification for user %d: %s", notification.UserID, notification.Message)
	return nil
}

func (r *notificationRepository) FindByUserID(userID uint) ([]model.Notification, error) {
	var notifications []model.Notification
	err := r.db.Where("user_id = ?", userID).Order("created_at DESC").Find(&notifications).Error
	if err != nil {
		logger.Log.Errorf("Failed to fetch notifications for user %d: %v", userID, err)
		return nil, err
	}
	return notifications, nil
}

func (r *notificationRepository) MarkAsRead(id uint) error {
	err := r.db.Model(&model.Notification{}).Where("id = ?", id).Update("is_read", true).Error
	if err != nil {
		logger.Log.Errorf("Failed to mark notification %d as read: %v", id, err)
		return err
	}
	logger.Log.Infof("Marked notification %d as read", id)
	return nil
}
