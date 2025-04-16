package model

import (
	"time"

	"github.com/go-playground/validator/v10"
)

type Submission struct {
	ID           uint       `gorm:"primaryKey"`
	AssignmentID uint       `gorm:"not null" validate:"required"`
	Assignment   Assignment `gorm:"foreignKey:AssignmentID"`
	UserID       uint       `gorm:"not null" validate:"required"`
	User         User       `gorm:"foreignKey:UserID"`
	Content      string     `gorm:"type:text"`
	Grade        float64    `gorm:"type:numeric(5,2);default:0"`
	CreatedAt    time.Time  `gorm:"default:current_timestamp"`
	UpdatedAt    time.Time  `gorm:"autoUpdateTime"`
}

func (s *Submission) Validate() error {
	validate := validator.New()
	return validate.Struct(s)
}
