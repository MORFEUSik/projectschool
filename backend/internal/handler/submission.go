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
			Grade float64 `json:"grade" binding:"required,gte=0,lte=10"`
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
		courseIDStr := c.Query("course_id")

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
			response = makeSubmissionResponse(submissions)
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
			response = makeSubmissionResponse(submissions)
		} else if courseIDStr != "" {
			courseID, err := strconv.Atoi(courseIDStr)
			if err != nil {
				logger.Log.Errorf("Invalid course_id: %v", err)
				error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверный course_id"})
				return
			}
			submissions, err := submissionService.GetByCourse(uint(courseID))
			if err != nil {
				logger.Log.Errorf("Failed to get submissions for course %d: %v", courseID, err)
				error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Ошибка получения решений по уроку"})
				return
			}
			response = makeSubmissionResponse(submissions)
		} else {
			logger.Log.Error("Missing assignment_id, user_id, or course_id")
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Требуется assignment_id, user_id или course_id"})
			return
		}

		logger.Log.Infof("Returning %d submissions", len(response))
		c.JSON(http.StatusOK, response)
	}
}

// Вспомогательная функция для форматирования ответов
func makeSubmissionResponse(submissions []model.Submission) []map[string]interface{} {
	response := make([]map[string]interface{}, len(submissions))
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
	return response
}

// GetUserSubmissions возвращает список решений текущего пользователя
// @Summary Получить решения текущего пользователя
// @Description Возвращает список всех решений аутентифицированного пользователя с информацией о заданиях и уроках.
// @Tags submissions
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {array} map[string]interface{}
// @Failure 401 {object} error.APIError
// @Failure 500 {object} error.APIError
// @Router /users/me/submissions [get]
func GetUserSubmissions(submissionService service.SubmissionService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userID")
		if !exists {
			logger.Log.Error("User not authenticated")
			error.HandleError(c, error.APIError{Status: http.StatusUnauthorized, Message: "Пользователь не аутентифицирован"})
			return
		}

		logger.Log.Infof("Fetching submissions for user %v", userID)
		submissions, err := submissionService.GetUserSubmissions(c, userID.(uint))
		if err != nil {
			logger.Log.Errorf("Failed to fetch submissions for user %d: %v", userID, err)
			error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Не удалось получить решения"})
			return
		}

		// Формируем ответ с вложенной структурой, соответствующей фронтенду
		response := make([]map[string]interface{}, len(submissions))
		for i, sub := range submissions {
			response[i] = map[string]interface{}{
				"ID":           sub.ID,
				"UserID":       sub.UserID,
				"AssignmentID": sub.AssignmentID,
				"Content":      sub.Content,
				"Grade":        sub.Grade,
				"CreatedAt":    sub.CreatedAt.Format("2006-01-02T15:04:05Z"),
				"Assignment": map[string]interface{}{
					"ID":       sub.Assignment.ID,
					"Title":    sub.Assignment.Title,
					"CourseID": sub.Assignment.CourseID,
					"Course": map[string]interface{}{
						"ID":    sub.Assignment.Course.ID,
						"Title": sub.Assignment.Course.Title,
					},
				},
			}
		}

		logger.Log.Infof("Retrieved %d submissions for user %v", len(submissions), userID)
		c.JSON(http.StatusOK, response)
	}
}
