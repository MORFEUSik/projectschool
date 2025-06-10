package repository

import (
	"time"

	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"gorm.io/gorm"
)

// ActionLogWithUser — структура для возврата логов с данными пользователя
type ActionLogWithUser struct {
	model.UserActionLog
}

type ActionLogRepository interface {
	Create(log *model.UserActionLog) error
	FindAll(limit, offset int, excludeActions []string) ([]ActionLogWithUser, int64, error)
	FindByDateRange(startDate, endDate time.Time, excludeActions []string) ([]ActionLogWithUser, int64, error)
}

type actionLogRepository struct {
	db *gorm.DB
}

func NewActionLogRepository(db *gorm.DB) ActionLogRepository {
	return &actionLogRepository{db: db}
}

func (r *actionLogRepository) Create(log *model.UserActionLog) error {
	return r.db.Create(log).Error
}

func (r *actionLogRepository) FindAll(limit, offset int, excludeActions []string) ([]ActionLogWithUser, int64, error) {
	var logs []ActionLogWithUser
	var total int64

	query := r.db.Model(&model.UserActionLog{}).Preload("User")
	if len(excludeActions) > 0 {
		query = query.Where("action NOT IN ?", excludeActions)
	}

	if err := query.Count(&total).Error; err != nil {
		logger.Log.Errorf("Failed to count action logs: %v", err)
		return nil, 0, err
	}

	query = query.Limit(limit).Offset(offset).Order("created_at desc")
	if err := query.Find(&logs).Error; err != nil {
		logger.Log.Errorf("Failed to fetch action logs: %v", err)
		return nil, 0, err
	}

	logger.Log.Infof("Fetched %d action logs with %d total", len(logs), total)
	for _, log := range logs {
		logger.Log.Debugf("Log ID: %d, UserID: %d, User: %+v", log.ID, log.UserID, log.User)
	}

	return logs, total, nil
}

func (r *actionLogRepository) FindByDateRange(startDate, endDate time.Time, excludeActions []string) ([]ActionLogWithUser, int64, error) {
	var logs []ActionLogWithUser
	var total int64

	query := r.db.Model(&model.UserActionLog{}).Preload("User").
		Where("created_at BETWEEN ? AND ?", startDate, endDate)
	if len(excludeActions) > 0 {
		query = query.Where("action NOT IN ?", excludeActions)
	}

	if err := query.Count(&total).Error; err != nil {
		logger.Log.Errorf("Failed to count action logs by date range: %v", err)
		return nil, 0, err
	}

	query = query.Order("created_at desc")
	if err := query.Find(&logs).Error; err != nil {
		logger.Log.Errorf("Failed to fetch action logs by date range: %v", err)
		return nil, 0, err
	}

	logger.Log.Infof("Fetched %d action logs for date range with %d total", len(logs), total)
	for _, log := range logs {
		logger.Log.Debugf("Log ID: %d, UserID: %d, User: %+v", log.ID, log.UserID, log.User)
	}

	return logs, total, nil
}
