package handler

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"

	"github.com/MORFEUSik/projectschool/backend/internal/db"
	"github.com/MORFEUSik/projectschool/backend/internal/error"
	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/repository"
	"github.com/MORFEUSik/projectschool/backend/internal/service"
	"github.com/MORFEUSik/projectschool/backend/internal/util"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// CreateCourseInput defines the input structure for creating a course
type CreateCourseInput struct {
	Title       string `json:"title" binding:"required,min=3,max=100" example:"Math 101" description:"Название урока (обязательное, 3-100 символов)"`
	Description string `json:"description" example:"Introduction to Mathematics" description:"Описание урока (опциональное)"`
	Subject     string `json:"subject" binding:"required" example:"Математика" description:"Предмет урока"`
	ClassNumber int    `json:"class_number" binding:"required,gte=1,lte=11" example:"6" description:"Номер класса (1-11)"`
	MaterialURL string `json:"material_url" example:"/uploads/materials/math101.pdf" description:"Ссылка на PDF-материал (опционально)"`
}

// ListCourses возвращает список уроков
// @Summary Получить список уроков
// @Description Возвращает список всех уроков с пагинацией. Требуется JWT-токен. Доступно для ролей: student, teacher, admin.
// @Tags courses
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param limit query int false "Лимит записей" default(6)
// @Param offset query int false "Смещение" default(0)
// @Success 200 {object} map[string]interface{} "courses, total"
// @Failure 400 {object} map[string]string "error"
// @Failure 401 {object} map[string]string "error"
// @Failure 500 {object} map[string]string "error"
// @Router /courses [get]
func ListCourses(courseService service.CourseService) gin.HandlerFunc {
	return func(c *gin.Context) {
		limit, _ := strconv.Atoi(c.DefaultQuery("limit", "6"))
		offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
		if limit < 1 || offset < 0 {
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверные параметры пагинации"})
			return
		}

		userID, exists := c.Get("userID")
		var uid uint
		if exists {
			uid = userID.(uint)
		}

		// Обработка class_number
		classNumber := c.Query("class_number")
		ctx := c.Request.Context()
		if classNumber != "" {
			ctx = context.WithValue(ctx, "class_number", classNumber)
		}

		courses, total, err := courseService.List(ctx, limit, offset, uid)
		if err != nil {
			error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Ошибка получения уроков"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"courses": courses, "total": total})
	}
}

// CreateCourse создает новый урок
// @Summary Создать урок
// @Description Создает новый урок. TeacherID устанавливается автоматически из токена авторизации. Требуется JWT-токен. Доступно только для ролей: teacher, admin.
// @Tags courses
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param course body CreateCourseInput true "Данные урока"
// @Success 200 {object} map[string]interface{} "message, course" example={"message":"урок создан","course":{"id":1,"title":"Math 101","description":"Introduction to Mathematics","teacher":{"id":1,"username":"teacher1","email":"teacher1@example.com","role":"teacher","points":0,"created_at":"2025-04-18T12:00:00Z","updated_at":"2025-04-18T12:00:00Z"},"created_at":"2025-04-18T12:00:00Z","updated_at":"2025-04-18T12:00:00Z"}}
// @Failure 400 {object} error.APIError
// @Failure 401 {object} error.APIError
// @Failure 403 {object} error.APIError
// @Failure 500 {object} error.APIError
// @Router /courses [post]
func CreateCourse(courseService service.CourseService) gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.ContentType() != "application/json" {
			logger.Log.Errorf("Invalid Content-Type: %s", c.ContentType())
			c.JSON(http.StatusUnsupportedMediaType, gin.H{"error": "Требуется Content-Type: application/json"})
			return
		}

		var input CreateCourseInput
		if err := c.ShouldBindJSON(&input); err != nil {
			logger.Log.Errorf("Failed to bind JSON: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверный формат данных"})
			return
		}

		userID, exists := c.Get("userID")
		if !exists {
			logger.Log.Error("UserID not found in context")
			error.HandleError(c, error.APIError{Status: http.StatusUnauthorized, Message: "Пользователь не аутентифицирован"})
			return
		}

		course := model.Course{
			Title:       input.Title,
			Description: input.Description,
			Subject:     input.Subject,
			ClassNumber: input.ClassNumber,
			TeacherID:   userID.(uint),
			MaterialURL: input.MaterialURL,
		}

		logger.Log.Infof("Creating course: %+v", course)

		if err := courseService.Create(&course); err != nil {
			logger.Log.Errorf("Failed to create course: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: err.Error()})
			return
		}

		if err := courseService.PreloadTeacher(&course); err != nil {
			logger.Log.Errorf("Failed to preload teacher for course %d: %v", course.ID, err)
			error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Ошибка загрузки данных преподавателя"})
			return
		}

		logger.Log.Infof("Course %s (ID: %d) created by user %d", course.Title, course.ID, userID)
		c.JSON(http.StatusOK, gin.H{"message": "урок создан", "course": course})
	}
}

// GetCourse возвращает урок по ID
// @Summary Получить урок
// @Description Возвращает данные урока по его ID. Требуется JWT-токен. Доступно для ролей: student, teacher, admin.
// @Tags courses
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID урока"
// @Success 200 {object} model.Course
// @Failure 400 {object} map[string]string "error"
// @Failure 401 {object} map[string]string "error"
// @Failure 404 {object} map[string]string "error"
// @Failure 500 {object} map[string]string "error"
// @Router /courses/{id} [get]
func GetCourse(courseService service.CourseService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			logger.Log.Errorf("Invalid course ID: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверный ID"})
			return
		}
		course, err := courseService.Get(uint(id))
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				error.HandleError(c, error.APIError{Status: http.StatusNotFound, Message: "урок не найден"})
			} else {
				logger.Log.Errorf("Failed to get course %d: %v", id, err)
				error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Ошибка сервера"})
			}
			return
		}
		c.JSON(http.StatusOK, course)
	}
}

// Enroll записывает пользователя на урок
// @Summary Записаться на урок
// @Description Записывает аутентифицированного студента на урок. Требуется JWT-токен. Доступно только для роли: student.
// @Tags courses
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID урока"
// @Success 200 {object} map[string]string "message"
// @Failure 400 {object} error.APIError
// @Failure 401 {object} error.APIError
// @Failure 403 {object} error.APIError
// @Failure 500 {object} error.APIError
// @Router /courses/{id}/enroll [post]
func Enroll(courseService service.CourseService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			logger.Log.Errorf("Invalid course ID: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверный ID урока"})
			return
		}

		userID, exists := c.Get("userID")
		if !exists {
			logger.Log.Error("UserID not found in context")
			error.HandleError(c, error.APIError{Status: http.StatusUnauthorized, Message: "Пользователь не аутентифицирован"})
			return
		}

		logger.Log.Infof("User %d attempting to enroll in course %d", userID, id)
		if err := courseService.Enroll(userID.(uint), uint(id)); err != nil {
			logger.Log.Errorf("Failed to enroll user %d in course %d: %v", userID, id, err)
			if err.Error() == "урок не найден" || err.Error() == "пользователь не найден" {
				error.HandleError(c, error.APIError{Status: http.StatusNotFound, Message: err.Error()})
			} else if err.Error() == "пользователь уже записан на урок" || err.Error() == "только студенты могут записываться на урокы" {
				error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: err.Error()})
			} else {
				error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Ошибка записи на урок"})
			}
			return
		}

		logger.Log.Infof("User %d enrolled in course %d", userID, id)
		c.JSON(http.StatusOK, gin.H{"message": "Вы записались на урок"})
	}
}

// Unenroll отменяет запись пользователя на урок
// @Summary Отменить запись на урок
// @Description Отменяет запись аутентифицированного студента на урок. Требуется JWT-токен. Доступно только для роли: student.
// @Tags courses
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID урока"
// @Success 200 {object} map[string]string "message"
// @Failure 400 {object} error.APIError
// @Failure 401 {object} error.APIError
// @Failure 403 {object} error.APIError
// @Failure 404 {object} error.APIError
// @Failure 500 {object} error.APIError
// @Router /courses/{id}/enroll [delete]
func Unenroll(courseService service.CourseService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			logger.Log.Errorf("Invalid course ID: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверный ID урока"})
			return
		}

		userID, exists := c.Get("userID")
		if !exists {
			logger.Log.Error("UserID not found in context")
			error.HandleError(c, error.APIError{Status: http.StatusUnauthorized, Message: "Пользователь не аутентифицирован"})
			return
		}

		logger.Log.Infof("User %d attempting to unenroll from course %d", userID, id)
		if err := courseService.Unenroll(userID.(uint), uint(id)); err != nil {
			logger.Log.Errorf("Failed to unenroll user %d from course %d: %v", userID, id, err)
			if err.Error() == "урок не найден" || err.Error() == "пользователь не найден" || err.Error() == "пользователь не записан на урок" {
				error.HandleError(c, error.APIError{Status: http.StatusNotFound, Message: err.Error()})
			} else if err.Error() == "только студенты могут отменять запись на урокы" {
				error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: err.Error()})
			} else {
				error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Ошибка отмены записи"})
			}
			return
		}

		logger.Log.Infof("User %d unenrolled from course %d", userID, id)
		c.JSON(http.StatusOK, gin.H{"message": "Запись на урок отменена"})
	}
}

// DeleteCourse удаляет урок
// @Summary Удалить урок
// @Description Удаляет урок. Требуется JWT-токен. Доступно только для преподавателя урока или админа.
// @Tags courses
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID урока"
// @Success 200 {object} map[string]string "message"
// @Failure 400 {object} error.APIError
// @Failure 401 {object} error.APIError
// @Failure 403 {object} error.APIError
// @Failure 404 {object} error.APIError
// @Failure 500 {object} error.APIError
// @Router /courses/{id} [delete]
func DeleteCourse(courseService service.CourseService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			logger.Log.Errorf("Invalid course ID: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверный ID урока"})
			return
		}

		userID, exists := c.Get("userID")
		if !exists {
			logger.Log.Error("UserID not found in context")
			error.HandleError(c, error.APIError{Status: http.StatusUnauthorized, Message: "Пользователь не аутентифицирован"})
			return
		}

		logger.Log.Infof("User %d attempting to delete course %d", userID, id)
		if err := courseService.Delete(userID.(uint), uint(id)); err != nil {
			logger.Log.Errorf("Failed to delete course %d by user %d: %v", id, userID, err)
			if err.Error() == "урок не найден" || err.Error() == "пользователь не найден" {
				error.HandleError(c, error.APIError{Status: http.StatusNotFound, Message: err.Error()})
			} else if err.Error() == "нет прав для удаления урока" || err.Error() == "недостаточно прав" {
				error.HandleError(c, error.APIError{Status: http.StatusForbidden, Message: err.Error()})
			} else {
				error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Ошибка удаления урока"})
			}
			return
		}

		logger.Log.Infof("Course %d deleted by user %d", id, userID)
		c.JSON(http.StatusOK, gin.H{"message": "урок удален"})
	}
}

// GetCourseStats возвращает статистику урока
// @Summary Получить статистику урока
// @Description Возвращает статистику урока (количество студентов, средняя оценка, процент завершения). Требуется JWT-токен. Доступно для ролей: teacher, admin.
// @Tags courses
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID урока"
// @Success 200 {object} map[string]interface{} "students_count, average_grade, completion_rate"
// @Failure 400 {object} error.APIError
// @Failure 401 {object} error.APIError
// @Failure 403 {object} error.APIError
// @Failure 404 {object} error.APIError
// @Failure 500 {object} error.APIError
// @Router /courses/{id}/stats [get]
func GetCourseStats(courseService service.CourseService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			logger.Log.Errorf("Invalid course ID: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверный ID урока"})
			return
		}

		userID, exists := c.Get("userID")
		if !exists {
			logger.Log.Error("UserID not found in context")
			error.HandleError(c, error.APIError{Status: http.StatusUnauthorized, Message: "Пользователь не аутентифицирован"})
			return
		}

		logger.Log.Infof("User %d fetching stats for course %d", userID, id)
		stats, err := courseService.GetStats(uint(id))
		if err != nil {
			logger.Log.Errorf("Failed to fetch stats for course %d: %v", id, err)
			if err.Error() == "урок не найден" {
				error.HandleError(c, error.APIError{Status: http.StatusNotFound, Message: "урок не найден"})
			} else {
				error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Ошибка получения статистики"})
			}
			return
		}

		// Проверка прав: учитель урока или админ
		var user model.User
		if err := db.DB.First(&user, userID).Error; err != nil {
			logger.Log.Errorf("User %d not found: %v", userID, err)
			error.HandleError(c, error.APIError{Status: http.StatusNotFound, Message: "Пользователь не найден"})
			return
		}
		var course model.Course
		if err := db.DB.First(&course, id).Error; err != nil {
			logger.Log.Errorf("Course %d not found: %v", id, err)
			error.HandleError(c, error.APIError{Status: http.StatusNotFound, Message: "урок не найден"})
			return
		}
		if user.Role == model.Teacher && course.TeacherID != userID.(uint) {
			logger.Log.Warnf("Teacher %d does not own course %d", userID, id)
			error.HandleError(c, error.APIError{Status: http.StatusForbidden, Message: "Нет прав для просмотра статистики"})
			return
		}
		if user.Role != model.Teacher && user.Role != model.Admin {
			logger.Log.Warnf("User %d does not have permission", userID)
			error.HandleError(c, error.APIError{Status: http.StatusForbidden, Message: "Недостаточно прав"})
			return
		}

		logger.Log.Infof("Stats fetched for course %d by user %d", id, userID)
		c.JSON(http.StatusOK, stats)
	}
}

// GetCourseProgress возвращает прогресс пользователя по уроку
// @Summary Получить прогресс по уроку
// @Description Возвращает прогресс текущего пользователя по уроку (количество заданий, завершённых заданий, процент завершения, набранные баллы). Требуется JWT-токен. Доступно только для студентов, записанных на урок.
// @Tags courses
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID урока"
// @Success 200 {object} map[string]interface{} "total_assignments, completed_assignments, completion_rate, total_points"
// @Failure 400 {object} error.APIError
// @Failure 401 {object} error.APIError
// @Failure 403 {object} error.APIError
// @Failure 404 {object} error.APIError
// @Failure 500 {object} error.APIError
// @Router /courses/{id}/progress [get]
func GetCourseProgress(courseService service.CourseService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userID")
		if !exists {
			logger.Log.Warn("Unauthorized access to course progress")
			error.HandleError(c, error.APIError{Status: http.StatusUnauthorized, Message: "Пользователь не аутентифицирован"})
			return
		}

		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			logger.Log.Warnf("Invalid course ID: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверный ID урока"})
			return
		}

		// Проверка: записан ли пользователь на урок
		var enrollment model.Enrollment
		if err := db.DB.Where("user_id = ? AND course_id = ?", userID, id).First(&enrollment).Error; err != nil {
			logger.Log.Warnf("User %d is not enrolled in course %d: %v", userID, id, err)
			error.HandleError(c, error.APIError{Status: http.StatusForbidden, Message: "Вы не записаны на этот урок"})
			return
		}

		// Проверка: является ли пользователь студентом
		var user model.User
		if err := db.DB.First(&user, userID).Error; err != nil {
			logger.Log.Errorf("User %d not found: %v", userID, err)
			error.HandleError(c, error.APIError{Status: http.StatusNotFound, Message: "Пользователь не найден"})
			return
		}
		if user.Role != model.Student {
			logger.Log.Warnf("User %d is not a student", userID)
			error.HandleError(c, error.APIError{Status: http.StatusForbidden, Message: "Только студенты могут просматривать прогресс"})
			return
		}

		progress, err := courseService.GetProgress(uint(userID.(uint)), uint(id))
		if err != nil {
			logger.Log.Errorf("Failed to get progress for user %d in course %d: %v", userID, id, err)
			if err.Error() == "урок не найден" {
				error.HandleError(c, error.APIError{Status: http.StatusNotFound, Message: err.Error()})
			} else {
				error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Ошибка получения прогресса"})
			}
			return
		}

		logger.Log.Infof("Progress fetched for user %d in course %d", userID, id)
		c.JSON(http.StatusOK, progress)
	}
}

// CheckDeadlines запускает проверку дедлайнов вручную
// @Summary Ручная проверка дедлайнов
// @Description Запускает проверку дедлайнов и отправляет уведомления. Доступно только для администратора. Требуется JWT-токен.
// @Tags courses
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} map[string]string "message"
// @Failure 401 {object} error.APIError
// @Failure 403 {object} error.APIError
// @Failure 500 {object} error.APIError
// @Router /check-deadlines [post]
func CheckDeadlines(courseService service.CourseService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userID")
		if !exists {
			logger.Log.Warn("Unauthorized access to check deadlines")
			error.HandleError(c, error.APIError{Status: http.StatusUnauthorized, Message: "Пользователь не аутентифицирован"})
			return
		}

		var user model.User
		if err := db.DB.First(&user, userID).Error; err != nil {
			logger.Log.Errorf("User %d not found: %v", userID, err)
			error.HandleError(c, error.APIError{Status: http.StatusNotFound, Message: "Пользователь не найден"})
			return
		}

		if user.Role != model.Admin {
			logger.Log.Warnf("User %d does not have permission to check deadlines", userID)
			error.HandleError(c, error.APIError{Status: http.StatusForbidden, Message: "Доступно только для администратора"})
			return
		}

		if err := courseService.CheckDeadlines(); err != nil {
			logger.Log.Errorf("Failed to check deadlines: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Ошибка проверки дедлайнов"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Дедлайны проверены"})
	}
}

// IsEnrolled проверяет, записан ли пользователь на урок
// @Summary Проверить запись на урок
// @Description Проверяет, записан ли аутентифицированный студент на урок. Требуется JWT-токен. Доступно только для роли: student.
// @Tags courses
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID урока"
// @Success 200 {object} map[string]bool "enrolled"
// @Failure 400 {object} error.APIError
// @Failure 401 {object} error.APIError
// @Failure 403 {object} error.APIError
// @Failure 500 {object} error.APIError
// @Router /courses/{id}/is-enrolled [get]
func IsEnrolled(courseService service.CourseService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			logger.Log.Errorf("Invalid course ID: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверный ID урока"})
			return
		}

		userID, exists := c.Get("userID")
		if !exists {
			logger.Log.Error("UserID not found in context")
			error.HandleError(c, error.APIError{Status: http.StatusUnauthorized, Message: "Пользователь не аутентифицирован"})
			return
		}

		var user model.User
		if err := db.DB.First(&user, userID).Error; err != nil {
			logger.Log.Errorf("User %d not found: %v", userID, err)
			error.HandleError(c, error.APIError{Status: http.StatusNotFound, Message: "Пользователь не найден"})
			return
		}

		if user.Role != model.Student {
			logger.Log.Warnf("User %d is not a student", userID)
			error.HandleError(c, error.APIError{Status: http.StatusForbidden, Message: "Только студенты могут проверять запись на урок"})
			return
		}

		logger.Log.Infof("User %d checking enrollment in course %d", userID, id)
		isEnrolled, err := courseService.IsEnrolled(userID.(uint), uint(id))
		if err != nil {
			logger.Log.Errorf("Failed to check enrollment for user %d in course %d: %v", userID, id, err)
			error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Ошибка проверки записи"})
			return
		}

		logger.Log.Infof("Enrollment status for user %d in course %d: %v", userID, id, isEnrolled)
		c.JSON(http.StatusOK, gin.H{"enrolled": isEnrolled})
	}
}

func GetEnrolledCourses(courseService service.CourseService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userIDStr := c.Query("userID")
		userID, err := strconv.ParseUint(userIDStr, 10, 32)
		if err != nil {
			logger.Log.Errorf("Invalid userID: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "некорректный userID"})
			return
		}

		// Получаем уроки, на которые записан пользователь
		courses, err := courseService.GetEnrolledCourses(uint(userID))
		if err != nil {
			logger.Log.Errorf("Failed to fetch enrolled courses for user %d: %v", userID, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		logger.Log.Infof("Fetched %d enrolled courses for user %d", len(courses), userID)
		c.JSON(http.StatusOK, gin.H{"courses": courses})
	}
}

// UploadCourseMaterial загружает PDF-материал для урока
// @Summary Загрузить материал урока
// @Description Загружает PDF-файл для урока. Доступно для учителей и админов. Требуется JWT-токен.
// @Tags courses
// @Accept multipart/form-data
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID урока"
// @Param file formData file true "PDF-файл"
// @Success 200 {object} map[string]string "file_url"
// @Failure 400 {object} error.APIError
// @Failure 401 {object} error.APIError
// @Failure 403 {object} error.APIError
// @Failure 500 {object} error.APIError
// @Router /courses/{id}/material/upload [post]
func UploadCourseMaterial() gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userID")
		if !exists {
			logger.Log.Error("UserID not found in context")
			error.HandleError(c, error.APIError{Status: http.StatusUnauthorized, Message: "Пользователь не аутентифицирован"})
			return
		}

		courseID, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			logger.Log.Errorf("Invalid course ID: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверный ID урока"})
			return
		}

		var user model.User
		if err := db.DB.First(&user, userID).Error; err != nil {
			logger.Log.Errorf("User %d not found: %v", userID, err)
			error.HandleError(c, error.APIError{Status: http.StatusNotFound, Message: "Пользователь не найден"})
			return
		}

		var course model.Course
		if err := db.DB.First(&course, courseID).Error; err != nil {
			logger.Log.Errorf("Course %d not found: %v", courseID, err)
			error.HandleError(c, error.APIError{Status: http.StatusNotFound, Message: "Урок не найден"})
			return
		}

		if user.Role != model.Admin && (user.Role != model.Teacher || course.TeacherID != userID) {
			logger.Log.Warnf("User %d has no permission to upload material for course %d", userID, courseID)
			error.HandleError(c, error.APIError{Status: http.StatusForbidden, Message: "Нет прав для загрузки материала"})
			return
		}

		file, err := c.FormFile("file")
		if err != nil {
			logger.Log.Errorf("File not provided: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Файл не загружен"})
			return
		}

		if filepath.Ext(file.Filename) != ".pdf" {
			logger.Log.Errorf("Invalid file format: %s", file.Filename)
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Допустимы только PDF-файлы"})
			return
		}

		uploadDir := filepath.Join("uploads", "materials")
		if err := os.MkdirAll(uploadDir, 0755); err != nil {
			logger.Log.Errorf("Failed to create upload directory: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Ошибка сервера"})
			return
		}

		filename := fmt.Sprintf("%d_%s", courseID, file.Filename)
		filePath := filepath.Join(uploadDir, filename)
		if err := c.SaveUploadedFile(file, filePath); err != nil {
			logger.Log.Errorf("Failed to save file: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Не удалось сохранить файл"})
			return
		}

		// Обновляем поле MaterialURL в курсе
		if err := db.DB.Model(&course).Update("material_url", fmt.Sprintf("/%s", filePath)).Error; err != nil {
			logger.Log.Errorf("Failed to update course material URL: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Ошибка обновления урока"})
			return
		}

		logger.Log.Infof("Material uploaded for course %d by user %d: %s", courseID, userID, filePath)
		util.LogUserAction(repository.NewActionLogRepository(db.DB), userID.(uint), "upload_material", fmt.Sprintf("Загружен материал для урока ID: %d", courseID))
		c.JSON(http.StatusOK, gin.H{"file_url": fmt.Sprintf("/%s", filePath)})
	}
}
