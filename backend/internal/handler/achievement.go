package handler

import (
	"net/http"

	"github.com/MORFEUSik/projectschool/backend/internal/error"
	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/service"
	"github.com/gin-gonic/gin"
)

func GetMyAchievements(service service.UserService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userID")
		if !exists {
			error.HandleError(c, error.APIError{Status: http.StatusUnauthorized, Message: "Пользователь не аутентифицирован"})
			return
		}

		achievements, err := service.GetAchievements(userID.(uint))
		if err != nil {
			logger.Log.Errorf("Ошибка при получении достижений: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Не удалось получить достижения"})
			return
		}

		c.JSON(http.StatusOK, achievements)
	}
}
