// @title ProjectSchool API
// @version 1.0
// @description API для обучающего приложения ProjectSchool
// @host localhost:8080
// @BasePath /api

package handler

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/MORFEUSik/projectschool/backend/internal/error"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/service"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

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
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверные параметры пагинации"})
			return
		}
		courses, err := courseService.List(limit, offset)
		if err != nil {
			error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Ошибка получения курсов"})
			return
		}
		c.JSON(http.StatusOK, courses)
	}
}

// CreateCourse создает новый курс
// @Summary Создать курс
// @Description Создает новый курс. Требуется JWT-токен. Доступно только для ролей: teacher, admin.
// @Tags courses
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param course body model.Course true "Данные курса"
// @Success 200 {object} map[string]interface{} "message, course"
// @Failure 400 {object} map[string]string "error"
// @Failure 401 {object} map[string]string "error"
// @Failure 403 {object} map[string]string "error"
// @Failure 500 {object} map[string]string "error"
// @Router /courses [post]
func CreateCourse(courseService service.CourseService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var course model.Course
		if err := c.ShouldBindJSON(&course); err != nil {
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверный формат данных"})
			return
		}
		if err := course.Validate(); err != nil {
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: err.Error()})
			return
		}
		userID := c.GetUint("userID")
		course.TeacherID = userID

		if err := courseService.Create(&course); err != nil {
			error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Ошибка создания курса"})
			return
		}
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
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверный ID"})
			return
		}
		course, err := courseService.Get(uint(id))
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				error.HandleError(c, error.APIError{Status: http.StatusNotFound, Message: "Курс не найден"})
			} else {
				error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Ошибка сервера"})
			}
			return
		}
		c.JSON(http.StatusOK, course)
	}
}
