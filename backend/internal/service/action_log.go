package service

import (
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/repository"
	"gorm.io/gorm"
	"time"
)

type ActionLogService interface {
	Create(userID uint, action, details string) error
	GetAll(limit, offset int) ([]model.UserActionLog, int64, error)
}

type actionLogService struct {
	repo repository.ActionLogRepository
	db   *gorm.DB
}

func NewActionLogService(repo repository.ActionLogRepository, db *gorm.DB) ActionLogService {
	return &actionLogService{repo: repo, db: db}
}

func (s *actionLogService) Create(userID uint, action, details string) error {
	log := &model.UserActionLog{
		UserID:    userID,
		Action:    action,
		Details:   details,
		CreatedAt: time.Now(),
	}
	return s.repo.Create(log)
}

func (s *actionLogService) GetAll(limit, offset int) ([]model.UserActionLog, int64, error) {
	return s.repo.FindAll(limit, offset)
}
