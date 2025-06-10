// internal/util/log_util.go
package util

import (
	"github.com/MORFEUSik/projectschool/backend/internal/service"
)

func LogUserAction(logService service.ActionLogService, userID uint, action, details string) {
	go func() {
		_ = logService.Create(userID, action, details) // можно логировать ошибку, если нужно
	}()
}
