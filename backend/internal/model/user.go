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
	ID          uint      `gorm:"primaryKey" json:"id"`
	Username    string    `gorm:"unique;not null" validate:"required,min=3,max=50" json:"username"`
	FullName    string    `gorm:"type:varchar(255)" validate:"omitempty,min=5,max=255" json:"full_name"` // Убираем required
	Email       string    `gorm:"unique;not null" validate:"required,email" json:"email"`
	Password    string    `gorm:"type:varchar(255);" validate:"omitempty,min=8,max=255" json:"password,omitempty"`
	Role        Role      `gorm:"type:varchar(50);not null;default:student" validate:"required,oneof=student teacher admin" json:"role"`
	ClassNumber uint      `gorm:"default:0" validate:"omitempty,gte=1,lte=11" json:"class_number"`
	Points      uint      `gorm:"default:0" json:"points"`
	CreatedAt   time.Time `gorm:"default:current_timestamp" json:"created_at"`
	UpdatedAt   time.Time `gorm:"default:current_timestamp" json:"updated_at"`
	AvatarURL   string    `json:"avatar_url"`
}

func (u *User) Validate() error {
	logger.Log.Infof("Validating user: email=%s, username=%s, role=%s", u.Email, u.Username, u.Role)
	validate := validator.New()
	if err := validate.Struct(u); err != nil {
		logger.Log.Errorf("Validation failed for user: email=%s, errors=%v", u.Email, err)
		return fmt.Errorf("ошибка валидации: %w", err)
	}
	if u.Role == Student && u.ClassNumber == 0 {
		return fmt.Errorf("для студентов необходимо указать номер класса (1-11)")
	}
	if u.Role != Student && u.ClassNumber != 0 {
		return fmt.Errorf("номер класса указывается только для студентов")
	}
	if (u.Role == Teacher || u.Role == Admin) && u.FullName == "" {
		return fmt.Errorf("для учителей и админов необходимо указать ФИО")
	}
	return nil
}
