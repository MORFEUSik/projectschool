package service

import (
	"github.com/MORFEUSik/projectschool/backend/internal/db"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/repository"
	"gorm.io/gorm"
)

// CourseService определяет интерфейс для работы с курсами
type CourseService interface {
	Create(course *model.Course) error
	List(limit, offset int) ([]model.Course, error)
	Get(id uint) (*model.Course, error)
	PreloadTeacher(course *model.Course) error
}

// courseService реализует CourseService
type courseService struct {
	repo repository.CourseRepository
	db   *gorm.DB
}

// NewCourseService создаёт новый экземпляр CourseService
func NewCourseService(repo repository.CourseRepository) CourseService {
	return &courseService{
		repo: repo,
		db:   db.DB,
	}
}

// Create создаёт новый курс
func (s *courseService) Create(course *model.Course) error {
	return s.repo.Create(course)
}

// List возвращает список курсов с пагинацией
func (s *courseService) List(limit, offset int) ([]model.Course, error) {
	var courses []model.Course
	err := s.db.Preload("Teacher").Limit(limit).Offset(offset).Find(&courses).Error
	return courses, err
}

// Get возвращает курс по ID
func (s *courseService) Get(id uint) (*model.Course, error) {
	var course model.Course
	err := s.db.Preload("Teacher").First(&course, id).Error
	return &course, err
}

// PreloadTeacher подгружает данные учителя для курса
func (s *courseService) PreloadTeacher(course *model.Course) error {
	return s.db.Preload("Teacher").First(course, course.ID).Error
}
