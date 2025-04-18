package handler

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"

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
// @Param limit query int false "Лимит записей" default(10)
// @Param offset query int false "Смещение" default(0)
// @Success 200 {array} model.Course
// @Failure 400 {object} map[string]string "error"
// @Failure 401 {object} map[string]string "error"
// @Failure 500 {object} map[string]string "error"
// @Router /courses [get]
func ListCourses(courseService service.CourseService) gin.HandlerFunc {
	return func(c *gin.Context) {
		limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
		offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
		if limit < 1 || offset < 0 {
			logger.Log.Errorf("Invalid pagination params: limit=%d, offset=%d", limit, offset)
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверные параметры пагинации"})
			return
		}
		courses, err := courseService.List(limit, offset)
		if err != nil {
			logger.Log.Errorf("Failed to list courses: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Ошибка получения курсов"})
			return
		}
		c.JSON(http.StatusOK, courses)
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
