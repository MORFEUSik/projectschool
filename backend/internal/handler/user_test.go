package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/MORFEUSik/projectschool/backend/internal/jwt"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockUserService для тестирования
type MockUserService struct {
	mock.Mock
}

func (m *MockUserService) Register(user *model.User) error {
	args := m.Called(user)
	return args.Error(0)
}

func (m *MockUserService) FindByEmail(email string) (*model.User, error) {
	args := m.Called(email)
	return args.Get(0).(*model.User), args.Error(1)
}

func (m *MockUserService) FindByID(id uint) (*model.User, error) {
	args := m.Called(id)
	return args.Get(0).(*model.User), args.Error(1)
}

// MockSubmissionService для тестирования
type MockSubmissionService struct {
	mock.Mock
}

func (m *MockSubmissionService) Create(submission *model.Submission) error {
	args := m.Called(submission)
	return args.Error(0)
}

func (m *MockSubmissionService) FindByUserID(userID uint) ([]model.Submission, error) {
	args := m.Called(userID)
	return args.Get(0).([]model.Submission), args.Error(1)
}

func TestGetProfile(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()

	mockUserService := new(MockUserService)
	router.GET("/api/users/me", AuthMiddleware(), GetProfile(mockUserService))

	t.Run("Successful profile fetch", func(t *testing.T) {
		user := &model.User{
			ID:       2,
			Username: "student1",
			Email:    "student1@example.com",
			Role:     "student",
			Points:   39,
		}
		mockUserService.On("FindByID", uint(2)).Return(user, nil).Once()

		token, _ := jwt.GenerateToken(2)
		req, _ := http.NewRequest("GET", "/api/users/me", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		var response model.User
		json.Unmarshal(w.Body.Bytes(), &response)
		assert.Equal(t, user.ID, response.ID)
		assert.Equal(t, user.Username, response.Username)
		assert.Equal(t, user.Email, response.Email)
	})

	t.Run("Unauthorized", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/api/users/me", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusUnauthorized, w.Code)
		var response map[string]string
		json.Unmarshal(w.Body.Bytes(), &response)
		assert.Equal(t, "Токен отсутствует", response["error"])
	})

	t.Run("User not found", func(t *testing.T) {
		mockUserService.On("FindByID", uint(2)).Return((*model.User)(nil), errors.New("пользователь не найден")).Once()

		token, _ := jwt.GenerateToken(2)
		req, _ := http.NewRequest("GET", "/api/users/me", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusInternalServerError, w.Code)
		var response map[string]string
		json.Unmarshal(w.Body.Bytes(), &response)
		assert.Equal(t, "пользователь не найден", response["error"])
	})
}

func TestGetUserSubmissions(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()

	mockSubmissionService := new(MockSubmissionService)
	router.GET("/api/users/me/submissions", AuthMiddleware(), GetUserSubmissions(mockSubmissionService))

	t.Run("Successful submissions fetch", func(t *testing.T) {
		submissions := []model.Submission{
			{
				ID:           5,
				AssignmentID: 1,
				UserID:       2,
				Content:      "x = 2",
				Grade:        4.5,
			},
		}
		mockSubmissionService.On("FindByUserID", uint(2)).Return(submissions, nil).Once()

		token, _ := jwt.GenerateToken(2)
		req, _ := http.NewRequest("GET", "/api/users/me/submissions", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		var response map[string][]model.Submission
		json.Unmarshal(w.Body.Bytes(), &response)
		assert.Len(t, response["submissions"], 1)
		assert.Equal(t, submissions[0].Content, response["submissions"][0].Content)
		assert.Equal(t, submissions[0].Grade, response["submissions"][0].Grade)
	})

	t.Run("Unauthorized", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/api/users/me/submissions", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusUnauthorized, w.Code)
		var response map[string]string
		json.Unmarshal(w.Body.Bytes(), &response)
		assert.Equal(t, "Токен отсутствует", response["error"])
	})

	t.Run("No submissions", func(t *testing.T) {
		mockSubmissionService.On("FindByUserID", uint(2)).Return([]model.Submission{}, nil).Once()

		token, _ := jwt.GenerateToken(2)
		req, _ := http.NewRequest("GET", "/api/users/me/submissions", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		var response map[string][]model.Submission
		json.Unmarshal(w.Body.Bytes(), &response)
		assert.Empty(t, response["submissions"])
	})
}
