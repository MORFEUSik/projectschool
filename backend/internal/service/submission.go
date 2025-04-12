// backend/internal/service/submission.go
package service

import (
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/repository"
)

type SubmissionService interface {
	Create(submission *model.Submission) error
	ListByAssignment(assignmentID uint) ([]model.Submission, error)
}

type submissionService struct {
	repo repository.SubmissionRepository
}

func NewSubmissionService(repo repository.SubmissionRepository) SubmissionService {
	return &submissionService{repo: repo}
}

func (s *submissionService) Create(submission *model.Submission) error {
	return s.repo.Create(submission)
}

func (s *submissionService) ListByAssignment(assignmentID uint) ([]model.Submission, error) {
	return s.repo.FindByAssignmentID(assignmentID)
}
