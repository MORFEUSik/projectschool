// backend/internal/handler/user.go
package handler

import (
	"net/http"

	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/service"
	"github.com/gin-gonic/gin"
)

func GetProfile(userService service.UserService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userID")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Пользователь не аутентифицирован"})
			return
		}

		var user model.User
		if err := userService.FindByID(userID.(uint), &user); err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Пользователь не найден"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"id":       user.ID,
			"username": user.Username,
			"email":    user.Email,
			"role":     user.Role,
			"points":   user.Points,
		})
	}
}
