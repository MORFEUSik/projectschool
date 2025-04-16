package service

import (
	"github.com/MORFEUSik/projectschool/backend/internal/db"
	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/repository"
	"gorm.io/gorm"
)

type AchievementService interface {
	AwardAchievements(userID uint, points uint, submissions []model.Submission, courseCount int) error
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

func (s *achievementService) AwardAchievements(userID uint, points uint, submissions []model.Submission, courseCount int) error {
	logger.Log.Infof("Checking achievements for user %d with %d points, %d submissions, %d courses", userID, points, len(submissions), courseCount)

	var user model.User
	if err := s.db.First(&user, userID).Error; err != nil {
		logger.Log.Errorf("Failed to find user %d: %v", userID, err)
		return err
	}

	achievements := []struct {
		Condition func() bool
		Title     string
		Desc      string
	}{
		{ // Достижение за баллы
			Condition: func() bool { return points >= 50 },
			Title:     "Мастер",
			Desc:      "Набрано 50 баллов",
		},
		{
			Condition: func() bool { return points >= 100 },
			Title:     "Гуру",
			Desc:      "Набрано 100 баллов",
		},
		{ // Достижение за первый курс
			Condition: func() bool { return courseCount >= 1 },
			Title:     "Новичок обучения",
			Desc:      "Завершён первый курс",
		},
		{ // Достижение за участие в нескольких курсах
			Condition: func() bool { return courseCount >= 3 },
			Title:     "Любознательный",
			Desc:      "Записан на 3 курса",
		},
		{ // Достижение за серию успешных решений
			Condition: func() bool {
				if len(submissions) < 5 {
					return false
				}
				count := 0
				for _, sub := range submissions {
					if sub.Grade >= 4.0 {
						count++
						if count >= 5 {
							return true
						}
					} else {
						count = 0
					}
				}
				return false
			},
			Title: "Мастер решений",
			Desc:  "5 успешных решений подряд (оценка ≥4.0)",
		},
	}

	for _, ach := range achievements {
		if ach.Condition() {
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
