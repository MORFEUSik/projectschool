// cmd/main.go

package main

import (
	"fmt"

	"github.com/MORFEUSik/projectschool/backend/config" // Импорт config
	"github.com/MORFEUSik/projectschool/backend/internal/db"
	"github.com/MORFEUSik/projectschool/backend/internal/handler" // Импорт обработчиков
	"github.com/gin-gonic/gin"
)

func main() {
	// Загружаем конфигурацию
	cfg := config.LoadConfig()

	// Инициализируем базу данных
	db.Init(cfg)

	// Создаем новый роутер Gin
	r := gin.Default()

	// Роут для логина
	r.POST("/login", handler.Login)

	// Роут для регистрации нового пользователя
	r.POST("/register", handler.Register) // Новый роут для регистрации

	// Роут для главной страницы
	r.GET("/", func(c *gin.Context) {
		c.String(200, "🎓 Backend для ProjectSchool работает!")
	})

	// Запускаем сервер на порту 8080
	fmt.Println("🚀 Сервер запущен на http://localhost:8080")
	if err := r.Run(":8080"); err != nil {
		panic(err)
	}
}
