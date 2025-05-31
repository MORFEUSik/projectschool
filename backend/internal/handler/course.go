package handler

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/MORFEUSik/projectschool/backend/internal/db"
	"github.com/MORFEUSik/projectschool/backend/internal/error"
	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"gorm.io/gorm"
)

// CreateCourseInput defines the input structure for creating a course
type CreateCourseInput struct {
	Title       string `json:"title" binding:"required,min=3,max=100" swaggertype:"string" example:"Math 101" description:"Название курса (обязательное, 3-100 символов)"`
	Description string `json:"description" swaggertype:"string" example:"Introduction to Mathematics" description:"Описание курса (опциональное)"`
}

// ListCourses возвращает список курсов
// @Summary Получить список курсов
// @Description Возвращает список всех курсов с пагинацией. Требуется JWT-токен. Доступно для ролей: student, teacher, admin.
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
		limit, _ := strconv.Atoi(c.DefaultQuery("limit", "6")) // По умолчанию 6
		offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
		if limit < 1 || offset < 0 {
			logger.Log.Errorf("Invalid pagination params: limit=%d, offset=%d", limit, offset)
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверные параметры пагинации"})
			return
		}
		courses, total, err := courseService.List(limit, offset)
		if err != nil {
			logger.Log.Errorf("Failed to list courses: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Ошибка получения курсов"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"courses": courses, "total": total})
	}
}

// CreateCourse создает новый курс
// @Summary Создать курс
// @Description Создает новый курс. TeacherID устанавливается автоматически из токена авторизации. Требуется JWT-токен. Доступно только для ролей: teacher, admin.
// @Tags courses
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param course body CreateCourseInput true "Данные курса"
// @Success 200 {object} map[string]interface{} "message, course" example={"message":"Курс создан","course":{"id":1,"title":"Math 101","description":"Introduction to Mathematics","teacher":{"id":1,"username":"teacher1","email":"teacher1@example.com","role":"teacher","points":0,"created_at":"2025-04-18T12:00:00Z","updated_at":"2025-04-18T12:00:00Z"},"created_at":"2025-04-18T12:00:00Z","updated_at":"2025-04-18T12:00:00Z"}}
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
			TeacherID:   userID.(uint),
		}

		logger.Log.Infof("Creating course: %+v", course)

		// Валидация
		if err := course.Validate(); err != nil {
			logger.Log.Errorf("Course validation failed: %v", err)
			validationErrors := make([]string, 0)
			if errs, ok := err.(validator.ValidationErrors); ok {
				for _, e := range errs {
					validationErrors = append(validationErrors, fmt.Sprintf("Поле %s: %s", e.Field(), e.Tag()))
				}
			} else {
				validationErrors = append(validationErrors, err.Error())
			}
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: strings.Join(validationErrors, "; ")})
			return
		}

		if err := courseService.Create(&course); err != nil {
			logger.Log.Errorf("Failed to create course: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: err.Error()})
			return
		}

		// Подгружаем данные учителя
		if err := courseService.PreloadTeacher(&course); err != nil {
			logger.Log.Errorf("Failed to preload teacher for course %d: %v", course.ID, err)
			error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Ошибка загрузки данных преподавателя"})
			return
		}

		logger.Log.Infof("Course %s (ID: %d) created by user %d", course.Title, course.ID, userID)
		c.JSON(http.StatusOK, gin.H{"message": "Курс создан", "course": course})
	}
}

// GetCourse возвращает курс по ID
// @Summary Получить курс
// @Description Возвращает данные курса по его ID. Требуется JWT-токен. Доступно для ролей: student, teacher, admin.
// @Tags courses
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID курса"
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
				error.HandleError(c, error.APIError{Status: http.StatusNotFound, Message: "Курс не найден"})
			} else {
				logger.Log.Errorf("Failed to get course %d: %v", id, err)
				error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Ошибка сервера"})
			}
			return
		}
		c.JSON(http.StatusOK, course)
	}
}

// Enroll записывает пользователя на курс
// @Summary Записаться на курс
// @Description Записывает аутентифицированного студента на курс. Требуется JWT-токен. Доступно только для роли: student.
// @Tags courses
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID курса"
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
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверный ID курса"})
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
			if err.Error() == "курс не найден" || err.Error() == "пользователь не найден" {
				error.HandleError(c, error.APIError{Status: http.StatusNotFound, Message: err.Error()})
			} else if err.Error() == "пользователь уже записан на курс" || err.Error() == "только студенты могут записываться на курсы" {
				error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: err.Error()})
			} else {
				error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Ошибка записи на курс"})
			}
			return
		}

		logger.Log.Infof("User %d enrolled in course %d", userID, id)
		c.JSON(http.StatusOK, gin.H{"message": "Вы записались на курс"})
	}
}

// Unenroll отменяет запись пользователя на курс
// @Summary Отменить запись на курс
// @Description Отменяет запись аутентифицированного студента на курс. Требуется JWT-токен. Доступно только для роли: student.
// @Tags courses
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID курса"
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
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверный ID курса"})
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
			if err.Error() == "курс не найден" || err.Error() == "пользователь не найден" || err.Error() == "пользователь не записан на курс" {
				error.HandleError(c, error.APIError{Status: http.StatusNotFound, Message: err.Error()})
			} else if err.Error() == "только студенты могут отменять запись на курсы" {
				error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: err.Error()})
			} else {
				error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Ошибка отмены записи"})
			}
			return
		}

		logger.Log.Infof("User %d unenrolled from course %d", userID, id)
		c.JSON(http.StatusOK, gin.H{"message": "Запись на курс отменена"})
	}
}

// DeleteCourse удаляет курс
// @Summary Удалить курс
// @Description Удаляет курс. Требуется JWT-токен. Доступно только для преподавателя курса или админа.
// @Tags courses
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID курса"
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
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверный ID курса"})
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
			if err.Error() == "курс не найден" || err.Error() == "пользователь не найден" {
				error.HandleError(c, error.APIError{Status: http.StatusNotFound, Message: err.Error()})
			} else if err.Error() == "нет прав для удаления курса" || err.Error() == "недостаточно прав" {
				error.HandleError(c, error.APIError{Status: http.StatusForbidden, Message: err.Error()})
			} else {
				error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Ошибка удаления курса"})
			}
			return
		}

		logger.Log.Infof("Course %d deleted by user %d", id, userID)
		c.JSON(http.StatusOK, gin.H{"message": "Курс удален"})
	}
}

// GetCourseStats возвращает статистику курса
// @Summary Получить статистику курса
// @Description Возвращает статистику курса (количество студентов, средняя оценка, процент завершения). Требуется JWT-токен. Доступно для ролей: teacher, admin.
// @Tags courses
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID курса"
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
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверный ID курса"})
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
			if err.Error() == "курс не найден" {
				error.HandleError(c, error.APIError{Status: http.StatusNotFound, Message: "Курс не найден"})
			} else {
				error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Ошибка получения статистики"})
			}
			return
		}

		// Проверка прав: учитель курса или админ
		var user model.User
		if err := db.DB.First(&user, userID).Error; err != nil {
			logger.Log.Errorf("User %d not found: %v", userID, err)
			error.HandleError(c, error.APIError{Status: http.StatusNotFound, Message: "Пользователь не найден"})
			return
		}
		var course model.Course
		if err := db.DB.First(&course, id).Error; err != nil {
			logger.Log.Errorf("Course %d not found: %v", id, err)
			error.HandleError(c, error.APIError{Status: http.StatusNotFound, Message: "Курс не найден"})
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

// GetCourseProgress возвращает прогресс пользователя по курсу
// @Summary Получить прогресс по курсу
// @Description Возвращает прогресс текущего пользователя по курсу (количество заданий, завершённых заданий, процент завершения, набранные баллы). Требуется JWT-токен. Доступно только для студентов, записанных на курс.
// @Tags courses
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID курса"
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
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверный ID курса"})
			return
		}

		// Проверка: записан ли пользователь на курс
		var enrollment model.Enrollment
		if err := db.DB.Where("user_id = ? AND course_id = ?", userID, id).First(&enrollment).Error; err != nil {
			logger.Log.Warnf("User %d is not enrolled in course %d: %v", userID, id, err)
			error.HandleError(c, error.APIError{Status: http.StatusForbidden, Message: "Вы не записаны на этот курс"})
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
			if err.Error() == "курс не найден" {
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
