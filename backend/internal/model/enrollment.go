package model

import (
	"time"

	"github.com/go-playground/validator/v10"
)

type Enrollment struct {
	ID         uint      `gorm:"primaryKey"`
	UserID     uint      `gorm:"not null;index" validate:"required"`
	CourseID   uint      `gorm:"not null;index;foreignKey:CourseID;constraint:OnDelete:CASCADE" validate:"required"`
	User       User      `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
	Course     Course    `gorm:"foreignKey:CourseID;constraint:OnDelete:CASCADE"`
	EnrolledAt time.Time `gorm:"default:current_timestamp"`
}

func (e *Enrollment) Validate() error {
	validate := validator.New()
	return validate.Struct(e)
}
