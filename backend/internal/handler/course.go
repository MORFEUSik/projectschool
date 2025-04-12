// backend/internal/handler/course.go
package handler

import (
	"net/http"
	"strconv"

	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/service"
	"github.com/gin-gonic/gin"
)

func ListCourses(courseService service.CourseService) gin.HandlerFunc {
	return func(c *gin.Context) {
		courses, err := courseService.List()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка получения курсов"})
			return
		}
		c.JSON(http.StatusOK, courses)
	}
}

func CreateCourse(courseService service.CourseService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var course model.Course
		if err := c.ShouldBindJSON(&course); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат данных"})
			return
		}
		userID := c.GetUint("userID")
		course.TeacherID = userID

		if err := courseService.Create(&course); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка создания курса"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Курс создан", "course": course})
	}
}

func GetCourse(courseService service.CourseService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный ID"})
			return
		}
		course, err := courseService.Get(uint(id))
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Курс не найден"})
			return
		}
		c.JSON(http.StatusOK, course)
	}
}
