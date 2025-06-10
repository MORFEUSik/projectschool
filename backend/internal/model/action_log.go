package model

import (
	"time"
)

type UserActionLog struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"index" json:"user_id"`
	User      *User     `gorm:"foreignKey:UserID" json:"user"` // Добавляем связь с User
	Action    string    `gorm:"type:varchar(255)" json:"action"`
	Details   string    `gorm:"type:text" json:"details"`
	CreatedAt time.Time `json:"created_at"`
}
