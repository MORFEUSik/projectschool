// backend/internal/model/enrollment.go
package model

import "time"

type Enrollment struct {
	ID         uint      `gorm:"primaryKey"`
	UserID     uint      `gorm:"not null" validate:"required"`
	CourseID   uint      `gorm:"not null" validate:"required"`
	User       User      `gorm:"foreignKey:UserID"`
	Course     Course    `gorm:"foreignKey:CourseID"`
	EnrolledAt time.Time `gorm:"default:current_timestamp"`
}
