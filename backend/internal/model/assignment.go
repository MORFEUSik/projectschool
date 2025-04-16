package model

import (
	"time"

	"github.com/go-playground/validator/v10"
)

type Assignment struct {
	ID               uint      `gorm:"primaryKey"`
	CourseID         uint      `gorm:"not null"`
	Title            string    `gorm:"type:text;not null" validate:"required,min=3"`
	Description      string    `gorm:"type:text"`
	DueDate          time.Time `gorm:"type:timestamp with time zone" validate:"required"`
	PointsMultiplier float64   `gorm:"type:numeric(5,2);default:2.0" validate:"gte=0"`
	CreatedAt        time.Time `gorm:"autoCreateTime"`
	UpdatedAt        time.Time
}

func (a *Assignment) Validate() error {
	validate := validator.New()
	return validate.Struct(a)
}
