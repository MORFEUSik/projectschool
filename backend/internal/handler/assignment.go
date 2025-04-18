package handler

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/MORFEUSik/projectschool/backend/internal/db"
	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

// ListAssignments возвращает список заданий для курса
// @Summary Получить список заданий
// @Description Возвращает список заданий для указанного курса. Требуется JWT-токен. Доступно для ролей: student, teacher, admin.
// @Tags assignments
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID курса"
// @Success 200 {array} model.Assignment
// @Failure 400 {object} map[string]string "error"
// @Failure 401 {object} map[string]string "error"
// @Failure 500 {object} map[string]string "error"
// @Router /courses/{id}/assignments [get]
func ListAssignments(assignmentService service.AssignmentService) gin.HandlerFunc {
	return func(c *gin.Context) {
		courseID, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			logger.Log.Errorf("Invalid course ID: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный ID курса"})
			return
		}
		assignments, err := assignmentService.ListByCourse(uint(courseID))
		if err != nil {
			logger.Log.Errorf("Failed to list assignments: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка получения заданий"})
			return
		}
		c.JSON(http.StatusOK, assignments)
	}
}

// CreateAssignment создает новое задание
// @Summary Создать задание
// @Description Создает новое задание для курса. Требуется JWT-токен. Доступно только для ролей: teacher, admin.
// @Tags assignments
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param assignment body model.Assignment true "Данные задания"
// @Success 200 {object} map[string]interface{} "message, assignment"
// @Failure 400 {object} map[string]string "error"
// @Failure 401 {object} map[string]string "error"
// @Failure 403 {object} map[string]string "error"
// @Failure 500 {object} map[string]string "error"
// @Router /assignments [post]
func CreateAssignment(assignmentService service.AssignmentService) gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.ContentType() != "application/json" {
			logger.Log.Errorf("Invalid Content-Type: %s", c.ContentType())
			c.JSON(http.StatusUnsupportedMediaType, gin.H{"error": "Требуется Content-Type: application/json"})
			return
		}

		var assignment model.Assignment
		if err := c.ShouldBindJSON(&assignment); err != nil {
			logger.Log.Errorf("Failed to bind JSON: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат данных"})
			return
		}

		logger.Log.Infof("Received assignment: %+v", assignment)

		// Проверка существования курса
		var course model.Course
		if err := db.DB.First(&course, assignment.CourseID).Error; err != nil {
			logger.Log.Errorf("Course %d not found: %v", assignment.CourseID, err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Курс не найден"})
			return
		}

		// Валидация
		if err := assignment.Validate(); err != nil {
			logger.Log.Errorf("Assignment validation failed: %v", err)
			validationErrors := make([]string, 0)
			if errs, ok := err.(validator.ValidationErrors); ok {
				for _, e := range errs {
					validationErrors = append(validationErrors, fmt.Sprintf("Поле %s: %s", e.Field(), e.Tag()))
				}
			} else {
				validationErrors = append(validationErrors, err.Error())
			}
			c.JSON(http.StatusBadRequest, gin.H{"error": strings.Join(validationErrors, "; ")})
			return
		}

		if err := assignmentService.Create(&assignment); err != nil {
			logger.Log.Errorf("Failed to create assignment: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка создания задания"})
			return
		}

		logger.Log.Infof("Assignment %s (ID: %d) created", assignment.Title, assignment.ID)
		c.JSON(http.StatusOK, gin.H{"message": "Задание создано", "assignment": assignment})
	}
}
