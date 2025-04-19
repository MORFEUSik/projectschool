package handler

import (
	"net/http"
	"strconv"

	"github.com/MORFEUSik/projectschool/backend/internal/error"
	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/service"
	"github.com/gin-gonic/gin"
)

// GetProfile возвращает профиль пользователя
// @Summary Получить профиль пользователя
// @Description Возвращает данные текущего аутентифицированного пользователя. Требуется JWT-токен. Доступно для ролей: student, teacher, admin.
// @Tags users
// @Accept json
// @Produce json
// @Security BearerAuth
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
// @Description Возвращает все решения текущего аутентифицированного пользователя. Требуется JWT-токен. Доступно для ролей: student, teacher, admin.
// @Tags submissions
// @Accept json
// @Produce json
// @Security BearerAuth
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

// UpdateRole обновляет роль пользователя
// @Summary Обновить роль пользователя
// @Description Обновляет роль указанного пользователя. Требуется JWT-токен. Доступно только для роли: admin.
// @Tags users
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID пользователя"
// @Param role body map[string]string true "Новая роль" example={"role":"teacher"}
// @Success 200 {object} map[string]string "message"
// @Failure 400 {object} error.APIError
// @Failure 401 {object} error.APIError
// @Failure 403 {object} error.APIError
// @Failure 404 {object} error.APIError
// @Failure 500 {object} error.APIError
// @Router /users/{id}/role [put]
func UpdateRole(userService service.UserService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			logger.Log.Errorf("Invalid user ID: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверный ID пользователя"})
			return
		}

		userID, exists := c.Get("userID")
		if !exists {
			logger.Log.Error("UserID not found in context")
			error.HandleError(c, error.APIError{Status: http.StatusUnauthorized, Message: "Пользователь не аутентифицирован"})
			return
		}

		var input struct {
			Role model.Role `json:"role" binding:"required,oneof=student teacher admin"`
		}
		if err := c.ShouldBindJSON(&input); err != nil {
			logger.Log.Errorf("Failed to bind JSON: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверный формат данных"})
			return
		}

		logger.Log.Infof("Admin %d attempting to update role for user %d to %s", userID, id, input.Role)
		if err := userService.UpdateRole(uint(id), userID.(uint), input.Role); err != nil {
			logger.Log.Errorf("Failed to update role for user %d: %v", id, err)
			if err.Error() == "пользователь не найден" {
				error.HandleError(c, error.APIError{Status: http.StatusNotFound, Message: "Пользователь не найден"})
			} else if err.Error() == "недостаточно прав" || err.Error() == "недопустимая роль" {
				error.HandleError(c, error.APIError{Status: http.StatusForbidden, Message: err.Error()})
			} else {
				error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Ошибка обновления роли"})
			}
			return
		}

		logger.Log.Infof("Role for user %d updated to %s by admin %d", id, input.Role, userID)
		c.JSON(http.StatusOK, gin.H{"message": "Роль пользователя обновлена"})
	}
}
