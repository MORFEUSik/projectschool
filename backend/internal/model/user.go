package model

import (
	"fmt"
	"time"

	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/go-playground/validator/v10"
)

type Role string

const (
	Student Role = "student"
	Teacher Role = "teacher"
	Admin   Role = "admin"
)

type User struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Username  string    `gorm:"unique;not null" validate:"required,min=3,max=50" json:"username"`
	Email     string    `gorm:"unique;not null" validate:"required,email" json:"email"`
	Password  string    `gorm:"type:varchar(255);not null" validate:"required,min=8" json:"password"`
	Role      Role      `gorm:"type:varchar(50);not null;default:student" validate:"required,oneof=student teacher admin" json:"role"`
	Points    uint      `gorm:"default:0" json:"points"`
	CreatedAt time.Time `gorm:"default:current_timestamp" json:"created_at"`
	UpdatedAt time.Time `gorm:"default:current_timestamp" json:"updated_at"`
}

func (u *User) Validate() error {
	logger.Log.Infof("Validating user: email=%s, username=%s, role=%s", u.Email, u.Username, u.Role)
	validate := validator.New()
	if err := validate.Struct(u); err != nil {
		logger.Log.Errorf("Validation failed for user: email=%s, errors=%v", u.Email, err)
		return fmt.Errorf("ошибка валидации: %w", err)
	}
	return nil
}
