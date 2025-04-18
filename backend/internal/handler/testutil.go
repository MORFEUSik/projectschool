package handler

import (
	"testing"

	"github.com/MORFEUSik/projectschool/backend/internal/jwt"
	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// SetupTestEnv инициализирует окружение для тестов
func SetupTestEnv(t *testing.T) {
	t.Helper()

	// Инициализация логгера
	logger.Init()

	// Инициализация JWT
	if err := jwt.Init("test-secret-key"); err != nil {
		t.Fatalf("Failed to init JWT: %v", err)
	}
}

// SetupTestDB создаёт тестовую базу данных в памяти
func SetupTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("Failed to create test DB: %v", err)
	}
	// Автомиграция моделей Course и User для тестов
	err = db.AutoMigrate(&model.User{}, &model.Course{})
	if err != nil {
		t.Fatalf("Failed to migrate test DB: %v", err)
	}
	return db
}
