package handler

import (
	"net/http"
	"strings"

	"github.com/MORFEUSik/projectschool/backend/internal/jwt"
	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

// AuthService определяет методы для аутентификации
type AuthService interface {
	Register(user *model.User) error
	Login(email, password string) (*model.User, error)
}

// Register обрабатывает регистрацию пользователя
func Register(service AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var user model.User
		if err := c.ShouldBindJSON(&user); err != nil {
			logger.Log.Errorf("Failed to bind JSON: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат данных"})
			return
		}

		logger.Log.Infof("Received registration request: username=%s, email=%s, role=%s, password_length=%d",
			user.Username, user.Email, user.Role, len(user.Password))

		// Валидация структуры User
		validate := validator.New()
		if err := validate.Struct(&user); err != nil {
			logger.Log.Errorf("User validation failed: %v", err)
			var errors []string
			for _, err := range err.(validator.ValidationErrors) {
				errors = append(errors, err.Error())
			}
			c.JSON(http.StatusBadRequest, gin.H{"error": "Валидация не пройдена: " + strings.Join(errors, ", ")})
			return
		}

		logger.Log.Infof("Registering user: %s", user.Email)
		if err := service.Register(&user); err != nil {
			logger.Log.Errorf("Failed to register user: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		logger.Log.Infof("User %s registered successfully", user.Email)
		token, err := jwt.GenerateToken(user.ID)
		if err != nil {
			logger.Log.Errorf("Failed to generate token: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось сгенерировать токен"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message": "Пользователь успешно зарегистрирован",
			"token":   token,
		})
	}
}

// Login обрабатывает вход пользователя
func Login(service AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var credentials struct {
			Email    string `json:"email" binding:"required,email"`
			Password string `json:"password" binding:"required"`
		}

		if err := c.ShouldBindJSON(&credentials); err != nil {
			logger.Log.Errorf("Failed to bind JSON: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат данных"})
			return
		}

		logger.Log.Infof("Login attempt for email: %s", credentials.Email)
		user, err := service.Login(credentials.Email, credentials.Password)
		if err != nil {
			logger.Log.Errorf("Login failed for %s: %v", credentials.Email, err)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Неверный email или пароль"})
			return
		}

		logger.Log.Infof("User %s logged in successfully", credentials.Email)
		token, err := jwt.GenerateToken(user.ID)
		if err != nil {
			logger.Log.Errorf("Failed to generate token: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось сгенерировать токен"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message": "Успешный вход",
			"token":   token,
		})
	}
}
