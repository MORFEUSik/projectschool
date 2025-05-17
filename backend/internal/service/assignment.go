package service

import (
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/repository"
)

type AssignmentService interface {
	Create(assignment *model.Assignment) error
	ListByCourse(courseID uint) ([]model.Assignment, error)
	ListByUser(userID uint) ([]model.Assignment, error)
	Get(id uint) (*model.Assignment, error)
	Delete(id uint) error // Новый метод
}

type assignmentService struct {
	repo repository.AssignmentRepository
}

func NewAssignmentService(repo repository.AssignmentRepository) AssignmentService {
	return &assignmentService{repo: repo}
}

func (s *assignmentService) Create(assignment *model.Assignment) error {
	return s.repo.Create(assignment)
}

func (s *assignmentService) ListByCourse(courseID uint) ([]model.Assignment, error) {
	return s.repo.FindByCourseID(courseID)
}

func (s *assignmentService) ListByUser(userID uint) ([]model.Assignment, error) {
	return s.repo.FindByUserID(userID)
}

func (s *assignmentService) Get(id uint) (*model.Assignment, error) {
	return s.repo.FindByID(id)
}

func (s *assignmentService) Delete(id uint) error {
	return s.repo.Delete(id)
}
