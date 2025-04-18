package main

import (
	"fmt"
	"log"
	"os"

	"github.com/MORFEUSik/projectschool/backend/config"
	"github.com/MORFEUSik/projectschool/backend/docs"
	"github.com/MORFEUSik/projectschool/backend/internal/db"
	"github.com/MORFEUSik/projectschool/backend/internal/handler"
	"github.com/MORFEUSik/projectschool/backend/internal/jwt"
	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/middleware"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/repository"
	"github.com/MORFEUSik/projectschool/backend/internal/service"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// @title ProjectSchool API
// @version 1.0
// @description API для обучающего приложения ProjectSchool
// @host localhost:8080
// @BasePath /api
// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Enter the JWT token with the "Bearer " prefix, e.g., "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

func main() {
	// Загружаем .env в самом начале для JWT_SECRET
	if err := godotenv.Load(); err != nil {
		log.Printf("Ошибка загрузки .env: %v, использую переменные окружения", err)
	}

	// Инициализация JWT
	if err := jwt.Init(os.Getenv("JWT_SECRET")); err != nil {
		log.Fatalf("Failed to initialize JWT: %v", err)
	}

	logger.Init()
	logger.Log.Info("Starting server...")

	cfg := config.LoadConfig()
	db.Init(cfg)
	r := gin.Default()

	// Настройка CORS для локальной разработки
	corsConfig := cors.Config{
		AllowOrigins:     []string{"http://localhost:8080", "http://localhost:3000"}, // Добавлен порт фронтенда
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
		AllowHeaders:     []string{"Authorization", "Content-Type"},
		AllowCredentials: true,
	}
	r.Use(cors.New(corsConfig))

	userRepo := repository.NewUserRepository()
	courseRepo := repository.NewCourseRepository()
	assignmentRepo := repository.NewAssignmentRepository()
	submissionRepo := repository.NewSubmissionRepository()
	achievementRepo := repository.NewAchievementRepository()

	authService := service.NewAuthService(userRepo)
	courseService := service.NewCourseService(courseRepo)
	assignmentService := service.NewAssignmentService(assignmentRepo)
	submissionService := service.NewSubmissionService(submissionRepo, userRepo, assignmentRepo, achievementRepo)
	userService := service.NewUserService(userRepo)

	// Группа API
	api := r.Group("/api")
	{
		// Регистрация и вход
		api.POST("/register", middleware.RateLimit(), handler.Register(authService))
		api.POST("/login", middleware.RateLimit(), handler.Login(authService))

		// Защищённые маршруты
		protected := api.Group("", handler.AuthMiddleware())
		{
			protected.GET("/users/me", handler.GetProfile(userService))
			protected.GET("/users/me/submissions", handler.GetUserSubmissions(submissionService))
			protected.GET("/leaderboard", handler.GetLeaderboard(userService))

			courses := protected.Group("/courses")
			{
				courses.GET("", handler.ListCourses(courseService))
				courses.POST("", handler.RoleMiddleware(model.Teacher, model.Admin), handler.CreateCourse(courseService))
				courses.GET("/:id", handler.GetCourse(courseService))
				courses.GET("/:id/assignments", handler.ListAssignments(assignmentService))
			}

			assignments := protected.Group("/assignments")
			{
				assignments.POST("", handler.RoleMiddleware(model.Teacher, model.Admin), handler.CreateAssignment(assignmentService))
				assignments.POST("/:id/submit", handler.RoleMiddleware(model.Student), handler.SubmitAssignment(submissionService))
			}

			submissions := protected.Group("/submissions")
			{
				submissions.PUT("/:id/grade", handler.RoleMiddleware(model.Teacher, model.Admin), handler.SetGrade(submissionService))
			}
		}
	}

	r.GET("/", func(c *gin.Context) {
		c.String(200, "🎓 Backend для ProjectSchool работает!")
	})

	// Swagger документация
	docs.SwaggerInfo.Title = "ProjectSchool API"
	docs.SwaggerInfo.Description = "API для обучающего приложения ProjectSchool"
	docs.SwaggerInfo.Version = "1.0"
	docs.SwaggerInfo.Host = "localhost:8080"
	docs.SwaggerInfo.BasePath = "/api"
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	fmt.Println("🚀 Сервер запущен на http://localhost:8080")
	fmt.Println("Swagger доступен на http://localhost:8080/swagger/index.html")
	if err := r.Run(":8080"); err != nil {
		logger.Log.Fatalf("Failed to start server: %v", err)
	}
}
