package model

import "time"

type Assignment struct {
	ID               uint      `gorm:"primaryKey"`
	CourseID         uint      `gorm:"not null"`
	Title            string    `gorm:"type:text;not null"`
	Description      string    `gorm:"type:text"`
	DueDate          time.Time `gorm:"type:timestamp with time zone"`
	PointsMultiplier float64   `gorm:"type:numeric(5,2);default:2.0"`
	CreatedAt        time.Time `gorm:"autoCreateTime"`
	UpdatedAt        time.Time
}
