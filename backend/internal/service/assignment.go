package service

import (
	"fmt"
	"time"

	//"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/repository"
	"gorm.io/gorm"
)

type AssignmentService interface {
	Create(assignment *model.Assignment, subtasks []model.Subtask) error
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

func (s *assignmentService) Create(assignment *model.Assignment, subtasks []model.Subtask) error {
	// Сохраняем задание
	if err := s.repo.Create(assignment); err != nil {
		return err
	}

	// Сохраняем подзадания (если есть)
	for i := range subtasks {
		subtasks[i].AssignmentID = assignment.ID
		subtasks[i].Order = i + 1
		if err := s.db.Create(&subtasks[i]).Error; err != nil {
			return err
		}
	}

	// Уведомляем студентов — без изменений
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
				s.notificationRepo.Create(notification)
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
