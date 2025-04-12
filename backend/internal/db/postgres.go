// backend/internal/db/postgres.go
package db

import (
	"fmt"
	"log"

	"github.com/MORFEUSik/projectschool/backend/config"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Init(cfg *config.Config) {
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
		cfg.DBHost, cfg.DBUser, cfg.DBPassword, cfg.DBName, cfg.DBPort)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Не удалось подключиться к БД: %v", err)
	}

	err = db.AutoMigrate(
		&model.User{},
		&model.Course{},
		&model.Enrollment{},
		&model.Assignment{},
		&model.Submission{},
		&model.Test{},
		&model.Achievement{}, // Если добавил
	)
	if err != nil {
		log.Fatalf("Ошибка миграции: %v", err)
	}

	DB = db
}
