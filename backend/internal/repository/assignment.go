package repository

import (
	"github.com/MORFEUSik/projectschool/backend/internal/db"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"gorm.io/gorm"
)

type AssignmentRepository interface {
	Create(assignment *model.Assignment) error
	FindByCourseID(courseID uint) ([]model.Assignment, error)
	FindByID(id uint) (*model.Assignment, error)
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
