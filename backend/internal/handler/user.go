package handler

import (
	"net/http"

	"github.com/MORFEUSik/projectschool/backend/internal/error"
	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/service"
	"github.com/gin-gonic/gin"
)

// GetProfile возвращает профиль пользователя
// @Summary Получить профиль пользователя
// @Description Возвращает данные текущего аутентифицированного пользователя
// @Tags users
// @Accept json
// @Produce json
// @Success 200 {object} model.User
// @Failure 401 {object} map[string]string "error"
// @Failure 404 {object} map[string]string "error"
// @Failure 500 {object} map[string]string "error"
// @Router /users/me [get]
func GetProfile(userService service.UserService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userID")
		if !exists {
			logger.Log.Error("UserID not found in context")
			error.HandleError(c, error.APIError{Status: http.StatusUnauthorized, Message: "Пользователь не аутентифицирован"})
			return
		}

		user, err := userService.GetProfile(userID.(uint))
		if err != nil {
			logger.Log.Errorf("Failed to get profile for user %d: %v", userID, err)
			if err.Error() == "пользователь не найден" {
				error.HandleError(c, error.APIError{Status: http.StatusNotFound, Message: "Пользователь не найден"})
			} else {
				error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Ошибка сервера"})
			}
			return
		}

		logger.Log.Infof("Profile retrieved for user %d", userID)
		c.JSON(http.StatusOK, user)
	}
}

// GetUserSubmissions возвращает список решений пользователя
// @Summary Получить решения пользователя
// @Description Возвращает все решения текущего аутентифицированного пользователя
// @Tags submissions
// @Accept json
// @Produce json
// @Success 200 {array} model.Submission
// @Failure 401 {object} map[string]string "error"
// @Failure 500 {object} map[string]string "error"
// @Router /users/me/submissions [get]
func GetUserSubmissions(submissionService service.SubmissionService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userID")
		if !exists {
			logger.Log.Error("UserID not found in context")
			error.HandleError(c, error.APIError{Status: http.StatusUnauthorized, Message: "Пользователь не аутентифицирован"})
			return
		}

		submissions, err := submissionService.GetByUserID(userID.(uint))
		if err != nil {
			logger.Log.Errorf("Failed to get submissions for user %d: %v", userID, err)
			error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Ошибка получения решений"})
			return
		}

		logger.Log.Infof("Retrieved %d submissions for user %d", len(submissions), userID)
		c.JSON(http.StatusOK, submissions)
	}
}
