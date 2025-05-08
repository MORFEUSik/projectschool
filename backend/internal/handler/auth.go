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
// @Summary Регистрация пользователя
// @Description Регистрирует нового пользователя и возвращает JWT-токен. Доступно без авторизации.
// @Tags auth
// @Accept json
// @Produce json
// @Param user body object true "Данные пользователя" example={"username":"testuser","email":"test@example.com","password":"password123","role":"student","class_number":5}
// @Success 200 {object} map[string]interface{} "message, token"
// @Failure 400 {object} map[string]string "error"
// @Failure 500 {object} map[string]string "error"
// @Router /register [post]
func Register(service AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var input struct {
			model.User
			ClassNumber uint `json:"class_number"`
		}
		if err := c.ShouldBindJSON(&input); err != nil {
			logger.Log.Errorf("Failed to bind JSON: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат данных"})
			return
		}

		user := model.User{
			Username:    input.Username,
			Email:       input.Email,
			Password:    input.Password,
			Role:        input.Role,
			ClassNumber: input.ClassNumber,
			Points:      0, // Устанавливаем по умолчанию, как в модели
		}

		logger.Log.Infof("Received registration request: username=%s, email=%s, role=%s, class_number=%d",
			user.Username, user.Email, user.Role, user.ClassNumber)

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

		// Дополнительная валидация через метод Validate
		if err := user.Validate(); err != nil {
			logger.Log.Errorf("User validation failed: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
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
// @Summary Вход пользователя
// @Description Аутентифицирует пользователя и возвращает JWT-токен. Доступно без авторизации.
// @Tags auth
// @Accept json
// @Produce json
// @Param credentials body object true "Учетные данные" example={"email":"user@example.com","password":"password123"}
// @Success 200 {object} map[string]interface{} "message, token"
// @Failure 400 {object} map[string]string "error"
// @Failure 401 {object} map[string]string "error"
// @Failure 500 {object} map[string]string "error"
// @Router /login [post]
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
