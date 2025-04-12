// backend/internal/model/submission.go
package model

import "time"

type Submission struct {
	ID           uint       `gorm:"primaryKey"`
	AssignmentID uint       `gorm:"not null" validate:"required"`
	Assignment   Assignment `gorm:"foreignKey:AssignmentID"`
	UserID       uint       `gorm:"not null" validate:"required"`
	User         User       `gorm:"foreignKey:UserID"`
	Content      string     `gorm:"type:text"`
	Grade        float64    `gorm:"type:numeric(5,2)"`
	CreatedAt    time.Time  `gorm:"default:current_timestamp"`
	UpdatedAt    time.Time  `gorm:"autoUpdateTime"`
}
