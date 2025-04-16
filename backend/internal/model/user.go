package model

import (
	"time"

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
	Password  string    `gorm:"not null" validate:"required,min=8" json:"-"`
	Role      Role      `gorm:"not null;default:student" validate:"required,oneof=student teacher admin" json:"role"`
	Points    uint      `gorm:"default:0" json:"points"`
	CreatedAt time.Time `gorm:"default:current_timestamp" json:"created_at"`
	UpdatedAt time.Time `gorm:"default:current_timestamp" json:"updated_at"`
}

func (u *User) Validate() error {
	validate := validator.New()
	return validate.Struct(u)
}
