package handler

import (
	"net/http"

	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/service"
	"github.com/gin-gonic/gin"
)

// GetProfile возвращает профиль аутентифицированного пользователя
func GetProfile(userService service.UserService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userID")
		if !exists {
			logger.Log.Error("User not authenticated")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Пользователь не аутентифицирован"})
			return
		}

		user, err := userService.FindByID(userID.(uint))
		if err != nil {
			logger.Log.Errorf("Failed to get user profile for user %d: %v", userID, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		logger.Log.Infof("Profile fetched for user %d", userID)
		c.JSON(http.StatusOK, user)
	}
}

// GetUserSubmissions возвращает список решений пользователя
func GetUserSubmissions(submissionService service.SubmissionService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userID")
		if !exists {
			logger.Log.Error("User not authenticated")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Пользователь не аутентифицирован"})
			return
		}

		logger.Log.Infof("Fetching submissions for user %d", userID)
		submissions, err := submissionService.FindByUserID(userID.(uint))
		if err != nil {
			logger.Log.Errorf("Failed to fetch submissions for user %d: %v", userID, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		logger.Log.Infof("Found %d submissions for user %d", len(submissions), userID)
		c.JSON(http.StatusOK, gin.H{
			"submissions": submissions,
		})
	}
}
