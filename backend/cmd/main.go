package main

import (
	"fmt"

	"github.com/MORFEUSik/projectschool/backend/config"
	"github.com/MORFEUSik/projectschool/backend/docs"
	"github.com/MORFEUSik/projectschool/backend/internal/db"
	"github.com/MORFEUSik/projectschool/backend/internal/handler"
	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/middleware"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/repository"
	"github.com/MORFEUSik/projectschool/backend/internal/service"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

func main() {
	logger.Init()
	logger.Log.Info("Starting server...")

	cfg := config.LoadConfig()
	db.Init(cfg)
	r := gin.Default()

	// Настройка CORS для локальной разработки
	corsConfig := cors.Config{
		AllowOrigins:     []string{"http://localhost:8080"},
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

	r.POST("/login", middleware.RateLimit(), handler.Login(authService))
	r.POST("/register", middleware.RateLimit(), handler.Register(authService))
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

	api := r.Group("/api", handler.AuthMiddleware())
	{
		api.GET("/users/me", handler.GetProfile(userService))
		api.GET("/users/me/submissions", handler.GetUserSubmissions(submissionService))
		api.GET("/leaderboard", handler.GetLeaderboard(userService))

		courses := api.Group("/courses")
		{
			courses.GET("", handler.ListCourses(courseService))
			courses.POST("", handler.RoleMiddleware(model.Teacher, model.Admin), handler.CreateCourse(courseService))
			courses.GET("/:id", handler.GetCourse(courseService))
			courses.GET("/:id/assignments", handler.ListAssignments(assignmentService))
		}

		assignments := api.Group("/assignments")
		{
			assignments.POST("", handler.RoleMiddleware(model.Teacher, model.Admin), handler.CreateAssignment(assignmentService))
			assignments.POST("/:id/submit", handler.RoleMiddleware(model.Student), handler.SubmitAssignment(submissionService))
		}

		submissions := api.Group("/submissions")
		{
			submissions.PUT("/:id/grade", handler.RoleMiddleware(model.Teacher, model.Admin), handler.SetGrade(submissionService))
		}
	}

	fmt.Println("🚀 Сервер запущен на http://localhost:8080")
	fmt.Println("Swagger доступен на http://localhost:8080/swagger/index.html")
	if err := r.Run(":8080"); err != nil {
		logger.Log.Fatalf("Failed to start server: %v", err)
	}
}
