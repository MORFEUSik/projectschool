package model

type GlobalAchievement struct {
	ID          uint   `gorm:"primaryKey"`
	Title       string `gorm:"type:varchar(255);not null" validate:"required"`
	Description string `gorm:"type:text"`
	Condition   string `gorm:"type:varchar(255)"` // Тип условия, например, "points_50", "courses_1"
}
