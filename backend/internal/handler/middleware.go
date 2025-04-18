package handler

import (
	"net/http"

	"github.com/MORFEUSik/projectschool/backend/internal/db"
	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/gin-gonic/gin"
)

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
