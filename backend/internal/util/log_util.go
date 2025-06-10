package util

import (
	"fmt"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/repository"
)

func LogUserAction(logRepo repository.ActionLogRepository, userID uint, action, details string) {
	go func() {
		err := logRepo.Create(&model.UserActionLog{
			UserID:  userID,
			Action:  action,
			Details: details,
		})
		if err != nil {
			fmt.Printf("Ошибка при логировании действия [%s]: %v\n", action, err)
		}
	}()
}
