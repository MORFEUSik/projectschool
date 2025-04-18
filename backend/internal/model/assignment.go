package model

import (
	"fmt"
	"time"

	"github.com/go-playground/validator/v10"
)

type Assignment struct {
	ID          uint      `gorm:"primaryKey" json:"id" swaggertype:"integer" example:"1" description:"Уникальный идентификатор задания"`
	CourseID    uint      `gorm:"not null" validate:"required" json:"course_id" swaggertype:"integer" example:"1" description:"ID курса, к которому относится задание"`
	Title       string    `gorm:"not null" validate:"required,min=3,max=100" json:"title" swaggertype:"string" example:"Test Assignment" description:"Название задания (обязательное, 3-100 символов)"`
	Description string    `gorm:"type:text" json:"description" swaggertype:"string" example:"Test Description" description:"Описание задания (опциональное)"`
	MaxScore    uint      `gorm:"not null" validate:"required,gte=0" json:"max_score" swaggertype:"integer" example:"100" description:"Максимальный балл за задание"`
	DueDate     time.Time `validate:"required" json:"due_date" swaggertype:"string" example:"2025-04-19T12:00:00Z" description:"Срок сдачи задания"`
	TeacherID   uint      `gorm:"not null" validate:"required,gt=0" json:"-" description:"ID преподавателя, создавшего задание"`
	Teacher     User      `gorm:"foreignKey:TeacherID" validate:"-" json:"teacher" description:"Информация о преподавателе"`
	CreatedAt   time.Time `gorm:"default:current_timestamp" json:"created_at" swaggertype:"string" example:"2025-04-18T12:00:00Z" description:"Дата создания задания"`
	UpdatedAt   time.Time `gorm:"autoUpdateTime" json:"updated_at" swaggertype:"string" example:"2025-04-18T12:00:00Z" description:"Дата последнего обновления задания"`
}

func (a *Assignment) Validate() error {
	validate := validator.New()
	if err := validate.Struct(a); err != nil {
		return err
	}
	if a.DueDate.Before(time.Now()) {
		return fmt.Errorf("DueDate must be in the future")
	}
	return nil
}
