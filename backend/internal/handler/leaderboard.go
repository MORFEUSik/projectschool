package handler

import (
	"net/http"

	"github.com/MORFEUSik/projectschool/backend/internal/error"
	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/service"
	"github.com/gin-gonic/gin"
)

// GetLeaderboard возвращает таблицу лидеров
// @Summary Получить таблицу лидеров
// @Description Возвращает топ-10 пользователей по баллам
// @Tags leaderboard
// @Accept json
// @Produce json
// @Success 200 {array} model.User
// @Failure 401 {object} map[string]string "error"
// @Failure 500 {object} map[string]string "error"
// @Router /leaderboard [get]
func GetLeaderboard(userService service.UserService) gin.HandlerFunc {
	return func(c *gin.Context) {
		logger.Log.Info("Processing GetLeaderboard request")

		users, err := userService.GetLeaderboard()
		if err != nil {
			logger.Log.Errorf("Failed to fetch leaderboard: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Ошибка получения таблицы лидеров"})
			return
		}

		logger.Log.Info("Leaderboard fetched successfully")
		c.JSON(http.StatusOK, users)
	}
}
