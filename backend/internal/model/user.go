// backend/internal/model/user.go
package model

import (
	"time"

	"github.com/go-playground/validator/v10"
)

type Role string

const (
	Admin   Role = "admin"
	Teacher Role = "teacher"
	Student Role = "student"
)

type User struct {
	ID        uint      `gorm:"primaryKey"`
	Username  string    `gorm:"type:varchar(100);unique" validate:"required,min=3,max=100"`
	Password  string    `gorm:"type:varchar(255)" validate:"required,min=6"`
	Email     string    `gorm:"type:varchar(255);unique" validate:"required,email"`
	Role      Role      `gorm:"type:varchar(50)" validate:"required,oneof=admin teacher student"`
	CreatedAt time.Time `gorm:"default:current_timestamp"`
}

// Validate валидирует структуру User
func (u *User) Validate() error {
	validate := validator.New()
	return validate.Struct(u)
}
