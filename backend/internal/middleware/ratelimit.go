package middleware

import (
	"net/http"
	//"time"

	"github.com/MORFEUSik/projectschool/backend/internal/error"
	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/gin-gonic/gin"
	"github.com/ulule/limiter/v3"
	"github.com/ulule/limiter/v3/drivers/store/memory"
)

// RateLimit ограничивает количество запросов с одного IP
func RateLimit() gin.HandlerFunc {
	store := memory.NewStore()
	rate, _ := limiter.NewRateFromFormatted("5-M") // 5 запросов в минуту
	limiter := limiter.New(store, rate)

	return func(c *gin.Context) {
		context, err := limiter.Get(c, c.ClientIP())
		if err != nil {
			logger.Log.Errorf("Rate limit error: %v", err)
			error.HandleError(c, error.APIError{Status: http.StatusInternalServerError, Message: "Ошибка сервера"})
			c.Abort()
			return
		}

		if context.Reached {
			logger.Log.Warnf("Rate limit exceeded for IP %s", c.ClientIP())
			error.HandleError(c, error.APIError{Status: http.StatusTooManyRequests, Message: "Слишком много запросов"})
			c.Abort()
			return
		}

		c.Next()
	}
}
