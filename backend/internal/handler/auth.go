// @title ProjectSchool API
// @version 1.0
// @description API для обучающего приложения ProjectSchool
// @host localhost:8080
// @BasePath /api

package handler

import (
	"net/http"

	"github.com/MORFEUSik/projectschool/backend/internal/error"
	"github.com/MORFEUSik/projectschool/backend/internal/jwt"
	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/service"
	"github.com/gin-gonic/gin"
)

// Register регистрирует нового пользователя
// @Summary Регистрация пользователя
// @Description Создает нового пользователя и возвращает JWT-токен
// @Tags auth
// @Accept json
// @Produce json
// @Param user body model.User true "Данные пользователя"
// @Success 200 {object} map[string]interface{} "message, token"
// @Failure 400 {object} map[string]string "error"
// @Failure 500 {object} map[string]string "error"
// @Router /register [post]
func Register(authService service.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var user model.User
		if err := c.ShouldBindJSON(&user); err != nil {
			logger.Log.Errorf("Invalid JSON input: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверный формат данных"})
			return
		}

		logger.Log.Infof("Registering user: %s", user.Email)

		if err := authService.Register(&user); err != nil {
			logger.Log.Errorf("Failed to register user: %v", err)
			if err.Error() == "пользователь с таким email уже существует" {
				error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: err.Error()})
				return
			}
			error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Ошибка при регистрации"})
			return
		}

		token, err := jwt.GenerateToken(user.ID)
		if err != nil {
			logger.Log.Errorf("Failed to generate token: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Ошибка при создании токена"})
			return
		}

		logger.Log.Infof("User %s registered successfully", user.Email)
		c.JSON(http.StatusOK, gin.H{
			"message": "Пользователь успешно зарегистрирован",
			"token":   token,
		})
	}
}

// Login аутентифицирует пользователя
// @Summary Вход пользователя
// @Description Аутентифицирует пользователя и возвращает JWT-токен
// @Tags auth
// @Accept json
// @Produce json
// @Param credentials body map[string]string true "Email и пароль"
// @Success 200 {object} map[string]interface{} "message, token"
// @Failure 400 {object} map[string]string "error"
// @Failure 401 {object} map[string]string "error"
// @Failure 500 {object} map[string]string "error"
// @Router /login [post]
func Login(authService service.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var credentials struct {
			Email    string `json:"email" binding:"required,email"`
			Password string `json:"password" binding:"required"`
		}
		if err := c.ShouldBindJSON(&credentials); err != nil {
			logger.Log.Errorf("Invalid JSON input: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверный формат данных"})
			return
		}

		logger.Log.Infof("Attempting login for user: %s", credentials.Email)

		user, err := authService.Login(credentials.Email, credentials.Password)
		if err != nil {
			logger.Log.Errorf("Login failed: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusUnauthorized, Message: "Неверный email или пароль"})
			return
		}

		token, err := jwt.GenerateToken(user.ID)
		if err != nil {
			logger.Log.Errorf("Failed to generate token: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Ошибка при создании токена"})
			return
		}

		logger.Log.Infof("User %s logged in successfully", credentials.Email)
		c.JSON(http.StatusOK, gin.H{
			"message": "Успешный вход",
			"token":   token,
		})
	}
}

// AuthMiddleware проверяет JWT-токен
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString := c.GetHeader("Authorization")
		if tokenString == "" {
			logger.Log.Warn("Authorization header missing")
			error.HandleError(c, error.APIError{Status: http.StatusUnauthorized, Message: "Токен отсутствует"})
			c.Abort()
			return
		}

		if len(tokenString) > 7 && tokenString[:7] == "Bearer " {
			tokenString = tokenString[7:]
		} else {
			logger.Log.Warn("Invalid token format")
			error.HandleError(c, error.APIError{Status: http.StatusUnauthorized, Message: "Неверный формат токена"})
			c.Abort()
			return
		}

		userID, err := jwt.ValidateToken(tokenString)
		if err != nil {
			logger.Log.Errorf("Invalid token: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusUnauthorized, Message: "Недействительный токен"})
			c.Abort()
			return
		}

		c.Set("userID", userID)
		c.Next()
	}
}
