package model

import (
	"time"

	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/go-playground/validator/v10"
)

type Course struct {
	ID          uint      `gorm:"primaryKey"`
	Title       string    `gorm:"not null" validate:"required,min=3,max=100"`
	Description string    `gorm:"type:text"`
	TeacherID   uint      `gorm:"not null" validate:"required" json:"-"` // Игнорируем в JSON
	Teacher     User      `gorm:"foreignKey:TeacherID" validate:"-"`     // Игнорируем в валидации
	CreatedAt   time.Time `gorm:"default:current_timestamp"`
	UpdatedAt   time.Time `gorm:"autoUpdateTime"`
}

func (c *Course) Validate() error {
	logger.Log.Infof("Validating course: %+v", c)
	validate := validator.New()
	return validate.Struct(c)
}
