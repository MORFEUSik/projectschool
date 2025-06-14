package model

import (
	"time"

	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/go-playground/validator/v10"
)

type Course struct {
	ID          uint         `gorm:"primaryKey" json:"id" swaggertype:"integer" example:"1" description:"Уникальный идентификатор урока"`
	Title       string       `gorm:"not null;unique" validate:"required,min=3,max=100" json:"title" swaggertype:"string" example:"Math 101" description:"Название урока (обязательное, 3-100 символов)"`
	Description string       `gorm:"type:text" json:"description" swaggertype:"string" example:"Описание урока (опционально)" description:"Описание урока"`
	Subject     string       `gorm:"not null" validate:"required" json:"subject" swaggertype:"string" example:"Математика" description:"Предмет урока"`
	ClassNumber int          `gorm:"not null" validate:"required,gte=1,lte=11" json:"class_number" swaggertype:"integer" example:"6" description:"Номер класса (1-11)"`
	TeacherID   uint         `gorm:"not null" validate:"required,gt=0" json:"-" description:"ID преподавателя"`
	Teacher     User         `gorm:"foreignKey:TeacherID" validate:"-" json:"teacher" description:"Данные преподавателя"`
	Assignments []Assignment `gorm:"foreignKey:CourseID" json:"assignments" description:"Список заданий"`
	MaterialURL string       `gorm:"type:text" json:"material_url" swaggertype:"string" example:"uploads/materials/math101.pdf" description:"Ссылка на PDF-материал (опционально)"`
	CreatedAt   time.Time    `gorm:"default:current_timestamp" json:"created_at" swaggertype:"string" example:"2025-06-12T00:00:00Z"`
	UpdatedAt   time.Time    `gorm:"autoUpdateTime" json:"updated_at" swaggertype:"string" example:"2025-06-12T00:00:00Z"`
}

func (c *Course) Validate() error {
	logger.Log.Infof("Validating course: %+v", c)
	validate := validator.New()
	return validate.Struct(c)
}
