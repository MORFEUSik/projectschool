package handler

import (
	"net/http"
	"strconv"

	"github.com/MORFEUSik/projectschool/backend/internal/db"
	"github.com/MORFEUSik/projectschool/backend/internal/error"
	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/service"
	"github.com/gin-gonic/gin"
)

// SubmitAssignment позволяет студенту отправить решение
func SubmitAssignment(submissionService service.SubmissionService) gin.HandlerFunc {
	return func(c *gin.Context) {
		logger.Log.Info("Processing SubmitAssignment request")

		var submissionInput struct {
			Content string `json:"content" binding:"required"`
		}
		if err := c.ShouldBindJSON(&submissionInput); err != nil {
			logger.Log.Errorf("Failed to bind JSON: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверный формат данных"})
			return
		}

		userID, exists := c.Get("userID")
		if !exists {
			logger.Log.Error("User not authenticated")
			error.HandleError(c, error.APIError{Status: http.StatusUnauthorized, Message: "Пользователь не аутентифицирован"})
			return
		}

		id, err := strconv.ParseUint(c.Param("id"), 10, 32)
		if err != nil {
			logger.Log.Errorf("Invalid assignment ID: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверный ID задания"})
			return
		}

		submission := model.Submission{
			UserID:       userID.(uint),
			AssignmentID: uint(id),
			Content:      submissionInput.Content,
		}
		logger.Log.Infof("Received submission: content=%s, userID=%d, assignmentID=%d", submission.Content, submission.UserID, submission.AssignmentID)

		logger.Log.Info("Calling submissionService.Create")
		if err := submissionService.Create(&submission); err != nil {
			logger.Log.Errorf("Failed to create submission: %v", err)
			if err.Error() == "решение уже отправлено" {
				error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Решение уже отправлено"})
				return
			}
			error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: err.Error()})
			return
		}

		logger.Log.Info("Submission created successfully")
		c.JSON(http.StatusOK, gin.H{
			"message":    "Решение отправлено",
			"submission": submission,
		})
	}
}

// SetGrade позволяет преподавателю установить оценку
func SetGrade(submissionService service.SubmissionService) gin.HandlerFunc {
	return func(c *gin.Context) {
		logger.Log.Info("Processing SetGrade request")

		var gradeInput struct {
			Grade float64 `json:"grade" binding:"required,gte=0,lte=5"`
		}
		if err := c.ShouldBindJSON(&gradeInput); err != nil {
			logger.Log.Errorf("Failed to bind JSON: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверный формат данных"})
			return
		}

		id, err := strconv.ParseUint(c.Param("id"), 10, 32)
		if err != nil {
			logger.Log.Errorf("Invalid submission ID: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверный ID решения"})
			return
		}

		userID := c.GetUint("userID")
		logger.Log.Infof("Setting grade %f for submission %d by user %d", gradeInput.Grade, id, userID)

		if err := submissionService.SetGrade(uint(id), userID, gradeInput.Grade); err != nil {
			logger.Log.Errorf("Failed to set grade: %v", err)
			if err.Error() == "решение не найдено" {
				error.HandleError(c, error.APIError{Status: http.StatusNotFound, Message: "Решение не найдено"})
				return
			}
			if err.Error() == "нет прав для оценки" {
				error.HandleError(c, error.APIError{Status: http.StatusForbidden, Message: "Нет прав для оценки"})
				return
			}
			error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: err.Error()})
			return
		}

		logger.Log.Info("Grade set successfully")
		c.JSON(http.StatusOK, gin.H{"message": "Оценка установлена"})
	}
}

// ListSubmissions возвращает список решений по assignment_id или user_id
func ListSubmissions(submissionService service.SubmissionService) gin.HandlerFunc {
	return func(c *gin.Context) {
		logger.Log.Info("Processing ListSubmissions request")

		userID, exists := c.Get("userID")
		if !exists {
			logger.Log.Error("User not authenticated")
			error.HandleError(c, error.APIError{Status: http.StatusUnauthorized, Message: "Пользователь не аутентифицирован"})
			return
		}

		// Проверка роли
		var user model.User
		if err := db.DB.First(&user, userID).Error; err != nil {
			logger.Log.Errorf("User %d not found: %v", userID, err)
			error.HandleError(c, error.APIError{Status: http.StatusUnauthorized, Message: "Пользователь не найден"})
			return
		}
		if user.Role != model.Teacher && user.Role != model.Admin {
			logger.Log.Warnf("User %d does not have permission to list submissions", userID)
			error.HandleError(c, error.APIError{Status: http.StatusForbidden, Message: "Нет прав для просмотра решений"})
			return
		}

		assignmentIDStr := c.Query("assignment_id")
		userIDStr := c.Query("user_id")

		var response []map[string]interface{}

		if assignmentIDStr != "" {
			assignmentID, err := strconv.Atoi(assignmentIDStr)
			if err != nil {
				logger.Log.Errorf("Invalid assignment_id: %v", err)
				error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверный assignment_id"})
				return
			}
			submissions, err := submissionService.GetByAssignment(uint(assignmentID))
			if err != nil {
				logger.Log.Errorf("Failed to get submissions for assignment %d: %v", assignmentID, err)
				if err.Error() == "задание не найдено" {
					error.HandleError(c, error.APIError{Status: http.StatusNotFound, Message: "Задание не найдено"})
					return
				}
				error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Внутренняя ошибка сервера"})
				return
			}
			// Формируем ответ с дополнительными полями
			response = make([]map[string]interface{}, len(submissions))
			for i, sub := range submissions {
				response[i] = map[string]interface{}{
					"id":               sub.ID,
					"user_id":          sub.UserID,
					"username":         sub.User.Username,
					"content":          sub.Content,
					"score":            sub.Grade,
					"submitted_at":     sub.CreatedAt.Format("2006-01-02T15:04:05Z"),
					"assignment_id":    sub.AssignmentID,
					"assignment_title": sub.Assignment.Title,
					"course_id":        sub.Assignment.CourseID,
					"course_title":     sub.Assignment.Course.Title,
				}
			}
		} else if userIDStr != "" {
			userIDQuery, err := strconv.Atoi(userIDStr)
			if err != nil {
				logger.Log.Errorf("Invalid user_id: %v", err)
				error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверный user_id"})
				return
			}
			submissions, err := submissionService.GetByUserID(uint(userIDQuery))
			if err != nil {
				logger.Log.Errorf("Failed to get submissions for user %d: %v", userIDQuery, err)
				error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Внутренняя ошибка сервера"})
				return
			}
			// Формируем ответ с дополнительными полями
			response = make([]map[string]interface{}, len(submissions))
			for i, sub := range submissions {
				response[i] = map[string]interface{}{
					"id":               sub.ID,
					"user_id":          sub.UserID,
					"username":         sub.User.Username,
					"content":          sub.Content,
					"score":            sub.Grade,
					"submitted_at":     sub.CreatedAt.Format("2006-01-02T15:04:05Z"),
					"assignment_id":    sub.AssignmentID,
					"assignment_title": sub.Assignment.Title,
					"course_id":        sub.Assignment.CourseID,
					"course_title":     sub.Assignment.Course.Title,
				}
			}
		} else {
			logger.Log.Error("Missing assignment_id or user_id")
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Требуется assignment_id или user_id"})
			return
		}

		logger.Log.Infof("Returning %d submissions", len(response))
		c.JSON(http.StatusOK, response)
	}
}
