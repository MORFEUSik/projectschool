package model

type GlobalAchievement struct {
	ID            uint   `gorm:"primaryKey"`
	Title         string `gorm:"type:varchar(255);not null" validate:"required"`
	Description   string `gorm:"type:text"`
	ConditionType string `gorm:"type:varchar(50);not null"` // Тип условия: points, courses, submissions
	Threshold     uint   `gorm:"default:0"`                 // Пороговое значение
}
