package handler

import (
	"net/http"
	"slices"

	"github.com/MORFEUSik/projectschool/backend/internal/db"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/gin-gonic/gin"
)

type AvatarRequest struct {
	AvatarURL string `json:"avatar_url"`
}

func UpdateUserAvatar(c *gin.Context) {
	// 1. Получаем пользователя
	userIface := c.MustGet("user")
	userModel, ok := userIface.(model.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Невозможно преобразовать пользователя"})
		return
	}

	// 2. Парсим тело запроса
	var req AvatarRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Некорректный JSON"})
		return
	}

	// 3. Проверка валидности аватара
	allowed := []string{
		"/avatars/1f803cd5-763c-484c-8db9-8a9e80e22f53.jpg",
		"/avatars/2467d09c-b0a6-46c9-9c01-eb2cbc29dd85.jpg",
		"/avatars/27258a85-1e4c-4ab9-b51e-ca6d8ad2e101.jpg",
		"/avatars/2aa12d4d-321f-4c58-a46b-bfa0f79022b4.jpg",
		"/avatars/2b1fa314-f37e-439e-be23-681b9cf2bd3e.jpg",
		"/avatars/4eda9fdf-8d86-473f-8364-34a7c1caefea.jpg",
		"/avatars/b9341e90-4e5c-4591-8a32-deff4d30c2af.jpg",
		"/avatars/c9d8ddeb-1b87-4451-9408-ad9672cdf889.jpg",
		"/avatars/d127a649-3bf3-45d0-b110-c1666c38b470.jpg",
	}

	if !slices.Contains(allowed, req.AvatarURL) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Недопустимый путь к аватару"})
		return
	}

	// 4. Обновляем avatar_url
	if err := db.DB.Model(&userModel).Update("avatar_url", req.AvatarURL).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось обновить аватар"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Аватар обновлён"})
}
