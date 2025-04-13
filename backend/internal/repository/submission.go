package repository

import (
	"github.com/MORFEUSik/projectschool/backend/internal/db"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"gorm.io/gorm"
)

type SubmissionRepository interface {
	Create(submission *model.Submission) error
	FindByAssignmentID(assignmentID uint) ([]model.Submission, error)
	FindByAssignmentAndUser(assignmentID, userID uint) (*model.Submission, error)
}

type submissionRepository struct {
	db *gorm.DB
}

func NewSubmissionRepository() SubmissionRepository {
	return &submissionRepository{db: db.DB}
}

func (r *submissionRepository) Create(submission *model.Submission) error {
	return r.db.Create(submission).Error
}

func (r *submissionRepository) FindByAssignmentID(assignmentID uint) ([]model.Submission, error) {
	var submissions []model.Submission
	err := r.db.Where("assignment_id = ?", assignmentID).Find(&submissions).Error
	return submissions, err
}

func (r *submissionRepository) FindByAssignmentAndUser(assignmentID, userID uint) (*model.Submission, error) {
	var submission model.Submission
	err := r.db.Where("assignment_id = ? AND user_id = ?", assignmentID, userID).First(&submission).Error
	return &submission, err
}
