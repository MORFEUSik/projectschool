package model

import (
	"time"

	"github.com/go-playground/validator/v10"
)

type Course struct {
	ID          uint      `gorm:"primaryKey"`
	Title       string    `gorm:"not null" validate:"required,min=3,max=100"`
	Description string    `gorm:"type:text"`
	TeacherID   uint      `gorm:"not null"`
	Teacher     User      `gorm:"foreignKey:TeacherID"`
	CreatedAt   time.Time `gorm:"default:current_timestamp"`
	UpdatedAt   time.Time `gorm:"autoUpdateTime"`
}

func (c *Course) Validate() error {
	validate := validator.New()
	return validate.Struct(c)
}
