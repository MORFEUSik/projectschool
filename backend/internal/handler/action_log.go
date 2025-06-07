package handler

import (
	"net/http"
	"strconv"

	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/service"
	"github.com/gin-gonic/gin"
)

// GetActionLogs возвращает список логов действий
func GetActionLogs(s service.ActionLogService) gin.HandlerFunc {
	return func(c *gin.Context) {
		limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
		offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

		logs, total, err := s.GetAll(limit, offset)
		if err != nil {
			logger.Log.Errorf("Failed to get action logs: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка получения логов"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"logs":  logs,
			"total": total,
		})
	}
}
