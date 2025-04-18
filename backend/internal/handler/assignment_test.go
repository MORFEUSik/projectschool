package handler

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/MORFEUSik/projectschool/backend/internal/db"
	"github.com/MORFEUSik/projectschool/backend/internal/jwt"
	//"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type MockAssignmentService struct {
	mock.Mock
}

func (m *MockAssignmentService) Create(assignment *model.Assignment) error {
	args := m.Called(assignment)
	return args.Error(0)
}

func (m *MockAssignmentService) ListByCourse(courseID uint) ([]model.Assignment, error) {
	args := m.Called(courseID)
	return args.Get(0).([]model.Assignment), args.Error(1)
}

func TestCreateAssignment(t *testing.T) {
	SetupTestEnv(t)
	gin.SetMode(gin.TestMode)

	// Настройка тестовой базы данных
	testDB := SetupTestDB(t)
	originalDB := db.DB
	db.DB = testDB
	defer func() { db.DB = originalDB }()

	// Создаём тестового пользователя
	testUser := model.User{
		ID:       1,
		Username: "testteacher",
		Email:    "teacher@example.com",
		Password: "hashedpassword",
		Role:     model.Teacher,
	}
	if err := testDB.Create(&testUser).Error; err != nil {
		t.Fatalf("Failed to create test user: %v", err)
	}

	// Создаём тестовый курс
	testCourse := model.Course{
		ID:        1,
		Title:     "Test Course",
		TeacherID: 1,
	}
	if err := testDB.Create(&testCourse).Error; err != nil {
		t.Fatalf("Failed to create test course: %v", err)
	}

	router := gin.New()
	mockService := new(MockAssignmentService)

	// Настройка маршрута с middleware
	router.POST("/api/assignments", AuthMiddleware(), RoleMiddleware(model.Teacher, model.Admin), CreateAssignment(mockService))

	t.Run("Successful assignment creation", func(t *testing.T) {
		assignment := &model.Assignment{
			CourseID:    1,
			Title:       "Test Assignment",
			Description: "Test Description",
			MaxScore:    100,
			DueDate:     time.Now().Add(24 * time.Hour),
		}
		mockService.On("Create", mock.Anything).Return(nil).Once()

		token, err := jwt.GenerateToken(1)
		if err != nil {
			t.Fatalf("Failed to generate token: %v", err)
		}

		body, _ := json.Marshal(assignment)
		req, _ := http.NewRequest("POST", "/api/assignments", bytes.NewBuffer(body))
		req.Header.Set("Authorization", "Bearer "+token)
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		var response map[string]interface{}
		err = json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, "Задание создано", response["message"])
	})

	t.Run("Invalid JSON", func(t *testing.T) {
		token, _ := jwt.GenerateToken(1)
		req, _ := http.NewRequest("POST", "/api/assignments", bytes.NewBuffer([]byte("{invalid}")))
		req.Header.Set("Authorization", "Bearer "+token)
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
		var response map[string]string
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, "Неверный формат данных", response["error"])
	})

	t.Run("Validation failed - empty title", func(t *testing.T) {
		assignment := &model.Assignment{
			CourseID: 1,
			Title:    "",
			MaxScore: 100,
			DueDate:  time.Now().Add(24 * time.Hour),
		}
		token, _ := jwt.GenerateToken(1)
		body, _ := json.Marshal(assignment)
		req, _ := http.NewRequest("POST", "/api/assignments", bytes.NewBuffer(body))
		req.Header.Set("Authorization", "Bearer "+token)
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
		var response map[string]string
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Contains(t, response["error"], "Поле Title: required")
	})

	t.Run("Validation failed - missing due date", func(t *testing.T) {
		assignment := &model.Assignment{
			CourseID: 1,
			Title:    "Test Assignment",
			MaxScore: 100,
		}
		token, _ := jwt.GenerateToken(1)
		body, _ := json.Marshal(assignment)
		req, _ := http.NewRequest("POST", "/api/assignments", bytes.NewBuffer(body))
		req.Header.Set("Authorization", "Bearer "+token)
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
		var response map[string]string
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Contains(t, response["error"], "Поле DueDate: required")
	})

	t.Run("Course not found", func(t *testing.T) {
		assignment := &model.Assignment{
			CourseID:    999, // Несуществующий курс
			Title:       "Test Assignment",
			Description: "Test Description",
			MaxScore:    100,
			DueDate:     time.Now().Add(24 * time.Hour),
		}
		token, _ := jwt.GenerateToken(1)
		body, _ := json.Marshal(assignment)
		req, _ := http.NewRequest("POST", "/api/assignments", bytes.NewBuffer(body))
		req.Header.Set("Authorization", "Bearer "+token)
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
		var response map[string]string
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, "Курс не найден", response["error"])
	})
}

func TestListAssignments(t *testing.T) {
	SetupTestEnv(t)
	gin.SetMode(gin.TestMode)

	router := gin.New()
	mockService := new(MockAssignmentService)

	// Настройка маршрута без middleware для простоты
	router.GET("/api/courses/:id/assignments", ListAssignments(mockService))

	t.Run("Successful assignment list", func(t *testing.T) {
		assignments := []model.Assignment{
			{ID: 1, Title: "Assignment 1", CourseID: 1},
			{ID: 2, Title: "Assignment 2", CourseID: 1},
		}
		mockService.On("ListByCourse", uint(1)).Return(assignments, nil).Once()

		req, _ := http.NewRequest("GET", "/api/courses/1/assignments", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		var response []model.Assignment
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Len(t, response, 2)
		assert.Equal(t, "Assignment 1", response[0].Title)
	})

	t.Run("Invalid course ID", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/api/courses/invalid/assignments", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
		var response map[string]string
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, "Неверный ID курса", response["error"])
	})
}
