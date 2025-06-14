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
		&model.Subtask{},
		&model.SubtaskSubmission{},
		&model.Submission{},
		&model.GlobalAchievement{},
		&model.UserAchievement{},
		&model.Notification{},
		&model.Enrollment{},
		&model.UserActionLog{},
	)

	// Создание папки uploads с абсолютным путём
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

	// Инициализация репозиториев
	userRepo := repository.NewUserRepository()
	courseRepo := repository.NewCourseRepository()
	assignmentRepo := repository.NewAssignmentRepository()
	submissionRepo := repository.NewSubmissionRepository()
	notificationRepo := repository.NewNotificationRepository(db.DB)
	logRepo := repository.NewActionLogRepository(db.DB)

	// Инициализация сервисов
	authService := service.NewAuthService(userRepo)
	courseService := service.NewCourseService(courseRepo, notificationRepo, userRepo, logRepo, db.DB)
	assignmentService := service.NewAssignmentService(assignmentRepo, notificationRepo, db.DB, logRepo)
	submissionService := service.NewSubmissionService(submissionRepo, userRepo, assignmentRepo, notificationRepo, logRepo)
	userService := service.NewUserService(userRepo, logRepo)
	notificationService := service.NewNotificationService(notificationRepo, db.DB)
	subtaskService := service.NewSubtaskService(db.DB)
	actionLogService := service.NewActionLogService(logRepo, db.DB)
	achievementService := service.NewAchievementService(db.DB, userRepo, logRepo)

	// Настройка CRON для проверки дедлайнов
	c := cron.New()
	c.AddFunc("@every 24h", func() {
		if err := courseService.CheckDeadlines(); err != nil {
			logger.Log.Errorf("Ошибка при проверке дедлайнов: %v", err)
		}
	})
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
			protected.GET("/enrollments", handler.GetEnrolledCourses(courseService))
			protected.GET("/users", handler.ListUsers(userService))
			protected.POST("/assignments/upload", handler.UploadFile())
			protected.GET("/users/me", handler.GetProfile(userService))
			protected.PUT("/users/me", handler.UpdateProfile(userService))
			protected.PUT("/users/me/avatar", handler.UpdateUserAvatar)
			protected.GET("/notifications", handler.GetNotifications(notificationService))
			protected.PUT("/notifications/:id/read", handler.MarkNotificationAsRead(notificationService))
			protected.GET("/users/me/submissions", handler.GetUserSubmissions(submissionService))
			protected.PUT("/users/:id/role", handler.RoleMiddleware(model.Admin), handler.UpdateRole(userService))
			protected.POST("/check-deadlines", handler.CheckDeadlines(courseService))
			protected.GET("/users/me/achievements", handler.GetMyAchievements(userService))

			// Админ-маршруты
			admin := protected.Group("/admin", handler.RoleMiddleware(model.Admin))
			{
				admin.GET("/logs", handler.GetActionLogs(actionLogService))
				admin.POST("/create-user", handler.AdminRegister(authService, userService))
				admin.DELETE("/users/:id", handler.DeleteUser(userService)) // Новый маршрут
			}

			// Достижения
			achievements := protected.Group("/achievements")
			{
				achievements.GET("", handler.ListAchievements(achievementService))
				achievements.POST("", handler.RoleMiddleware(model.Admin), handler.CreateAchievement(achievementService))
				achievements.PUT("/:id", handler.RoleMiddleware(model.Admin), handler.UpdateAchievement(achievementService))
				achievements.DELETE("/:id", handler.RoleMiddleware(model.Admin), handler.DeleteAchievement(achievementService))
			}

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
					courseGroup.GET("/is-enrolled", handler.RoleMiddleware(model.Student), handler.IsEnrolled(courseService))
					courseGroup.POST("/material/upload", handler.UploadCourseMaterial())
				}
			}

			assignments := protected.Group("/assignments")
			{
				assignments.POST("", handler.RoleMiddleware(model.Teacher, model.Admin), handler.CreateAssignment(assignmentService))
				assignments.POST("/:id/submit", handler.RoleMiddleware(model.Student), handler.SubmitAssignment(submissionService))
				assignments.DELETE("/:id", handler.RoleMiddleware(model.Teacher, model.Admin), handler.DeleteAssignment(assignmentService))
				assignments.POST("/:id/submit-quiz", handler.RoleMiddleware(model.Student), handler.SubmitQuizAssignment(submissionService))
				assignments.GET("/:id/subtasks", handler.GetSubtasks(subtaskService))
				assignments.POST("/:id/check-subtask", handler.RoleMiddleware(model.Student), handler.CheckSubtaskAnswer(subtaskService, submissionService))
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
