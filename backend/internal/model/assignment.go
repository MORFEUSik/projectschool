package model

import "time"

type Assignment struct {
	ID        uint   `gorm:"primaryKey"`
	Title     string `gorm:"not null"`
	Content   string
	DueDate   time.Time
	CourseID  uint `gorm:"not null"`
	Course    Course
	CreatedAt time.Time
	UpdatedAt time.Time
}
