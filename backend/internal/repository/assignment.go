package repository

import (
	"fmt"
	"github.com/MORFEUSik/projectschool/backend/internal/db"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"gorm.io/gorm"
)

type AssignmentRepository interface {
	Create(assignment *model.Assignment) error
	FindByCourseID(courseID uint) ([]model.Assignment, error)
	FindByID(id uint) (*model.Assignment, error)
	FindByUserID(userID uint) ([]model.Assignment, error)
	Delete(id uint) error // Новый метод
}

type assignmentRepository struct {
	db *gorm.DB
}

func NewAssignmentRepository() AssignmentRepository {
	return &assignmentRepository{db: db.DB}
}

func (r *assignmentRepository) Create(assignment *model.Assignment) error {
	return r.db.Create(assignment).Error
}

func (r *assignmentRepository) FindByCourseID(courseID uint) ([]model.Assignment, error) {
	var assignments []model.Assignment
	err := r.db.Where("course_id = ?", courseID).Find(&assignments).Error
	return assignments, err
}

func (r *assignmentRepository) FindByID(id uint) (*model.Assignment, error) {
	var assignment model.Assignment
	err := r.db.First(&assignment, id).Error
	return &assignment, err
}

func (r *assignmentRepository) FindByUserID(userID uint) ([]model.Assignment, error) {
	var assignments []model.Assignment
	err := r.db.Joins("JOIN enrollments ON enrollments.course_id = assignments.course_id").
		Where("enrollments.user_id = ?", userID).
		Find(&assignments).Error
	return assignments, err
}

func (r *assignmentRepository) Delete(id uint) error {
	result := r.db.Delete(&model.Assignment{}, id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("assignment not found")
	}
	return nil
}
