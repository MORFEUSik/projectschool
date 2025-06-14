package handler

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/MORFEUSik/projectschool/backend/internal/error" // Правильный импорт
	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/service"
	"github.com/gin-gonic/gin"
)

// GetMyAchievements возвращает достижения пользователя
// @Summary Получить достижения пользователя
// @Description Возвращает список достижений текущего пользователя. Требуется JWT-токен. Доступно для ролей: student, teacher, admin.
// @Tags achievements
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {array} model.UserAchievement
// @Failure 401 {object} error.APIError
// @Failure 500 {object} error.APIError
// @Router /users/me/achievements [get]
func GetMyAchievements(userService service.UserService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userID")
		if !exists {
			logger.Log.Error("UserID not found in context")
			error.HandleError(c, error.APIError{Status: http.StatusUnauthorized, Message: "Пользователь не аутентифицирован"})
			return
		}

		achievements, err := userService.GetAchievements(userID.(uint))
		if err != nil {
			logger.Log.Errorf("Ошибка при получении достижений: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Не удалось получить достижения"})
			return
		}

		c.JSON(http.StatusOK, achievements)
	}
}

// ListAchievements возвращает список всех глобальных достижений
// @Summary Получить все достижения
// @Description Возвращает список всех доступных достижений. Требуется JWT-токен. Доступно для ролей: student, teacher, admin.
// @Tags achievements
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {array} model.GlobalAchievement
// @Failure 401 {object} error.APIError
// @Failure 500 {object} error.APIError
// @Router /achievements [get]
func ListAchievements(achievementService service.AchievementService) gin.HandlerFunc {
	return func(c *gin.Context) {
		achievements, err := achievementService.ListAll()
		if err != nil {
			logger.Log.Errorf("Failed to list achievements: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Ошибка получения достижений"})
			return
		}

		// Формируем ответ с вычисленным полем condition
		type ResponseAchievement struct {
			ID            uint   `json:"ID"`
			Title         string `json:"Title"`
			Description   string `json:"Description"`
			ConditionType string `json:"ConditionType"`
			Threshold     uint   `json:"Threshold"`
			Condition     string `json:"Condition"` // Добавляем для фронтенда
		}

		response := make([]ResponseAchievement, len(achievements))
		for i, ach := range achievements {
			var condition string
			switch ach.ConditionType {
			case "points":
				condition = fmt.Sprintf("Набрать %d баллов", ach.Threshold)
			case "courses":
				condition = fmt.Sprintf("Завершить %d курсов", ach.Threshold)
			case "submissions":
				condition = fmt.Sprintf("Сдать %d заданий с оценкой 8+", ach.Threshold)
			default:
				condition = "Условие не указано"
			}
			response[i] = ResponseAchievement{
				ID:            ach.ID,
				Title:         ach.Title,
				Description:   ach.Description,
				ConditionType: ach.ConditionType,
				Threshold:     ach.Threshold,
				Condition:     condition,
			}
		}

		c.JSON(http.StatusOK, response)
	}
}

// CreateAchievement создаёт новое достижение
// @Summary Создать достижение
// @Description Создаёт новое глобальное достижение. Требуется JWT-токен. Доступно только для роли: admin.
// @Tags achievements
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param body body object true "Данные достижения" example={"title":"Новое достижение","description":"Описание достижения","condition_type":"points","threshold":100}
// @Success 200 {object} map[string]string "message"
// @Failure 400 {object} error.APIError
// @Failure 401 {object} error.APIError
// @Failure 403 {object} error.APIError
// @Failure 500 {object} error.APIError
// @Router /achievements [post]
func CreateAchievement(achievementService service.AchievementService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userID")
		if !exists {
			logger.Log.Error("UserID not found in context")
			error.HandleError(c, error.APIError{Status: http.StatusUnauthorized, Message: "Пользователь не аутентифицирован"})
			return
		}

		var input struct {
			Title         string `json:"title" binding:"required,min=3,max=100"`
			Description   string `json:"description" binding:"required,min=3,max=255"`
			ConditionType string `json:"condition_type" binding:"required,oneof=points courses submissions"`
			Threshold     uint   `json:"threshold" binding:"required,gte=1"`
		}
		if err := c.ShouldBindJSON(&input); err != nil {
			logger.Log.Errorf("Failed to bind JSON: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверный формат данных"})
			return
		}

		achievement := &model.GlobalAchievement{
			Title:         input.Title,
			Description:   input.Description,
			ConditionType: input.ConditionType,
			Threshold:     input.Threshold,
		}

		logger.Log.Infof("Admin %d attempting to create achievement %s", userID, input.Title)
		if err := achievementService.Create(achievement, userID.(uint)); err != nil {
			logger.Log.Errorf("Failed to create achievement: %v", err)
			if err.Error() == "название или условие достижения не может быть пустым" {
				error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: err.Error()})
			} else if err.Error() == "админ не найден" || err.Error() == "недостаточно прав" {
				error.HandleError(c, error.APIError{Status: http.StatusForbidden, Message: err.Error()})
			} else {
				error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Ошибка создания достижения"})
			}
			return
		}

		logger.Log.Infof("Achievement %s created by admin %d", input.Title, userID)
		c.JSON(http.StatusOK, gin.H{"message": "Достижение создано"})
	}
}

// UpdateAchievement обновляет существующее достижение
// @Summary Обновить достижение
// @Description Обновляет данные достижения по ID. Требуется JWT-токен. Доступно только для роли: admin.
// @Tags achievements
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID достижения"
// @Param body body object true "Данные достижения" example={"title":"Обновленное достижение","description":"Новое описание","condition_type":"points","threshold":500}
// @Success 200 {object} map[string]string "message"
// @Failure 400 {object} error.APIError
// @Failure 401 {object} error.APIError
// @Failure 403 {object} error.APIError
// @Failure 404 {object} error.APIError
// @Failure 500 {object} error.APIError
// @Router /achievements/{id} [put]
func UpdateAchievement(achievementService service.AchievementService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userID")
		if !exists {
			logger.Log.Error("UserID not found in context")
			error.HandleError(c, error.APIError{Status: http.StatusUnauthorized, Message: "Пользователь не аутентифицирован"})
			return
		}

		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			logger.Log.Errorf("Invalid achievement ID: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверный ID достижения"})
			return
		}

		var input struct {
			Title         string `json:"title" binding:"required,min=3,max=100"`
			Description   string `json:"description" binding:"required,min=3,max=255"`
			ConditionType string `json:"condition_type" binding:"required,oneof=points courses submissions"`
			Threshold     uint   `json:"threshold" binding:"required,gte=1"`
		}
		if err := c.ShouldBindJSON(&input); err != nil {
			logger.Log.Errorf("Failed to bind JSON: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверный формат данных"})
			return
		}

		achievement := &model.GlobalAchievement{
			Title:         input.Title,
			Description:   input.Description,
			ConditionType: input.ConditionType,
			Threshold:     input.Threshold,
		}

		logger.Log.Infof("Admin %d attempting to update achievement %d", userID, id)
		if err := achievementService.Update(uint(id), achievement, userID.(uint)); err != nil {
			logger.Log.Errorf("Failed to update achievement: %v", err)
			if err.Error() == "название или условие достижения не может быть пустым" {
				error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: err.Error()})
			} else if err.Error() == "достижение не найдено" {
				error.HandleError(c, error.APIError{Status: http.StatusNotFound, Message: err.Error()})
			} else if err.Error() == "админ не найден" || err.Error() == "недостаточно прав" {
				error.HandleError(c, error.APIError{Status: http.StatusForbidden, Message: err.Error()})
			} else {
				error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Ошибка обновления достижения"})
			}
			return
		}

		logger.Log.Infof("Achievement %d updated by admin %d", id, userID)
		c.JSON(http.StatusOK, gin.H{"message": "Достижение обновлено"})
	}
}

// DeleteAchievement удаляет достижение
// @Summary Удалить достижение
// @Description Удаляет достижение по ID. Требуется JWT-токен. Доступно только для роли: admin.
// @Tags achievements
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID достижения"
// @Success 200 {object} map[string]string "message"
// @Failure 400 {object} error.APIError
// @Failure 401 {object} error.APIError
// @Failure 403 {object} error.APIError
// @Failure 404 {object} error.APIError
// @Failure 500 {object} error.APIError
// @Router /achievements/{id} [delete]
func DeleteAchievement(achievementService service.AchievementService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userID")
		if !exists {
			logger.Log.Error("UserID not found in context")
			error.HandleError(c, error.APIError{Status: http.StatusUnauthorized, Message: "Пользователь не аутентифицирован"})
			return
		}

		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			logger.Log.Errorf("Invalid achievement ID: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusBadRequest, Message: "Неверный ID достижения"})
			return
		}

		logger.Log.Infof("Admin %d attempting to delete achievement %d", userID, id)
		if err := achievementService.Delete(uint(id), userID.(uint)); err != nil {
			logger.Log.Errorf("Failed to delete achievement: %v", err)
			if err.Error() == "достижение не найдено" {
				error.HandleError(c, error.APIError{Status: http.StatusNotFound, Message: err.Error()})
			} else if err.Error() == "админ не найден" || err.Error() == "недостаточно прав" {
				error.HandleError(c, error.APIError{Status: http.StatusForbidden, Message: err.Error()})
			} else {
				error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Ошибка удаления достижения"})
			}
			return
		}

		logger.Log.Infof("Achievement %d deleted by admin %d", id, userID)
		c.JSON(http.StatusOK, gin.H{"message": "Достижение удалено"})
	}
}
