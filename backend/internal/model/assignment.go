package model

import (
	"time"

	"github.com/go-playground/validator/v10"
)

type Assignment struct {
	ID          uint      `gorm:"primaryKey"`
	CourseID    uint      `gorm:"not null" validate:"required"`
	Title       string    `gorm:"not null" validate:"required,min=3,max=100"`
	Description string    `gorm:"type:text"`
	MaxScore    uint      `gorm:"not null" validate:"required,gte=0"`
	DueDate     time.Time `validate:"required"`
	CreatedAt   time.Time `gorm:"default:current_timestamp"`
	UpdatedAt   time.Time `gorm:"autoUpdateTime"`
}

func (a *Assignment) Validate() error {
	validate := validator.New()
	return validate.Struct(a)
}
