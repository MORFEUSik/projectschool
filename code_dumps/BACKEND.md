================================================================================
ФАЙЛОВАЯ СТРУКТУРА
================================================================================
backend/
├── check_password.go
├── cmd
│   └── main.go
├── config
│   └── config.go
├── go.mod
├── go.sum
├── internal
│   ├── db
│   │   └── postgres.go
│   ├── error
│   │   └── error.go
│   ├── handler
│   │   ├── achievement.go
│   │   ├── assignment.go
│   │   ├── auth.go
│   │   ├── course.go
│   │   ├── leaderboard.go
│   │   ├── middleware.go
│   │   ├── notification.go
│   │   ├── submission.go
│   │   ├── testutil.go
│   │   └── user.go
│   ├── jwt
│   │   └── jwt.go
│   ├── logger
│   │   └── logger.go
│   ├── middleware
│   │   └── ratelimit.go
│   ├── model
│   │   ├── assignment.go
│   │   ├── course.go
│   │   ├── enrollment.go
│   │   ├── global_achievement.go
│   │   ├── notification.go
│   │   ├── submission.go
│   │   ├── subtask.go
│   │   ├── subtask_submission.go
│   │   ├── user.go
│   │   └── user_achievement.go
│   ├── repository
│   │   ├── assignment.go
│   │   ├── course.go
│   │   ├── notification.go
│   │   ├── submission.go
│   │   └── user.go
│   └── service
│       ├── achievement.go
│       ├── assignment.go
│       ├── auth.go
│       ├── course.go
│       ├── notification.go
│       ├── submission.go
│       ├── subtask.go
│       └── user.go

================================================================================
СОДЕРЖИМОЕ ФАЙЛОВ
================================================================================


════════════════════════════════════════════════════════════════════════════════
║ backend/internal/middleware/ratelimit.go
════════════════════════════════════════════════════════════════════════════════

package middleware

import (
	"net/http"
	//"time"

	"github.com/MORFEUSik/projectschool/backend/internal/error"
	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/gin-gonic/gin"
	"github.com/ulule/limiter/v3"
	"github.com/ulule/limiter/v3/drivers/store/memory"
)

// RateLimit ограничивает количество запросов с одного IP
func RateLimit() gin.HandlerFunc {
	store := memory.NewStore()
	rate, _ := limiter.NewRateFromFormatted("5-M") // 5 запросов в минуту
	limiter := limiter.New(store, rate)

	return func(c *gin.Context) {
		context, err := limiter.Get(c, c.ClientIP())
		if err != nil {
			logger.Log.Errorf("Rate limit error: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Ошибка сервера"})
			c.Abort()
			return
		}

		if context.Reached {
			logger.Log.Warnf("Rate limit exceeded for IP %s", c.ClientIP())
			error.HandleError(c, error.APIError{Status: http.StatusTooManyRequests, Message: "Слишком много запросов"})
			c.Abort()
			return
		}

		c.Next()
	}
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/error/error.go
════════════════════════════════════════════════════════════════════════════════

package error

import (
	"github.com/gin-gonic/gin"
)

// APIError представляет ошибку API с кодом статуса и сообщением
type APIError struct {
	Status  int
	Message string
}

func (e APIError) Error() string {
	return e.Message
}

// HandleError отправляет стандартизированный JSON-ответ с ошибкой
func HandleError(c *gin.Context, err error) {
	if apiErr, ok := err.(APIError); ok {
		c.JSON(apiErr.Status, gin.H{"error": apiErr.Message})
	} else {
		c.JSON(500, gin.H{"error": "Внутренняя ошибка сервера"})
	}
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/handler/middleware.go
════════════════════════════════════════════════════════════════════════════════

package handler

import (
	"net/http"
	"strings"

	"github.com/MORFEUSik/projectschool/backend/internal/db"
	"github.com/MORFEUSik/projectschool/backend/internal/jwt"
	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/gin-gonic/gin"
)

// AuthMiddleware проверяет JWT-токен и устанавливает userID в контекст
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			logger.Log.Error("Authorization header is missing")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Не авторизован"})
			c.Abort()
			return
		}
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			logger.Log.Error("Invalid Authorization header format")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Неверный формат токена"})
			c.Abort()
			return
		}
		tokenString := parts[1]
		userID, err := jwt.ValidateToken(tokenString)
		if err != nil {
			logger.Log.Errorf("Failed to validate token: %v", err)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Недействительный токен"})
			c.Abort()
			return
		}
		var user model.User
		if err := db.DB.First(&user, userID).Error; err != nil {
			logger.Log.Errorf("User %d not found in database: %v", userID, err)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Пользователь не найден"})
			c.Abort()
			return
		}
		logger.Log.Infof("Authenticated user %d (%s)", user.ID, user.Role)
		c.Set("user", user)
		c.Set("userID", user.ID)
		c.Next()
	}
}

// RoleMiddleware проверяет, имеет ли пользователь одну из указанных ролей
func RoleMiddleware(roles ...model.Role) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userID")
		if !exists {
			logger.Log.Error("UserID not found in context")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Пользователь не аутентифицирован"})
			c.Abort()
			return
		}

		var user model.User
		if err := db.DB.First(&user, userID).Error; err != nil {
			logger.Log.Errorf("Failed to find user %d: %v", userID, err)
			c.JSON(http.StatusNotFound, gin.H{"error": "Пользователь не найден"})
			c.Abort()
			return
		}

		for _, role := range roles {
			if user.Role == role {
				c.Next()
				return
			}
		}

		logger.Log.Warnf("User %d with role %s does not have required permissions", userID, user.Role)
		c.JSON(http.StatusForbidden, gin.H{"error": "Недостаточно прав"})
		c.Abort()
	}
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/handler/auth.go
════════════════════════════════════════════════════════════════════════════════

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



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/handler/submission.go
════════════════════════════════════════════════════════════════════════════════

package handler

import (
	"net/http"
	"strconv"

	"github.com/MORFEUSik/projectschool/backend/internal/db"
	"github.com/MORFEUSik/projectschool/backend/internal/error"
	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/service"
	"github.com/gin-gonic/gin"
)

// SubmitAssignment позволяет студенту отправить решение
func SubmitAssignment(submissionService service.SubmissionService) gin.HandlerFunc {
	return func(c *gin.Context) {
		logger.Log.Info("Processing SubmitAssignment request")

		var submissionInput struct {
			Content string `json:"content" binding:"required"`
		}
		if err := c.ShouldBindJSON(&submissionInput); err != nil {
			logger.Log.Errorf("Failed to bind JSON: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверный формат данных"})
			return
		}

		userID, exists := c.Get("userID")
		if !exists {
			logger.Log.Error("User not authenticated")
			error.HandleError(c, error.APIError{Status: http.StatusUnauthorized, Message: "Пользователь не аутентифицирован"})
			return
		}

		id, err := strconv.ParseUint(c.Param("id"), 10, 32)
		if err != nil {
			logger.Log.Errorf("Invalid assignment ID: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверный ID задания"})
			return
		}

		submission := model.Submission{
			UserID:       userID.(uint),
			AssignmentID: uint(id),
			Content:      submissionInput.Content,
		}
		logger.Log.Infof("Received submission: content=%s, userID=%d, assignmentID=%d", submission.Content, submission.UserID, submission.AssignmentID)

		logger.Log.Info("Calling submissionService.Create")
		if err := submissionService.Create(&submission); err != nil {
			logger.Log.Errorf("Failed to create submission: %v", err)
			if err.Error() == "решение уже отправлено" {
				error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Решение уже отправлено"})
				return
			}
			error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: err.Error()})
			return
		}

		logger.Log.Info("Submission created successfully")
		c.JSON(http.StatusOK, gin.H{
			"message":    "Решение отправлено",
			"submission": submission,
		})
	}
}

// SetGrade позволяет преподавателю установить оценку
func SetGrade(submissionService service.SubmissionService) gin.HandlerFunc {
	return func(c *gin.Context) {
		logger.Log.Info("Processing SetGrade request")

		var gradeInput struct {
			Grade float64 `json:"grade" binding:"required,gte=0,lte=5"`
		}
		if err := c.ShouldBindJSON(&gradeInput); err != nil {
			logger.Log.Errorf("Failed to bind JSON: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверный формат данных"})
			return
		}

		id, err := strconv.ParseUint(c.Param("id"), 10, 32)
		if err != nil {
			logger.Log.Errorf("Invalid submission ID: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверный ID решения"})
			return
		}

		userID := c.GetUint("userID")
		logger.Log.Infof("Setting grade %f for submission %d by user %d", gradeInput.Grade, id, userID)

		if err := submissionService.SetGrade(uint(id), userID, gradeInput.Grade); err != nil {
			logger.Log.Errorf("Failed to set grade: %v", err)
			if err.Error() == "решение не найдено" {
				error.HandleError(c, error.APIError{Status: http.StatusNotFound, Message: "Решение не найдено"})
				return
			}
			if err.Error() == "нет прав для оценки" {
				error.HandleError(c, error.APIError{Status: http.StatusForbidden, Message: "Нет прав для оценки"})
				return
			}
			error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: err.Error()})
			return
		}

		logger.Log.Info("Grade set successfully")
		c.JSON(http.StatusOK, gin.H{"message": "Оценка установлена"})
	}
}

// ListSubmissions возвращает список решений по assignment_id или user_id
func ListSubmissions(submissionService service.SubmissionService) gin.HandlerFunc {
	return func(c *gin.Context) {
		logger.Log.Info("Processing ListSubmissions request")

		userID, exists := c.Get("userID")
		if !exists {
			logger.Log.Error("User not authenticated")
			error.HandleError(c, error.APIError{Status: http.StatusUnauthorized, Message: "Пользователь не аутентифицирован"})
			return
		}

		// Проверка роли
		var user model.User
		if err := db.DB.First(&user, userID).Error; err != nil {
			logger.Log.Errorf("User %d not found: %v", userID, err)
			error.HandleError(c, error.APIError{Status: http.StatusUnauthorized, Message: "Пользователь не найден"})
			return
		}
		if user.Role != model.Teacher && user.Role != model.Admin {
			logger.Log.Warnf("User %d does not have permission to list submissions", userID)
			error.HandleError(c, error.APIError{Status: http.StatusForbidden, Message: "Нет прав для просмотра решений"})
			return
		}

		assignmentIDStr := c.Query("assignment_id")
		userIDStr := c.Query("user_id")

		var response []map[string]interface{}

		if assignmentIDStr != "" {
			assignmentID, err := strconv.Atoi(assignmentIDStr)
			if err != nil {
				logger.Log.Errorf("Invalid assignment_id: %v", err)
				error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверный assignment_id"})
				return
			}
			submissions, err := submissionService.GetByAssignment(uint(assignmentID))
			if err != nil {
				logger.Log.Errorf("Failed to get submissions for assignment %d: %v", assignmentID, err)
				if err.Error() == "задание не найдено" {
					error.HandleError(c, error.APIError{Status: http.StatusNotFound, Message: "Задание не найдено"})
					return
				}
				error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Внутренняя ошибка сервера"})
				return
			}
			// Формируем ответ с дополнительными полями
			response = make([]map[string]interface{}, len(submissions))
			for i, sub := range submissions {
				response[i] = map[string]interface{}{
					"id":               sub.ID,
					"user_id":          sub.UserID,
					"username":         sub.User.Username,
					"content":          sub.Content,
					"score":            sub.Grade,
					"submitted_at":     sub.CreatedAt.Format("2006-01-02T15:04:05Z"),
					"assignment_id":    sub.AssignmentID,
					"assignment_title": sub.Assignment.Title,
					"course_id":        sub.Assignment.CourseID,
					"course_title":     sub.Assignment.Course.Title,
				}
			}
		} else if userIDStr != "" {
			userIDQuery, err := strconv.Atoi(userIDStr)
			if err != nil {
				logger.Log.Errorf("Invalid user_id: %v", err)
				error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверный user_id"})
				return
			}
			submissions, err := submissionService.GetByUserID(uint(userIDQuery))
			if err != nil {
				logger.Log.Errorf("Failed to get submissions for user %d: %v", userIDQuery, err)
				error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Внутренняя ошибка сервера"})
				return
			}
			// Формируем ответ с дополнительными полями
			response = make([]map[string]interface{}, len(submissions))
			for i, sub := range submissions {
				response[i] = map[string]interface{}{
					"id":               sub.ID,
					"user_id":          sub.UserID,
					"username":         sub.User.Username,
					"content":          sub.Content,
					"score":            sub.Grade,
					"submitted_at":     sub.CreatedAt.Format("2006-01-02T15:04:05Z"),
					"assignment_id":    sub.AssignmentID,
					"assignment_title": sub.Assignment.Title,
					"course_id":        sub.Assignment.CourseID,
					"course_title":     sub.Assignment.Course.Title,
				}
			}
		} else {
			logger.Log.Error("Missing assignment_id or user_id")
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Требуется assignment_id или user_id"})
			return
		}

		logger.Log.Infof("Returning %d submissions", len(response))
		c.JSON(http.StatusOK, response)
	}
}

// GetUserSubmissions возвращает список решений текущего пользователя
// @Summary Получить решения текущего пользователя
// @Description Возвращает список всех решений аутентифицированного пользователя с информацией о заданиях и курсах.
// @Tags submissions
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {array} map[string]interface{}
// @Failure 401 {object} error.APIError
// @Failure 500 {object} error.APIError
// @Router /users/me/submissions [get]
func GetUserSubmissions(submissionService service.SubmissionService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userID")
		if !exists {
			logger.Log.Error("User not authenticated")
			error.HandleError(c, error.APIError{Status: http.StatusUnauthorized, Message: "Пользователь не аутентифицирован"})
			return
		}

		logger.Log.Infof("Fetching submissions for user %v", userID)
		submissions, err := submissionService.GetUserSubmissions(c, userID.(uint))
		if err != nil {
			logger.Log.Errorf("Failed to fetch submissions for user %d: %v", userID, err)
			error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Не удалось получить решения"})
			return
		}

		// Формируем ответ с вложенной структурой, соответствующей фронтенду
		response := make([]map[string]interface{}, len(submissions))
		for i, sub := range submissions {
			response[i] = map[string]interface{}{
				"ID":           sub.ID,
				"UserID":       sub.UserID,
				"AssignmentID": sub.AssignmentID,
				"Content":      sub.Content,
				"Grade":        sub.Grade,
				"CreatedAt":    sub.CreatedAt.Format("2006-01-02T15:04:05Z"),
				"Assignment": map[string]interface{}{
					"ID":       sub.Assignment.ID,
					"Title":    sub.Assignment.Title,
					"CourseID": sub.Assignment.CourseID,
					"Course": map[string]interface{}{
						"ID":    sub.Assignment.Course.ID,
						"Title": sub.Assignment.Course.Title,
					},
				},
			}
		}

		logger.Log.Infof("Retrieved %d submissions for user %v", len(submissions), userID)
		c.JSON(http.StatusOK, response)
	}
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/handler/testutil.go
════════════════════════════════════════════════════════════════════════════════

package handler

import (
	"testing"

	"github.com/MORFEUSik/projectschool/backend/internal/jwt"
	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// SetupTestEnv инициализирует окружение для тестов
func SetupTestEnv(t *testing.T) {
	t.Helper()

	// Инициализация логгера
	logger.Init()

	// Инициализация JWT
	if err := jwt.Init("test-secret-key"); err != nil {
		t.Fatalf("Failed to init JWT: %v", err)
	}
}

// SetupTestDB создаёт тестовую базу данных в памяти
func SetupTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("Failed to create test DB: %v", err)
	}
	// Автомиграция моделей Course и User для тестов
	err = db.AutoMigrate(&model.User{}, &model.Course{})
	if err != nil {
		t.Fatalf("Failed to migrate test DB: %v", err)
	}
	return db
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/handler/user.go
════════════════════════════════════════════════════════════════════════════════

package handler

import (
	"net/http"
	"strconv"

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



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/handler/notification.go
════════════════════════════════════════════════════════════════════════════════

package handler

import (
	"net/http"
	"strconv"

	"github.com/MORFEUSik/projectschool/backend/internal/db"
	"github.com/MORFEUSik/projectschool/backend/internal/error"
	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/service"
	"github.com/gin-gonic/gin"
)

// GetNotifications возвращает уведомления пользователя
// @Summary Получить уведомления
// @Description Возвращает список уведомлений пользователя. Если указан courseId, возвращает уведомления, связанные с курсом. Требуется JWT-токен.
// @Tags notifications
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param courseId query int false "ID курса (опционально)"
// @Success 200 {array} model.Notification
// @Failure 400 {object} error.APIError
// @Failure 401 {object} error.APIError
// @Failure 500 {object} error.APIError
// @Router /notifications [get]
func GetNotifications(notificationService service.NotificationService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userID")
		if !exists {
			logger.Log.Error("UserID not found in context")
			error.HandleError(c, error.APIError{Status: http.StatusUnauthorized, Message: "Пользователь не аутентифицирован"})
			return
		}

		courseIDStr := c.Query("courseId")
		var courseID uint
		if courseIDStr != "" {
			id, err := strconv.Atoi(courseIDStr)
			if err != nil {
				logger.Log.Warnf("Invalid course ID: %v", err)
				error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверный ID курса"})
				return
			}
			courseID = uint(id)
		}

		notifications, err := notificationService.GetByUserID(userID.(uint))
		if err != nil {
			logger.Log.Errorf("Failed to get notifications for user %d: %v", userID, err)
			error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Ошибка получения уведомлений"})
			return
		}

		// Фильтрация уведомлений по courseId
		if courseID != 0 {
			var filteredNotifications []model.Notification
			for _, notification := range notifications {
				// Проверяем, связано ли уведомление с курсом через Assignment
				var assignment model.Assignment
				if err := db.DB.Joins("JOIN submissions ON submissions.assignment_id = assignments.id").
					Where("submissions.user_id = ? AND assignments.course_id = ?", userID, courseID).
					First(&assignment).Error; err == nil {
					// Если уведомление связано с заданием курса, добавляем его
					if notification.Message != "" { // Можно уточнить фильтрацию по тексту уведомления
						filteredNotifications = append(filteredNotifications, notification)
					}
				}
			}
			notifications = filteredNotifications
		}

		c.JSON(http.StatusOK, notifications)
	}
}

// MarkNotificationAsRead помечает уведомление как прочитанное
// @Summary Пометить уведомление как прочитанное
// @Description Помечает указанное уведомление как прочитанное. Требуется JWT-токен.
// @Tags notifications
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID уведомления"
// @Success 200 {object} map[string]string "message"
// @Failure 400 {object} error.APIError
// @Failure 401 {object} error.APIError
// @Failure 500 {object} error.APIError
// @Router /notifications/{id}/read [put]
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



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/handler/assignment.go
════════════════════════════════════════════════════════════════════════════════

package handler

import (
	"encoding/json"
	"errors"
	"fmt"

	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/MORFEUSik/projectschool/backend/internal/db"
	errorpkg "github.com/MORFEUSik/projectschool/backend/internal/error"
	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ListAssignments возвращает список заданий для курса
// @Summary Получить список заданий
// @Description Возвращает список заданий для указанного курса. Требуется JWT-токен. Доступно для ролей: student, teacher, admin.
// @Tags assignments
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID курса"
// @Success 200 {array} model.Assignment
// @Failure 400 {object} map[string]string "error"
// @Failure 401 {object} map[string]string "error"
// @Failure 500 {object} map[string]string "error"
// @Router /courses/{id}/assignments [get]
func ListAssignments(assignmentService service.AssignmentService) gin.HandlerFunc {
	return func(c *gin.Context) {
		courseID, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			logger.Log.Errorf("Invalid course ID: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный ID курса"})
			return
		}
		assignments, err := assignmentService.ListByCourse(uint(courseID))
		if err != nil {
			logger.Log.Errorf("Failed to list assignments: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка получения заданий"})
			return
		}
		c.JSON(http.StatusOK, assignments)
	}
}

// CreateAssignment создает новое задание
// @Summary Создать задание
// @Description Создает новое задание для курса с возможностью загрузки файла. Требуется JWT-токен. Доступно только для ролей: teacher, admin.
// @Tags assignments
// @Accept multipart/form-data
// @Produce json
// @Security BearerAuth
// @Param title formData string true "Название задания"
// @Param description formData string false "Описание задания (поддерживает HTML, например, <img src='/uploads/...'>)"
// @Param max_score formData integer true "Максимальный балл"
// @Param due_date formData string true "Срок сдачи (ISO 8601)"
// @Param course_id formData integer true "ID курса"
// @Param type formData string true "Тип задания (text | multiple_choice)"
// @Param subtasks_json formData string false "JSON подзаданий для multiple_choice"
// @Param file formData file false "Файл (jpg, png, pdf)"
// @Param subtask_image_0 formData file false "Файл для подзадания 0 (jpg, png, pdf)"
// @Param subtask_image_1 formData file false "Файл для подзадания 1 (jpg, png, pdf)"
// @Success 200 {object} map[string]interface{} "message, assignment_id"
// @Failure 400 {object} map[string]string "error"
// @Failure 401 {object} map[string]string "error"
// @Failure 403 {object} map[string]string "error"
// @Failure 415 {object} map[string]string "error"
// @Failure 500 {object} map[string]string "error"
// @Router /assignments [post]
func CreateAssignment(assignmentService service.AssignmentService) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Проверка Content-Type
		if !strings.Contains(c.ContentType(), "multipart/form-data") {
			logger.Log.Errorf("Invalid Content-Type: %s", c.ContentType())
			c.JSON(http.StatusUnsupportedMediaType, gin.H{"error": "Требуется Content-Type: multipart/form-data"})
			return
		}

		// Структура для входных данных
		type AssignmentInput struct {
			Title        string    `form:"title" validate:"required,min=3,max=100"`
			Description  string    `form:"description"`
			MaxScore     uint      `form:"max_score" validate:"required,gte=0"`
			DueDate      time.Time `form:"due_date" validate:"required"`
			CourseID     uint      `form:"course_id" validate:"required"`
			Type         string    `form:"type" validate:"required,oneof=text multiple_choice"`
			SubtasksJSON string    `form:"subtasks_json"` // Синхронизировано с фронтендом
		}

		var input AssignmentInput
		if err := c.ShouldBind(&input); err != nil {
			logger.Log.Errorf("Failed to bind form data: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат данных"})
			return
		}

		// Десериализация подзаданий
		var subtasks []model.Subtask
		if input.Type == "multiple_choice" {
			if input.SubtasksJSON == "" {
				logger.Log.Errorf("Subtasks required for multiple_choice assignment")
				c.JSON(http.StatusBadRequest, gin.H{"error": "Тест должен содержать подзадания"})
				return
			}
			if err := json.Unmarshal([]byte(input.SubtasksJSON), &subtasks); err != nil {
				logger.Log.Errorf("Failed to parse subtasks JSON: %v", err)
				c.JSON(http.StatusBadRequest, gin.H{"error": "Ошибка обработки подзаданий"})
				return
			}
			logger.Log.Infof("Successfully deserialized %d subtasks", len(subtasks))
		}

		// Получаем userID из контекста
		userIDRaw, exists := c.Get("userID")
		if !exists {
			logger.Log.Error("UserID not found in context")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Пользователь не аутентифицирован"})
			return
		}

		// Безопасное приведение userID к uint
		var userID uint
		switch v := userIDRaw.(type) {
		case uint:
			userID = v
		case int:
			if v < 0 {
				logger.Log.Errorf("Invalid userID: negative value %d", v)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Некорректный ID пользователя"})
				return
			}
			userID = uint(v)
		case float64:
			if v < 0 || v != float64(uint(v)) {
				logger.Log.Errorf("Invalid userID: non-integer float %f", v)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Некорректный ID пользователя"})
				return
			}
			userID = uint(v)
		default:
			logger.Log.Errorf("Invalid userID type: %T, value: %v", userIDRaw, userIDRaw)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка обработки ID пользователя"})
			return
		}

		// Проверка существования пользователя и его роли
		var user model.User
		if err := db.DB.First(&user, userID).Error; err != nil {
			logger.Log.Errorf("User %d not found: %v", userID, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка проверки пользователя"})
			return
		}
		if user.Role != model.Teacher && user.Role != model.Admin {
			logger.Log.Errorf("User %d (%s) attempted to create assignment without permission", userID, user.Role)
			c.JSON(http.StatusForbidden, gin.H{"error": "Доступ запрещён"})
			return
		}

		// Проверка существования курса
		var course model.Course
		if err := db.DB.First(&course, input.CourseID).Error; err != nil {
			logger.Log.Errorf("Course %d not found: %v", input.CourseID, err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Курс не найден"})
			return
		}

		// Проверка: принадлежит ли курс учителю (только для роли teacher)
		if user.Role == model.Teacher && course.TeacherID != userID {
			logger.Log.Errorf("Teacher %d does not own course %d", userID, course.TeacherID)
			c.JSON(http.StatusForbidden, gin.H{"error": "Вы не можете создавать задания для этого курса"})
			return
		}

		// Обработка файлов
		files := make(map[string]string)
		uploadDir := "./uploads"
		if err := os.MkdirAll(uploadDir, 0755); err != nil {
			logger.Log.Errorf("Failed to create upload directory %s: %v", uploadDir, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка создания директории для файлов"})
			return
		}

		// Файл для задания
		var fileURL string
		file, err := c.FormFile("file")
		if err == nil { // Файл загружен
			// Валидация типа файла
			allowedTypes := map[string]bool{
				"image/jpeg":      true,
				"image/png":       true,
				"application/pdf": true,
			}
			fileHeader := file.Header.Get("Content-Type")
			if !allowedTypes[fileHeader] {
				logger.Log.Errorf("Unsupported file type: %s", fileHeader)
				c.JSON(http.StatusBadRequest, gin.H{"error": "Неподдерживаемый тип файла (разрешены jpg, png, pdf)"})
				return
			}

			// Валидация размера (10 MB)
			if file.Size > 10*1024*1024 {
				logger.Log.Errorf("File too large: %d bytes", file.Size)
				c.JSON(http.StatusBadRequest, gin.H{"error": "Файл слишком большой (макс. 10 МБ)"})
				return
			}

			// Сохранение файла
			ext := filepath.Ext(file.Filename)
			filename := fmt.Sprintf("%d-%s%s", time.Now().UnixNano(), uuid.New().String(), ext)
			filePath := filepath.Join(uploadDir, filename)
			logger.Log.Infof("Saving file to %s", filePath)
			if err := c.SaveUploadedFile(file, filePath); err != nil {
				logger.Log.Errorf("Failed to save file to %s: %v", filePath, err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка сохранения файла"})
				return
			}
			if _, err := os.Stat(filePath); os.IsNotExist(err) {
				logger.Log.Errorf("File %s does not exist after saving", filePath)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Файл не был сохранён"})
				return
			}
			fileURL = "http://localhost:8080/uploads/" + filename
			logger.Log.Infof("File saved successfully: %s", fileURL)
		} else if !errors.Is(err, http.ErrMissingFile) {
			logger.Log.Errorf("Failed to get file: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Ошибка обработки файла"})
			return
		}

		// Файлы для подзаданий
		for i := range subtasks {
			fileKey := fmt.Sprintf("subtask_image_%d", i)
			file, err := c.FormFile(fileKey)
			if err == nil { // Файл загружен
				// Валидация типа файла
				allowedTypes := map[string]bool{
					"image/jpeg":      true,
					"image/png":       true,
					"application/pdf": true,
				}
				fileHeader := file.Header.Get("Content-Type")
				if !allowedTypes[fileHeader] {
					logger.Log.Errorf("Unsupported file type for %s: %s", fileKey, fileHeader)
					c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Неподдерживаемый тип файла для подзадания %d (разрешены jpg, png, pdf)", i)})
					return
				}

				// Валидация размера (10 MB)
				if file.Size > 10*1024*1024 {
					logger.Log.Errorf("File too large for %s: %d bytes", fileKey, file.Size)
					c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Файл подзадания %d слишком большой (макс. 10 МБ)", i)})
					return
				}

				// Сохранение файла
				ext := filepath.Ext(file.Filename)
				filename := fmt.Sprintf("subtask_%d-%s%s", time.Now().UnixNano(), uuid.New().String(), ext)
				filePath := filepath.Join(uploadDir, filename)
				logger.Log.Infof("Saving subtask file to %s", filePath)
				if err := c.SaveUploadedFile(file, filePath); err != nil {
					logger.Log.Errorf("Failed to save subtask file to %s: %v", filePath, err)
					c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Ошибка сохранения файла подзадания %d", i)})
					return
				}
				if _, err := os.Stat(filePath); os.IsNotExist(err) {
					logger.Log.Errorf("Subtask file %s does not exist after saving", filePath)
					c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Файл подзадания %d не был сохранён", i)})
					return
				}
				fileURL := "http://localhost:8080/uploads/" + filename
				files[fileKey] = fileURL
				logger.Log.Infof("Subtask file saved successfully: %s", fileURL)
			} else if !errors.Is(err, http.ErrMissingFile) {
				logger.Log.Errorf("Failed to get subtask file %s: %v", fileKey, err)
				c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Ошибка обработки файла подзадания %d", i)})
				return
			}
		}

		// Создание модели Assignment
		assignment := model.Assignment{
			Title:       input.Title,
			Description: input.Description,
			Type:        input.Type,
			MaxScore:    input.MaxScore,
			DueDate:     input.DueDate,
			CourseID:    input.CourseID,
			TeacherID:   userID,
			FileURL:     fileURL,
		}

		// Валидация
		if err := assignment.Validate(); err != nil {
			logger.Log.Errorf("Assignment validation failed: %v", err)
			validationErrors := make([]string, 0)
			if errs, ok := err.(validator.ValidationErrors); ok {
				for _, e := range errs {
					validationErrors = append(validationErrors, fmt.Sprintf("Поле %s: %s", e.Field(), e.Tag()))
				}
			} else {
				validationErrors = append(validationErrors, err.Error())
			}
			c.JSON(http.StatusBadRequest, gin.H{"error": strings.Join(validationErrors, "; ")})
			return
		}

		// Сохранение через сервис
		if err := assignmentService.Create(&assignment, subtasks, files); err != nil {
			logger.Log.Errorf("Failed to create assignment: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		logger.Log.Infof("Assignment %s (ID: %d) created by user %d with file: %s", assignment.Title, assignment.ID, userID, fileURL)
		c.JSON(http.StatusOK, gin.H{"message": "Задание создано", "assignment_id": assignment.ID})
	}
}

// GetAssignment возвращает задание по ID в контексте курса
func GetAssignment(assignmentService service.AssignmentService) gin.HandlerFunc {
	return func(c *gin.Context) {
		courseID, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			logger.Log.Errorf("Invalid course ID: %v", err)
			errorpkg.HandleError(c, errorpkg.APIError{Status: http.StatusBadRequest, Message: "Неверный ID курса"})
			return
		}

		assignmentID, err := strconv.Atoi(c.Param("assignmentId"))
		if err != nil {
			logger.Log.Errorf("Invalid assignment ID: %v", err)
			errorpkg.HandleError(c, errorpkg.APIError{Status: http.StatusBadRequest, Message: "Неверный ID задания"})
			return
		}

		assignment, err := assignmentService.Get(uint(assignmentID))
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				errorpkg.HandleError(c, errorpkg.APIError{Status: http.StatusNotFound, Message: "Задание не найдено"})
			} else {
				logger.Log.Errorf("Failed to get assignment %d: %v", assignmentID, err)
				errorpkg.HandleError(c, errorpkg.APIError{Status: http.StatusInternalServerError, Message: "Ошибка сервера"})
			}
			return
		}

		// Проверка, что задание принадлежит курсу
		if assignment.CourseID != uint(courseID) {
			logger.Log.Errorf("Assignment %d does not belong to course %d", assignmentID, courseID)
			errorpkg.HandleError(c, errorpkg.APIError{Status: http.StatusNotFound, Message: "Задание не принадлежит этому курсу"})
			return
		}

		c.JSON(http.StatusOK, assignment)
	}
}

// DeleteAssignment удаляет задание
func DeleteAssignment(assignmentService service.AssignmentService) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Получаем ID задания
		idStr := c.Param("id")
		id, err := strconv.Atoi(idStr)
		if err != nil {
			logger.Log.Errorf("Invalid assignment ID: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный ID"})
			return
		}

		// Получаем пользователя из контекста
		userRaw, exists := c.Get("user")
		if !exists {
			logger.Log.Error("User not found in context")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Не авторизован"})
			return
		}
		user, ok := userRaw.(model.User)
		if !ok {
			logger.Log.Error("Invalid user type in context")
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Внутренняя ошибка сервера"})
			return
		}

		// Проверяем права
		if user.Role != model.Teacher && user.Role != model.Admin {
			logger.Log.Errorf("User %d (%s) attempted to delete assignment %d without permission", user.ID, user.Role, id)
			c.JSON(http.StatusForbidden, gin.H{"error": "Доступ запрещён"})
			return
		}

		// Проверяем существование задания
		assignment, err := assignmentService.Get(uint(id))
		if err != nil {
			logger.Log.Errorf("Failed to get assignment %d: %v", id, err)
			if err.Error() == "record not found" {
				c.JSON(http.StatusNotFound, gin.H{"error": "Задание не найдено"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Внутренняя ошибка сервера"})
			}
			return
		}

		// Если учитель, проверяем, что он создатель задания
		if user.Role == model.Teacher && assignment.TeacherID != user.ID {
			logger.Log.Errorf("Teacher %d attempted to delete assignment %d not owned by them", user.ID, id)
			c.JSON(http.StatusForbidden, gin.H{"error": "Доступ запрещён"})
			return
		}

		// Удаляем задание
		if err := assignmentService.Delete(uint(id)); err != nil {
			logger.Log.Errorf("Failed to delete assignment %d: %v", id, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось удалить задание"})
			return
		}

		logger.Log.Infof("Assignment %d deleted by user %d (%s)", id, user.ID, user.Role)
		c.JSON(http.StatusOK, gin.H{"message": "Задание удалено"})
	}
}

// UploadFile загружает файл для задания
func UploadFile() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Проверка Content-Type
		if !strings.Contains(c.ContentType(), "multipart/form-data") {
			logger.Log.Errorf("Invalid Content-Type: %s", c.ContentType())
			c.JSON(http.StatusUnsupportedMediaType, gin.H{"error": "Требуется Content-Type: multipart/form-data"})
			return
		}

		// Получаем userID из контекста
		userIDRaw, exists := c.Get("userID")
		if !exists {
			logger.Log.Error("UserID not found in context")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Пользователь не аутентифицирован"})
			return
		}

		var userID uint
		switch v := userIDRaw.(type) {
		case uint:
			userID = v
		case int:
			if v < 0 {
				logger.Log.Errorf("Invalid userID: negative value %d", v)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Некорректный ID пользователя"})
				return
			}
			userID = uint(v)
		case float64:
			if v < 0 || v != float64(uint(v)) {
				logger.Log.Errorf("Invalid userID: non-integer float %f", v)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Некорректный ID пользователя"})
				return
			}
			userID = uint(v)
		default:
			logger.Log.Errorf("Invalid userID type: %T, value: %v", userIDRaw, userIDRaw)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка обработки ID пользователя"})
			return
		}

		// Проверка роли
		var user model.User
		if err := db.DB.First(&user, userID).Error; err != nil {
			logger.Log.Errorf("User %d not found: %v", userID, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка проверки пользователя"})
			return
		}
		if user.Role != model.Teacher && user.Role != model.Admin {
			logger.Log.Errorf("User %d (%s) attempted to upload file without permission", userID, user.Role)
			c.JSON(http.StatusForbidden, gin.H{"error": "Доступ запрещён"})
			return
		}

		// Обработка файла
		file, err := c.FormFile("file")
		if err != nil {
			logger.Log.Errorf("Failed to get file: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Ошибка обработки файла"})
			return
		}

		// Валидация типа файла
		allowedTypes := map[string]bool{
			"image/jpeg":      true,
			"image/png":       true,
			"application/pdf": true,
		}
		fileHeader := file.Header.Get("Content-Type")
		if !allowedTypes[fileHeader] {
			logger.Log.Errorf("Unsupported file type: %s", fileHeader)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неподдерживаемый тип файла (разрешены jpg, png, pdf)"})
			return
		}

		// Валидация размера (10 MB)
		if file.Size > 10*1024*1024 {
			logger.Log.Errorf("File too large: %d bytes", file.Size)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Файл слишком большой (макс. 10 МБ)"})
			return
		}

		// Сохранение файла
		ext := filepath.Ext(file.Filename)
		filename := fmt.Sprintf("%d-%s%s", time.Now().UnixNano(), uuid.New().String(), ext)
		uploadDir := "./uploads"
		if err := os.MkdirAll(uploadDir, 0755); err != nil {
			logger.Log.Errorf("Failed to create upload directory %s: %v", uploadDir, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка создания директории для файлов"})
			return
		}
		filePath := filepath.Join(uploadDir, filename)
		logger.Log.Infof("Saving file to %s", filePath)
		if err := c.SaveUploadedFile(file, filePath); err != nil {
			logger.Log.Errorf("Failed to save file to %s: %v", filePath, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка сохранения файла"})
			return
		}
		if _, err := os.Stat(filePath); os.IsNotExist(err) {
			logger.Log.Errorf("File %s does not exist after saving", filePath)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Файл не был сохранён"})
			return
		}
		fileURL := "http://localhost:8080/uploads/" + filename
		logger.Log.Infof("File saved successfully: %s", fileURL)

		c.JSON(http.StatusOK, gin.H{"file_url": fileURL})
	}
}

// SubmitQuizAssignment отправляет ответы на тест
// @Summary Отправить ответы на тест
// @Description Отправляет ответы на тест (multiple_choice). Требуется JWT-токен. Доступно для роли: student.
// @Tags assignments
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID задания"
// @Param answers body object true "Ответы на подзадания"
// @Success 200 {object} map[string]interface{} "message, grade, totalScore, answers"
// @Failure 400 {object} map[string]string "error"
// @Failure 401 {object} map[string]string "error"
// @Failure 500 {object} map[string]string "error"
// @Router /assignments/{id}/submit-quiz [post]
func SubmitQuizAssignment(submissionService service.SubmissionService) gin.HandlerFunc {
	return func(c *gin.Context) {
		assignmentID, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			logger.Log.Errorf("Invalid assignment ID: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный ID задания"})
			return
		}

		userID := c.GetUint("userID")
		if userID == 0 {
			logger.Log.Error("UserID not found in context")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Пользователь не аутентифицирован"})
			return
		}

		var input struct {
			Answers []model.SubtaskSubmission `json:"answers" binding:"required"`
		}
		if err := c.ShouldBindJSON(&input); err != nil {
			logger.Log.Errorf("Failed to bind JSON data: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат данных"})
			return
		}

		result, err := submissionService.ProcessQuizSubmission(uint(assignmentID), userID, input.Answers)
		if err != nil {
			logger.Log.Errorf("Failed to process quiz submission: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message":    "Решение отправлено",
			"grade":      result["grade"],
			"totalScore": result["totalScore"],
			"answers":    result["answers"],
		})
	}
}

// GetSubtasks возвращает подзадания для задания
func GetSubtasks(subtaskService service.SubtaskService) gin.HandlerFunc {
	return func(c *gin.Context) {
		assignmentID, err := strconv.ParseUint(c.Param("id"), 10, 64)
		if err != nil {
			logger.Log.Errorf("Invalid assignment ID: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный ID задания"})
			return
		}
		subtasks, err := subtaskService.GetByAssignmentID(uint(assignmentID))
		if err != nil {
			logger.Log.Errorf("Failed to get subtasks: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка получения подзаданий"})
			return
		}
		c.JSON(http.StatusOK, subtasks)
	}
}

// CheckSubtaskAnswer проверяет ответ на подзадание
// @Summary Проверить ответ на подзадание
// @Description Проверяет, является ли ответ на подзадание правильным. Требуется JWT-токен. Доступно для роли: student.
// @Tags assignments
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID задания"
// @Param subtask_id body int true "ID подзадания"
// @Param answer body string true "Ответ"
// @Success 200 {object} map[string]interface{} "isCorrect, attempts"
// @Failure 400 {object} map[string]string "error"
// @Failure 401 {object} map[string]string "error"
// @Failure 403 {object} map[string]string "error"
// @Failure 404 {object} map[string]string "error"
// @Failure 500 {object} map[string]string "error"
// @Router /assignments/{id}/check-subtask [post]
func CheckSubtaskAnswer(subtaskService service.SubtaskService, submissionService service.SubmissionService) gin.HandlerFunc {
	return func(c *gin.Context) {
		assignmentID, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			logger.Log.Errorf("Invalid assignment ID: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный ID задания"})
			return
		}

		userID := c.GetUint("userID")
		if userID == 0 {
			logger.Log.Error("UserID not found in context")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Пользователь не аутентифицирован"})
			return
		}

		var input struct {
			SubtaskID uint   `json:"subtask_id" binding:"required"`
			Answer    string `json:"answer" binding:"required"`
		}
		if err := c.ShouldBindJSON(&input); err != nil {
			logger.Log.Errorf("Failed to bind JSON data: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат данных"})
			return
		}

		// Проверка роли
		var user model.User
		if err := db.DB.First(&user, userID).Error; err != nil {
			logger.Log.Errorf("User %d not found: %v", userID, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка проверки пользователя"})
			return
		}
		if user.Role != model.Student {
			logger.Log.Errorf("User %d (%s) attempted to check subtask without permission", userID, user.Role)
			c.JSON(http.StatusForbidden, gin.H{"error": "Доступ запрещён"})
			return
		}

		// Проверка существования подзадания
		var subtask model.Subtask
		if err := db.DB.Where("id = ? AND assignment_id = ?", input.SubtaskID, assignmentID).First(&subtask).Error; err != nil {
			logger.Log.Errorf("Subtask %d not found for assignment %d: %v", input.SubtaskID, assignmentID, err)
			c.JSON(http.StatusNotFound, gin.H{"error": "Подзадание не найдено"})
			return
		}

		// Проверка, не отправлено ли уже решение для задания
		var existingSubmission model.Submission
		if err := db.DB.Where("user_id = ? AND assignment_id = ?", userID, assignmentID).First(&existingSubmission).Error; err == nil {
			logger.Log.Warnf("Submission already exists for user %d, assignment %d", userID, assignmentID)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Решение уже отправлено"})
			return
		}

		// Проверка ответа
		isCorrect := strings.TrimSpace(strings.ToLower(input.Answer)) == strings.TrimSpace(strings.ToLower(subtask.Answer))

		// Сохраняем попытку
		var subtaskSubmission model.SubtaskSubmission
		err = db.DB.Where("user_id = ? AND subtask_id = ?", userID, input.SubtaskID).First(&subtaskSubmission).Error
		if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			logger.Log.Errorf("Error checking subtask submission: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка обработки попытки"})
			return
		}

		attempts := 1
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// Создаём новую запись
			subtaskSubmission = model.SubtaskSubmission{
				SubtaskID: input.SubtaskID,
				UserID:    userID,
				Answer:    input.Answer,
				IsCorrect: isCorrect,
				Attempts:  1,
			}
			if err := db.DB.Create(&subtaskSubmission).Error; err != nil {
				logger.Log.Errorf("Failed to create subtask submission: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка сохранения попытки"})
				return
			}
		} else {
			// Обновляем существующую запись
			attempts = subtaskSubmission.Attempts + 1
			if err := db.DB.Model(&subtaskSubmission).Updates(map[string]interface{}{
				"answer":     input.Answer,
				"is_correct": isCorrect,
				"attempts":   attempts,
			}).Error; err != nil {
				logger.Log.Errorf("Failed to update subtask submission: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка обновления попытки"})
				return
			}
		}

		logger.Log.Infof("Subtask %d checked for user %d: answer=%s, isCorrect=%v, attempts=%d", input.SubtaskID, userID, input.Answer, isCorrect, attempts)
		c.JSON(http.StatusOK, gin.H{"isCorrect": isCorrect, "attempts": attempts})
	}
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/handler/leaderboard.go
════════════════════════════════════════════════════════════════════════════════

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



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/handler/course.go
════════════════════════════════════════════════════════════════════════════════

package handler

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/MORFEUSik/projectschool/backend/internal/db"
	"github.com/MORFEUSik/projectschool/backend/internal/error"
	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"gorm.io/gorm"
)

// CreateCourseInput defines the input structure for creating a course
type CreateCourseInput struct {
	Title       string `json:"title" binding:"required,min=3,max=100" swaggertype:"string" example:"Math 101" description:"Название курса (обязательное, 3-100 символов)"`
	Description string `json:"description" swaggertype:"string" example:"Introduction to Mathematics" description:"Описание курса (опциональное)"`
}

// ListCourses возвращает список курсов
// @Summary Получить список курсов
// @Description Возвращает список всех курсов с пагинацией. Требуется JWT-токен. Доступно для ролей: student, teacher, admin.
// @Tags courses
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param limit query int false "Лимит записей" default(6)
// @Param offset query int false "Смещение" default(0)
// @Success 200 {object} map[string]interface{} "courses, total"
// @Failure 400 {object} map[string]string "error"
// @Failure 401 {object} map[string]string "error"
// @Failure 500 {object} map[string]string "error"
// @Router /courses [get]
func ListCourses(courseService service.CourseService) gin.HandlerFunc {
	return func(c *gin.Context) {
		limit, _ := strconv.Atoi(c.DefaultQuery("limit", "6")) // По умолчанию 6
		offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
		if limit < 1 || offset < 0 {
			logger.Log.Errorf("Invalid pagination params: limit=%d, offset=%d", limit, offset)
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверные параметры пагинации"})
			return
		}
		courses, total, err := courseService.List(limit, offset)
		if err != nil {
			logger.Log.Errorf("Failed to list courses: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Ошибка получения курсов"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"courses": courses, "total": total})
	}
}

// CreateCourse создает новый курс
// @Summary Создать курс
// @Description Создает новый курс. TeacherID устанавливается автоматически из токена авторизации. Требуется JWT-токен. Доступно только для ролей: teacher, admin.
// @Tags courses
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param course body CreateCourseInput true "Данные курса"
// @Success 200 {object} map[string]interface{} "message, course" example={"message":"Курс создан","course":{"id":1,"title":"Math 101","description":"Introduction to Mathematics","teacher":{"id":1,"username":"teacher1","email":"teacher1@example.com","role":"teacher","points":0,"created_at":"2025-04-18T12:00:00Z","updated_at":"2025-04-18T12:00:00Z"},"created_at":"2025-04-18T12:00:00Z","updated_at":"2025-04-18T12:00:00Z"}}
// @Failure 400 {object} error.APIError
// @Failure 401 {object} error.APIError
// @Failure 403 {object} error.APIError
// @Failure 500 {object} error.APIError
// @Router /courses [post]
func CreateCourse(courseService service.CourseService) gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.ContentType() != "application/json" {
			logger.Log.Errorf("Invalid Content-Type: %s", c.ContentType())
			c.JSON(http.StatusUnsupportedMediaType, gin.H{"error": "Требуется Content-Type: application/json"})
			return
		}

		var input CreateCourseInput
		if err := c.ShouldBindJSON(&input); err != nil {
			logger.Log.Errorf("Failed to bind JSON: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверный формат данных"})
			return
		}

		userID, exists := c.Get("userID")
		if !exists {
			logger.Log.Error("UserID not found in context")
			error.HandleError(c, error.APIError{Status: http.StatusUnauthorized, Message: "Пользователь не аутентифицирован"})
			return
		}

		course := model.Course{
			Title:       input.Title,
			Description: input.Description,
			TeacherID:   userID.(uint),
		}

		logger.Log.Infof("Creating course: %+v", course)

		// Валидация
		if err := course.Validate(); err != nil {
			logger.Log.Errorf("Course validation failed: %v", err)
			validationErrors := make([]string, 0)
			if errs, ok := err.(validator.ValidationErrors); ok {
				for _, e := range errs {
					validationErrors = append(validationErrors, fmt.Sprintf("Поле %s: %s", e.Field(), e.Tag()))
				}
			} else {
				validationErrors = append(validationErrors, err.Error())
			}
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: strings.Join(validationErrors, "; ")})
			return
		}

		if err := courseService.Create(&course); err != nil {
			logger.Log.Errorf("Failed to create course: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: err.Error()})
			return
		}

		// Подгружаем данные учителя
		if err := courseService.PreloadTeacher(&course); err != nil {
			logger.Log.Errorf("Failed to preload teacher for course %d: %v", course.ID, err)
			error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Ошибка загрузки данных преподавателя"})
			return
		}

		logger.Log.Infof("Course %s (ID: %d) created by user %d", course.Title, course.ID, userID)
		c.JSON(http.StatusOK, gin.H{"message": "Курс создан", "course": course})
	}
}

// GetCourse возвращает курс по ID
// @Summary Получить курс
// @Description Возвращает данные курса по его ID. Требуется JWT-токен. Доступно для ролей: student, teacher, admin.
// @Tags courses
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID курса"
// @Success 200 {object} model.Course
// @Failure 400 {object} map[string]string "error"
// @Failure 401 {object} map[string]string "error"
// @Failure 404 {object} map[string]string "error"
// @Failure 500 {object} map[string]string "error"
// @Router /courses/{id} [get]
func GetCourse(courseService service.CourseService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			logger.Log.Errorf("Invalid course ID: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверный ID"})
			return
		}
		course, err := courseService.Get(uint(id))
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				error.HandleError(c, error.APIError{Status: http.StatusNotFound, Message: "Курс не найден"})
			} else {
				logger.Log.Errorf("Failed to get course %d: %v", id, err)
				error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Ошибка сервера"})
			}
			return
		}
		c.JSON(http.StatusOK, course)
	}
}

// Enroll записывает пользователя на курс
// @Summary Записаться на курс
// @Description Записывает аутентифицированного студента на курс. Требуется JWT-токен. Доступно только для роли: student.
// @Tags courses
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID курса"
// @Success 200 {object} map[string]string "message"
// @Failure 400 {object} error.APIError
// @Failure 401 {object} error.APIError
// @Failure 403 {object} error.APIError
// @Failure 500 {object} error.APIError
// @Router /courses/{id}/enroll [post]
func Enroll(courseService service.CourseService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			logger.Log.Errorf("Invalid course ID: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверный ID курса"})
			return
		}

		userID, exists := c.Get("userID")
		if !exists {
			logger.Log.Error("UserID not found in context")
			error.HandleError(c, error.APIError{Status: http.StatusUnauthorized, Message: "Пользователь не аутентифицирован"})
			return
		}

		logger.Log.Infof("User %d attempting to enroll in course %d", userID, id)
		if err := courseService.Enroll(userID.(uint), uint(id)); err != nil {
			logger.Log.Errorf("Failed to enroll user %d in course %d: %v", userID, id, err)
			if err.Error() == "курс не найден" || err.Error() == "пользователь не найден" {
				error.HandleError(c, error.APIError{Status: http.StatusNotFound, Message: err.Error()})
			} else if err.Error() == "пользователь уже записан на курс" || err.Error() == "только студенты могут записываться на курсы" {
				error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: err.Error()})
			} else {
				error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Ошибка записи на курс"})
			}
			return
		}

		logger.Log.Infof("User %d enrolled in course %d", userID, id)
		c.JSON(http.StatusOK, gin.H{"message": "Вы записались на курс"})
	}
}

// Unenroll отменяет запись пользователя на курс
// @Summary Отменить запись на курс
// @Description Отменяет запись аутентифицированного студента на курс. Требуется JWT-токен. Доступно только для роли: student.
// @Tags courses
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID курса"
// @Success 200 {object} map[string]string "message"
// @Failure 400 {object} error.APIError
// @Failure 401 {object} error.APIError
// @Failure 403 {object} error.APIError
// @Failure 404 {object} error.APIError
// @Failure 500 {object} error.APIError
// @Router /courses/{id}/enroll [delete]
func Unenroll(courseService service.CourseService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			logger.Log.Errorf("Invalid course ID: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверный ID курса"})
			return
		}

		userID, exists := c.Get("userID")
		if !exists {
			logger.Log.Error("UserID not found in context")
			error.HandleError(c, error.APIError{Status: http.StatusUnauthorized, Message: "Пользователь не аутентифицирован"})
			return
		}

		logger.Log.Infof("User %d attempting to unenroll from course %d", userID, id)
		if err := courseService.Unenroll(userID.(uint), uint(id)); err != nil {
			logger.Log.Errorf("Failed to unenroll user %d from course %d: %v", userID, id, err)
			if err.Error() == "курс не найден" || err.Error() == "пользователь не найден" || err.Error() == "пользователь не записан на курс" {
				error.HandleError(c, error.APIError{Status: http.StatusNotFound, Message: err.Error()})
			} else if err.Error() == "только студенты могут отменять запись на курсы" {
				error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: err.Error()})
			} else {
				error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Ошибка отмены записи"})
			}
			return
		}

		logger.Log.Infof("User %d unenrolled from course %d", userID, id)
		c.JSON(http.StatusOK, gin.H{"message": "Запись на курс отменена"})
	}
}

// DeleteCourse удаляет курс
// @Summary Удалить курс
// @Description Удаляет курс. Требуется JWT-токен. Доступно только для преподавателя курса или админа.
// @Tags courses
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID курса"
// @Success 200 {object} map[string]string "message"
// @Failure 400 {object} error.APIError
// @Failure 401 {object} error.APIError
// @Failure 403 {object} error.APIError
// @Failure 404 {object} error.APIError
// @Failure 500 {object} error.APIError
// @Router /courses/{id} [delete]
func DeleteCourse(courseService service.CourseService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			logger.Log.Errorf("Invalid course ID: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверный ID курса"})
			return
		}

		userID, exists := c.Get("userID")
		if !exists {
			logger.Log.Error("UserID not found in context")
			error.HandleError(c, error.APIError{Status: http.StatusUnauthorized, Message: "Пользователь не аутентифицирован"})
			return
		}

		logger.Log.Infof("User %d attempting to delete course %d", userID, id)
		if err := courseService.Delete(userID.(uint), uint(id)); err != nil {
			logger.Log.Errorf("Failed to delete course %d by user %d: %v", id, userID, err)
			if err.Error() == "курс не найден" || err.Error() == "пользователь не найден" {
				error.HandleError(c, error.APIError{Status: http.StatusNotFound, Message: err.Error()})
			} else if err.Error() == "нет прав для удаления курса" || err.Error() == "недостаточно прав" {
				error.HandleError(c, error.APIError{Status: http.StatusForbidden, Message: err.Error()})
			} else {
				error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Ошибка удаления курса"})
			}
			return
		}

		logger.Log.Infof("Course %d deleted by user %d", id, userID)
		c.JSON(http.StatusOK, gin.H{"message": "Курс удален"})
	}
}

// GetCourseStats возвращает статистику курса
// @Summary Получить статистику курса
// @Description Возвращает статистику курса (количество студентов, средняя оценка, процент завершения). Требуется JWT-токен. Доступно для ролей: teacher, admin.
// @Tags courses
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID курса"
// @Success 200 {object} map[string]interface{} "students_count, average_grade, completion_rate"
// @Failure 400 {object} error.APIError
// @Failure 401 {object} error.APIError
// @Failure 403 {object} error.APIError
// @Failure 404 {object} error.APIError
// @Failure 500 {object} error.APIError
// @Router /courses/{id}/stats [get]
func GetCourseStats(courseService service.CourseService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			logger.Log.Errorf("Invalid course ID: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверный ID курса"})
			return
		}

		userID, exists := c.Get("userID")
		if !exists {
			logger.Log.Error("UserID not found in context")
			error.HandleError(c, error.APIError{Status: http.StatusUnauthorized, Message: "Пользователь не аутентифицирован"})
			return
		}

		logger.Log.Infof("User %d fetching stats for course %d", userID, id)
		stats, err := courseService.GetStats(uint(id))
		if err != nil {
			logger.Log.Errorf("Failed to fetch stats for course %d: %v", id, err)
			if err.Error() == "курс не найден" {
				error.HandleError(c, error.APIError{Status: http.StatusNotFound, Message: "Курс не найден"})
			} else {
				error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Ошибка получения статистики"})
			}
			return
		}

		// Проверка прав: учитель курса или админ
		var user model.User
		if err := db.DB.First(&user, userID).Error; err != nil {
			logger.Log.Errorf("User %d not found: %v", userID, err)
			error.HandleError(c, error.APIError{Status: http.StatusNotFound, Message: "Пользователь не найден"})
			return
		}
		var course model.Course
		if err := db.DB.First(&course, id).Error; err != nil {
			logger.Log.Errorf("Course %d not found: %v", id, err)
			error.HandleError(c, error.APIError{Status: http.StatusNotFound, Message: "Курс не найден"})
			return
		}
		if user.Role == model.Teacher && course.TeacherID != userID.(uint) {
			logger.Log.Warnf("Teacher %d does not own course %d", userID, id)
			error.HandleError(c, error.APIError{Status: http.StatusForbidden, Message: "Нет прав для просмотра статистики"})
			return
		}
		if user.Role != model.Teacher && user.Role != model.Admin {
			logger.Log.Warnf("User %d does not have permission", userID)
			error.HandleError(c, error.APIError{Status: http.StatusForbidden, Message: "Недостаточно прав"})
			return
		}

		logger.Log.Infof("Stats fetched for course %d by user %d", id, userID)
		c.JSON(http.StatusOK, stats)
	}
}

// GetCourseProgress возвращает прогресс пользователя по курсу
// @Summary Получить прогресс по курсу
// @Description Возвращает прогресс текущего пользователя по курсу (количество заданий, завершённых заданий, процент завершения, набранные баллы). Требуется JWT-токен. Доступно только для студентов, записанных на курс.
// @Tags courses
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID курса"
// @Success 200 {object} map[string]interface{} "total_assignments, completed_assignments, completion_rate, total_points"
// @Failure 400 {object} error.APIError
// @Failure 401 {object} error.APIError
// @Failure 403 {object} error.APIError
// @Failure 404 {object} error.APIError
// @Failure 500 {object} error.APIError
// @Router /courses/{id}/progress [get]
func GetCourseProgress(courseService service.CourseService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userID")
		if !exists {
			logger.Log.Warn("Unauthorized access to course progress")
			error.HandleError(c, error.APIError{Status: http.StatusUnauthorized, Message: "Пользователь не аутентифицирован"})
			return
		}

		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			logger.Log.Warnf("Invalid course ID: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверный ID курса"})
			return
		}

		// Проверка: записан ли пользователь на курс
		var enrollment model.Enrollment
		if err := db.DB.Where("user_id = ? AND course_id = ?", userID, id).First(&enrollment).Error; err != nil {
			logger.Log.Warnf("User %d is not enrolled in course %d: %v", userID, id, err)
			error.HandleError(c, error.APIError{Status: http.StatusForbidden, Message: "Вы не записаны на этот курс"})
			return
		}

		// Проверка: является ли пользователь студентом
		var user model.User
		if err := db.DB.First(&user, userID).Error; err != nil {
			logger.Log.Errorf("User %d not found: %v", userID, err)
			error.HandleError(c, error.APIError{Status: http.StatusNotFound, Message: "Пользователь не найден"})
			return
		}
		if user.Role != model.Student {
			logger.Log.Warnf("User %d is not a student", userID)
			error.HandleError(c, error.APIError{Status: http.StatusForbidden, Message: "Только студенты могут просматривать прогресс"})
			return
		}

		progress, err := courseService.GetProgress(uint(userID.(uint)), uint(id))
		if err != nil {
			logger.Log.Errorf("Failed to get progress for user %d in course %d: %v", userID, id, err)
			if err.Error() == "курс не найден" {
				error.HandleError(c, error.APIError{Status: http.StatusNotFound, Message: err.Error()})
			} else {
				error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Ошибка получения прогресса"})
			}
			return
		}

		logger.Log.Infof("Progress fetched for user %d in course %d", userID, id)
		c.JSON(http.StatusOK, progress)
	}
}

// CheckDeadlines запускает проверку дедлайнов вручную
// @Summary Ручная проверка дедлайнов
// @Description Запускает проверку дедлайнов и отправляет уведомления. Доступно только для администратора. Требуется JWT-токен.
// @Tags courses
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} map[string]string "message"
// @Failure 401 {object} error.APIError
// @Failure 403 {object} error.APIError
// @Failure 500 {object} error.APIError
// @Router /check-deadlines [post]
func CheckDeadlines(courseService service.CourseService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userID")
		if !exists {
			logger.Log.Warn("Unauthorized access to check deadlines")
			error.HandleError(c, error.APIError{Status: http.StatusUnauthorized, Message: "Пользователь не аутентифицирован"})
			return
		}

		var user model.User
		if err := db.DB.First(&user, userID).Error; err != nil {
			logger.Log.Errorf("User %d not found: %v", userID, err)
			error.HandleError(c, error.APIError{Status: http.StatusNotFound, Message: "Пользователь не найден"})
			return
		}

		if user.Role != model.Admin {
			logger.Log.Warnf("User %d does not have permission to check deadlines", userID)
			error.HandleError(c, error.APIError{Status: http.StatusForbidden, Message: "Доступно только для администратора"})
			return
		}

		if err := courseService.CheckDeadlines(); err != nil {
			logger.Log.Errorf("Failed to check deadlines: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Ошибка проверки дедлайнов"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Дедлайны проверены"})
	}
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/handler/achievement.go
════════════════════════════════════════════════════════════════════════════════

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



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/jwt/jwt.go
════════════════════════════════════════════════════════════════════════════════

package jwt

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v4"
)

var secretKey []byte

// Init инициализирует JWT с секретным ключом
func Init(secret string) error {
	if secret == "" {
		return fmt.Errorf("JWT_SECRET is not set")
	}
	secretKey = []byte(secret)
	return nil
}

const (
	accessTokenDuration  = 24 * time.Hour
	refreshTokenDuration = 7 * 24 * time.Hour
)

// GenerateToken генерирует access-токен для пользователя
func GenerateToken(userID uint) (string, error) {
	claims := jwt.MapClaims{
		"sub":  userID,
		"iss":  "projectschool",
		"aud":  "api",
		"iat":  time.Now().Unix(),
		"exp":  time.Now().Add(accessTokenDuration).Unix(),
		"type": "access",
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(secretKey)
	if err != nil {
		return "", fmt.Errorf("не удалось создать токен: %v", err)
	}

	return tokenString, nil
}

// GenerateRefreshToken генерирует refresh-токен
func GenerateRefreshToken(userID uint) (string, error) {
	claims := jwt.MapClaims{
		"sub":  userID,
		"iss":  "projectschool",
		"aud":  "api",
		"iat":  time.Now().Unix(),
		"exp":  time.Now().Add(refreshTokenDuration).Unix(),
		"type": "refresh",
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(secretKey)
	if err != nil {
		return "", fmt.Errorf("не удалось создать refresh-токен: %v", err)
	}

	return tokenString, nil
}

// ValidateToken проверяет валидность токена и возвращает userID
func ValidateToken(tokenString string) (uint, error) {
	token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("не поддерживаемый метод подписи")
		}
		return secretKey, nil
	})
	if err != nil {
		return 0, fmt.Errorf("неверный токен: %v", err)
	}

	if !token.Valid {
		return 0, fmt.Errorf("токен недействителен")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return 0, fmt.Errorf("неверные претензии")
	}

	// Проверка типа токена
	if tokenType, exists := claims["type"]; exists && tokenType == "refresh" {
		return 0, fmt.Errorf("refresh-токен нельзя использовать для авторизации")
	}

	userID, ok := claims["sub"].(float64)
	if !ok {
		return 0, fmt.Errorf("неверный userID в токене")
	}

	return uint(userID), nil
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/model/subtask_submission.go
════════════════════════════════════════════════════════════════════════════════

// model/subtask_submission.go
package model

type SubtaskSubmission struct {
	ID        uint   `gorm:"primaryKey"`
	UserID    uint   `gorm:"not null;index"`
	SubtaskID uint   `gorm:"not null;index"`
	Answer    string `gorm:"not null"` // ответ пользователя
	IsCorrect bool   `gorm:"not null"` // правильно ли
	Attempts  int    `gorm:"not null"` // сколько попыток потребовалось
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/model/submission.go
════════════════════════════════════════════════════════════════════════════════

package model

import (
	"time"

	"github.com/go-playground/validator/v10"
)

type Submission struct {
	ID           uint       `gorm:"primaryKey"`
	AssignmentID uint       `gorm:"not null" validate:"required"`
	Assignment   Assignment `gorm:"foreignKey:AssignmentID"`
	UserID       uint       `gorm:"not null" validate:"required"`
	User         User       `gorm:"foreignKey:UserID"`
	Content      string     `gorm:"type:text"`
	Grade        float64    `gorm:"type:numeric(5,2);default:0"`
	CreatedAt    time.Time  `gorm:"default:current_timestamp"`
	UpdatedAt    time.Time  `gorm:"autoUpdateTime"`
}

func (s *Submission) Validate() error {
	validate := validator.New()
	return validate.Struct(s)
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/model/subtask.go
════════════════════════════════════════════════════════════════════════════════

package model

type Subtask struct {
	ID           uint     `gorm:"primaryKey"`
	AssignmentID uint     `gorm:"not null;index"`             // привязка к заданию
	Question     string   `gorm:"type:text;not null"`         // текст вопроса
	Options      []string `gorm:"type:jsonb;serializer:json"` // список вариантов ответа
	Answer       string   `gorm:"not null"`                   // правильный ответ
	SortOrder    int      `gorm:"column:sort_order"`
	File_url     string   `json:"file_url,omitempty"`
	InputType    string   `gorm:"type:varchar(20);default:'multiple_choice'" json:"Type"` // ← исправлено
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/model/user.go
════════════════════════════════════════════════════════════════════════════════

package model

import (
	"fmt"
	"time"

	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/go-playground/validator/v10"
)

type Role string

const (
	Student Role = "student"
	Teacher Role = "teacher"
	Admin   Role = "admin"
)

type User struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Username    string    `gorm:"unique;not null" validate:"required,min=3,max=50" json:"username"`
	Email       string    `gorm:"unique;not null" validate:"required,email" json:"email"`
	Password    string    `gorm:"type:varchar(255);" validate:"omitempty,min=8,max=255" json:"password,omitempty"`
	Role        Role      `gorm:"type:varchar(50);not null;default:student" validate:"required,oneof=student teacher admin" json:"role"`
	ClassNumber uint      `gorm:"default:0" validate:"omitempty,gte=1,lte=11" json:"class_number"`
	Points      uint      `gorm:"default:0" json:"points"`
	CreatedAt   time.Time `gorm:"default:current_timestamp" json:"created_at"`
	UpdatedAt   time.Time `gorm:"default:current_timestamp" json:"updated_at"`
}

func (u *User) Validate() error {
	logger.Log.Infof("Validating user: email=%s, username=%s, role=%s", u.Email, u.Username, u.Role)
	validate := validator.New()
	if err := validate.Struct(u); err != nil {
		logger.Log.Errorf("Validation failed for user: email=%s, errors=%v", u.Email, err)
		return fmt.Errorf("ошибка валидации: %w", err)
	}
	if u.Role == Student && u.ClassNumber == 0 {
		return fmt.Errorf("для студентов необходимо указать номер класса (1-11)")
	}
	if u.Role != Student && u.ClassNumber != 0 {
		return fmt.Errorf("номер класса указывается только для студентов")
	}
	return nil
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/model/notification.go
════════════════════════════════════════════════════════════════════════════════

package model

import (
	"github.com/go-playground/validator/v10"
	"time"
)

type Notification struct {
	ID        uint      `gorm:"primaryKey" json:"id" swaggertype:"integer" example:"1" description:"Уникальный идентификатор уведомления"`
	UserID    uint      `gorm:"not null;index" validate:"required" json:"-" description:"ID пользователя"`
	User      User      `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"-" description:"Пользователь"`
	Message   string    `gorm:"type:text;not null" validate:"required" json:"message" swaggertype:"string" example:"Новое задание в курсе Math 101" description:"Текст уведомления"`
	IsRead    bool      `gorm:"default:false" json:"is_read" swaggertype:"boolean" example:"false" description:"Прочитано ли уведомление"`
	CreatedAt time.Time `gorm:"default:current_timestamp" json:"created_at" swaggertype:"string" example:"2025-04-18T12:00:00Z" description:"Дата создания уведомления"`
}

func (n *Notification) Validate() error {
	validate := validator.New()
	return validate.Struct(n)
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/model/enrollment.go
════════════════════════════════════════════════════════════════════════════════

package model

import (
	"time"

	"github.com/go-playground/validator/v10"
)

type Enrollment struct {
	ID         uint      `gorm:"primaryKey"`
	UserID     uint      `gorm:"not null;index" validate:"required"`
	CourseID   uint      `gorm:"not null;index;foreignKey:CourseID;constraint:OnDelete:CASCADE" validate:"required"`
	User       User      `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
	Course     Course    `gorm:"foreignKey:CourseID;constraint:OnDelete:CASCADE"`
	EnrolledAt time.Time `gorm:"default:current_timestamp"`
}

func (e *Enrollment) Validate() error {
	validate := validator.New()
	return validate.Struct(e)
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/model/assignment.go
════════════════════════════════════════════════════════════════════════════════

package model

import (
	"fmt"
	"time"

	"github.com/go-playground/validator/v10"
)

type Assignment struct {
	ID          uint         `gorm:"primaryKey" json:"id" swaggertype:"integer" example:"1" description:"Уникальный идентификатор задания"`
	CourseID    uint         `gorm:"not null" validate:"required" json:"course_id" swaggertype:"integer" example:"1" description:"ID курса, к которому относится задание"`
	Course      Course       `gorm:"foreignKey:CourseID;constraint:OnDelete:CASCADE" json:"course" validate:"-" description:"Информация о курсе"` // Добавлен validate:"-"
	Title       string       `gorm:"not null" validate:"required,min=3,max=100" json:"title" swaggertype:"string" example:"Test Assignment" description:"Название задания (обязательное, 3-100 символов)"`
	Description string       `gorm:"type:text" json:"description" swaggertype:"string" example:"Test Description" description:"Описание задания (опциональное)"`
	Type        string       `gorm:"type:varchar(32);not null;default:'text'" json:"type"`
	MaxScore    uint         `gorm:"not null" validate:"required,gte=0" json:"max_score" swaggertype:"integer" example:"100" description:"Максимальный балл за задание"`
	DueDate     time.Time    `validate:"required" json:"due_date" swaggertype:"string" example:"2025-04-19T12:00:00Z" description:"Срок сдачи задания"`
	TeacherID   uint         `gorm:"not null" validate:"required,gt=0" json:"-" description:"ID преподавателя, создавшего задание"`
	Teacher     User         `gorm:"foreignKey:TeacherID" validate:"-" json:"teacher" description:"Информация о преподавателе"`
	FileURL     string       `gorm:"type:text" json:"file_url" swaggertype:"string" example:"/uploads/assignment1.jpg" description:"URL загруженного файла (опционально)"`
	Submissions []Submission `gorm:"foreignKey:AssignmentID;constraint:OnDelete:CASCADE" json:"submissions" description:"Список отправленных работ по заданию"`
	CreatedAt   time.Time    `gorm:"default:current_timestamp" json:"created_at" swaggertype:"string" example:"2025-04-18T12:00:00Z" description:"Дата создания задания"`
	UpdatedAt   time.Time    `gorm:"autoUpdateTime" json:"updated_at" swaggertype:"string" example:"2025-04-18T12:00:00Z" description:"Дата последнего обновления задания"`
}

func (a *Assignment) Validate() error {
	validate := validator.New()
	if err := validate.Struct(a); err != nil {
		return err
	}
	if a.DueDate.Before(time.Now()) {
		return fmt.Errorf("DueDate must be in the future")
	}
	return nil
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/model/user_achievement.go
════════════════════════════════════════════════════════════════════════════════

package model

import "time"

type UserAchievement struct {
	UserID        uint              `gorm:"primaryKey"`
	AchievementID uint              `gorm:"primaryKey"`
	AwardedAt     time.Time         `gorm:"default:current_timestamp"`
	User          User              `gorm:"foreignKey:UserID"`
	Achievement   GlobalAchievement `gorm:"foreignKey:AchievementID"`
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/model/course.go
════════════════════════════════════════════════════════════════════════════════

package model

import (
	"time"

	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/go-playground/validator/v10"
)

type Course struct {
	ID          uint         `gorm:"primaryKey" json:"id" swaggertype:"integer" example:"1" description:"Уникальный идентификатор курса"`
	Title       string       `gorm:"not null;unique" validate:"required,min=3,max=100" json:"title" swaggertype:"string" example:"Math 101" description:"Название курса (обязательное, 3-100 символов)"`
	Description string       `gorm:"type:text" json:"description" swaggertype:"string" example:"Introduction to Mathematics" description:"Описание курса (опциональное)"`
	TeacherID   uint         `gorm:"not null" validate:"required,gt=0" json:"-" description:"ID преподавателя (устанавливается автоматически из токена)"`
	Teacher     User         `gorm:"foreignKey:TeacherID" validate:"-" json:"teacher" description:"Информация о преподавателе"`
	Assignments []Assignment `gorm:"foreignKey:CourseID" json:"assignments" description:"Список заданий курса"` // Добавляем
	CreatedAt   time.Time    `gorm:"default:current_timestamp" json:"created_at" swaggertype:"string" example:"2025-04-18T12:00:00Z" description:"Дата создания курса"`
	UpdatedAt   time.Time    `gorm:"autoUpdateTime" json:"updated_at" swaggertype:"string" example:"2025-04-18T12:00:00Z" description:"Дата последнего обновления курса"`
}

func (c *Course) Validate() error {
	logger.Log.Infof("Validating course: %+v", c)
	validate := validator.New()
	return validate.Struct(c)
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/model/global_achievement.go
════════════════════════════════════════════════════════════════════════════════

package model

type GlobalAchievement struct {
	ID          uint   `gorm:"primaryKey"`
	Title       string `gorm:"type:varchar(255);not null" validate:"required"`
	Description string `gorm:"type:text"`
	Condition   string `gorm:"type:varchar(255)"` // Тип условия, например, "points_50", "courses_1"
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/logger/logger.go
════════════════════════════════════════════════════════════════════════════════

package logger

import (
	"github.com/sirupsen/logrus"
)

var Log *logrus.Logger

func Init() {
	if Log == nil {
		Log = logrus.New()
		Log.SetFormatter(&logrus.JSONFormatter{})
	}
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/repository/submission.go
════════════════════════════════════════════════════════════════════════════════

package repository

import (
	"github.com/MORFEUSik/projectschool/backend/internal/db"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"gorm.io/gorm"
)

type SubmissionRepository interface {
	Create(submission *model.Submission) error
	FindByAssignmentID(assignmentID uint) ([]model.Submission, error)
	FindByAssignmentAndUser(assignmentID, userID uint) (*model.Submission, error)
	FindByUserID(userID uint) ([]model.Submission, error)
}

type submissionRepository struct {
	db *gorm.DB
}

func NewSubmissionRepository() SubmissionRepository {
	return &submissionRepository{db: db.DB}
}

func (r *submissionRepository) Create(submission *model.Submission) error {
	return r.db.Create(submission).Error
}

func (r *submissionRepository) FindByAssignmentID(assignmentID uint) ([]model.Submission, error) {
	var submissions []model.Submission
	err := r.db.Where("assignment_id = ?", assignmentID).Find(&submissions).Error
	return submissions, err
}

func (r *submissionRepository) FindByAssignmentAndUser(assignmentID, userID uint) (*model.Submission, error) {
	var submission model.Submission
	err := r.db.Where("assignment_id = ? AND user_id = ?", assignmentID, userID).First(&submission).Error
	return &submission, err
}

func (r *submissionRepository) FindByUserID(userID uint) ([]model.Submission, error) {
	var submissions []model.Submission
	err := r.db.Where("user_id = ?", userID).Find(&submissions).Error
	return submissions, err
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/repository/user.go
════════════════════════════════════════════════════════════════════════════════

package repository

import (
	"github.com/MORFEUSik/projectschool/backend/internal/db"
	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"gorm.io/gorm"
)

type UserRepository interface {
	Create(user *model.User) error
	FindByID(id uint) (*model.User, error)
	FindByEmail(email string) (*model.User, error)
	FindTopByPoints(limit int) ([]model.User, error)
	FindTopByPointsInCourse(courseID uint, limit int) ([]model.User, error)
	UpdateRole(id uint, role model.Role) error
}

type userRepository struct {
	db *gorm.DB
}

func NewUserRepository() UserRepository {
	return &userRepository{db: db.DB}
}

func (r *userRepository) Create(user *model.User) error {
	logger.Log.Infof("Saving user: email=%s, username=%s, role=%s, password_hash_length=%d",
		user.Email, user.Username, user.Role, len(user.Password))
	err := r.db.Create(user).Error
	if err != nil {
		logger.Log.Errorf("Failed to save user: email=%s, error=%v", user.Email, err)
	}
	return err
}

func (r *userRepository) FindByID(id uint) (*model.User, error) {
	var user model.User
	err := r.db.First(&user, id).Error
	return &user, err
}

func (r *userRepository) FindByEmail(email string) (*model.User, error) {
	var user model.User
	err := r.db.Where("email = ?", email).First(&user).Error
	return &user, err
}

func (r *userRepository) FindTopByPoints(limit int) ([]model.User, error) {
	var users []model.User
	err := r.db.Order("points DESC").Limit(limit).Find(&users).Error
	return users, err
}

func (r *userRepository) FindTopByPointsInCourse(courseID uint, limit int) ([]model.User, error) {
	var users []model.User
	err := r.db.Joins("JOIN enrollments ON enrollments.user_id = users.id").
		Where("enrollments.course_id = ?", courseID).
		Order("users.points DESC").
		Limit(limit).
		Find(&users).Error
	return users, err
}

func (r *userRepository) UpdateRole(id uint, role model.Role) error {
	logger.Log.Infof("Updating role for user %d to %s", id, role)
	return r.db.Model(&model.User{}).Where("id = ?", id).Update("role", role).Error
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/repository/notification.go
════════════════════════════════════════════════════════════════════════════════

package repository

import (
	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"gorm.io/gorm"
)

type NotificationRepository interface {
	Create(notification *model.Notification) error
	FindByUserID(userID uint) ([]model.Notification, error)
	MarkAsRead(id uint) error
}

type notificationRepository struct {
	db *gorm.DB
}

func NewNotificationRepository(db *gorm.DB) NotificationRepository {
	return &notificationRepository{db: db}
}

func (r *notificationRepository) Create(notification *model.Notification) error {
	err := r.db.Create(notification).Error
	if err != nil {
		logger.Log.Errorf("Failed to create notification for user %d: %v", notification.UserID, err)
		return err
	}
	logger.Log.Infof("Created notification for user %d: %s", notification.UserID, notification.Message)
	return nil
}

func (r *notificationRepository) FindByUserID(userID uint) ([]model.Notification, error) {
	var notifications []model.Notification
	err := r.db.Where("user_id = ?", userID).Order("created_at DESC").Find(&notifications).Error
	if err != nil {
		logger.Log.Errorf("Failed to fetch notifications for user %d: %v", userID, err)
		return nil, err
	}
	return notifications, nil
}

func (r *notificationRepository) MarkAsRead(id uint) error {
	err := r.db.Model(&model.Notification{}).Where("id = ?", id).Update("is_read", true).Error
	if err != nil {
		logger.Log.Errorf("Failed to mark notification %d as read: %v", id, err)
		return err
	}
	logger.Log.Infof("Marked notification %d as read", id)
	return nil
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/repository/assignment.go
════════════════════════════════════════════════════════════════════════════════

package repository

import (
	"fmt"
	"github.com/MORFEUSik/projectschool/backend/internal/db"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"gorm.io/gorm"
)

type AssignmentRepository interface {
	Create(assignment *model.Assignment) error
	CreateWithTx(tx *gorm.DB, assignment *model.Assignment) error
	FindByCourseID(courseID uint) ([]model.Assignment, error)
	FindByID(id uint) (*model.Assignment, error)
	FindByUserID(userID uint) ([]model.Assignment, error)
	Delete(id uint) error // Новый метод
}

type assignmentRepository struct {
	db *gorm.DB
}

func NewAssignmentRepository() AssignmentRepository {
	return &assignmentRepository{db: db.DB}
}

func (r *assignmentRepository) Create(assignment *model.Assignment) error {
	return r.db.Create(assignment).Error
}

func (r *assignmentRepository) FindByCourseID(courseID uint) ([]model.Assignment, error) {
	var assignments []model.Assignment
	err := r.db.Where("course_id = ?", courseID).Find(&assignments).Error
	return assignments, err
}

func (r *assignmentRepository) FindByID(id uint) (*model.Assignment, error) {
	var assignment model.Assignment
	err := r.db.First(&assignment, id).Error
	return &assignment, err
}

func (r *assignmentRepository) FindByUserID(userID uint) ([]model.Assignment, error) {
	var assignments []model.Assignment
	err := r.db.Joins("JOIN enrollments ON enrollments.course_id = assignments.course_id").
		Where("enrollments.user_id = ?", userID).
		Find(&assignments).Error
	return assignments, err
}

func (r *assignmentRepository) Delete(id uint) error {
	result := r.db.Delete(&model.Assignment{}, id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("assignment not found")
	}
	return nil
}

func (r *assignmentRepository) CreateWithTx(tx *gorm.DB, assignment *model.Assignment) error {
	return tx.Create(assignment).Error
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/repository/course.go
════════════════════════════════════════════════════════════════════════════════

package repository

import (
	"github.com/MORFEUSik/projectschool/backend/internal/db"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"gorm.io/gorm"
)

type CourseRepository interface {
	Create(course *model.Course) error
	FindAllWithPagination(limit, offset int) ([]model.Course, error)
	FindByID(id uint) (*model.Course, error)
	Delete(id uint) error
	GetStats(id uint) (map[string]interface{}, error)
}

type courseRepository struct {
	db *gorm.DB
}

func NewCourseRepository() CourseRepository {
	return &courseRepository{db: db.DB}
}

func (r *courseRepository) Create(course *model.Course) error {
	return r.db.Create(course).Error
}

func (r *courseRepository) FindAllWithPagination(limit, offset int) ([]model.Course, error) {
	var courses []model.Course
	err := r.db.Limit(limit).Offset(offset).Find(&courses).Error
	return courses, err
}

func (r *courseRepository) FindByID(id uint) (*model.Course, error) {
	var course model.Course
	err := r.db.First(&course, id).Error
	return &course, err
}

func (r *courseRepository) Delete(id uint) error {
	return r.db.Delete(&model.Course{}, id).Error
}

func (r *courseRepository) GetStats(courseID uint) (map[string]interface{}, error) {
	var (
		studentsCount    int64
		assignmentsCount int64
		submissionsCount int64
		averageGrade     float64
	)

	// Сколько студентов записано
	if err := r.db.Model(&model.Enrollment{}).
		Where("course_id = ?", courseID).
		Count(&studentsCount).Error; err != nil {
		return nil, err
	}

	// Сколько заданий у курса
	if err := r.db.Model(&model.Assignment{}).
		Where("course_id = ?", courseID).
		Count(&assignmentsCount).Error; err != nil {
		return nil, err
	}

	// Сколько всего решений у этих заданий
	if err := r.db.Model(&model.Submission{}).
		Joins("JOIN assignments ON submissions.assignment_id = assignments.id").
		Where("assignments.course_id = ?", courseID).
		Count(&submissionsCount).Error; err != nil {
		return nil, err
	}

	// Средняя оценка (по только тем, у кого grade > 0)
	if err := r.db.Model(&model.Submission{}).
		Select("AVG(grade)").
		Where("grade > 0").
		Joins("JOIN assignments ON submissions.assignment_id = assignments.id").
		Where("assignments.course_id = ?", courseID).
		Scan(&averageGrade).Error; err != nil {
		return nil, err
	}

	// Общий процент завершения курса
	var completionRate float64 = 0
	if studentsCount > 0 && assignmentsCount > 0 {
		totalPossible := float64(studentsCount * assignmentsCount)
		completionRate = float64(submissionsCount) / totalPossible * 100
	}

	return map[string]interface{}{
		"students_count":  studentsCount,
		"average_grade":   averageGrade,
		"completion_rate": completionRate,
	}, nil
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/db/postgres.go
════════════════════════════════════════════════════════════════════════════════

package db

import (
	"fmt"
	"log"

	"github.com/MORFEUSik/projectschool/backend/config"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Init(cfg *config.Config) {
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
		cfg.DBHost, cfg.DBUser, cfg.DBPassword, cfg.DBName, cfg.DBPort)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Не удалось подключиться к БД: %v", err)
	}

	// Автомиграция моделей
	log.Println("Running AutoMigrate")
	err = db.AutoMigrate(
		&model.User{},
		&model.Course{},
		&model.Enrollment{},
		&model.Assignment{},
		&model.Submission{},
		&model.Notification{},
		&model.GlobalAchievement{},
		&model.UserAchievement{},
	)
	if err != nil {
		log.Fatalf("Ошибка миграции: %v", err)
	}

	// Проверка и добавление столбца teacher_id в таблицу courses
	log.Println("Checking teacher_id column in courses")
	var columnExists int
	err = db.Raw("SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'teacher_id'").Scan(&columnExists).Error
	if err != nil {
		log.Printf("Предупреждение: не удалось проверить столбец teacher_id: %v", err)
	} else if columnExists == 0 {
		log.Println("Adding teacher_id column to courses")
		err = db.Exec("ALTER TABLE courses ADD COLUMN teacher_id BIGINT NOT NULL DEFAULT 0").Error
		if err != nil {
			log.Printf("Предупреждение: не удалось добавить teacher_id: %v", err)
		}
	}

	// Проверка и добавление столбца teacher_id в таблицу assignments
	log.Println("Checking teacher_id column in assignments")
	var assignmentColumnExists int
	err = db.Raw("SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'assignments' AND column_name = 'teacher_id'").Scan(&assignmentColumnExists).Error
	if err != nil {
		log.Printf("Предупреждение: не удалось проверить столбец teacher_id в assignments: %v", err)
	} else if assignmentColumnExists == 0 {
		log.Println("Adding teacher_id column to assignments")
		err = db.Exec("ALTER TABLE assignments ADD COLUMN teacher_id BIGINT NOT NULL DEFAULT 0").Error
		if err != nil {
			log.Printf("Предупреждение: не удалось добавить teacher_id в assignments: %v", err)
		}
	}

	// Проверка и обновление колонки password
	log.Println("Checking password column type")
	var columnType string
	err = db.Raw("SELECT data_type FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password'").Scan(&columnType).Error
	if err != nil {
		log.Printf("Предупреждение: не удалось проверить тип колонки password: %v", err)
	} else if columnType != "character varying" {
		log.Println("Updating password column to varchar(255)")
		err = db.Exec(`ALTER TABLE users ALTER COLUMN password TYPE varchar(255)`).Error
		if err != nil {
			log.Printf("Предупреждение: не удалось обновить колонку password: %v", err)
		}
	}

	// Проверка и добавление столбца class_number в таблицу users
	log.Println("Checking class_number column in users")
	var classNumberColumnExists int
	err = db.Raw("SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'class_number'").Scan(&classNumberColumnExists).Error
	if err != nil {
		log.Printf("Предупреждение: не удалось проверить столбец class_number: %v", err)
	} else if classNumberColumnExists == 0 {
		log.Println("Adding class_number column to users")
		err = db.Exec("ALTER TABLE users ADD COLUMN class_number INTEGER DEFAULT 0").Error
		if err != nil {
			log.Printf("Предупреждение: не удалось добавить class_number: %v", err)
		}
	}

	// Проверка уникальных индексов
	log.Println("Ensuring unique constraints")
	err = db.Exec(`
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM pg_constraint
                WHERE conname = 'users_email_key'
            ) THEN
                ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);
            END IF;
            IF NOT EXISTS (
                SELECT 1
                FROM pg_constraint
                WHERE conname = 'users_username_key'
            ) THEN
                ALTER TABLE users ADD CONSTRAINT users_username_key UNIQUE (username);
            END IF;
        END $$;
    `).Error
	if err != nil {
		log.Printf("Предупреждение: не удалось добавить уникальные индексы: %v", err)
	}

	// Добавление индексов для оптимизации
	log.Println("Ensuring indexes")
	err = db.Exec(`
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM pg_indexes
                WHERE indexname = 'idx_submissions_user_id'
            ) THEN
                CREATE INDEX idx_submissions_user_id ON submissions(user_id);
            END IF;
            IF NOT EXISTS (
                SELECT 1
                FROM pg_indexes
                WHERE indexname = 'idx_assignments_course_id'
            ) THEN
                CREATE INDEX idx_assignments_course_id ON assignments(course_id);
            END IF;
            IF NOT EXISTS (
                SELECT 1
                FROM pg_indexes
                WHERE indexname = 'idx_notifications_user_id'
            ) THEN
                CREATE INDEX idx_notifications_user_id ON notifications(user_id);
            END IF;
            IF NOT EXISTS (
                SELECT 1
                FROM pg_indexes
                WHERE indexname = 'idx_user_achievements_user_id'
            ) THEN
                CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
            END IF;
        END $$;
    `).Error
	if err != nil {
		log.Printf("Предупреждение: не удалось добавить индексы: %v", err)
	}

	// Проверка и добавление столбца is_read в таблицу notifications
	log.Println("Checking is_read column in notifications")
	var isReadColumnExists int
	err = db.Raw("SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'is_read'").Scan(&isReadColumnExists).Error
	if err != nil {
		log.Printf("Предупреждение: не удалось проверить столбец is_read: %v", err)
	} else if isReadColumnExists == 0 {
		log.Println("Adding is_read column to notifications")
		err = db.Exec("ALTER TABLE notifications ADD COLUMN is_read BOOLEAN DEFAULT FALSE").Error
		if err != nil {
			log.Printf("Предупреждение: не удалось добавить is_read: %v", err)
		}
	}

	// Логирование схемы таблицы users
	type ColumnSchema struct {
		ColumnName string `gorm:"column:column_name"`
		DataType   string `gorm:"column:data_type"`
	}
	var schemas []ColumnSchema
	err = db.Raw("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'").Scan(&schemas).Error
	if err != nil {
		log.Printf("Предупреждение: не удалось получить схему таблицы users: %v", err)
	} else {
		log.Println("Table users schema:")
		for _, schema := range schemas {
			log.Printf("  Column: %s, Type: %s", schema.ColumnName, schema.DataType)
		}
	}

	// Логирование схемы таблицы courses
	var courseSchemas []ColumnSchema
	err = db.Raw("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'courses'").Scan(&courseSchemas).Error
	if err != nil {
		log.Printf("Предупреждение: не удалось получить схему таблицы courses: %v", err)
	} else {
		log.Println("Table courses schema:")
		for _, schema := range courseSchemas {
			log.Printf("  Column: %s, Type: %s", schema.ColumnName, schema.DataType)
		}
	}

	// Логирование схемы таблицы assignments
	var assignmentSchemas []ColumnSchema
	err = db.Raw("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'assignments'").Scan(&assignmentSchemas).Error
	if err != nil {
		log.Printf("Предупреждение: не удалось получить схему таблицы assignments: %v", err)
	} else {
		log.Println("Table assignments schema:")
		for _, schema := range assignmentSchemas {
			log.Printf("  Column: %s, Type: %s", schema.ColumnName, schema.DataType)
		}
	}

	// Логирование схемы таблицы notifications
	var notificationSchemas []ColumnSchema
	err = db.Raw("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'notifications'").Scan(&notificationSchemas).Error
	if err != nil {
		log.Printf("Предупреждение: не удалось получить схему таблицы notifications: %v", err)
	} else {
		log.Println("Table notifications schema:")
		for _, schema := range notificationSchemas {
			log.Printf("  Column: %s, Type: %s", schema.ColumnName, schema.DataType)
		}
	}

	// Логирование схемы таблицы global_achievements
	var globalAchievementSchemas []ColumnSchema
	err = db.Raw("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'global_achievements'").Scan(&globalAchievementSchemas).Error
	if err != nil {
		log.Printf("Предупреждение: не удалось получить схему таблицы global_achievements: %v", err)
	} else {
		log.Println("Table global_achievements schema:")
		for _, schema := range globalAchievementSchemas {
			log.Printf("  Column: %s, Type: %s", schema.ColumnName, schema.DataType)
		}
	}

	// Логирование схемы таблицы user_achievements
	var userAchievementSchemas []ColumnSchema
	err = db.Raw("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'user_achievements'").Scan(&userAchievementSchemas).Error
	if err != nil {
		log.Printf("Предупреждение: не удалось получить схему таблицы user_achievements: %v", err)
	} else {
		log.Println("Table user_achievements schema:")
		for _, schema := range userAchievementSchemas {
			log.Printf("  Column: %s, Type: %s", schema.ColumnName, schema.DataType)
		}
	}

	DB = db
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/service/auth.go
════════════════════════════════════════════════════════════════════════════════

package service

import (
	"errors"
	"fmt"

	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/repository"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type AuthService interface {
	Register(user *model.User) error
	Login(email, password string) (*model.User, error)
}

type authService struct {
	repo repository.UserRepository
}

func NewAuthService(repo repository.UserRepository) AuthService {
	return &authService{repo: repo}
}

func (s *authService) Register(user *model.User) error {
	logger.Log.Infof("Registering user: email=%s, username=%s, role=%s, password_length=%d",
		user.Email, user.Username, user.Role, len(user.Password))

	// Проверка входных данных
	logger.Log.Info("Checking input data")
	if user.Email == "" || user.Username == "" || user.Password == "" || user.Role == "" {
		logger.Log.Errorf("Invalid input: email=%s, username=%s, role=%s, password_length=%d",
			user.Email, user.Username, user.Role, len(user.Password))
		return fmt.Errorf("все поля обязательны")
	}

	// Проверка: существует ли пользователь
	logger.Log.Info("Checking if user exists")
	existingUser, err := s.repo.FindByEmail(user.Email)
	if err == nil && existingUser != nil {
		logger.Log.Warnf("User with email %s already exists", user.Email)
		return errors.New("пользователь с таким email уже существует")
	}
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		logger.Log.Errorf("Error checking user existence: %v", err)
		return fmt.Errorf("ошибка проверки существования пользователя: %w", err)
	}
	logger.Log.Info("No existing user found")

	// Валидация пользователя
	logger.Log.Info("Validating user")
	if err := user.Validate(); err != nil {
		logger.Log.Errorf("User validation failed: %v", err)
		return fmt.Errorf("ошибка валидации пользователя: %w", err)
	}

	// Хеширование пароля
	logger.Log.Info("Hashing password")
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		logger.Log.Errorf("Failed to hash password: %v", err)
		return fmt.Errorf("ошибка хеширования пароля: %w", err)
	}
	hashStr := string(hashedPassword)
	logger.Log.Infof("Generated hash: length=%d, starts_with=%s", len(hashStr), hashStr[:7])
	user.Password = hashStr
	logger.Log.Infof("User password set to hash: length=%d", len(user.Password))

	// Создание пользователя
	logger.Log.Info("Creating user")
	if err := s.repo.Create(user); err != nil {
		logger.Log.Errorf("Failed to create user: email=%s, error=%v", user.Email, err)
		return fmt.Errorf("ошибка создания пользователя: %w", err)
	}

	logger.Log.Infof("User %s registered successfully", user.Email)
	return nil
}

func (s *authService) Login(email, password string) (*model.User, error) {
	logger.Log.Infof("Attempting login for user: email=%s, password_length=%d", email, len(password))

	// Проверка входных данных
	if email == "" || password == "" {
		logger.Log.Errorf("Invalid login input: email=%s, password_length=%d", email, len(password))
		return nil, errors.New("email и пароль обязательны")
	}

	// Поиск пользователя
	logger.Log.Info("Finding user by email")
	user, err := s.repo.FindByEmail(email)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			logger.Log.Warnf("User with email %s not found", email)
			return nil, errors.New("неверный email или пароль")
		}
		logger.Log.Errorf("Error finding user: %v", err)
		return nil, fmt.Errorf("ошибка поиска пользователя: %w", err)
	}
	logger.Log.Infof("User found: id=%d, email=%s, hash_length=%d", user.ID, user.Email, len(user.Password))

	// Проверка пароля
	logger.Log.Info("Verifying password")
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		logger.Log.Warnf("Invalid password for user %s: %v", email, err)
		return nil, errors.New("неверный email или пароль")
	}

	logger.Log.Infof("User %s logged in successfully", email)
	return user, nil
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/service/submission.go
════════════════════════════════════════════════════════════════════════════════

package service

import (
	"context"
	"errors"
	"fmt"
	"math"
	"strings"
	"time"

	"github.com/MORFEUSik/projectschool/backend/internal/db"
	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/repository"
	"gorm.io/gorm"
)

type SubmissionService interface {
	Create(submission *model.Submission) error
	SetGrade(submissionID, userID uint, grade float64) error
	ProcessQuizSubmission(assignmentID, userID uint, answers []model.SubtaskSubmission) (map[string]interface{}, error)
	GetByUserID(userID uint) ([]model.Submission, error)
	GetByAssignment(assignmentID uint) ([]model.Submission, error)
	GetUserSubmissions(ctx context.Context, userID uint) ([]model.Submission, error)
}

type submissionService struct {
	repo             repository.SubmissionRepository
	userRepo         repository.UserRepository
	assignmentRepo   repository.AssignmentRepository
	notificationRepo repository.NotificationRepository
	db               *gorm.DB
}

func NewSubmissionService(
	repo repository.SubmissionRepository,
	userRepo repository.UserRepository,
	assignmentRepo repository.AssignmentRepository,
	notificationRepo repository.NotificationRepository,
) SubmissionService {
	return &submissionService{
		repo:             repo,
		userRepo:         userRepo,
		assignmentRepo:   assignmentRepo,
		notificationRepo: notificationRepo,
		db:               db.DB,
	}
}

func (s *submissionService) Create(submission *model.Submission) error {
	logger.Log.Infof("Creating submission for user %d, assignment %d", submission.UserID, submission.AssignmentID)

	_, err := s.userRepo.FindByID(submission.UserID)
	if err != nil {
		logger.Log.Errorf("User %d not found: %v", submission.UserID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("пользователь не найден")
		}
		return err
	}

	assignment, err := s.assignmentRepo.FindByID(submission.AssignmentID)
	if err != nil {
		logger.Log.Errorf("Assignment %d not found: %v", submission.AssignmentID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("задание не найдено")
		}
		return err
	}

	var enrollment model.Enrollment
	err = s.db.Where("user_id = ? AND course_id = ?", submission.UserID, assignment.CourseID).First(&enrollment).Error
	if err != nil {
		logger.Log.Errorf("User %d not enrolled in course %d: %v", submission.UserID, assignment.CourseID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("пользователь не записан на курс")
		}
		return err
	}

	var existingSubmission model.Submission
	err = s.db.Where("user_id = ? AND assignment_id = ?", submission.UserID, submission.AssignmentID).First(&existingSubmission).Error
	if err == nil {
		logger.Log.Warnf("Submission already exists for user %d, assignment %d", submission.UserID, submission.AssignmentID)
		return errors.New("решение уже отправлено")
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		logger.Log.Errorf("Error checking existing submission: %v", err)
		return err
	}

	if err := s.repo.Create(submission); err != nil {
		logger.Log.Errorf("Failed to create submission: %v", err)
		return err
	}

	notification := &model.Notification{
		UserID:    submission.UserID,
		Message:   fmt.Sprintf("Вы отправили решение для задания #%d", submission.AssignmentID),
		IsRead:    false,
		CreatedAt: time.Now(),
	}
	if err := s.notificationRepo.Create(notification); err != nil {
		logger.Log.Errorf("Failed to create submission notification: %v", err)
	} else {
		logger.Log.Infof("Created submission notification for user %d: %s", submission.UserID, notification.Message)
	}

	logger.Log.Infof("Submission created for user %d, assignment %d", submission.UserID, submission.AssignmentID)
	return nil
}

func (s *submissionService) SetGrade(submissionID, userID uint, grade float64) error {
	logger.Log.Infof("Setting grade %f for submission %d by user %d", grade, submissionID, userID)

	var submission model.Submission
	if err := s.db.First(&submission, submissionID).Error; err != nil {
		logger.Log.Errorf("Submission %d not found: %v", submissionID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("решение не найдено")
		}
		return err
	}

	var user model.User
	if err := s.db.First(&user, userID).Error; err != nil {
		logger.Log.Errorf("User %d not found: %v", userID, err)
		return err
	}
	if user.Role != model.Teacher && user.Role != model.Admin {
		logger.Log.Warnf("User %d does not have permission to grade", userID)
		return errors.New("нет прав для оценки")
	}

	var assignment model.Assignment
	if err := s.db.First(&assignment, submission.AssignmentID).Error; err != nil {
		logger.Log.Errorf("Assignment %d not found: %v", submission.AssignmentID, err)
		return err
	}
	var course model.Course
	if err := s.db.First(&course, assignment.CourseID).Error; err != nil {
		logger.Log.Errorf("Course %d not found: %v", assignment.CourseID, err)
		return err
	}
	if user.Role == model.Teacher && course.TeacherID != userID {
		logger.Log.Warnf("Teacher %d does not own course %d", userID, assignment.CourseID)
		return errors.New("нет прав для оценки")
	}

	var submissionUser model.User
	var points uint
	err := s.db.Transaction(func(tx *gorm.DB) error {
		submission.Grade = grade
		if err := tx.Save(&submission).Error; err != nil {
			return err
		}

		if err := tx.First(&submissionUser, submission.UserID).Error; err != nil {
			return err
		}
		points = uint(math.Round(grade * float64(assignment.MaxScore) / 5.0))
		submissionUser.Points += points
		if err := tx.Save(&submissionUser).Error; err != nil {
			return err
		}
		logger.Log.Infof("Grade %f set for submission %d, added %d points to user %d", grade, submissionID, points, submission.UserID)
		return nil
	})
	if err != nil {
		logger.Log.Errorf("Failed to set grade and update points: %v", err)
		return err
	}

	notification := &model.Notification{
		UserID:    submission.UserID,
		Message:   fmt.Sprintf("Ваше решение для задания #%d оценено: %.2f", submission.AssignmentID, grade),
		IsRead:    false,
		CreatedAt: time.Now(),
	}
	if err := s.notificationRepo.Create(notification); err != nil {
		logger.Log.Errorf("Failed to create grade notification: %v", err)
	}

	achievementService := NewAchievementService(s.db)
	var submissions []model.Submission
	if err := s.db.Where("user_id = ?", submission.UserID).Find(&submissions).Error; err != nil {
		logger.Log.Errorf("Failed to fetch submissions for user %d: %v", submission.UserID, err)
		return err
	}
	var courseCount int64
	if err := s.db.Model(&model.Enrollment{}).Where("user_id = ?", submission.UserID).Count(&courseCount).Error; err != nil {
		logger.Log.Errorf("Failed to count courses for user %d: %v", submission.UserID, err)
		return err
	}
	newAchievements, err := achievementService.AwardAchievements(submission.UserID, submissionUser.Points, submissions, int(courseCount))
	if err != nil {
		logger.Log.Errorf("Failed to award achievements for user %d: %v", submission.UserID, err)
		return err
	}

	for _, ach := range newAchievements {
		notification := &model.Notification{
			UserID:    submission.UserID,
			Message:   fmt.Sprintf("Вы заработали достижение: %s", ach.Title),
			IsRead:    false,
			CreatedAt: time.Now(),
		}
		if err := s.notificationRepo.Create(notification); err != nil {
			logger.Log.Errorf("Failed to create achievement notification: %v", err)
		}
	}

	return nil
}

func (s *submissionService) GetByUserID(userID uint) ([]model.Submission, error) {
	logger.Log.Infof("Fetching submissions for user %d", userID)

	var submissions []model.Submission
	err := s.db.Preload("User").Preload("Assignment.Course").Where("user_id = ?", userID).Find(&submissions).Error
	if err != nil {
		logger.Log.Errorf("Failed to fetch submissions for user %d: %v", userID, err)
		return nil, err
	}

	logger.Log.Infof("Fetched %d submissions for user %d", len(submissions), userID)
	return submissions, nil
}

func (s *submissionService) GetByAssignment(assignmentID uint) ([]model.Submission, error) {
	logger.Log.Infof("Fetching submissions for assignment %d", assignmentID)

	// Проверяем существование задания
	_, err := s.assignmentRepo.FindByID(assignmentID)
	if err != nil {
		logger.Log.Errorf("Assignment %d not found: %v", assignmentID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("задание не найдено")
		}
		return nil, err
	}

	var submissions []model.Submission
	err = s.db.Preload("User").Preload("Assignment.Course").Where("assignment_id = ?", assignmentID).Find(&submissions).Error
	if err != nil {
		logger.Log.Errorf("Failed to fetch submissions for assignment %d: %v", assignmentID, err)
		return nil, err
	}

	logger.Log.Infof("Fetched %d submissions for assignment %d", len(submissions), assignmentID)
	return submissions, nil
}

func (s *submissionService) GetUserSubmissions(ctx context.Context, userID uint) ([]model.Submission, error) {
	logger.Log.Infof("Fetching submissions for user %d", userID)

	var submissions []model.Submission
	err := s.db.WithContext(ctx).
		Preload("User").
		Preload("Assignment.Course").
		Where("user_id = ?", userID).
		Find(&submissions).Error
	if err != nil {
		logger.Log.Errorf("Failed to fetch submissions for user %d: %v", userID, err)
		return nil, fmt.Errorf("failed to get user submissions: %w", err)
	}

	logger.Log.Infof("Fetched %d submissions for user %d", len(submissions), userID)
	return submissions, nil
}

func (s *submissionService) ProcessQuizSubmission(assignmentID, userID uint, answers []model.SubtaskSubmission) (map[string]interface{}, error) {
	logger.Log.Infof("Processing quiz submission for user %d, assignment %d", userID, assignmentID)

	assignment, err := s.assignmentRepo.FindByID(assignmentID)
	if err != nil {
		logger.Log.Errorf("Assignment %d not found: %v", assignmentID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("задание не найдено")
		}
		return nil, err
	}

	if assignment.DueDate.Before(time.Now()) {
		logger.Log.Warnf("Submission deadline passed for assignment %d", assignmentID)
		return nil, errors.New("дедлайн задания истёк")
	}

	var existingSubmission model.Submission
	err = s.db.Where("user_id = ? AND assignment_id = ?", userID, assignmentID).First(&existingSubmission).Error
	if err == nil {
		logger.Log.Warnf("Submission already exists for user %d, assignment %d", userID, assignmentID)
		return nil, errors.New("решение уже отправлено")
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		logger.Log.Errorf("Error checking existing submission: %v", err)
		return nil, err
	}

	var subtasks []model.Subtask
	if err := s.db.Where("assignment_id = ?", assignmentID).Find(&subtasks).Error; err != nil {
		logger.Log.Errorf("Failed to fetch subtasks for assignment %d: %v", assignmentID, err)
		return nil, err
	}
	if len(subtasks) == 0 {
		logger.Log.Errorf("No subtasks found for assignment %d", assignmentID)
		return nil, errors.New("подзадания не найдены")
	}
	subtaskMap := make(map[uint]model.Subtask)
	for _, st := range subtasks {
		subtaskMap[st.ID] = st
	}

	var totalScore float64
	responseAnswers := make([]map[string]interface{}, 0, len(answers))
	var totalWeight float64
	for _, st := range subtasks {
		if st.InputType == "text_input" {
			totalWeight += 2.0 // Учитывается как 2 обычных
		} else {
			totalWeight += 1.0
		}
	}
	subtaskScore := float64(assignment.MaxScore) / totalWeight

	for i, answer := range answers {
		subtask, ok := subtaskMap[answer.SubtaskID]
		if !ok {
			logger.Log.Warnf("Subtask %d not found for answer index %d", answer.SubtaskID, i)
			continue
		}

		// Проверяем наличие сохранённой попытки
		var subtaskSubmission model.SubtaskSubmission
		err = s.db.Where("user_id = ? AND subtask_id = ?", userID, answer.SubtaskID).First(&subtaskSubmission).Error
		if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			logger.Log.Errorf("Error checking subtask submission for SubtaskID %d: %v", answer.SubtaskID, err)
			return nil, err
		}

		isCorrect := strings.TrimSpace(strings.ToLower(answer.Answer)) == strings.TrimSpace(strings.ToLower(subtask.Answer))
		attempts := answer.Attempts
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			attempts = subtaskSubmission.Attempts
		}

		var weight float64
		if subtask.InputType == "text_input" {
			weight = 2.0
		} else {
			weight = 1.0
			numOptions := len(subtask.Options)
			if numOptions < 2 || numOptions > 6 {
				logger.Log.Errorf("Invalid number of options for SubtaskID %d: %d", answer.SubtaskID, numOptions)
				return nil, errors.New("некорректное количество вариантов ответа")
			}
		}

		// Подсчёт баллов
		var score float64
		if isCorrect {
			if attempts == 1 {
				score = subtaskScore * weight // полный балл
			} else if subtask.InputType != "text_input" && attempts < len(subtask.Options) {
				score = subtaskScore * weight * float64(len(subtask.Options)-attempts) / float64(len(subtask.Options)-1)
			} else {
				score = 0
			}
		}

		totalScore += score

		logger.Log.Infof("Processing answer for SubtaskID %d: UserAnswer='%s', CorrectAnswer='%s', IsCorrect=%v, Attempts=%d, Score=%.2f",
			answer.SubtaskID, answer.Answer, subtask.Answer, isCorrect, attempts, score)

		// Формируем ответ для клиента
		responseAnswer := map[string]interface{}{
			"SubtaskID": answer.SubtaskID,
			"Answer":    answer.Answer,
			"IsCorrect": isCorrect,
			"Attempts":  attempts,
			"Score":     score,
		}
		if !isCorrect {
			responseAnswer["CorrectAnswer"] = subtask.Answer
		}
		responseAnswers = append(responseAnswers, responseAnswer)

		// Сохраняем или обновляем подзадачу
		if errors.Is(err, gorm.ErrRecordNotFound) {
			answers[i].IsCorrect = isCorrect
			answers[i].UserID = userID
			if err := s.db.Create(&answers[i]).Error; err != nil {
				logger.Log.Errorf("Failed to save subtask submission for SubtaskID %d: %v", answer.SubtaskID, err)
				return nil, err
			}
		} else {
			if err := s.db.Model(&subtaskSubmission).Updates(map[string]interface{}{
				"answer":     answer.Answer,
				"is_correct": isCorrect,
				"attempts":   attempts,
			}).Error; err != nil {
				logger.Log.Errorf("Failed to update subtask submission for SubtaskID %d: %v", answer.SubtaskID, err)
				return nil, err
			}
		}
	}

	percent := totalScore / float64(assignment.MaxScore) * 100
	var grade float64
	switch {
	case percent >= 80:
		grade = 5
	case percent >= 60:
		grade = 4
	case percent >= 40:
		grade = 3
	case percent >= 20:
		grade = 2
	default:
		grade = 1
	}

	submission := model.Submission{
		AssignmentID: assignmentID,
		UserID:       userID,
		Grade:        grade,
	}
	if err := s.db.Create(&submission).Error; err != nil {
		logger.Log.Errorf("Failed to save submission: %v", err)
		return nil, err
	}

	points := uint(math.Round(totalScore))
	s.db.Model(&model.User{}).Where("id = ?", userID).Update("points", gorm.Expr("points + ?", points))

	msg := fmt.Sprintf("Ваше задание #%d оценено: %.1f", assignmentID, grade)
	s.notificationRepo.Create(&model.Notification{
		UserID:    userID,
		Message:   msg,
		IsRead:    false,
		CreatedAt: time.Now(),
	})

	response := map[string]interface{}{
		"grade":      grade,
		"totalScore": totalScore,
		"answers":    responseAnswers,
	}

	logger.Log.Infof("Quiz submission processed for user %d, assignment %d: grade=%.1f, totalScore=%.1f, answers=%+v",
		userID, assignmentID, grade, totalScore, responseAnswers)
	return response, nil
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/service/subtask.go
════════════════════════════════════════════════════════════════════════════════

package service

import (
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"gorm.io/gorm"
)

type SubtaskService interface {
	GetByAssignmentID(assignmentID uint) ([]model.Subtask, error)
}

type subtaskService struct {
	db *gorm.DB
}

func NewSubtaskService(db *gorm.DB) SubtaskService {
	return &subtaskService{db: db}
}

func (s *subtaskService) GetByAssignmentID(assignmentID uint) ([]model.Subtask, error) {
	var subtasks []model.Subtask
	if err := s.db.Where("assignment_id = ?", assignmentID).Order("sort_order asc").Find(&subtasks).Error; err != nil {
		return nil, err
	}
	return subtasks, nil
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/service/user.go
════════════════════════════════════════════════════════════════════════════════

package service

import (
	"errors"

	"github.com/MORFEUSik/projectschool/backend/internal/db"
	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/repository"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type UserService interface {
	Register(user *model.User) error
	Login(email, password string) (*model.User, error)
	GetProfile(userID uint) (*model.User, error)
	GetLeaderboard(courseID uint) ([]model.User, error)
	UpdateRole(userID, adminID uint, role model.Role) error
	UpdateProfile(userID uint, username, email string) error
	ListAll() ([]model.User, error)
	GetAchievements(userID uint) ([]model.UserAchievement, error)
}

type userService struct {
	repo repository.UserRepository
	db   *gorm.DB
}

func NewUserService(repo repository.UserRepository) UserService {
	return &userService{
		repo: repo,
		db:   db.DB,
	}
}

func (s *userService) Register(user *model.User) error {
	logger.Log.Infof("Attempting to register user: %s", user.Email)

	// Проверка: существует ли пользователь
	_, err := s.repo.FindByEmail(user.Email)
	if err == nil {
		logger.Log.Warnf("User with email %s already exists", user.Email)
		return errors.New("пользователь с таким email уже существует")
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		logger.Log.Errorf("Error checking email %s: %v", user.Email, err)
		return err
	}

	// Валидация модели
	if err := user.Validate(); err != nil {
		logger.Log.Errorf("User validation failed: %v", err)
		return err
	}

	// Хеширование пароля
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		logger.Log.Errorf("Failed to hash password: %v", err)
		return err
	}
	user.Password = string(hashedPassword)
	logger.Log.Info("Password hashed successfully")

	// Создание пользователя
	if err := s.repo.Create(user); err != nil {
		logger.Log.Errorf("Failed to create user: %v", err)
		return err
	}

	logger.Log.Infof("User %s registered successfully", user.Email)
	return nil
}

func (s *userService) Login(email, password string) (*model.User, error) {
	logger.Log.Infof("Attempting login for user: %s", email)

	user, err := s.repo.FindByEmail(email)
	if err != nil {
		logger.Log.Errorf("User %s not found: %v", email, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("неверный email или пароль")
		}
		return nil, err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		logger.Log.Warnf("Invalid password for user %s", email)
		return nil, errors.New("неверный email или пароль")
	}

	logger.Log.Infof("User %s logged in successfully", email)
	return user, nil
}

func (s *userService) GetProfile(userID uint) (*model.User, error) {
	logger.Log.Infof("Fetching profile for user %d", userID)

	user, err := s.repo.FindByID(userID)
	if err != nil {
		logger.Log.Errorf("User %d not found: %v", userID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("пользователь не найден")
		}
		return nil, err
	}

	logger.Log.Infof("Profile fetched for user %d", userID)
	return user, nil
}

func (s *userService) GetLeaderboard(courseID uint) ([]model.User, error) {
	logger.Log.Info("Fetching leaderboard")

	var users []model.User
	var err error
	if courseID == 0 {
		users, err = s.repo.FindTopByPoints(10)
	} else {
		users, err = s.repo.FindTopByPointsInCourse(courseID, 10)
	}
	if err != nil {
		logger.Log.Errorf("Failed to fetch leaderboard: %v", err)
		return nil, err
	}

	logger.Log.Infof("Leaderboard fetched with %d users", len(users))
	return users, nil
}

func (s *userService) UpdateRole(userID, adminID uint, role model.Role) error {
	logger.Log.Infof("Admin %d updating role for user %d to %s", adminID, userID, role)

	// Проверка: существует ли пользователь
	_, err := s.repo.FindByID(userID)
	if err != nil {
		logger.Log.Errorf("User %d not found: %v", userID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("пользователь не найден")
		}
		return err
	}

	// Проверка: является ли вызывающий пользователь админом
	admin, err := s.repo.FindByID(adminID)
	if err != nil {
		logger.Log.Errorf("Admin %d not found: %v", adminID, err)
		return err
	}
	if admin.Role != model.Admin {
		logger.Log.Warnf("User %d is not an admin", adminID)
		return errors.New("недостаточно прав")
	}

	// Проверка валидности роли
	if role != model.Student && role != model.Teacher && role != model.Admin {
		logger.Log.Errorf("Invalid role: %s", role)
		return errors.New("недопустимая роль")
	}

	// Обновление роли
	if err := s.repo.UpdateRole(userID, role); err != nil {
		logger.Log.Errorf("Failed to update role for user %d: %v", userID, err)
		return err
	}

	logger.Log.Infof("Role for user %d updated to %s", userID, role)
	return nil
}

func (s *userService) UpdateProfile(userID uint, username, email string) error {
	user, err := s.repo.FindByID(userID)
	if err != nil {
		return err
	}
	user.Username = username
	user.Email = email
	if err := user.Validate(); err != nil {
		return err
	}
	return s.db.Save(user).Error
}

func (s *userService) ListAll() ([]model.User, error) {
	var users []model.User
	err := s.db.Find(&users).Error
	return users, err
}

func (s *userService) GetAchievements(userID uint) ([]model.UserAchievement, error) {
	var achievements []model.UserAchievement
	err := s.db.Preload("Achievement").Where("user_id = ?", userID).Find(&achievements).Error
	return achievements, err
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/service/notification.go
════════════════════════════════════════════════════════════════════════════════

package service

import (
	"errors"

	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/repository"
	"gorm.io/gorm"
)

type NotificationService interface {
	Create(notification *model.Notification) error
	GetByUserID(userID uint) ([]model.Notification, error)
	MarkAsRead(id uint, userID uint) error
}

type notificationService struct {
	repo repository.NotificationRepository
	db   *gorm.DB
}

func NewNotificationService(repo repository.NotificationRepository, db *gorm.DB) NotificationService {
	return &notificationService{repo: repo, db: db}
}

func (s *notificationService) Create(notification *model.Notification) error {
	return s.repo.Create(notification)
}

func (s *notificationService) GetByUserID(userID uint) ([]model.Notification, error) {
	return s.repo.FindByUserID(userID)
}

func (s *notificationService) MarkAsRead(id uint, userID uint) error {
	var notification model.Notification
	if err := s.db.First(&notification, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("уведомление не найдено")
		}
		return err
	}
	if notification.UserID != userID {
		return errors.New("недостаточно прав")
	}
	return s.repo.MarkAsRead(id)
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/service/assignment.go
════════════════════════════════════════════════════════════════════════════════

package service

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/repository"
	"gorm.io/gorm"
)

type AssignmentService interface {
	Create(assignment *model.Assignment, subtasks []model.Subtask, files map[string]string) error // Обновляем сигнатуру
	ListByCourse(courseID uint) ([]model.Assignment, error)
	ListByUser(userID uint) ([]model.Assignment, error)
	Get(id uint) (*model.Assignment, error)
	Delete(id uint) error
}

type assignmentService struct {
	repo             repository.AssignmentRepository
	notificationRepo repository.NotificationRepository
	db               *gorm.DB
}

func NewAssignmentService(repo repository.AssignmentRepository, notificationRepo repository.NotificationRepository, db *gorm.DB) AssignmentService {
	return &assignmentService{
		repo:             repo,
		notificationRepo: notificationRepo,
		db:               db,
	}
}

func (s *assignmentService) Create(assignment *model.Assignment, subtasks []model.Subtask, files map[string]string) error {
	logger.Log.Infof("Creating assignment: %s", assignment.Title)
	if assignment.Type == "multiple_choice" && len(subtasks) == 0 {
		logger.Log.Errorf("Multiple choice assignment must have at least one subtask")
		return errors.New("тест должен содержать хотя бы одно подзадание")
	}

	return s.db.Transaction(func(tx *gorm.DB) error {
		if err := s.repo.CreateWithTx(tx, assignment); err != nil {
			logger.Log.Errorf("Failed to create assignment: %v", err)
			return err
		}

		for i := range subtasks {
			if subtasks[i].Question == "" {
				logger.Log.Errorf("Subtask question cannot be empty")
				return errors.New("вопрос подзадания не может быть пустым")
			}
			if subtasks[i].InputType == "multiple_choice" {
				if len(subtasks[i].Options) < 2 {
					logger.Log.Errorf("Subtask must have at least 2 options")
					return errors.New("подзадание должно содержать хотя бы 2 варианта ответа")
				}
				if !contains(subtasks[i].Options, subtasks[i].Answer) {
					logger.Log.Errorf("Subtask answer must be one of the options")
					return errors.New("правильный ответ должен быть одним из вариантов")
				}
			} else if subtasks[i].InputType == "text_input" {
				if len(subtasks[i].Options) > 0 {
					logger.Log.Errorf("Text input subtask must not have options")
					return errors.New("подзадание с текстовым вводом не должно содержать варианты ответа")
				}
				if subtasks[i].Answer == "" {
					logger.Log.Errorf("Text input subtask must have an answer")
					return errors.New("подзадание с текстовым вводом должно содержать правильный ответ")
				}
			} else {
				logger.Log.Errorf("Invalid subtask type: %s", subtasks[i].InputType)
				return errors.New("неверный тип подзадания")
			}
			subtasks[i].AssignmentID = assignment.ID
			subtasks[i].SortOrder = i + 1

			// Привязываем URL файла к подзаданию
			if fileURL, ok := files[fmt.Sprintf("subtask_image_%d", i)]; ok {
				subtasks[i].File_url = fileURL
			}

			if err := tx.Create(&subtasks[i]).Error; err != nil {
				logger.Log.Errorf("Failed to create subtask: %v", err)
				return err
			}
		}

		var enrollments []model.Enrollment
		if err := s.db.Where("course_id = ?", assignment.CourseID).Find(&enrollments).Error; err == nil {
			var course model.Course
			if err := s.db.First(&course, assignment.CourseID).Error; err == nil {
				for _, e := range enrollments {
					notification := &model.Notification{
						UserID:    e.UserID,
						Message:   fmt.Sprintf("Новое задание в курсе %s: %s", course.Title, assignment.Title),
						IsRead:    false,
						CreatedAt: time.Now(),
					}
					s.notificationRepo.Create(notification)
				}
			}
		}

		logger.Log.Infof("Assignment %s created successfully with %d subtasks", assignment.Title, len(subtasks))
		return nil
	})
}

func contains(options []string, answer string) bool {
	for _, opt := range options {
		if strings.TrimSpace(strings.ToLower(opt)) == strings.TrimSpace(strings.ToLower(answer)) {
			return true
		}
	}
	return false
}

func (s *assignmentService) ListByCourse(courseID uint) ([]model.Assignment, error) {
	return s.repo.FindByCourseID(courseID)
}

func (s *assignmentService) ListByUser(userID uint) ([]model.Assignment, error) {
	return s.repo.FindByUserID(userID)
}

func (s *assignmentService) Get(id uint) (*model.Assignment, error) {
	return s.repo.FindByID(id)
}

func (s *assignmentService) Delete(id uint) error {
	return s.repo.Delete(id)
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/service/course.go
════════════════════════════════════════════════════════════════════════════════

package service

import (
	"errors"
	"fmt"
	"time"

	//"github.com/MORFEUSik/projectschool/backend/internal/db"
	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/repository"
	"gorm.io/gorm"
)

// CourseService определяет интерфейс для работы с курсами
type CourseService interface {
	Create(course *model.Course) error
	List(limit, offset int) ([]model.Course, int, error) // Изменяем сигнатуру, добавляем total	Get(id uint) (*model.Course, error)
	Get(id uint) (*model.Course, error)                  // Добавляем метод Get
	PreloadTeacher(course *model.Course) error
	Enroll(userID, courseID uint) error
	Unenroll(userID, courseID uint) error
	Delete(userID, courseID uint) error
	GetStats(courseID uint) (map[string]interface{}, error)
	GetProgress(userID, courseID uint) (map[string]interface{}, error)
	CheckDeadlines() error
}

// courseService реализует CourseService
type courseService struct {
	repo             repository.CourseRepository
	userRepo         repository.UserRepository
	notificationRepo repository.NotificationRepository
	db               *gorm.DB
}

// NewCourseService создаёт новый экземпляр CourseService
func NewCourseService(
	repo repository.CourseRepository,
	notificationRepo repository.NotificationRepository,
	userRepo repository.UserRepository,
	db *gorm.DB,
) CourseService {
	return &courseService{
		repo:             repo,
		userRepo:         userRepo,
		notificationRepo: notificationRepo,
		db:               db,
	}
}

// Create создаёт новый курс
func (s *courseService) Create(course *model.Course) error {
	logger.Log.Infof("Creating course: %s", course.Title)
	err := s.repo.Create(course)
	if err != nil {
		logger.Log.Errorf("Failed to create course: %v", err)
		return err
	}
	logger.Log.Infof("Course %s created successfully", course.Title)
	return nil
}

// List возвращает список курсов с пагинацией и общим количеством
func (s *courseService) List(limit, offset int) ([]model.Course, int, error) {
	logger.Log.Infof("Fetching courses with limit %d, offset %d", limit, offset)
	var courses []model.Course
	var total int64
	err := s.db.Model(&model.Course{}).Count(&total).Error
	if err != nil {
		logger.Log.Errorf("Failed to count courses: %v", err)
		return nil, 0, err
	}
	err = s.db.Preload("Teacher").Limit(limit).Offset(offset).Find(&courses).Error
	if err != nil {
		logger.Log.Errorf("Failed to fetch courses: %v", err)
		return nil, 0, err
	}
	logger.Log.Infof("Fetched %d courses out of %d total", len(courses), total)
	return courses, int(total), nil
}

// Get возвращает курс по ID
func (s *courseService) Get(id uint) (*model.Course, error) {
	logger.Log.Infof("Fetching course %d", id)
	var course model.Course
	err := s.db.Preload("Teacher").First(&course, id).Error
	if err != nil {
		logger.Log.Errorf("Failed to fetch course %d: %v", id, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("курс не найден")
		}
		return nil, err
	}
	logger.Log.Infof("Fetched course %d", id)
	return &course, nil
}

// PreloadTeacher подгружает данные учителя для курса
func (s *courseService) PreloadTeacher(course *model.Course) error {
	logger.Log.Infof("Preloading teacher for course %d", course.ID)
	err := s.db.Preload("Teacher").First(course, course.ID).Error
	if err != nil {
		logger.Log.Errorf("Failed to preload teacher for course %d: %v", course.ID, err)
		return err
	}
	return nil
}

// Enroll записывает пользователя на курс
func (s *courseService) Enroll(userID, courseID uint) error {
	logger.Log.Infof("User %d enrolling in course %d", userID, courseID)

	// Проверка: существует ли курс
	course, err := s.repo.FindByID(courseID)
	if err != nil {
		logger.Log.Errorf("Course %d not found: %v", courseID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("курс не найден")
		}
		return err
	}

	// Проверка: существует ли пользователь
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		logger.Log.Errorf("User %d not found: %v", userID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("пользователь не найден")
		}
		return err
	}

	// Проверка: является ли пользователь студентом
	if user.Role != model.Student {
		logger.Log.Warnf("User %d is not a student", userID)
		return errors.New("только студенты могут записываться на курсы")
	}

	// Проверка: не записан ли пользователь уже
	var enrollment model.Enrollment
	err = s.db.Where("user_id = ? AND course_id = ?", userID, courseID).First(&enrollment).Error
	if err == nil {
		logger.Log.Warnf("User %d already enrolled in course %d", userID, courseID)
		return errors.New("пользователь уже записан на курс")
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		logger.Log.Errorf("Error checking enrollment: %v", err)
		return err
	}

	// Создание записи
	enrollment = model.Enrollment{
		UserID:     userID,
		CourseID:   courseID,
		EnrolledAt: time.Now(),
	}
	if err := s.db.Create(&enrollment).Error; err != nil {
		logger.Log.Errorf("Failed to create enrollment: %v", err)
		return err
	}

	// Создание уведомления
	notification := &model.Notification{
		UserID:    userID,
		Message:   fmt.Sprintf("Вы записались на курс: %s", course.Title),
		IsRead:    false,
		CreatedAt: time.Now(),
	}
	if err := s.notificationRepo.Create(notification); err != nil {
		logger.Log.Errorf("Failed to create enrollment notification for user %d: %v", userID, err)
	}

	// Проверка достижений
	achievementService := NewAchievementService(s.db)
	var submissions []model.Submission
	if err := s.db.Where("user_id = ?", userID).Find(&submissions).Error; err != nil {
		logger.Log.Errorf("Failed to fetch submissions for user %d: %v", userID, err)
	}
	var courseCount int64
	if err := s.db.Model(&model.Enrollment{}).Where("user_id = ?", userID).Count(&courseCount).Error; err != nil {
		logger.Log.Errorf("Failed to count courses for user %d: %v", userID, err)
	}
	newAchievements, err := achievementService.AwardAchievements(userID, user.Points, submissions, int(courseCount))
	if err != nil {
		logger.Log.Errorf("Failed to award achievements for user %d: %v", userID, err)
	} else if len(newAchievements) > 0 {
		logger.Log.Infof("Awarded %d new achievements to user %d", len(newAchievements), userID)
		for _, ach := range newAchievements {
			notification := &model.Notification{
				UserID:    userID,
				Message:   fmt.Sprintf("Вы заработали достижение: %s", ach.Title),
				IsRead:    false,
				CreatedAt: time.Now(),
			}
			if err := s.notificationRepo.Create(notification); err != nil {
				logger.Log.Errorf("Failed to create achievement notification for user %d: %v", userID, err)
			}
		}
	}

	logger.Log.Infof("User %d enrolled in course %d", userID, courseID)
	return nil
}

// Unenroll отменяет запись пользователя на курс
func (s *courseService) Unenroll(userID, courseID uint) error {
	logger.Log.Infof("User %d unenrolling from course %d", userID, courseID)

	// Проверка: существует ли курс
	_, err := s.repo.FindByID(courseID)
	if err != nil {
		logger.Log.Errorf("Course %d not found: %v", courseID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("курс не найден")
		}
		return err
	}

	// Проверка: существует ли пользователь
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		logger.Log.Errorf("User %d not found: %v", userID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("пользователь не найден")
		}
		return err
	}

	// Проверка: является ли пользователь студентом
	if user.Role != model.Student {
		logger.Log.Warnf("User %d is not a student", userID)
		return errors.New("только студенты могут отменять запись на курсы")
	}

	// Проверка: записан ли пользователь
	var enrollment model.Enrollment
	err = s.db.Where("user_id = ? AND course_id = ?", userID, courseID).First(&enrollment).Error
	if err != nil {
		logger.Log.Errorf("Enrollment not found for user %d in course %d: %v", userID, courseID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("пользователь не записан на курс")
		}
		return err
	}

	// Удаление записи
	if err := s.db.Delete(&enrollment).Error; err != nil {
		logger.Log.Errorf("Failed to delete enrollment: %v", err)
		return err
	}

	logger.Log.Infof("User %d unenrolled from course %d", userID, courseID)
	return nil
}

// Delete удаляет курс
func (s *courseService) Delete(userID, courseID uint) error {
	logger.Log.Infof("User %d deleting course %d", userID, courseID)

	course, err := s.repo.FindByID(courseID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("курс не найден")
		}
		return err
	}

	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("пользователь не найден")
		}
		return err
	}

	// 💥 Вот тут даём право админу
	if user.Role != model.Admin && (user.Role != model.Teacher || course.TeacherID != userID) {
		return errors.New("нет прав для удаления курса")
	}

	if err := s.repo.Delete(courseID); err != nil {
		return fmt.Errorf("ошибка при удалении курса: %w", err)
	}

	logger.Log.Infof("Course %d deleted by user %d", courseID, userID)
	return nil
}

// GetStats возвращает статистику по курсу
func (s *courseService) GetStats(courseID uint) (map[string]interface{}, error) {
	logger.Log.Infof("Fetching stats for course %d", courseID)

	// Проверка: существует ли курс
	_, err := s.repo.FindByID(courseID)
	if err != nil {
		logger.Log.Errorf("Course %d not found: %v", courseID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("курс не найден")
		}
		return nil, err
	}

	stats, err := s.repo.GetStats(courseID)
	if err != nil {
		logger.Log.Errorf("Failed to fetch stats for course %d: %v", courseID, err)
		return nil, err
	}

	logger.Log.Infof("Stats fetched for course %d", courseID)
	return stats, nil
}

func (s *courseService) GetProgress(userID, courseID uint) (map[string]interface{}, error) {
	logger.Log.Infof("Fetching progress for user %d in course %d", userID, courseID)

	// Проверка записи на курс
	var enrollment model.Enrollment
	if err := s.db.Where("user_id = ? AND course_id = ?", userID, courseID).First(&enrollment).Error; err != nil {
		logger.Log.Errorf("User %d not enrolled in course %d: %v", userID, courseID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("пользователь не записан на курс")
		}
		return nil, err
	}

	var course model.Course
	if err := s.db.Preload("Assignments.Submissions").First(&course, courseID).Error; err != nil {
		logger.Log.Errorf("Course %d not found: %v", courseID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("курс не найден")
		}
		return nil, err
	}

	totalAssignments := len(course.Assignments)
	var completedAssignments int
	var totalPoints float64

	for _, assignment := range course.Assignments {
		for _, submission := range assignment.Submissions {
			if submission.UserID == userID && submission.Grade != 0 {
				completedAssignments++
				totalPoints += submission.Grade * float64(assignment.MaxScore) / 5.0
			}
		}
	}

	completionRate := 0.0
	if totalAssignments > 0 {
		completionRate = float64(completedAssignments) / float64(totalAssignments) * 100
	}

	logger.Log.Infof("Progress for user %d in course %d: %d/%d assignments, %.2f points, %.2f%% completion",
		userID, courseID, completedAssignments, totalAssignments, totalPoints, completionRate)

	return map[string]interface{}{
		"total_assignments":     totalAssignments,
		"completed_assignments": completedAssignments,
		"completion_rate":       fmt.Sprintf("%.2f", completionRate),
		"total_points":          fmt.Sprintf("%.2f", totalPoints),
	}, nil
}

func (s *courseService) CheckDeadlines() error {
	deadlineThreshold := time.Now().Add(24 * time.Hour)
	var assignments []model.Assignment
	if err := s.db.
		Where("due_date BETWEEN ? AND ?", time.Now(), deadlineThreshold).
		Preload("Course").
		Find(&assignments).Error; err != nil {
		return err
	}
	for _, assignment := range assignments {
		var enrollments []model.Enrollment
		if err := s.db.Where("course_id = ?", assignment.CourseID).Find(&enrollments).Error; err != nil {
			continue
		}
		for _, enrollment := range enrollments {
			msg := fmt.Sprintf("Дедлайн задания '%s' на курсе '%s' приближается (%s)!", assignment.Title, assignment.Course.Title, assignment.DueDate.Format(time.RFC1123))
			_ = s.notificationRepo.Create(&model.Notification{
				UserID:    enrollment.UserID,
				Message:   msg,
				IsRead:    false,
				CreatedAt: time.Now(),
			})
		}
	}
	return nil
}



════════════════════════════════════════════════════════════════════════════════
║ backend/internal/service/achievement.go
════════════════════════════════════════════════════════════════════════════════

package service

import (
	"time"

	//"github.com/MORFEUSik/projectschool/backend/internal/db"
	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"gorm.io/gorm"
)

type AchievementService interface {
	AwardAchievements(userID uint, points uint, submissions []model.Submission, courseCount int) ([]model.GlobalAchievement, error)
}

type achievementService struct {
	db *gorm.DB
}

func NewAchievementService(db *gorm.DB) AchievementService {
	return &achievementService{
		db: db,
	}
}

func (s *achievementService) AwardAchievements(userID uint, points uint, submissions []model.Submission, courseCount int) ([]model.GlobalAchievement, error) {
	logger.Log.Infof("Checking achievements for user %d with %d points, %d submissions, %d courses", userID, points, len(submissions), courseCount)

	var user model.User
	if err := s.db.First(&user, userID).Error; err != nil {
		logger.Log.Errorf("Failed to find user %d: %v", userID, err)
		return nil, err
	}

	// Загружаем все глобальные достижения
	var globalAchievements []model.GlobalAchievement
	if err := s.db.Find(&globalAchievements).Error; err != nil {
		logger.Log.Errorf("Failed to load global achievements: %v", err)
		return nil, err
	}

	var newAchievements []model.GlobalAchievement
	for _, ach := range globalAchievements {
		// Проверяем условия
		conditionMet := false
		switch ach.Condition {
		case "points_50":
			conditionMet = points >= 50
		case "points_100":
			conditionMet = points >= 100
		case "courses_1":
			conditionMet = courseCount >= 1
		case "courses_3":
			conditionMet = courseCount >= 3
		case "submissions_5":
			if len(submissions) >= 5 {
				count := 0
				for _, sub := range submissions {
					if sub.Grade >= 4.0 {
						count++
						if count >= 5 {
							conditionMet = true
							break
						}
					} else {
						count = 0
					}
				}
			}
		}

		if conditionMet {
			// Проверяем, не присвоено ли достижение
			var count int64
			s.db.Model(&model.UserAchievement{}).
				Where("user_id = ? AND achievement_id = ?", userID, ach.ID).
				Count(&count)
			if count == 0 {
				// Присваиваем достижение
				userAch := model.UserAchievement{
					UserID:        userID,
					AchievementID: ach.ID,
					AwardedAt:     time.Now(),
				}
				if err := s.db.Create(&userAch).Error; err != nil {
					logger.Log.Errorf("Failed to assign achievement %s to user %d: %v", ach.Title, userID, err)
					return nil, err
				}
				logger.Log.Infof("Assigned achievement %s to user %d", ach.Title, userID)
				newAchievements = append(newAchievements, ach)
			}
		}
	}

	return newAchievements, nil
}



════════════════════════════════════════════════════════════════════════════════
║ backend/config/config.go
════════════════════════════════════════════════════════════════════════════════

package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
}

func LoadConfig() *Config {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Ошибка загрузки .env файла")
	}

	return &Config{
		DBHost:     os.Getenv("DB_HOST"),
		DBPort:     os.Getenv("DB_PORT"),
		DBUser:     os.Getenv("DB_USER"),
		DBPassword: os.Getenv("DB_PASSWORD"),
		DBName:     os.Getenv("DB_NAME"),
	}
}



════════════════════════════════════════════════════════════════════════════════
║ backend/cmd/main.go
════════════════════════════════════════════════════════════════════════════════

package main

import (
	"fmt"
	"log"
	"os"
	"path/filepath"

	"github.com/MORFEUSik/projectschool/backend/config"
	"github.com/MORFEUSik/projectschool/backend/docs"
	"github.com/MORFEUSik/projectschool/backend/internal/db"
	"github.com/MORFEUSik/projectschool/backend/internal/handler"
	"github.com/MORFEUSik/projectschool/backend/internal/jwt"
	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/middleware"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/repository"
	"github.com/MORFEUSik/projectschool/backend/internal/service"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/robfig/cron/v3"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

func main() {
	// Загружаем .env
	if err := godotenv.Load(); err != nil {
		log.Printf("Ошибка загрузки .env: %v, использую переменные окружения", err)
	}

	// Инициализация JWT
	if err := jwt.Init(os.Getenv("JWT_SECRET")); err != nil {
		log.Fatalf("Failed to initialize JWT: %v", err)
	}

	logger.Init()
	logger.Log.Info("Starting server...")

	cfg := config.LoadConfig()
	db.Init(cfg)

	// Миграция моделей
	db.DB.AutoMigrate(
		&model.User{},
		&model.Course{},
		&model.Assignment{},
		&model.Subtask{},
		&model.SubtaskSubmission{},
		&model.Submission{},
		&model.GlobalAchievement{},
		&model.UserAchievement{},
		&model.Notification{},
		&model.Enrollment{},
	)

	// Создание папки uploads с абсолютным путём
	wd, err := os.Getwd()
	if err != nil {
		logger.Log.Fatalf("Failed to get working directory: %v", err)
	}
	uploadDir := filepath.Join(wd, "uploads")
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		logger.Log.Fatalf("Failed to create uploads directory: %v", err)
	}

	r := gin.Default()

	// Настройка статического маршрута для /uploads
	r.Static("/uploads", uploadDir)

	// Настройка CORS
	corsConfig := cors.Config{
		AllowOrigins:     []string{"http://localhost:8080", "http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Authorization", "Content-Type"},
		AllowCredentials: true,
	}
	r.Use(cors.New(corsConfig))

	userRepo := repository.NewUserRepository()
	courseRepo := repository.NewCourseRepository()
	assignmentRepo := repository.NewAssignmentRepository()
	submissionRepo := repository.NewSubmissionRepository()
	notificationRepo := repository.NewNotificationRepository(db.DB)

	authService := service.NewAuthService(userRepo)
	courseService := service.NewCourseService(courseRepo, notificationRepo, userRepo, db.DB)
	assignmentService := service.NewAssignmentService(assignmentRepo, notificationRepo, db.DB)
	submissionService := service.NewSubmissionService(submissionRepo, userRepo, assignmentRepo, notificationRepo)
	userService := service.NewUserService(userRepo)
	notificationService := service.NewNotificationService(notificationRepo, db.DB)
	subtaskService := service.NewSubtaskService(db.DB)

	c := cron.New()
	c.AddFunc("@every 24h", func() {
		if err := courseService.CheckDeadlines(); err != nil {
			logger.Log.Errorf("Ошибка при проверке дедлайнов: %v", err)
		}
	})
	c.Start()

	// Группа API
	api := r.Group("/api")
	{
		// Публичные маршруты
		api.POST("/register", middleware.RateLimit(), handler.Register(authService))
		api.POST("/login", middleware.RateLimit(), handler.Login(authService))
		api.GET("/leaderboard", handler.GetLeaderboard(userService))

		// Защищённые маршруты
		protected := api.Group("", handler.AuthMiddleware())
		{
			protected.GET("/users", handler.ListUsers(userService))
			protected.POST("/assignments/upload", handler.UploadFile())
			protected.GET("/users/me", handler.GetProfile(userService))
			protected.PUT("/users/me", handler.UpdateProfile(userService))
			protected.GET("/notifications", handler.GetNotifications(notificationService))
			protected.PUT("/notifications/:id/read", handler.MarkNotificationAsRead(notificationService))
			protected.GET("/users/me/submissions", handler.GetUserSubmissions(submissionService))
			protected.PUT("/users/:id/role", handler.RoleMiddleware(model.Admin), handler.UpdateRole(userService))
			protected.POST("/check-deadlines", handler.CheckDeadlines(courseService))
			protected.GET("/users/me/achievements", handler.GetMyAchievements(userService))

			courses := protected.Group("/courses")
			{
				courses.GET("", handler.ListCourses(courseService))
				courses.POST("", handler.RoleMiddleware(model.Teacher, model.Admin), handler.CreateCourse(courseService))

				courseGroup := courses.Group("/:id")
				{
					courseGroup.GET("", handler.GetCourse(courseService))
					courseGroup.GET("/assignments", handler.ListAssignments(assignmentService))
					courseGroup.GET("/assignments/:assignmentId", handler.GetAssignment(assignmentService))
					courseGroup.POST("/enroll", handler.RoleMiddleware(model.Student), handler.Enroll(courseService))
					courseGroup.DELETE("/enroll", handler.RoleMiddleware(model.Student), handler.Unenroll(courseService))
					courseGroup.DELETE("", handler.RoleMiddleware(model.Teacher, model.Admin), handler.DeleteCourse(courseService))
					courseGroup.GET("/stats", handler.RoleMiddleware(model.Teacher, model.Admin), handler.GetCourseStats(courseService))
					courseGroup.GET("/progress", handler.RoleMiddleware(model.Student), handler.GetCourseProgress(courseService))
				}
			}

			assignments := protected.Group("/assignments")
			{
				assignments.POST("", handler.RoleMiddleware(model.Teacher, model.Admin), handler.CreateAssignment(assignmentService))
				assignments.POST("/:id/submit", handler.RoleMiddleware(model.Student), handler.SubmitAssignment(submissionService))
				assignments.DELETE("/:id", handler.RoleMiddleware(model.Teacher, model.Admin), handler.DeleteAssignment(assignmentService))
				assignments.POST("/:id/submit-quiz", handler.RoleMiddleware(model.Student), handler.SubmitQuizAssignment(submissionService))
				assignments.GET("/:id/subtasks", handler.GetSubtasks(subtaskService))
				assignments.POST("/:id/check-subtask", handler.RoleMiddleware(model.Student), handler.CheckSubtaskAnswer(subtaskService, submissionService))
			}

			submissions := protected.Group("/submissions")
			{
				submissions.GET("", handler.RoleMiddleware(model.Teacher, model.Admin), handler.ListSubmissions(submissionService))
				submissions.PUT("/:id/grade", handler.RoleMiddleware(model.Teacher, model.Admin), handler.SetGrade(submissionService))
			}
		}
	}

	r.GET("/", func(c *gin.Context) {
		c.String(200, "🎓 Backend для ProjectSchool работает!")
	})

	// Swagger документация
	docs.SwaggerInfo.Title = "ProjectSchool API"
	docs.SwaggerInfo.Description = "API для обучающего приложения ProjectSchool"
	docs.SwaggerInfo.Version = "1.0"
	docs.SwaggerInfo.Host = "localhost:8080"
	docs.SwaggerInfo.BasePath = "/api"
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	fmt.Println("🚀 Сервер запущен на http://localhost:8080")
	fmt.Println("Swagger доступен на http://localhost:8080/swagger/index.html")
	if err := r.Run(":8080"); err != nil {
		logger.Log.Fatalf("Failed to start server: %v", err)
	}
}
