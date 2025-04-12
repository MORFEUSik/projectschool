// backend/internal/model/achievement.go
package model

import "time"

type Achievement struct {
	ID          uint      `gorm:"primaryKey"`
	UserID      uint      `gorm:"not null" validate:"required"`
	User        User      `gorm:"foreignKey:UserID"`
	Title       string    `gorm:"type:varchar(255);not null" validate:"required"`
	Description string    `gorm:"type:text"`
	AwardedAt   time.Time `gorm:"default:current_timestamp"`
}
