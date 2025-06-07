package handler

import (
	"net/http"
	"strconv"
	"strings"

	errorpkg "github.com/MORFEUSik/projectschool/backend/internal/error"
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
			errorpkg.HandleError(c, errorpkg.APIError{Status: http.StatusUnauthorized, Message: "Пользователь не аутентифицирован"})
			return
		}

		user, err := userService.GetProfile(userID.(uint))
		if err != nil {
			logger.Log.Errorf("Failed to get profile for user %d: %v", userID, err)
			if err.Error() == "пользователь не найден" {
				errorpkg.HandleError(c, errorpkg.APIError{Status: http.StatusNotFound, Message: "Пользователь не найден"})
			} else {
				errorpkg.HandleError(c, errorpkg.APIError{Status: http.StatusInternalServerError, Message: "Ошибка сервера"})
			}
			return
		}

		logger.Log.Infof("Profile retrieved for user %d", userID)
		c.JSON(http.StatusOK, user)
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
// @Failure 400 {object} errorpkg.APIError
// @Failure 401 {object} errorpkg.APIError
// @Failure 403 {object} errorpkg.APIError
// @Failure 404 {object} errorpkg.APIError
// @Failure 500 {object} errorpkg.APIError
// @Router /users/{id}/role [put]
func UpdateRole(userService service.UserService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			logger.Log.Errorf("Invalid user ID: %v", err)
			errorpkg.HandleError(c, errorpkg.APIError{Status: http.StatusBadRequest, Message: "Неверный ID пользователя"})
			return
		}

		userID, exists := c.Get("userID")
		if !exists {
			logger.Log.Error("UserID not found in context")
			errorpkg.HandleError(c, errorpkg.APIError{Status: http.StatusUnauthorized, Message: "Пользователь не аутентифицирован"})
			return
		}

		var input struct {
			Role model.Role `json:"role" binding:"required,oneof=student teacher admin"`
		}
		if err := c.ShouldBindJSON(&input); err != nil {
			logger.Log.Errorf("Failed to bind JSON: %v", err)
			errorpkg.HandleError(c, errorpkg.APIError{Status: http.StatusBadRequest, Message: "Неверный формат данных"})
			return
		}

		logger.Log.Infof("Admin %d attempting to update role for user %d to %s", userID, id, input.Role)
		if err := userService.UpdateRole(uint(id), userID.(uint), input.Role); err != nil {
			logger.Log.Errorf("Failed to update role for user %d: %v", id, err)
			if err.Error() == "пользователь не найден" {
				errorpkg.HandleError(c, errorpkg.APIError{Status: http.StatusNotFound, Message: "Пользователь не найден"})
			} else if err.Error() == "недостаточно прав" || err.Error() == "недопустимая роль" {
				errorpkg.HandleError(c, errorpkg.APIError{Status: http.StatusForbidden, Message: err.Error()})
			} else {
				errorpkg.HandleError(c, errorpkg.APIError{Status: http.StatusInternalServerError, Message: "Ошибка обновления роли"})
			}
			return
		}

		logger.Log.Infof("Role for user %d updated to %s by admin %d", id, input.Role, userID)
		c.JSON(http.StatusOK, gin.H{"message": "Роль пользователя обновлена"})
	}
}

// UpdateProfile обновляет профиль пользователя
// @Summary Обновить профиль пользователя
// @Description Обновляет имя и email текущего пользователя. Требуется JWT-токен. Доступно для ролей: student, teacher, admin.
// @Tags users
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param body body object true "Данные профиля" example={"username":"newname","email":"newemail@example.com"}
// @Success 200 {object} map[string]string "message"
// @Failure 400 {object} errorpkg.APIError
// @Failure 401 {object} errorpkg.APIError
// @Failure 500 {object} errorpkg.APIError
// @Router /users/me [put]
func UpdateProfile(userService service.UserService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userID")
		if !exists {
			logger.Log.Error("UserID not found in context")
			errorpkg.HandleError(c, errorpkg.APIError{Status: http.StatusUnauthorized, Message: "Пользователь не аутентифицирован"})
			return
		}

		var input struct {
			Username string `json:"username" binding:"required,min=3,max=50"`
			Email    string `json:"email" binding:"required,email"`
		}
		if err := c.ShouldBindJSON(&input); err != nil {
			logger.Log.Errorf("Failed to bind JSON: %v", err)
			errorpkg.HandleError(c, errorpkg.APIError{Status: http.StatusBadRequest, Message: "Неверный формат данных"})
			return
		}

		if err := userService.UpdateProfile(userID.(uint), input.Username, input.Email); err != nil {
			logger.Log.Errorf("Failed to update profile: %v", err)
			errorpkg.HandleError(c, errorpkg.APIError{Status: http.StatusInternalServerError, Message: err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Профиль обновлён"})
	}
}

// ListUsers возвращает список всех пользователей
// @Summary Получить список пользователей
// @Description Возвращает список всех пользователей. Требуется JWT-токен. Доступно для ролей: admin.
// @Tags users
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {array} model.User
// @Failure 401 {object} errorpkg.APIError
// @Failure 500 {object} errorpkg.APIError
// @Router /users [get]
func ListUsers(userService service.UserService) gin.HandlerFunc {
	return func(c *gin.Context) {
		users, err := userService.ListAll()
		if err != nil {
			logger.Log.Errorf("Failed to list users: %v", err)
			errorpkg.HandleError(c, errorpkg.APIError{Status: http.StatusInternalServerError, Message: "Ошибка получения пользователей"})
			return
		}
		c.JSON(http.StatusOK, users)
	}
}

// AdminRegister регистрирует нового пользователя от имени администратора
// @Summary Зарегистрировать пользователя (админ)
// @Description Позволяет администратору создать нового пользователя (teacher или admin). Требуется JWT-токен. Доступно только для роли: admin.
// @Tags users
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param body body object true "Данные пользователя" example={"email":"newuser@example.com","password":"password123","role":"teacher"}
// @Success 200 {object} map[string]string "message"
// @Failure 400 {object} errorpkg.APIError
// @Failure 401 {object} errorpkg.APIError
// @Failure 403 {object} errorpkg.APIError
// @Failure 500 {object} errorpkg.APIError
// @Router /admin/create-user [post]
func AdminRegister(authService service.AuthService, userService service.UserService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userID")
		if !exists {
			logger.Log.Error("UserID not found in context")
			errorpkg.HandleError(c, errorpkg.APIError{Status: http.StatusUnauthorized, Message: "Пользователь не аутентифицирован"})
			return
		}

		var input struct {
			Email    string     `json:"email" binding:"required,email"`
			Password string     `json:"password" binding:"required,min=6"`
			Role     model.Role `json:"role" binding:"required,oneof=teacher admin"`
		}
		if err := c.ShouldBindJSON(&input); err != nil {
			logger.Log.Errorf("Failed to bind JSON: %v", err)
			errorpkg.HandleError(c, errorpkg.APIError{Status: http.StatusBadRequest, Message: "Неверный формат данных"})
			return
		}

		user := &model.User{
			Email:    input.Email,
			Password: input.Password,
			Role:     input.Role,
			Username: input.Email[:strings.Index(input.Email, "@")], // Генерируем username из email
		}

		logger.Log.Infof("Admin %d attempting to register user %s", userID, input.Email)
		if err := userService.AdminRegister(user, userID.(uint)); err != nil {
			logger.Log.Errorf("Failed to register user %s: %v", input.Email, err)
			if err.Error() == "пользователь с таким email уже существует" {
				errorpkg.HandleError(c, errorpkg.APIError{Status: http.StatusBadRequest, Message: "Пользователь с таким email уже существует"})
			} else if err.Error() == "админ не найден" || err.Error() == "недостаточно прав" {
				errorpkg.HandleError(c, errorpkg.APIError{Status: http.StatusForbidden, Message: err.Error()})
			} else {
				errorpkg.HandleError(c, errorpkg.APIError{Status: http.StatusInternalServerError, Message: "Ошибка регистрации"})
			}
			return
		}

		logger.Log.Infof("User %s registered by admin %d", input.Email, userID)
		c.JSON(http.StatusOK, gin.H{"message": "Пользователь зарегистрирован"})
	}
}
