package main

import (
	"fmt"

	"github.com/MORFEUSik/projectschool/backend/config"
	"github.com/MORFEUSik/projectschool/backend/internal/db"
	"github.com/MORFEUSik/projectschool/backend/internal/handler"
	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/repository"
	"github.com/MORFEUSik/projectschool/backend/internal/service"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	logger.Init()
	logger.Log.Info("Starting server...")

	cfg := config.LoadConfig()
	db.Init(cfg)
	r := gin.Default()

	r.Use(cors.Default())

	userRepo := repository.NewUserRepository()
	courseRepo := repository.NewCourseRepository()
	assignmentRepo := repository.NewAssignmentRepository()
	submissionRepo := repository.NewSubmissionRepository()

	authService := service.NewAuthService(userRepo)
	courseService := service.NewCourseService(courseRepo)
	assignmentService := service.NewAssignmentService(assignmentRepo)
	submissionService := service.NewSubmissionService(submissionRepo, userRepo, assignmentRepo)
	userService := service.NewUserService(userRepo)

	r.POST("/login", handler.Login(authService))
	r.POST("/register", handler.Register(authService))
	r.GET("/", func(c *gin.Context) {
		c.String(200, "🎓 Backend для ProjectSchool работает!")
	})

	api := r.Group("/api", handler.AuthMiddleware())
	{
		api.GET("/users/me", handler.GetProfile(userService))

		courses := api.Group("/courses")
		{
			courses.GET("", handler.ListCourses(courseService))
			courses.POST("", handler.RoleMiddleware(model.Teacher, model.Admin), handler.CreateCourse(courseService))
			courses.GET("/:id", handler.ListCourses(courseService))
			courses.GET("/:id/assignments", handler.ListAssignments(assignmentService))
		}

		assignments := api.Group("/assignments")
		{
			assignments.POST("", handler.RoleMiddleware(model.Teacher, model.Admin), handler.CreateAssignment(assignmentService))
			assignments.POST("/:id/submit", handler.RoleMiddleware(model.Student), handler.SubmitAssignment(submissionService))
		}
	}

	fmt.Println("🚀 Сервер запущен на http://localhost:8080")
	if err := r.Run(":8080"); err != nil {
		logger.Log.Fatalf("Failed to start server: %v", err)
	}
}
