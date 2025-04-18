package handler

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/MORFEUSik/projectschool/backend/internal/db"
	"github.com/MORFEUSik/projectschool/backend/internal/jwt"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"gorm.io/gorm"
)

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

func (m *MockCourseService) PreloadTeacher(course *model.Course) error {
	args := m.Called(course)
	return args.Error(0)
}

func TestCreateCourse(t *testing.T) {
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

	router := gin.New()
	mockService := new(MockCourseService)
	router.POST("/api/courses", AuthMiddleware(), RoleMiddleware(model.Teacher, model.Admin), CreateCourse(mockService))

	t.Run("Successful course creation", func(t *testing.T) {
		input := struct {
			Title       string `json:"title"`
			Description string `json:"description"`
		}{
			Title:       "Math 101",
			Description: "Introduction to Mathematics",
		}
		mockService.On("Create", mock.MatchedBy(func(c *model.Course) bool {
			return c.Title == input.Title && c.Description == input.Description && c.TeacherID == 1
		})).Return(nil).Once()
		mockService.On("PreloadTeacher", mock.Anything).Run(func(args mock.Arguments) {
			course := args.Get(0).(*model.Course)
			course.ID = 1
			course.Teacher = model.User{
				ID:       1,
				Username: "testteacher",
				Email:    "teacher@example.com",
				Role:     model.Teacher,
			}
		}).Return(nil).Once()

		token, _ := jwt.GenerateToken(1)
		body, _ := json.Marshal(input)
		req, _ := http.NewRequest("POST", "/api/courses", bytes.NewBuffer(body))
		req.Header.Set("Authorization", "Bearer "+token)
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, "Курс создан", response["message"])

		course, ok := response["course"].(map[string]interface{})
		assert.True(t, ok)
		teacher, ok := course["teacher"].(map[string]interface{})
		assert.True(t, ok)
		assert.Equal(t, float64(1), teacher["id"]) // Проверяем, что teacher.id = 1
		assert.Equal(t, "testteacher", teacher["username"])
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
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, "Неверный формат данных", response["error"])
	})

	t.Run("Validation failed - short title", func(t *testing.T) {
		input := struct {
			Title       string `json:"title"`
			Description string `json:"description"`
		}{
			Title: "M",
		}
		token, _ := jwt.GenerateToken(1)
		body, _ := json.Marshal(input)
		req, _ := http.NewRequest("POST", "/api/courses", bytes.NewBuffer(body))
		req.Header.Set("Authorization", "Bearer "+token)
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
		var response map[string]string
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Contains(t, response["error"], "Поле Title: min=3")
	})

	t.Run("Validation failed - missing title", func(t *testing.T) {
		input := struct {
			Title       string `json:"title"`
			Description string `json:"description"`
		}{
			Description: "Introduction to Mathematics",
		}
		token, _ := jwt.GenerateToken(1)
		body, _ := json.Marshal(input)
		req, _ := http.NewRequest("POST", "/api/courses", bytes.NewBuffer(body))
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
}

func TestListCourses(t *testing.T) {
	SetupTestEnv(t)
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
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Len(t, response, 2)
		assert.Equal(t, "Math 101", response[0].Title)
	})

	t.Run("Invalid pagination params", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/api/courses?limit=0", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
		var response map[string]string
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, "Неверные параметры пагинации", response["error"])
	})
}

func TestGetCourse(t *testing.T) {
	SetupTestEnv(t)
	gin.SetMode(gin.TestMode)
	router := gin.New()

	mockService := new(MockCourseService)
	router.GET("/api/courses/:id", GetCourse(mockService))

	t.Run("Successful course fetch", func(t *testing.T) {
		course := &model.Course{ID: 1, Title: "Math 101", TeacherID: 1}
		mockService.On("Get", uint(1)).Return(course, nil).Once()

		req, _ := http.NewRequest("GET", "/api/courses/1", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		var response model.Course
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, "Math 101", response.Title)
		assert.Equal(t, uint(1), response.TeacherID)
	})

	t.Run("Course not found", func(t *testing.T) {
		mockService.On("Get", uint(1)).Return((*model.Course)(nil), gorm.ErrRecordNotFound).Once()

		req, _ := http.NewRequest("GET", "/api/courses/1", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusNotFound, w.Code)
		var response map[string]string
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, "Курс не найден", response["error"])
	})

	t.Run("Invalid ID", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/api/courses/invalid", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
		var response map[string]string
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, "Неверный ID", response["error"])
	})
}
