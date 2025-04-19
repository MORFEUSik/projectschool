package model

import (
	"time"

	"github.com/go-playground/validator/v10"
)

type Notification struct {
	ID        uint      `gorm:"primaryKey" json:"id" swaggertype:"integer" example:"1" description:"Уникальный идентификатор уведомления"`
	UserID    uint      `gorm:"not null;index" validate:"required" json:"-" description:"ID пользователя"`
	User      User      `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"-" description:"Пользователь"`
	Message   string    `gorm:"type:text;not null" validate:"required" json:"message" swaggertype:"string" example:"Новое задание в курсе Math 101" description:"Текст уведомления"`
	CreatedAt time.Time `gorm:"default:current_timestamp" json:"created_at" swaggertype:"string" example:"2025-04-18T12:00:00Z" description:"Дата создания уведомления"`
}

func (n *Notification) Validate() error {
	validate := validator.New()
	return validate.Struct(n)
}
