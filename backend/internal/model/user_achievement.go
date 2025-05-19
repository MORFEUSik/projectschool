package model

import "time"

type UserAchievement struct {
	UserID        uint              `gorm:"primaryKey"`
	AchievementID uint              `gorm:"primaryKey"`
	AwardedAt     time.Time         `gorm:"default:current_timestamp"`
	User          User              `gorm:"foreignKey:UserID"`
	Achievement   GlobalAchievement `gorm:"foreignKey:AchievementID"`
}
