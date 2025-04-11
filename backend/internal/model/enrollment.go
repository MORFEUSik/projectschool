package model

type Enrollment struct {
	ID       uint `gorm:"primaryKey"`
	UserID   uint `gorm:"not null"`
	CourseID uint `gorm:"not null"`
	User     User
	Course   Course
}
