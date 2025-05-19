package service

import (
	"fmt"
	"time"

	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/repository"
	"gorm.io/gorm"
)

type AssignmentService interface {
	Create(assignment *model.Assignment) error
	ListByCourse(courseID uint) ([]model.Assignment, error)
	ListByUser(userID uint) ([]model.Assignment, error)
	Get(id uint) (*model.Assignment, error)
	Delete(id uint) error
}

type assignmentService struct {
	repo             repository.AssignmentRepository
	notificationRepo repository.NotificationRepository
	db               *gorm.DB
}

func NewAssignmentService(repo repository.AssignmentRepository, notificationRepo repository.NotificationRepository, db *gorm.DB) AssignmentService {
	return &assignmentService{
		repo:             repo,
		notificationRepo: notificationRepo,
		db:               db,
	}
}

func (s *assignmentService) Create(assignment *model.Assignment) error {
	// Создание задания
	if err := s.repo.Create(assignment); err != nil {
		return err
	}

	// Уведомить всех студентов курса
	var enrollments []model.Enrollment
	if err := s.db.Where("course_id = ?", assignment.CourseID).Find(&enrollments).Error; err == nil {
		var course model.Course
		if err := s.db.First(&course, assignment.CourseID).Error; err == nil {
			for _, e := range enrollments {
				notification := &model.Notification{
					UserID:    e.UserID,
					Message:   fmt.Sprintf("Новое задание в курсе %s: %s", course.Title, assignment.Title),
					IsRead:    false,
					CreatedAt: time.Now(),
				}
				if err := s.notificationRepo.Create(notification); err != nil {
					logger.Log.Errorf("Failed to create notification for user %d: %v", e.UserID, err)
				}
			}
		}
	}

	return nil
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
