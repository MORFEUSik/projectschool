// backend/internal/model/test.go
package model

import "time"

type Test struct {
	ID            uint       `gorm:"primaryKey"`
	AssignmentID  uint       `gorm:"not null" validate:"required"`
	Assignment    Assignment `gorm:"foreignKey:AssignmentID"`
	Question      string     `gorm:"type:text;not null" validate:"required"`
	Options       string     `gorm:"type:jsonb"`
	CorrectAnswer string     `gorm:"type:text"`
	CreatedAt     time.Time  `gorm:"default:current_timestamp"`
}
