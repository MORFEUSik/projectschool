package error

import (
	"github.com/gin-gonic/gin"
)

// APIError представляет ошибку API с кодом статуса и сообщением
type APIError struct {
	Status  int
	Message string
}

func (e APIError) Error() string {
	return e.Message
}

// HandleError отправляет стандартизированный JSON-ответ с ошибкой
func HandleError(c *gin.Context, err error) {
	if apiErr, ok := err.(APIError); ok {
		c.JSON(apiErr.Status, gin.H{"error": apiErr.Message})
	} else {
		c.JSON(500, gin.H{"error": "Внутренняя ошибка сервера"})
	}
}
