package service

import (
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/repository"
)

type CourseService interface {
	Create(course *model.Course) error
	List(limit, offset int) ([]model.Course, error)
	Get(id uint) (*model.Course, error)
}

type courseService struct {
	repo repository.CourseRepository
}

func NewCourseService(repo repository.CourseRepository) CourseService {
	return &courseService{repo: repo}
}

func (s *courseService) Create(course *model.Course) error {
	return s.repo.Create(course)
}

func (s *courseService) List(limit, offset int) ([]model.Course, error) {
	return s.repo.FindAllWithPagination(limit, offset)
}

func (s *courseService) Get(id uint) (*model.Course, error) {
	return s.repo.FindByID(id)
}
