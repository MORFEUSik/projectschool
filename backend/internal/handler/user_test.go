package handler

import (
	//"bytes"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/MORFEUSik/projectschool/backend/internal/model"
	//"github.com/MORFEUSik/projectschool/backend/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

type MockUserService struct {
	profile *model.User
	err     error
}

func (m *MockUserService) Register(user *model.User) error {
	return nil
}

func (m *MockUserService) Login(email, password string) (*model.User, error) {
	return nil, nil
}

func (m *MockUserService) GetProfile(userID uint) (*model.User, error) {
	return m.profile, m.err
}

func (m *MockUserService) GetLeaderboard() ([]model.User, error) {
	return []model.User{}, nil
}

func TestGetProfile(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("successful profile retrieval", func(t *testing.T) {
		mockUserService := &MockUserService{
			profile: &model.User{
				ID:       1,
				Username: "testuser",
				Email:    "test@example.com",
				Role:     model.Student,
			},
			err: nil,
		}

		router := gin.Default()
		router.GET("/users/me", func(c *gin.Context) {
			c.Set("userID", uint(1))
			GetProfile(mockUserService)(c)
		})

		req, _ := http.NewRequest("GET", "/users/me", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var response model.User
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, mockUserService.profile.ID, response.ID)
		assert.Equal(t, mockUserService.profile.Username, response.Username)
	})

	t.Run("user not found", func(t *testing.T) {
		mockUserService := &MockUserService{
			profile: nil,
			err:     errors.New("пользователь не найден"),
		}

		router := gin.Default()
		router.GET("/users/me", func(c *gin.Context) {
			c.Set("userID", uint(1))
			GetProfile(mockUserService)(c)
		})

		req, _ := http.NewRequest("GET", "/users/me", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusNotFound, w.Code)
	})
}
