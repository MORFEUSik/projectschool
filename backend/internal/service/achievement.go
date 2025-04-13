package service

import (
	"github.com/MORFEUSik/projectschool/backend/internal/db"
	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/repository"
	"gorm.io/gorm"
)

type AchievementService interface {
	AwardAchievements(userID uint, points uint) error
}

type achievementService struct {
	repo repository.AchievementRepository
	db   *gorm.DB
}

func NewAchievementService(repo repository.AchievementRepository) AchievementService {
	return &achievementService{
		repo: repo,
		db:   db.DB,
	}
}

func (s *achievementService) AwardAchievements(userID uint, points uint) error {
	logger.Log.Infof("Checking achievements for user %d with %d points", userID, points)

	var user model.User
	if err := s.db.First(&user, userID).Error; err != nil {
		logger.Log.Errorf("Failed to find user %d: %v", userID, err)
		return err
	}

	achievements := []struct {
		Points uint
		Title  string
		Desc   string
	}{
		{50, "Мастер", "Набрано 50 баллов"},
		{100, "Гуру", "Набрано 100 баллов"},
	}

	for _, ach := range achievements {
		if points >= ach.Points {
			var count int64
			s.db.Model(&model.Achievement{}).Where("user_id = ? AND title = ?", userID, ach.Title).Count(&count)
			if count == 0 {
				achievement := model.Achievement{
					UserID:      userID,
					Title:       ach.Title,
					Description: ach.Desc,
				}
				if err := s.repo.Create(&achievement); err != nil {
					logger.Log.Errorf("Failed to award %s to user %d: %v", ach.Title, userID, err)
					return err
				}
				logger.Log.Infof("Awarded %s to user %d", ach.Title, userID)
			}
		}
	}

	return nil
}
