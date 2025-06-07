package repository

import (
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"gorm.io/gorm"
)

type ActionLogRepository interface {
	Create(log *model.UserActionLog) error
	FindAll(limit, offset int) ([]model.UserActionLog, int64, error)
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

func (r *actionLogRepository) FindAll(limit, offset int) ([]model.UserActionLog, int64, error) {
	var logs []model.UserActionLog
	var total int64
	if err := r.db.Model(&model.UserActionLog{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	err := r.db.Limit(limit).Offset(offset).Order("created_at desc").Find(&logs).Error // Убрали Preload
	return logs, total, err
}
