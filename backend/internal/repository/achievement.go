package repository

import (
	"github.com/MORFEUSik/projectschool/backend/internal/db"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"gorm.io/gorm"
)

type AchievementRepository interface {
	Create(achievement *model.Achievement) error
}

type achievementRepository struct {
	db *gorm.DB
}

func NewAchievementRepository() AchievementRepository {
	return &achievementRepository{db: db.DB}
}

func (r *achievementRepository) Create(achievement *model.Achievement) error {
	return r.db.Create(achievement).Error
}
