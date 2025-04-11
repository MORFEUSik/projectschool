package model

import "time"

type Submission struct {
	ID           uint `gorm:"primaryKey"`
	AssignmentID uint `gorm:"not null"`
	StudentID    uint `gorm:"not null"`
	Content      string
	Grade        *int // Может быть nil
	CreatedAt    time.Time
	UpdatedAt    time.Time

	Assignment Assignment
	Student    User `gorm:"foreignKey:StudentID"`
}
