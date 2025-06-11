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

func (r *courseRepository) GetStats(courseID uint) (map[string]interface{}, error) {
	var (
		studentsCount    int64
		assignmentsCount int64
		submissionsCount int64
		averageGrade     float64
	)

	// Сколько студентов записано
	if err := r.db.Model(&model.Enrollment{}).
		Where("course_id = ?", courseID).
		Count(&studentsCount).Error; err != nil {
		return nil, err
	}

	// Сколько заданий у урока
	if err := r.db.Model(&model.Assignment{}).
		Where("course_id = ?", courseID).
		Count(&assignmentsCount).Error; err != nil {
		return nil, err
	}

	// Сколько всего решений у этих заданий
	if err := r.db.Model(&model.Submission{}).
		Joins("JOIN assignments ON submissions.assignment_id = assignments.id").
		Where("assignments.course_id = ?", courseID).
		Count(&submissionsCount).Error; err != nil {
		return nil, err
	}

	// Средняя оценка (по только тем, у кого grade > 0)
	if err := r.db.Model(&model.Submission{}).
		Select("AVG(grade)").
		Where("grade > 0").
		Joins("JOIN assignments ON submissions.assignment_id = assignments.id").
		Where("assignments.course_id = ?", courseID).
		Scan(&averageGrade).Error; err != nil {
		return nil, err
	}

	// Общий процент завершения урока
	var completionRate float64 = 0
	if studentsCount > 0 && assignmentsCount > 0 {
		totalPossible := float64(studentsCount * assignmentsCount)
		completionRate = float64(submissionsCount) / totalPossible * 100
	}

	return map[string]interface{}{
		"students_count":  studentsCount,
		"average_grade":   averageGrade,
		"completion_rate": completionRate,
	}, nil
}
