package service

import (
	"errors"
	"time"

	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/repository"
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
		switch ach.Condition {
		case "points_50":
			conditionMet = points >= 50
		case "points_100":
			conditionMet = points >= 100
		case "courses_1":
			conditionMet = courseCount >= 1
		case "courses_3":
			conditionMet = courseCount >= 3
		case "submissions_5":
			if len(submissions) >= 5 {
				count := 0
				for _, sub := range submissions {
					if sub.Grade >= 4.0 {
						count++
						if count >= 5 {
							conditionMet = true
							break
						}
					} else {
						count = 0
					}
				}
			}
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

				// Логирование действия
				log := &model.UserActionLog{
					UserID:    userID,
					Action:    "award_achievement",
					Details:   "Пользователь получил достижение: " + ach.Title,
					CreatedAt: time.Now(),
				}
				if err := s.logRepo.Create(log); err != nil {
					logger.Log.Errorf("Failed to create action log: %v", err)
				}
			}
		}
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

	if achievement.Title == "" || achievement.Condition == "" {
		logger.Log.Errorf("Achievement title or condition cannot be empty")
		return errors.New("название или условие достижения не может быть пустым")
	}

	if err := s.db.Create(achievement).Error; err != nil {
		logger.Log.Errorf("Failed to create achievement: %v", err)
		return err
	}

	logger.Log.Infof("Achievement %s created by admin %d", achievement.Title, adminID)
	log := &model.UserActionLog{
		UserID:    adminID,
		Action:    "create_achievement",
		Details:   "Админ создал достижение: " + achievement.Title,
		CreatedAt: time.Now(),
	}
	if s.logRepo != nil {
		if err := s.logRepo.Create(log); err != nil {
			logger.Log.Errorf("Failed to create action log: %v", err)
		}
	} else {
		logger.Log.Warnf("logRepo is nil, skipping action log creation")
	}
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

	if achievement.Title == "" || achievement.Condition == "" {
		logger.Log.Errorf("Achievement title or condition cannot be empty")
		return errors.New("название или условие достижения не может быть пустым")
	}

	existing.Title = achievement.Title
	existing.Description = achievement.Description
	existing.Condition = achievement.Condition
	if err := s.db.Save(&existing).Error; err != nil {
		logger.Log.Errorf("Failed to update achievement %d: %v", achievementID, err)
		return err
	}

	logger.Log.Infof("Achievement %d updated by admin %d", achievementID, adminID)
	log := &model.UserActionLog{
		UserID:    adminID,
		Action:    "update_achievement",
		Details:   "Админ обновил достижение: " + achievement.Title,
		CreatedAt: time.Now(),
	}
	if s.logRepo != nil {
		if err := s.logRepo.Create(log); err != nil {
			logger.Log.Errorf("Failed to create action log: %v", err)
		}
	} else {
		logger.Log.Warnf("logRepo is nil, skipping action log creation")
	}
	return nil
}

func (s *achievementService) ListAll() ([]model.GlobalAchievement, error) {
	var achievements []model.GlobalAchievement
	if err := s.db.Find(&achievements).Error; err != nil {
		logger.Log.Errorf("Failed to list achievements: %v", err)
		return nil, err
	}
	log := &model.UserActionLog{
		UserID:    0,
		Action:    "list_achievements",
		Details:   "Запрошен список всех достижений",
		CreatedAt: time.Now(),
	}
	if s.logRepo != nil {
		if err := s.logRepo.Create(log); err != nil {
			logger.Log.Errorf("Failed to create action log: %v", err)
		}
	} else {
		logger.Log.Warnf("logRepo is nil, skipping action log creation")
	}
	return achievements, nil
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

	// Удаление записи из global_achievements (user_achievements удаляются автоматически благодаря ON DELETE CASCADE)
	if err := s.db.Delete(&achievement).Error; err != nil {
		logger.Log.Errorf("Failed to delete achievement %d: %v", achievementID, err)
		return err
	}

	logger.Log.Infof("Achievement %d deleted by admin %d", achievementID, adminID)
	log := &model.UserActionLog{
		UserID:    adminID,
		Action:    "delete_achievement",
		Details:   "Админ удалил достижение: " + achievement.Title,
		CreatedAt: time.Now(),
	}
	if s.logRepo != nil {
		if err := s.logRepo.Create(log); err != nil {
			logger.Log.Errorf("Failed to create action log: %v", err)
		}
	} else {
		logger.Log.Warnf("logRepo is nil, skipping action log creation")
	}
	return nil
}
