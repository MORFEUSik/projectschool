package handler

import (
	"net/http"
	"strconv"

	"github.com/MORFEUSik/projectschool/backend/internal/error"
	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/service"
	"github.com/gin-gonic/gin"
)

func GetNotifications(notificationService service.NotificationService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userID")
		if !exists {
			logger.Log.Error("UserID not found in context")
			error.HandleError(c, error.APIError{Status: http.StatusUnauthorized, Message: "Пользователь не аутентифицирован"})
			return
		}
		notifications, err := notificationService.GetByUserID(userID.(uint))
		if err != nil {
			logger.Log.Errorf("Failed to get notifications: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Ошибка получения уведомлений"})
			return
		}
		c.JSON(http.StatusOK, notifications)
	}
}

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
