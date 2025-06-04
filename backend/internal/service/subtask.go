package service

import (
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"gorm.io/gorm"
)

type SubtaskService interface {
	GetByAssignmentID(assignmentID uint) ([]model.Subtask, error)
}

type subtaskService struct {
	db *gorm.DB
}

func NewSubtaskService(db *gorm.DB) SubtaskService {
	return &subtaskService{db: db}
}

func (s *subtaskService) GetByAssignmentID(assignmentID uint) ([]model.Subtask, error) {
	var subtasks []model.Subtask
	if err := s.db.Where("assignment_id = ?", assignmentID).Order("order asc").Find(&subtasks).Error; err != nil {
		return nil, err
	}
	return subtasks, nil
}
