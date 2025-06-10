package repository

import (
	"time"

	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"gorm.io/gorm"
)

// ActionLogWithUser — структура для возврата логов с данными пользователя
type ActionLogWithUser struct {
	ID        uint      `json:"id"`
	UserID    uint      `json:"user_id"`
	Action    string    `json:"action"`
	Details   string    `json:"details"`
	CreatedAt time.Time `json:"created_at"`
	User      struct {
		ID       uint   `json:"id"`
		Username string `json:"username"`
		FullName string `json:"full_name"`
		Role     string `json:"role"`
	} `json:"user"`
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

	query := r.db.Table("user_action_logs").
		Select("user_action_logs.id, user_action_logs.user_id, user_action_logs.action, user_action_logs.details, user_action_logs.created_at, COALESCE(users.id, 0) as user__id, COALESCE(users.username, '') as user__username, COALESCE(users.full_name, '') as user__full_name, COALESCE(users.role, '') as user__role").
		Joins("left join users on user_action_logs.user_id = users.id")

	if len(excludeActions) > 0 {
		query = query.Where("user_action_logs.action NOT IN ?", excludeActions)
	}

	if err := query.Count(&total).Error; err != nil {
		logger.Log.Errorf("Failed to count action logs: %v", err)
		return nil, 0, err
	}

	query = query.Limit(limit).Offset(offset).Order("user_action_logs.created_at desc")
	if err := query.Scan(&logs).Error; err != nil {
		logger.Log.Errorf("Failed to scan action logs: %v", err)
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

	query := r.db.Table("user_action_logs").
		Select("user_action_logs.id, user_action_logs.user_id, user_action_logs.action, user_action_logs.details, user_action_logs.created_at, COALESCE(users.id, 0) as user__id, COALESCE(users.username, '') as user__username, COALESCE(users.full_name, '') as user__full_name, COALESCE(users.role, '') as user__role").
		Joins("left join users on user_action_logs.user_id = users.id").
		Where("user_action_logs.created_at BETWEEN ? AND ?", startDate, endDate)

	if len(excludeActions) > 0 {
		query = query.Where("user_action_logs.action NOT IN ?", excludeActions)
	}

	if err := query.Count(&total).Error; err != nil {
		logger.Log.Errorf("Failed to count action logs by date range: %v", err)
		return nil, 0, err
	}

	query = query.Order("user_action_logs.created_at desc")
	if err := query.Scan(&logs).Error; err != nil {
		logger.Log.Errorf("Failed to scan action logs by date range: %v", err)
		return nil, 0, err
	}

	logger.Log.Infof("Fetched %d action logs for date range with %d total", len(logs), total)
	for _, log := range logs {
		logger.Log.Debugf("Log ID: %d, UserID: %d, User: %+v", log.ID, log.UserID, log.User)
	}

	return logs, total, nil
}
