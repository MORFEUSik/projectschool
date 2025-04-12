// backend/internal/service/course.go
package service

import (
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/repository"
)

type CourseService interface {
	Create(course *model.Course) error
	List() ([]model.Course, error)
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

func (s *courseService) List() ([]model.Course, error) {
	return s.repo.FindAll()
}

func (s *courseService) Get(id uint) (*model.Course, error) {
	return s.repo.FindByID(id)
}
