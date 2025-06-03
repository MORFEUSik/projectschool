package repository

import (
	"github.com/MORFEUSik/projectschool/backend/internal/db"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"gorm.io/gorm"
)

type SubtaskRepository interface {
	FindByAssignment(assignmentID uint) ([]model.Subtask, error)
}

type subtaskRepository struct {
	db *gorm.DB
}

func NewSubtaskRepository() SubtaskRepository {
	return &subtaskRepository{db: db.DB}
}

func (r *subtaskRepository) FindByAssignment(assignmentID uint) ([]model.Subtask, error) {
	var subtasks []model.Subtask
	err := r.db.Where("assignment_id = ?", assignmentID).Order("order ASC").Find(&subtasks).Error
	return subtasks, err
}
