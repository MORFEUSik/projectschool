package main

import (
	"fmt"
	"log"
	"os"
	"path/filepath"

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
	"github.com/robfig/cron/v3"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

func main() {
	// Загружаем .env
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

	// Миграция моделей
	db.DB.AutoMigrate(
		&model.User{},
		&model.Course{},
		&model.Assignment{},
		&model.Submission{},
		&model.GlobalAchievement{},
		&model.UserAchievement{},
		&model.Notification{},
		&model.Enrollment{},
	)

	// Создание папки Uploads с абсолютным путём
	wd, err := os.Getwd()
	if err != nil {
		logger.Log.Fatalf("Failed to get working directory: %v", err)
	}
	uploadDir := filepath.Join(wd, "uploads")
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		logger.Log.Fatalf("Failed to create uploads directory: %v", err)
	}

	r := gin.Default()

	// Настройка статического маршрута для /uploads
	r.Static("/uploads", uploadDir)

	// Настройка CORS
	corsConfig := cors.Config{
		AllowOrigins:     []string{"http://localhost:8080", "http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Authorization", "Content-Type"},
		AllowCredentials: true,
	}
	r.Use(cors.New(corsConfig))

	userRepo := repository.NewUserRepository()
	courseRepo := repository.NewCourseRepository()
	assignmentRepo := repository.NewAssignmentRepository()
	submissionRepo := repository.NewSubmissionRepository()
	notificationRepo := repository.NewNotificationRepository(db.DB)

	authService := service.NewAuthService(userRepo)
	courseService := service.NewCourseService(courseRepo, notificationRepo, userRepo, db.DB)
	assignmentService := service.NewAssignmentService(assignmentRepo, notificationRepo, db.DB)
	submissionService := service.NewSubmissionService(submissionRepo, userRepo, assignmentRepo, notificationRepo)
	userService := service.NewUserService(userRepo)
	notificationService := service.NewNotificationService(notificationRepo, db.DB)

	// Настройка cron для проверки дедлайнов
	c := cron.New()
	_, err = c.AddFunc("@every 1h", func() {
		logger.Log.Info("Running scheduled deadline check...")
		if err := courseService.CheckDeadlines(); err != nil {
			logger.Log.Errorf("Failed to check deadlines: %v", err)
		}
	})
	if err != nil {
		logger.Log.Fatalf("Failed to add cron job: %v", err)
	}
	c.Start()

	// Группа API
	api := r.Group("/api")
	{
		// Публичные маршруты
		api.POST("/register", middleware.RateLimit(), handler.Register(authService))
		api.POST("/login", middleware.RateLimit(), handler.Login(authService))
		api.GET("/leaderboard", handler.GetLeaderboard(userService))

		// Защищённые маршруты
		protected := api.Group("", handler.AuthMiddleware())
		{
			protected.GET("/users", handler.ListUsers(userService))
			protected.POST("/assignments/upload", handler.UploadFile())
			protected.GET("/users/me", handler.GetProfile(userService))
			protected.PUT("/users/me", handler.UpdateProfile(userService))
			protected.GET("/notifications", handler.GetNotifications(notificationService))
			protected.PUT("/notifications/:id/read", handler.MarkNotificationAsRead(notificationService))
			protected.GET("/users/me/submissions", handler.GetUserSubmissions(submissionService))
			protected.PUT("/users/:id/role", handler.RoleMiddleware(model.Admin), handler.UpdateRole(userService))
			protected.POST("/check-deadlines", handler.CheckDeadlines(courseService))

			courses := protected.Group("/courses")
			{
				courses.GET("", handler.ListCourses(courseService))
				courses.POST("", handler.RoleMiddleware(model.Teacher, model.Admin), handler.CreateCourse(courseService))

				courseGroup := courses.Group("/:id")
				{
					courseGroup.GET("", handler.GetCourse(courseService))
					courseGroup.GET("/assignments", handler.ListAssignments(assignmentService))
					courseGroup.GET("/assignments/:assignmentId", handler.GetAssignment(assignmentService))
					courseGroup.POST("/enroll", handler.RoleMiddleware(model.Student), handler.Enroll(courseService))
					courseGroup.DELETE("/enroll", handler.RoleMiddleware(model.Student), handler.Unenroll(courseService))
					courseGroup.DELETE("", handler.RoleMiddleware(model.Teacher, model.Admin), handler.DeleteCourse(courseService))
					courseGroup.GET("/stats", handler.RoleMiddleware(model.Teacher, model.Admin), handler.GetCourseStats(courseService))
					courseGroup.GET("/progress", handler.RoleMiddleware(model.Student), handler.GetCourseProgress(courseService))
				}
			}

			assignments := protected.Group("/assignments")
			{
				assignments.POST("", handler.RoleMiddleware(model.Teacher, model.Admin), handler.CreateAssignment(assignmentService))
				assignments.POST("/:id/submit", handler.RoleMiddleware(model.Student), handler.SubmitAssignment(submissionService))
				assignments.DELETE("/:id", handler.RoleMiddleware(model.Teacher, model.Admin), handler.DeleteAssignment(assignmentService))
			}

			submissions := protected.Group("/submissions")
			{
				submissions.GET("", handler.RoleMiddleware(model.Teacher, model.Admin), handler.ListSubmissions(submissionService))
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
