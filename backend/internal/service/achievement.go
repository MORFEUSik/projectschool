package service

import (
	"errors"
	"fmt"
	"time"

	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/repository"
	"github.com/MORFEUSik/projectschool/backend/internal/util"
	"gorm.io/gorm"
)

type AchievementService interface {
	AwardAchievements(userID uint, points uint, submissions []model.Submission, courseCount int) ([]model.GlobalAchievement, error)
	Create(achievement *model.GlobalAchievement, adminID uint) error
	Update(achievementID uint, achievement *model.GlobalAchievement, adminID uint) error
	Delete(achievementID uint, adminID uint) error
	ListAll() ([]model.GlobalAchievement, error)
}

type achievementService struct {
	db       *gorm.DB
	userRepo repository.UserRepository
	logRepo  repository.ActionLogRepository
}

func NewAchievementService(db *gorm.DB, userRepo repository.UserRepository, logRepo repository.ActionLogRepository) AchievementService {
	return &achievementService{
		db:       db,
		userRepo: userRepo,
		logRepo:  logRepo,
	}
}

func (s *achievementService) AwardAchievements(userID uint, points uint, submissions []model.Submission, courseCount int) ([]model.GlobalAchievement, error) {
	logger.Log.Infof("Checking achievements for user %d with %d points, %d submissions, %d courses", userID, points, len(submissions), courseCount)

	var user model.User
	if err := s.db.First(&user, userID).Error; err != nil {
		logger.Log.Errorf("Failed to find user %d: %v", userID, err)
		return nil, err
	}

	var globalAchievements []model.GlobalAchievement
	if err := s.db.Find(&globalAchievements).Error; err != nil {
		logger.Log.Errorf("Failed to load global achievements: %v", err)
		return nil, err
	}

	var newAchievements []model.GlobalAchievement
	for _, ach := range globalAchievements {
		conditionMet := false
		switch ach.ConditionType {
		case "points":
			conditionMet = points >= ach.Threshold
		case "courses":
			conditionMet = uint(courseCount) >= ach.Threshold
		case "submissions":
			if len(submissions) >= int(ach.Threshold) {
				count := 0
				for _, sub := range submissions {
					if sub.Grade >= 8.0 {
						count++
						if uint(count) >= ach.Threshold {
							conditionMet = true
							break
						}
					}
				}
			}
		default:
			logger.Log.Warnf("Unknown achievement condition type: %s", ach.ConditionType)
			continue
		}

		if conditionMet {
			var count int64
			s.db.Model(&model.UserAchievement{}).
				Where("user_id = ? AND achievement_id = ?", userID, ach.ID).
				Count(&count)
			if count == 0 {
				userAch := model.UserAchievement{
					UserID:        userID,
					AchievementID: ach.ID,
					AwardedAt:     time.Now(),
				}
				if err := s.db.Create(&userAch).Error; err != nil {
					logger.Log.Errorf("Failed to assign achievement %s to user %d: %v", ach.Title, userID, err)
					return nil, err
				}
				logger.Log.Infof("Assigned achievement %s to user %d", ach.Title, userID)
				newAchievements = append(newAchievements, ach)
			}
		}
	}

	if len(newAchievements) > 0 {
		util.LogUserAction(s.logRepo, userID, "award_achievement", fmt.Sprintf("Получено %d новых достижений", len(newAchievements)))
	}

	return newAchievements, nil
}

func (s *achievementService) Create(achievement *model.GlobalAchievement, adminID uint) error {
	logger.Log.Infof("Admin %d creating achievement: %s", adminID, achievement.Title)

	admin, err := s.userRepo.FindByID(adminID)
	if err != nil {
		logger.Log.Errorf("Admin %d not found: %v", adminID, err)
		return errors.New("админ не найден")
	}
	if admin.Role != model.Admin {
		logger.Log.Warnf("User %d is not an admin", adminID)
		return errors.New("недостаточно прав")
	}

	if achievement.Title == "" || achievement.ConditionType == "" || achievement.Threshold == 0 {
		logger.Log.Errorf("Achievement title, condition type, or threshold cannot be empty")
		return errors.New("название, тип условия или порог не могут быть пустыми")
	}

	if err := s.db.Create(achievement).Error; err != nil {
		logger.Log.Errorf("Failed to create achievement: %v", err)
		return err
	}

	logger.Log.Infof("Achievement %s created by admin %d", achievement.Title, adminID)
	util.LogUserAction(s.logRepo, adminID, "create_achievement", fmt.Sprintf("Создано достижение: %s", achievement.Title))
	return nil
}

func (s *achievementService) Update(achievementID uint, achievement *model.GlobalAchievement, adminID uint) error {
	logger.Log.Infof("Admin %d updating achievement %d", adminID, achievementID)

	admin, err := s.userRepo.FindByID(adminID)
	if err != nil {
		logger.Log.Errorf("Admin %d not found: %v", adminID, err)
		return errors.New("админ не найден")
	}
	if admin.Role != model.Admin {
		logger.Log.Warnf("User %d is not an admin", adminID)
		return errors.New("недостаточно прав")
	}

	var existing model.GlobalAchievement
	if err := s.db.First(&existing, achievementID).Error; err != nil {
		logger.Log.Errorf("Achievement %d not found: %v", achievementID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("достижение не найдено")
		}
		return err
	}

	if achievement.Title == "" || achievement.ConditionType == "" || achievement.Threshold == 0 {
		logger.Log.Errorf("Achievement title, condition type, or threshold cannot be empty")
		return errors.New("название, тип условия или порог не могут быть пустыми")
	}

	existing.Title = achievement.Title
	existing.Description = achievement.Description
	existing.ConditionType = achievement.ConditionType
	existing.Threshold = achievement.Threshold
	if err := s.db.Save(&existing).Error; err != nil {
		logger.Log.Errorf("Failed to update achievement %d: %v", achievementID, err)
		return err
	}

	logger.Log.Infof("Achievement %d updated by admin %d", achievementID, adminID)
	util.LogUserAction(s.logRepo, adminID, "update_achievement", fmt.Sprintf("Обновлено достижение ID: %d", achievementID))
	return nil
}

func (s *achievementService) Delete(achievementID uint, adminID uint) error {
	logger.Log.Infof("Admin %d deleting achievement %d", adminID, achievementID)

	admin, err := s.userRepo.FindByID(adminID)
	if err != nil {
		logger.Log.Errorf("Admin %d not found: %v", adminID, err)
		return errors.New("админ не найден")
	}
	if admin.Role != model.Admin {
		logger.Log.Warnf("User %d is not an admin", adminID)
		return errors.New("недостаточно прав")
	}

	var achievement model.GlobalAchievement
	if err := s.db.First(&achievement, achievementID).Error; err != nil {
		logger.Log.Errorf("Achievement %d not found: %v", achievementID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("достижение не найдено")
		}
		return err
	}

	if err := s.db.Delete(&achievement).Error; err != nil {
		logger.Log.Errorf("Failed to delete achievement %d: %v", achievementID, err)
		return err
	}

	logger.Log.Infof("Achievement %d deleted by admin %d", achievementID, adminID)
	util.LogUserAction(s.logRepo, adminID, "delete_achievement", fmt.Sprintf("Удалено достижение ID: %d", achievementID))
	return nil
}

func (s *achievementService) ListAll() ([]model.GlobalAchievement, error) {
	var achievements []model.GlobalAchievement
	if err := s.db.Find(&achievements).Error; err != nil {
		logger.Log.Errorf("Failed to list achievements: %v", err)
		return nil, err
	}
	util.LogUserAction(s.logRepo, 0, "list_achievements", "Запрошен список всех достижений")
	return achievements, nil
}
