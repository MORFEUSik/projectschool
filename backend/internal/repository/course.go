package repository

import (
	"github.com/MORFEUSik/projectschool/backend/internal/db"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"gorm.io/gorm"
)

type CourseRepository interface {
	Create(course *model.Course) error
	FindAllWithPagination(limit, offset int) ([]model.Course, error)
	FindByID(id uint) (*model.Course, error)
	Delete(id uint) error
	GetStats(id uint) (map[string]interface{}, error)
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

func (r *courseRepository) FindAllWithPagination(limit, offset int) ([]model.Course, error) {
	var courses []model.Course
	err := r.db.Limit(limit).Offset(offset).Find(&courses).Error
	return courses, err
}

func (r *courseRepository) FindByID(id uint) (*model.Course, error) {
	var course model.Course
	err := r.db.First(&course, id).Error
	return &course, err
}

func (r *courseRepository) Delete(id uint) error {
	return r.db.Delete(&model.Course{}, id).Error
}

func (r *courseRepository) GetStats(id uint) (map[string]interface{}, error) {
	var stats struct {
		StudentsCount  int64   `gorm:"column:students_count"`
		AverageGrade   float64 `gorm:"column:average_grade"`
		CompletionRate float64 `gorm:"column:completion_rate"`
	}
	err := r.db.Raw(`
		SELECT 
			COUNT(DISTINCT e.user_id) as students_count,
			COALESCE(AVG(s.grade), 0) as average_grade,
			COALESCE(
				COUNT(DISTINCT s.id)::float / NULLIF(COUNT(DISTINCT a.id) * COUNT(DISTINCT e.user_id), 0),
				0
			) as completion_rate
		FROM courses c
		LEFT JOIN enrollments e ON e.course_id = c.id
		LEFT JOIN assignments a ON a.course_id = c.id
		LEFT JOIN submissions s ON s.assignment_id = a.id
		WHERE c.id = ?
	`, id).Scan(&stats).Error
	if err != nil {
		return nil, err
	}
	return map[string]interface{}{
		"students_count":  stats.StudentsCount,
		"average_grade":   stats.AverageGrade,
		"completion_rate": stats.CompletionRate,
	}, nil
}
