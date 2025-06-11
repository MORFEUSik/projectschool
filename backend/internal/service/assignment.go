package service

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/repository"
	"github.com/MORFEUSik/projectschool/backend/internal/util" // Добавляем импорт
	"gorm.io/gorm"
)

type AssignmentService interface {
	Create(assignment *model.Assignment, subtasks []model.Subtask, files map[string]string) error
	ListByCourse(courseID uint) ([]model.Assignment, error)
	ListByUser(userID uint) ([]model.Assignment, error)
	Get(id uint) (*model.Assignment, error)
	Delete(id uint, teacherID uint) error // Обновляем сигнатуру
}

type assignmentService struct {
	repo             repository.AssignmentRepository
	notificationRepo repository.NotificationRepository
	db               *gorm.DB
	logRepo          repository.ActionLogRepository // Добавляем поле
}

func NewAssignmentService(repo repository.AssignmentRepository, notificationRepo repository.NotificationRepository, db *gorm.DB, logRepo repository.ActionLogRepository) AssignmentService {
	return &assignmentService{
		repo:             repo,
		notificationRepo: notificationRepo,
		db:               db,
		logRepo:          logRepo,
	}
}

func (s *assignmentService) Create(assignment *model.Assignment, subtasks []model.Subtask, files map[string]string) error {
	logger.Log.Infof("Creating assignment: %s", assignment.Title)
	if assignment.Type == "multiple_choice" && len(subtasks) == 0 {
		logger.Log.Errorf("Multiple choice assignment must have at least one subtask")
		return errors.New("тест должен содержать хотя бы одно подзадание")
	}

	return s.db.Transaction(func(tx *gorm.DB) error {
		if err := s.repo.CreateWithTx(tx, assignment); err != nil {
			logger.Log.Errorf("Failed to create assignment: %v", err)
			return err
		}

		for i := range subtasks {
			if subtasks[i].Question == "" {
				logger.Log.Errorf("Subtask question cannot be empty")
				return errors.New("вопрос подзадания не может быть пустым")
			}
			if subtasks[i].InputType == "multiple_choice" {
				if len(subtasks[i].Options) < 2 {
					logger.Log.Errorf("Subtask must have at least 2 options")
					return errors.New("подзадание должно содержать хотя бы 2 варианта ответа")
				}
				if !contains(subtasks[i].Options, subtasks[i].Answer) {
					logger.Log.Errorf("Subtask answer must be one of the options")
					return errors.New("правильный ответ должен быть одним из вариантов")
				}
			} else if subtasks[i].InputType == "text_input" {
				if len(subtasks[i].Options) > 0 {
					logger.Log.Errorf("Text input subtask must not have options")
					return errors.New("подзадание с текстовым вводом не должно содержать варианты ответа")
				}
				if subtasks[i].Answer == "" {
					logger.Log.Errorf("Text input subtask must have an answer")
					return errors.New("подзадание с текстовым вводом должно содержать правильный ответ")
				}
			} else {
				logger.Log.Errorf("Invalid subtask type: %s", subtasks[i].InputType)
				return errors.New("неверный тип подзадания")
			}
			subtasks[i].AssignmentID = assignment.ID
			subtasks[i].SortOrder = i + 1

			if fileURL, ok := files[fmt.Sprintf("subtask_image_%d", i)]; ok {
				subtasks[i].File_url = fileURL
			}

			if err := tx.Create(&subtasks[i]).Error; err != nil {
				logger.Log.Errorf("Failed to create subtask: %v", err)
				return err
			}
		}

		var enrollments []model.Enrollment
		if err := s.db.Where("course_id = ?", assignment.CourseID).Find(&enrollments).Error; err == nil {
			var course model.Course
			if err := s.db.First(&course, assignment.CourseID).Error; err == nil {
				for _, e := range enrollments {
					notification := &model.Notification{
						UserID:    e.UserID,
						Message:   fmt.Sprintf("Новое задание в уроке %s: %s", course.Title, assignment.Title),
						IsRead:    false,
						CreatedAt: time.Now(),
					}
					s.notificationRepo.Create(notification)
				}
			}
		}

		logger.Log.Infof("Assignment %s created successfully with %d subtasks", assignment.Title, len(subtasks))
		util.LogUserAction(s.logRepo, assignment.TeacherID, "create_assignment", fmt.Sprintf("Создано задание: %s", assignment.Title)) // Исправляем AuthorID на TeacherID
		return nil
	})
}

func contains(options []string, answer string) bool {
	for _, opt := range options {
		if strings.TrimSpace(strings.ToLower(opt)) == strings.TrimSpace(strings.ToLower(answer)) {
			return true
		}
	}
	return false
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

func (s *assignmentService) Delete(id uint, teacherID uint) error {
	logger.Log.Infof("Deleting assignment %d by teacher %d", id, teacherID)
	err := s.repo.Delete(id)
	if err != nil {
		logger.Log.Errorf("Failed to delete assignment %d: %v", id, err)
		return err
	}
	logger.Log.Infof("Assignment %d deleted successfully", id)
	util.LogUserAction(s.logRepo, teacherID, "delete_assignment", fmt.Sprintf("Удалено задание ID: %d", id))
	return nil
}
