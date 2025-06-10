package handler

import (
	"net/http"
	"time"

	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/repository"
	"github.com/MORFEUSik/projectschool/backend/internal/service"
	"github.com/gin-gonic/gin"
)

// GetActionLogs возвращает список логов действий
func GetActionLogs(s service.ActionLogService) gin.HandlerFunc {
	return func(c *gin.Context) {
		limit := 100 // По умолчанию 100 логов
		offset := 0
		startDateStr := c.Query("start_date")
		endDateStr := c.Query("end_date")

		excludeActions := []string{"list_achievements", "list_users", "get_profile", "get_course", "list_courses"}

		var logs []repository.ActionLogWithUser
		var total int64
		var err error

		if startDateStr != "" && endDateStr != "" {
			startDate, err := time.Parse(time.RFC3339, startDateStr)
			if err != nil {
				logger.Log.Errorf("Invalid start_date format: %v", err)
				c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат start_date"})
				return
			}
			endDate, err := time.Parse(time.RFC3339, endDateStr)
			if err != nil {
				logger.Log.Errorf("Invalid end_date format: %v", err)
				c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат end_date"})
				return
			}
			logs, total, err = s.FindByDateRange(startDate, endDate, excludeActions)
		} else {
			logs, total, err = s.GetAll(limit, offset, excludeActions)
		}

		if err != nil {
			logger.Log.Errorf("Failed to get action logs: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка получения логов"})
			return
		}

		logger.Log.Infof("Fetched %d action logs, total: %d", len(logs), total)
		c.JSON(http.StatusOK, gin.H{
			"logs":  logs,
			"total": total,
		})
	}
}
