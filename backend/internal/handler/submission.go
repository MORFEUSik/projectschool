package handler

import (
	"net/http"
	"strconv"

	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/service"
	"github.com/gin-gonic/gin"
)

func SubmitAssignment(submissionService service.SubmissionService) gin.HandlerFunc {
	return func(c *gin.Context) {
		logger.Log.Info("Processing SubmitAssignment request")

		var submission model.Submission
		if err := c.ShouldBindJSON(&submission); err != nil {
			logger.Log.Errorf("Failed to bind JSON: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат данных"})
			return
		}
		logger.Log.Infof("Received submission: content=%s, grade=%.2f", submission.Content, submission.Grade)

		userID, exists := c.Get("userID")
		if !exists {
			logger.Log.Error("User not authenticated")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Пользователь не аутентифицирован"})
			return
		}
		submission.UserID = userID.(uint)
		logger.Log.Infof("Set UserID: %d", submission.UserID)

		id, err := strconv.ParseUint(c.Param("id"), 10, 32)
		if err != nil {
			logger.Log.Errorf("Invalid assignment ID: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный ID задания"})
			return
		}
		submission.AssignmentID = uint(id)
		logger.Log.Infof("Set AssignmentID: %d", submission.AssignmentID)

		logger.Log.Info("Calling submissionService.Create")
		if err := submissionService.Create(&submission); err != nil {
			logger.Log.Errorf("Failed to create submission: %v", err)
			if err.Error() == "решение уже отправлено" {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Решение уже отправлено"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		logger.Log.Info("Submission created successfully")
		c.JSON(http.StatusOK, gin.H{
			"message":    "Решение отправлено",
			"submission": submission,
		})
	}
}
