// backend/internal/model/course.go
package model

import "time"

type Course struct {
	ID          uint      `gorm:"primaryKey"`
	Title       string    `gorm:"not null" validate:"required,min=3,max=100"`
	Description string    `gorm:"type:text"`
	TeacherID   uint      `gorm:"not null"`
	Teacher     User      `gorm:"foreignKey:TeacherID"`
	CreatedAt   time.Time `gorm:"default:current_timestamp"`
	UpdatedAt   time.Time `gorm:"autoUpdateTime"`
}
