package handler

import (
	"bytes"
	"encoding/json"
	//"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/MORFEUSik/projectschool/backend/internal/jwt"
	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	//"github.com/MORFEUSik/projectschool/backend/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"gorm.io/gorm"
)

// MockCourseService для тестирования
type MockCourseService struct {
	mock.Mock
}

func (m *MockCourseService) Create(course *model.Course) error {
	args := m.Called(course)
	return args.Error(0)
}

func (m *MockCourseService) List(limit, offset int) ([]model.Course, error) {
	args := m.Called(limit, offset)
	return args.Get(0).([]model.Course), args.Error(1)
}

func (m *MockCourseService) Get(id uint) (*model.Course, error) {
	args := m.Called(id)
	return args.Get(0).(*model.Course), args.Error(1)
}

func TestCreateCourse(t *testing.T) {
	logger.Init()
	gin.SetMode(gin.TestMode)
	router := gin.New()

	mockService := new(MockCourseService)
	router.POST("/api/courses", AuthMiddleware(), CreateCourse(mockService))

	t.Run("Successful course creation", func(t *testing.T) {
		course := &model.Course{
			Title:       "Math 101",
			Description: "Introduction to Mathematics",
			TeacherID:   1,
		}
		mockService.On("Create", mock.Anything).Return(nil).Once()

		token, _ := jwt.GenerateToken(1)
		body, _ := json.Marshal(course)
		req, _ := http.NewRequest("POST", "/api/courses", bytes.NewBuffer(body))
		req.Header.Set("Authorization", "Bearer "+token)
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		assert.Equal(t, "Курс создан", response["message"])
	})

	t.Run("Invalid JSON", func(t *testing.T) {
		token, _ := jwt.GenerateToken(1)
		req, _ := http.NewRequest("POST", "/api/courses", bytes.NewBuffer([]byte("{invalid}")))
		req.Header.Set("Authorization", "Bearer "+token)
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
		var response map[string]string
		json.Unmarshal(w.Body.Bytes(), &response)
		assert.Equal(t, "Неверный формат данных", response["error"])
	})

	t.Run("Validation failed", func(t *testing.T) {
		course := &model.Course{Title: "M"} // Слишком короткое название
		token, _ := jwt.GenerateToken(1)
		body, _ := json.Marshal(course)
		req, _ := http.NewRequest("POST", "/api/courses", bytes.NewBuffer(body))
		req.Header.Set("Authorization", "Bearer "+token)
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
		var response map[string]string
		json.Unmarshal(w.Body.Bytes(), &response)
		assert.Contains(t, response["error"], "Field validation for 'Title'")
	})
}

func TestListCourses(t *testing.T) {
	logger.Init()
	gin.SetMode(gin.TestMode)
	router := gin.New()

	mockService := new(MockCourseService)
	router.GET("/api/courses", ListCourses(mockService))

	t.Run("Successful course list", func(t *testing.T) {
		courses := []model.Course{
			{ID: 1, Title: "Math 101"},
			{ID: 2, Title: "Physics 101"},
		}
		mockService.On("List", 10, 0).Return(courses, nil).Once()

		req, _ := http.NewRequest("GET", "/api/courses?limit=10&offset=0", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		var response []model.Course
		json.Unmarshal(w.Body.Bytes(), &response)
		assert.Len(t, response, 2)
		assert.Equal(t, "Math 101", response[0].Title)
	})

	t.Run("Invalid pagination params", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/api/courses?limit=0", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
		var response map[string]string
		json.Unmarshal(w.Body.Bytes(), &response)
		assert.Equal(t, "Неверные параметры пагинации", response["error"])
	})
}

func TestGetCourse(t *testing.T) {
	logger.Init()
	gin.SetMode(gin.TestMode)
	router := gin.New()

	mockService := new(MockCourseService)
	router.GET("/api/courses/:id", GetCourse(mockService))

	t.Run("Successful course fetch", func(t *testing.T) {
		course := &model.Course{ID: 1, Title: "Math 101"}
		mockService.On("Get", uint(1)).Return(course, nil).Once()

		req, _ := http.NewRequest("GET", "/api/courses/1", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		var response model.Course
		json.Unmarshal(w.Body.Bytes(), &response)
		assert.Equal(t, "Math 101", response.Title)
	})

	t.Run("Course not found", func(t *testing.T) {
		mockService.On("Get", uint(1)).Return((*model.Course)(nil), gorm.ErrRecordNotFound).Once()

		req, _ := http.NewRequest("GET", "/api/courses/1", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusNotFound, w.Code)
		var response map[string]string
		json.Unmarshal(w.Body.Bytes(), &response)
		assert.Equal(t, "Курс не найден", response["error"])
	})

	t.Run("Invalid ID", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/api/courses/invalid", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
		var response map[string]string
		json.Unmarshal(w.Body.Bytes(), &response)
		assert.Equal(t, "Неверный ID", response["error"])
	})
}
