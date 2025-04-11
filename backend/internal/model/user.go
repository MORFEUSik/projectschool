package model

import (
	"time"
)

type Role string

const (
	Admin   Role = "admin"
	Teacher Role = "teacher"
	Student Role = "student"
)

type User struct {
	ID        int       `gorm:"primaryKey;autoIncrement"`
	Username  string    `gorm:"type:varchar(100);unique"`
	Password  string    `gorm:"type:varchar(255)"`
	Email     string    `gorm:"type:varchar(255);unique"`
	Role      Role      `gorm:"type:varchar(50)"`
	CreatedAt time.Time `gorm:"default:current_timestamp"`
}
