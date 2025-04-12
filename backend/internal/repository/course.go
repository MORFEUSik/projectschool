// backend/internal/repository/course.go
package repository

import (
	"github.com/MORFEUSik/projectschool/backend/internal/db"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"gorm.io/gorm"
)

type CourseRepository interface {
	Create(course *model.Course) error
	FindAll() ([]model.Course, error)
	FindByID(id uint) (*model.Course, error)
}

type courseRepository struct {
	db *gorm.DB
}

func NewCourseRepository() CourseRepository {
	return &courseRepository{db: db.DB}
}

func (r *courseRepository) Create(course *model.Course) error {
	return r.db.Create(course).Error
}

func (r *courseRepository) FindAll() ([]model.Course, error) {
	var courses []model.Course
	err := r.db.Find(&courses).Error // Исправлено: .SEXPError -> .Error
	return courses, err
}

func (r *courseRepository) FindByID(id uint) (*model.Course, error) {
	var course model.Course
	err := r.db.First(&course, id).Error
	return &course, err
}
