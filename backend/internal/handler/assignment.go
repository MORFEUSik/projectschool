package handler

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/MORFEUSik/projectschool/backend/internal/db"
	errorpkg "github.com/MORFEUSik/projectschool/backend/internal/error"
	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"gorm.io/gorm"
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

		// Получаем userID из контекста
		userIDRaw, exists := c.Get("userID")
		if !exists {
			logger.Log.Error("UserID not found in context")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Пользователь не аутентифицирован"})
			return
		}

		// Безопасное приведение userID к uint
		var userID uint
		switch v := userIDRaw.(type) {
		case uint:
			userID = v
		case int:
			if v < 0 {
				logger.Log.Errorf("Invalid userID: negative value %d", v)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Некорректный ID пользователя"})
				return
			}
			userID = uint(v)
		case float64:
			if v < 0 || v != float64(uint(v)) {
				logger.Log.Errorf("Invalid userID: non-integer float %f", v)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Некорректный ID пользователя"})
				return
			}
			userID = uint(v)
		default:
			logger.Log.Errorf("Invalid userID type: %T, value: %v", userIDRaw, userIDRaw)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка обработки ID пользователя"})
			return
		}

		// Устанавливаем TeacherID
		assignment.TeacherID = userID
		logger.Log.Infof("Received assignment: %+v, TeacherID: %d", assignment, userID)

		// Проверка существования курса
		var course model.Course
		if err := db.DB.First(&course, assignment.CourseID).Error; err != nil {
			logger.Log.Errorf("Course %d not found: %v", assignment.CourseID, err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Курс не найден"})
			return
		}

		// Проверка: принадлежит ли курс учителю (для роли teacher)
		var user model.User
		if err := db.DB.First(&user, userID).Error; err != nil {
			logger.Log.Errorf("User %d not found: %v", userID, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка проверки пользователя"})
			return
		}
		if user.Role == model.Teacher && course.TeacherID != userID {
			logger.Log.Errorf("Teacher %d does not own course %d", userID, course.TeacherID)
			c.JSON(http.StatusForbidden, gin.H{"error": "Вы не можете создавать задания для этого курса"})
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

		logger.Log.Infof("Assignment %s (ID: %d) created by user %d", assignment.Title, assignment.ID, userID)
		c.JSON(http.StatusOK, gin.H{"message": "Задание создано", "assignment": assignment})
	}
}

// GetAssignment возвращает задание по ID в контексте курса
// @Summary Получить задание в курсе
// @Description Возвращает задание по ID, проверяя его принадлежность к курсу. Требуется JWT-токен. Доступно для ролей: student, teacher, admin.
// @Tags assignments
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param courseId path int true "ID курса"
// @Param assignmentId path int true "ID задания"
// @Success 200 {object} model.Assignment
// @Failure 400 {object} map[string]string "error"
// @Failure 401 {object} map[string]string "error"
// @Failure 404 {object} map[string]string "error"
// @Failure 500 {object} map[string]string "error"
// @Router /courses/{courseId}/assignments/{assignmentId} [get]
func GetAssignment(assignmentService service.AssignmentService) gin.HandlerFunc {
	return func(c *gin.Context) {
		courseID, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			logger.Log.Errorf("Invalid course ID: %v", err)
			errorpkg.HandleError(c, errorpkg.APIError{Status: http.StatusBadRequest, Message: "Неверный ID курса"})
			return
		}

		assignmentID, err := strconv.Atoi(c.Param("assignmentId"))
		if err != nil {
			logger.Log.Errorf("Invalid assignment ID: %v", err)
			errorpkg.HandleError(c, errorpkg.APIError{Status: http.StatusBadRequest, Message: "Неверный ID задания"})
			return
		}

		assignment, err := assignmentService.Get(uint(assignmentID))
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				errorpkg.HandleError(c, errorpkg.APIError{Status: http.StatusNotFound, Message: "Задание не найдено"})
			} else {
				logger.Log.Errorf("Failed to get assignment %d: %v", assignmentID, err)
				errorpkg.HandleError(c, errorpkg.APIError{Status: http.StatusInternalServerError, Message: "Ошибка сервера"})
			}
			return
		}

		// Проверка, что задание принадлежит курсу
		if assignment.CourseID != uint(courseID) {
			logger.Log.Errorf("Assignment %d does not belong to course %d", assignmentID, courseID)
			errorpkg.HandleError(c, errorpkg.APIError{Status: http.StatusNotFound, Message: "Задание не принадлежит этому курсу"})
			return
		}

		c.JSON(http.StatusOK, assignment)
	}
}

// DeleteAssignment удаляет задание
// @Summary Удалить задание
// @Description Удаляет задание по его ID. Доступно только для учителей (создателей задания) и админов.
// @Tags assignments
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID задания"
// @Success 200 {object} map[string]string "message: Задание удалено"
// @Failure 400 {object} map[string]string "error: Неверный ID"
// @Failure 401 {object} map[string]string "error: Не авторизован"
// @Failure 403 {object} map[string]string "error: Доступ запрещён"
// @Failure 404 {object} map[string]string "error: Задание не найдено"
// @Failure 500 {object} map[string]string "error: Внутренняя ошибка сервера"
// @Router /assignments/{id} [delete]
func DeleteAssignment(assignmentService service.AssignmentService) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Получаем ID задания
		idStr := c.Param("id")
		id, err := strconv.Atoi(idStr)
		if err != nil {
			logger.Log.Errorf("Invalid assignment ID: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный ID"})
			return
		}

		// Получаем пользователя из контекста
		userRaw, exists := c.Get("user")
		if !exists {
			logger.Log.Error("User not found in context")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Не авторизован"})
			return
		}
		user, ok := userRaw.(model.User)
		if !ok {
			logger.Log.Error("Invalid user type in context")
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Внутренняя ошибка сервера"})
			return
		}

		// Проверяем права
		if user.Role != model.Teacher && user.Role != model.Admin {
			logger.Log.Errorf("User %d (%s) attempted to delete assignment %d without permission", user.ID, user.Role, id)
			c.JSON(http.StatusForbidden, gin.H{"error": "Доступ запрещён"})
			return
		}

		// Проверяем существование задания
		assignment, err := assignmentService.Get(uint(id))
		if err != nil {
			logger.Log.Errorf("Failed to get assignment %d: %v", id, err)
			if err.Error() == "record not found" {
				c.JSON(http.StatusNotFound, gin.H{"error": "Задание не найдено"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Внутренняя ошибка сервера"})
			}
			return
		}

		// Если учитель, проверяем, что он создатель задания
		if user.Role == model.Teacher && assignment.TeacherID != user.ID {
			logger.Log.Errorf("Teacher %d attempted to delete assignment %d not owned by them", user.ID, id)
			c.JSON(http.StatusForbidden, gin.H{"error": "Доступ запрещён"})
			return
		}

		// Удаляем задание
		if err := assignmentService.Delete(uint(id)); err != nil {
			logger.Log.Errorf("Failed to delete assignment %d: %v", id, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось удалить задание"})
			return
		}

		logger.Log.Infof("Assignment %d deleted by user %d (%s)", id, user.ID, user.Role)
		c.JSON(http.StatusOK, gin.H{"message": "Задание удалено"})
	}
}
