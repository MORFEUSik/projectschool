package handler

import (
	"net/http"
	"strconv"

	"github.com/MORFEUSik/projectschool/backend/internal/error"
	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/service"
	"github.com/gin-gonic/gin"
)

// GetLeaderboard возвращает таблицу лидеров
// @Summary Получить таблицу лидеров
// @Description Возвращает топ-10 пользователей по баллам, опционально для конкретного курса. Требуется JWT-токен. Доступно для ролей: student, teacher, admin.
// @Tags leaderboard
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param course_id query int false "ID курса для фильтрации"
// @Success 200 {array} model.User
// @Failure 400 {object} map[string]string "error"
// @Failure 401 {object} map[string]string "error"
// @Failure 500 {object} map[string]string "error"
// @Router /leaderboard [get]
func GetLeaderboard(userService service.UserService) gin.HandlerFunc {
	return func(c *gin.Context) {
		logger.Log.Info("Processing GetLeaderboard request")

		var courseID uint
		if courseIDStr := c.Query("course_id"); courseIDStr != "" {
			id, err := strconv.Atoi(courseIDStr)
			if err != nil || id < 1 {
				logger.Log.Errorf("Invalid course_id: %s", courseIDStr)
				error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверный ID курса"})
				return
			}
			courseID = uint(id)
		}

		users, err := userService.GetLeaderboard(courseID)
		if err != nil {
			logger.Log.Errorf("Failed to fetch leaderboard: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Ошибка получения таблицы лидеров"})
			return
		}

		logger.Log.Info("Leaderboard fetched successfully")
		c.JSON(http.StatusOK, users)
	}
}
