// backend/internal/handler/submission.go
package handler

import (
	"net/http"
	"strconv"

	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/service"
	"github.com/gin-gonic/gin"
)

func SubmitAssignment(submissionService service.SubmissionService) gin.HandlerFunc {
	return func(c *gin.Context) {
		assignmentID, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный ID задания"})
			return
		}
		var submission model.Submission
		if err := c.ShouldBindJSON(&submission); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат данных"})
			return
		}
		submission.AssignmentID = uint(assignmentID)
		submission.UserID = c.GetUint("userID")

		if err := submissionService.Create(&submission); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка отправки решения"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Решение отправлено", "submission": submission})
	}
}
