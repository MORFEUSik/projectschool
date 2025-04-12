// backend/internal/model/assignment.go
package model

import "time"

type Assignment struct {
	ID          uint      `gorm:"primaryKey"`
	CourseID    uint      `gorm:"not null" validate:"required"`
	Course      Course    `gorm:"foreignKey:CourseID"`
	Title       string    `gorm:"not null" validate:"required,min=3,max=255"`
	Description string    `gorm:"type:text"`
	DueDate     time.Time `validate:"required"`
	CreatedAt   time.Time `gorm:"default:current_timestamp"`
	UpdatedAt   time.Time `gorm:"autoUpdateTime"`
}
