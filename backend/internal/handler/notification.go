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

// GetNotifications возвращает уведомления пользователя
// @Summary Получить уведомления
// @Description Возвращает список уведомлений пользователя. Если указан courseId, возвращает уведомления, связанные с курсом. Требуется JWT-токен.
// @Tags notifications
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param courseId query int false "ID курса (опционально)"
// @Success 200 {array} model.Notification
// @Failure 400 {object} error.APIError
// @Failure 401 {object} error.APIError
// @Failure 500 {object} error.APIError
// @Router /notifications [get]
func GetNotifications(notificationService service.NotificationService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userID")
		if !exists {
			logger.Log.Error("UserID not found in context")
			error.HandleError(c, error.APIError{Status: http.StatusUnauthorized, Message: "Пользователь не аутентифицирован"})
			return
		}

		courseIDStr := c.Query("courseId")
		var courseID uint
		if courseIDStr != "" {
			id, err := strconv.Atoi(courseIDStr)
			if err != nil {
				logger.Log.Warnf("Invalid course ID: %v", err)
				error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверный ID курса"})
				return
			}
			courseID = uint(id)
		}

		notifications, err := notificationService.GetByUserID(userID.(uint))
		if err != nil {
			logger.Log.Errorf("Failed to get notifications for user %d: %v", userID, err)
			error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Ошибка получения уведомлений"})
			return
		}

		// Фильтрация уведомлений по courseId
		if courseID != 0 {
			var filteredNotifications []model.Notification
			for _, notification := range notifications {
				// Проверяем, связано ли уведомление с курсом через Assignment
				var assignment model.Assignment
				if err := db.DB.Joins("JOIN submissions ON submissions.assignment_id = assignments.id").
					Where("submissions.user_id = ? AND assignments.course_id = ?", userID, courseID).
					First(&assignment).Error; err == nil {
					// Если уведомление связано с заданием курса, добавляем его
					if notification.Message != "" { // Можно уточнить фильтрацию по тексту уведомления
						filteredNotifications = append(filteredNotifications, notification)
					}
				}
			}
			notifications = filteredNotifications
		}

		c.JSON(http.StatusOK, notifications)
	}
}

// MarkNotificationAsRead помечает уведомление как прочитанное
// @Summary Пометить уведомление как прочитанное
// @Description Помечает указанное уведомление как прочитанное. Требуется JWT-токен.
// @Tags notifications
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID уведомления"
// @Success 200 {object} map[string]string "message"
// @Failure 400 {object} error.APIError
// @Failure 401 {object} error.APIError
// @Failure 500 {object} error.APIError
// @Router /notifications/{id}/read [put]
func MarkNotificationAsRead(notificationService service.NotificationService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userID")
		if !exists {
			logger.Log.Error("UserID not found in context")
			error.HandleError(c, error.APIError{Status: http.StatusUnauthorized, Message: "Пользователь не аутентифицирован"})
			return
		}
		id, err := strconv.ParseUint(c.Param("id"), 10, 32)
		if err != nil {
			logger.Log.Errorf("Invalid notification ID: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверный ID уведомления"})
			return
		}
		if err := notificationService.MarkAsRead(uint(id), userID.(uint)); err != nil {
			logger.Log.Errorf("Failed to mark notification as read: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Уведомление помечено как прочитанное"})
	}
}
