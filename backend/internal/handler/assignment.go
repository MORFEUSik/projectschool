package handler

import (
	"net/http"
	"strconv"

	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/service"
	"github.com/gin-gonic/gin"
)

// ListAssignments возвращает список заданий для курса
// @Summary Получить список заданий
// @Description Возвращает список заданий для указанного курса. Требуется.JWT-токен. Доступно для ролей: student, teacher, admin.
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
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный ID курса"})
			return
		}
		assignments, err := assignmentService.ListByCourse(uint(courseID))
		if err != nil {
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
		var assignment model.Assignment
		if err := c.ShouldBindJSON(&assignment); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат данных"})
			return
		}
		if err := assignment.Validate(); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if err := assignmentService.Create(&assignment); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка создания задания"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Задание создано", "assignment": assignment})
	}
}
