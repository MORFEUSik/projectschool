package handler

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	//"github.com/MORFEUSik/projectschool/backend/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockAuthService для тестирования
type MockAuthService struct {
	mock.Mock
}

func (m *MockAuthService) Register(user *model.User) error {
	args := m.Called(user)
	return args.Error(0)
}

func (m *MockAuthService) Login(email, password string) (*model.User, error) {
	args := m.Called(email, password)
	return args.Get(0).(*model.User), args.Error(1)
}

func TestRegister(t *testing.T) {
	// Инициализация логгера
	logger.Init()

	gin.SetMode(gin.TestMode)
	router := gin.New()

	mockService := new(MockAuthService)
	router.POST("/register", Register(mockService))

	t.Run("Successful registration", func(t *testing.T) {
		user := &model.User{
			Username: "testuser",
			Email:    "testuser@example.com",
			Password: "password123",
			Role:     "student",
		}
		mockService.On("Register", mock.Anything).Return(nil).Once()

		body, _ := json.Marshal(user)
		req, _ := http.NewRequest("POST", "/register", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		assert.Equal(t, "Пользователь успешно зарегистрирован", response["message"])
		assert.NotEmpty(t, response["token"])
	})

	t.Run("Invalid JSON", func(t *testing.T) {
		req, _ := http.NewRequest("POST", "/register", bytes.NewBuffer([]byte("{invalid}")))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
		var response map[string]string
		json.Unmarshal(w.Body.Bytes(), &response)
		assert.Equal(t, "Неверный формат данных", response["error"])
	})

	t.Run("User already exists", func(t *testing.T) {
		user := &model.User{
			Username: "testuser",
			Email:    "testuser@example.com",
			Password: "password123",
			Role:     "student",
		}
		mockService.On("Register", mock.Anything).Return(errors.New("пользователь с таким email уже существует")).Once()

		body, _ := json.Marshal(user)
		req, _ := http.NewRequest("POST", "/register", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
		var response map[string]string
		json.Unmarshal(w.Body.Bytes(), &response)
		assert.Equal(t, "пользователь с таким email уже существует", response["error"])
	})
}

func TestLogin(t *testing.T) {
	// Инициализация логгера
	logger.Init()

	gin.SetMode(gin.TestMode)
	router := gin.New()

	mockService := new(MockAuthService)
	router.POST("/login", Login(mockService))

	t.Run("Successful login", func(t *testing.T) {
		credentials := struct {
			Email    string `json:"email"`
			Password string `json:"password"`
		}{
			Email:    "student1@example.com",
			Password: "password123",
		}
		user := &model.User{ID: 2, Email: "student1@example.com"}
		mockService.On("Login", credentials.Email, credentials.Password).Return(user, nil).Once()

		body, _ := json.Marshal(credentials)
		req, _ := http.NewRequest("POST", "/login", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		assert.Equal(t, "Успешный вход", response["message"])
		assert.NotEmpty(t, response["token"])
	})

	t.Run("Invalid credentials", func(t *testing.T) {
		credentials := struct {
			Email    string `json:"email"`
			Password string `json:"password"`
		}{
			Email:    "student1@example.com",
			Password: "wrongpassword",
		}
		mockService.On("Login", credentials.Email, credentials.Password).Return((*model.User)(nil), errors.New("Неверный email или пароль")).Once()

		body, _ := json.Marshal(credentials)
		req, _ := http.NewRequest("POST", "/login", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusUnauthorized, w.Code)
		var response map[string]string
		json.Unmarshal(w.Body.Bytes(), &response)
		assert.Equal(t, "Неверный email или пароль", response["error"])
	})

	t.Run("Invalid JSON", func(t *testing.T) {
		req, _ := http.NewRequest("POST", "/login", bytes.NewBuffer([]byte("{invalid}")))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
		var response map[string]string
		json.Unmarshal(w.Body.Bytes(), &response)
		assert.Equal(t, "Неверный формат данных", response["error"])
	})
}
