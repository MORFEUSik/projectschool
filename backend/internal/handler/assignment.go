package handler

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/MORFEUSik/projectschool/backend/internal/db"
	errorpkg "github.com/MORFEUSik/projectschool/backend/internal/error"
	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/repository" // ← вот это добавь
	"github.com/MORFEUSik/projectschool/backend/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"gorm.io/gorm"
)

// ListAssignments возвращает список заданий для курса
// @Summary Получить список заданий
// @Description Возвращает список заданий для указанного курса. Требуется JWT-токен. Доступно для ролей: student, teacher, admin.
// @Tags assignments
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID курса"
// @Success 200 {array} model.Assignment
// @Failure 400 {object} map[string]string "error"
// @Failure 401 {object} map[string]string "error"
// @Failure 500 {object} map[string]string "error"
// @Router /courses/{id}/assignments [get]
func ListAssignments(assignmentService service.AssignmentService) gin.HandlerFunc {
	return func(c *gin.Context) {
		courseID, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			logger.Log.Errorf("Invalid course ID: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный ID курса"})
			return
		}
		assignments, err := assignmentService.ListByCourse(uint(courseID))
		if err != nil {
			logger.Log.Errorf("Failed to list assignments: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка получения заданий"})
			return
		}
		c.JSON(http.StatusOK, assignments)
	}
}

// CreateAssignment создает новое задание
// @Summary Создать задание
// @Description Создает новое задание для курса с возможностью загрузки файла. Требуется JWT-токен. Доступно только для ролей: teacher, admin.
// @Tags assignments
// @Accept multipart/form-data
// @Produce json
// @Security BearerAuth
// @Param title formData string true "Название задания"
// @Param description formData string false "Описание задания (поддерживает HTML, например, <img src='/uploads/...'>)"
// @Param max_score formData integer true "Максимальный балл"
// @Param due_date formData string true "Срок сдачи (ISO 8601)"
// @Param course_id formData integer true "ID курса"
// @Param file formData file false "Файл (jpg, png, pdf)"
// @Success 200 {object} map[string]interface{} "message, assignment"
// @Failure 400 {object} map[string]string "error"
// @Failure 401 {object} map[string]string "error"
// @Failure 403 {object} map[string]string "error"
// @Failure 415 {object} map[string]string "error"
// @Failure 500 {object} map[string]string "error"
// @Router /assignments [post]
func CreateAssignment(assignmentService service.AssignmentService) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Проверка Content-Type
		if !strings.Contains(c.ContentType(), "multipart/form-data") {
			logger.Log.Errorf("Invalid Content-Type: %s", c.ContentType())
			c.JSON(http.StatusUnsupportedMediaType, gin.H{"error": "Требуется Content-Type: multipart/form-data"})
			return
		}

		// Структура для входных данных
		type AssignmentInput struct {
			Title       string    `form:"title" validate:"required,min=3,max=100"`
			Description string    `form:"description"`
			MaxScore    uint      `form:"max_score" validate:"required,gte=0"`
			DueDate     time.Time `form:"due_date" validate:"required"`
			CourseID    uint      `form:"course_id" validate:"required"`
			Type        string    `form:"type"`     // ← новое поле
			SubtasksRaw string    `form:"subtasks"` // ← JSON-строка
		}

		var input AssignmentInput
		if err := c.ShouldBind(&input); err != nil {
			logger.Log.Errorf("Failed to bind form data: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат данных"})
			return
		}

		var subtasks []model.Subtask
		if input.SubtasksRaw != "" {
			if err := json.Unmarshal([]byte(input.SubtasksRaw), &subtasks); err != nil {
				logger.Log.Errorf("Failed to parse subtasks JSON: %v", err)
				c.JSON(http.StatusBadRequest, gin.H{"error": "Ошибка обработки подзаданий"})
				return
			}
		}

		// Получаем userID из контекста
		userIDRaw, exists := c.Get("userID")
		if !exists {
			logger.Log.Error("UserID not found in context")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Пользователь не аутентифицирован"})
			return
		}

		// Безопасное приведение userID к uint
		var userID uint
		switch v := userIDRaw.(type) {
		case uint:
			userID = v
		case int:
			if v < 0 {
				logger.Log.Errorf("Invalid userID: negative value %d", v)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Некорректный ID пользователя"})
				return
			}
			userID = uint(v)
		case float64:
			if v < 0 || v != float64(uint(v)) {
				logger.Log.Errorf("Invalid userID: non-integer float %f", v)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Некорректный ID пользователя"})
				return
			}
			userID = uint(v)
		default:
			logger.Log.Errorf("Invalid userID type: %T, value: %v", userIDRaw, userIDRaw)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка обработки ID пользователя"})
			return
		}

		// Проверка существования пользователя и его роли
		var user model.User
		if err := db.DB.First(&user, userID).Error; err != nil {
			logger.Log.Errorf("User %d not found: %v", userID, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка проверки пользователя"})
			return
		}
		if user.Role != model.Teacher && user.Role != model.Admin {
			logger.Log.Errorf("User %d (%s) attempted to create assignment without permission", userID, user.Role)
			c.JSON(http.StatusForbidden, gin.H{"error": "Доступ запрещён"})
			return
		}

		// Проверка существования курса
		var course model.Course
		if err := db.DB.First(&course, input.CourseID).Error; err != nil {
			logger.Log.Errorf("Course %d not found: %v", input.CourseID, err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Курс не найден"})
			return
		}

		// Проверка: принадлежит ли курс учителю (только для роли teacher)
		if user.Role == model.Teacher && course.TeacherID != userID {
			logger.Log.Errorf("Teacher %d does not own course %d", userID, course.TeacherID)
			c.JSON(http.StatusForbidden, gin.H{"error": "Вы не можете создавать задания для этого курса"})
			return
		}
		// Админы могут создавать задания для любого курса

		// Обработка файла
		var fileURL string
		file, err := c.FormFile("file")
		if err == nil { // Файл загружен
			// Валидация типа файла
			allowedTypes := map[string]bool{
				"image/jpeg":      true,
				"image/png":       true,
				"application/pdf": true,
			}
			fileHeader := file.Header.Get("Content-Type")
			if !allowedTypes[fileHeader] {
				logger.Log.Errorf("Unsupported file type: %s", fileHeader)
				c.JSON(http.StatusBadRequest, gin.H{"error": "Неподдерживаемый тип файла (разрешены jpg, png, pdf)"})
				return
			}

			// Валидация размера (10 MB)
			if file.Size > 10*1024*1024 {
				logger.Log.Errorf("File too large: %d bytes", file.Size)
				c.JSON(http.StatusBadRequest, gin.H{"error": "Файл слишком большой (макс. 10 МБ)"})
				return
			}

			// Сохранение файла
			ext := filepath.Ext(file.Filename)
			filename := fmt.Sprintf("%d-%s%s", time.Now().UnixNano(), uuid.New().String(), ext)
			uploadDir := "./uploads"
			if err := os.MkdirAll(uploadDir, 0755); err != nil {
				logger.Log.Errorf("Failed to create upload directory %s: %v", uploadDir, err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка создания директории для файлов"})
				return
			}
			filePath := filepath.Join(uploadDir, filename)
			logger.Log.Infof("Saving file to %s", filePath)
			if err := c.SaveUploadedFile(file, filePath); err != nil {
				logger.Log.Errorf("Failed to save file to %s: %v", filePath, err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка сохранения файла"})
				return
			}
			if _, err := os.Stat(filePath); os.IsNotExist(err) {
				logger.Log.Errorf("File %s does not exist after saving", filePath)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Файл не был сохранён"})
				return
			}
			fileURL = "http://localhost:8080/uploads/" + filename
			logger.Log.Infof("File saved successfully: %s", fileURL)
		} else if !errors.Is(err, http.ErrMissingFile) {
			logger.Log.Errorf("Failed to get file: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Ошибка обработки файла"})
			return
		}

		// Создание модели Assignment
		assignment := model.Assignment{
			Title:       input.Title,
			Description: input.Description,
			Type:        input.Type,
			MaxScore:    input.MaxScore,
			DueDate:     input.DueDate,
			CourseID:    input.CourseID,
			TeacherID:   userID,
			FileURL:     fileURL,
		}

		// Валидация
		if err := assignment.Validate(); err != nil {
			logger.Log.Errorf("Assignment validation failed: %v", err)
			validationErrors := make([]string, 0)
			if errs, ok := err.(validator.ValidationErrors); ok {
				for _, e := range errs {
					validationErrors = append(validationErrors, fmt.Sprintf("Поле %s: %s", e.Field(), e.Tag()))
				}
			} else {
				validationErrors = append(validationErrors, err.Error())
			}
			c.JSON(http.StatusBadRequest, gin.H{"error": strings.Join(validationErrors, "; ")})
			return
		}

		// Сохранение через сервис
		if err := assignmentService.Create(&assignment, subtasks); err != nil {
			logger.Log.Errorf("Failed to create assignment: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка создания задания"})
			return
		}

		logger.Log.Infof("Assignment %s (ID: %d) created by user %d with file: %s", assignment.Title, assignment.ID, userID, fileURL)
		c.JSON(http.StatusOK, gin.H{"message": "Задание создано", "assignment": assignment})
	}
}

// GetAssignment возвращает задание по ID в контексте курса
// @Summary Получить задание в курсе
// @Description Возвращает задание по ID, проверяя его принадлежность к курсу. Требуется JWT-токен. Доступно для ролей: student, teacher, admin.
// @Tags assignments
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param courseId path int true "ID курса"
// @Param assignmentId path int true "ID задания"
// @Success 200 {object} model.Assignment
// @Failure 400 {object} map[string]string "error"
// @Failure 401 {object} map[string]string "error"
// @Failure 404 {object} map[string]string "error"
// @Failure 500 {object} map[string]string "error"
// @Router /courses/{courseId}/assignments/{assignmentId} [get]
func GetAssignment(assignmentService service.AssignmentService) gin.HandlerFunc {
	return func(c *gin.Context) {
		courseID, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			logger.Log.Errorf("Invalid course ID: %v", err)
			errorpkg.HandleError(c, errorpkg.APIError{Status: http.StatusBadRequest, Message: "Неверный ID курса"})
			return
		}

		assignmentID, err := strconv.Atoi(c.Param("assignmentId"))
		if err != nil {
			logger.Log.Errorf("Invalid assignment ID: %v", err)
			errorpkg.HandleError(c, errorpkg.APIError{Status: http.StatusBadRequest, Message: "Неверный ID задания"})
			return
		}

		assignment, err := assignmentService.Get(uint(assignmentID))
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				errorpkg.HandleError(c, errorpkg.APIError{Status: http.StatusNotFound, Message: "Задание не найдено"})
			} else {
				logger.Log.Errorf("Failed to get assignment %d: %v", assignmentID, err)
				errorpkg.HandleError(c, errorpkg.APIError{Status: http.StatusInternalServerError, Message: "Ошибка сервера"})
			}
			return
		}

		// Проверка, что задание принадлежит курсу
		if assignment.CourseID != uint(courseID) {
			logger.Log.Errorf("Assignment %d does not belong to course %d", assignmentID, courseID)
			errorpkg.HandleError(c, errorpkg.APIError{Status: http.StatusNotFound, Message: "Задание не принадлежит этому курсу"})
			return
		}

		c.JSON(http.StatusOK, assignment)
	}
}

// DeleteAssignment удаляет задание
// @Summary Удалить задание
// @Description Удаляет задание по его ID. Доступно только для учителей (создателей задания) и админов.
// @Tags assignments
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID задания"
// @Success 200 {object} map[string]string "message: Задание удалено"
// @Failure 400 {object} map[string]string "error: Неверный ID"
// @Failure 401 {object} map[string]string "error: Не авторизован"
// @Failure 403 {object} map[string]string "error: Доступ запрещён"
// @Failure 404 {object} map[string]string "error: Задание не найдено"
// @Failure 500 {object} map[string]string "error: Внутренняя ошибка сервера"
// @Router /assignments/{id} [delete]
func DeleteAssignment(assignmentService service.AssignmentService) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Получаем ID задания
		idStr := c.Param("id")
		id, err := strconv.Atoi(idStr)
		if err != nil {
			logger.Log.Errorf("Invalid assignment ID: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный ID"})
			return
		}

		// Получаем пользователя из контекста
		userRaw, exists := c.Get("user")
		if !exists {
			logger.Log.Error("User not found in context")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Не авторизован"})
			return
		}
		user, ok := userRaw.(model.User)
		if !ok {
			logger.Log.Error("Invalid user type in context")
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Внутренняя ошибка сервера"})
			return
		}

		// Проверяем права
		if user.Role != model.Teacher && user.Role != model.Admin {
			logger.Log.Errorf("User %d (%s) attempted to delete assignment %d without permission", user.ID, user.Role, id)
			c.JSON(http.StatusForbidden, gin.H{"error": "Доступ запрещён"})
			return
		}

		// Проверяем существование задания
		assignment, err := assignmentService.Get(uint(id))
		if err != nil {
			logger.Log.Errorf("Failed to get assignment %d: %v", id, err)
			if err.Error() == "record not found" {
				c.JSON(http.StatusNotFound, gin.H{"error": "Задание не найдено"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Внутренняя ошибка сервера"})
			}
			return
		}

		// Если учитель, проверяем, что он создатель задания
		if user.Role == model.Teacher && assignment.TeacherID != user.ID {
			logger.Log.Errorf("Teacher %d attempted to delete assignment %d not owned by them", user.ID, id)
			c.JSON(http.StatusForbidden, gin.H{"error": "Доступ запрещён"})
			return
		}

		// Удаляем задание
		if err := assignmentService.Delete(uint(id)); err != nil {
			logger.Log.Errorf("Failed to delete assignment %d: %v", id, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось удалить задание"})
			return
		}

		logger.Log.Infof("Assignment %d deleted by user %d (%s)", id, user.ID, user.Role)
		c.JSON(http.StatusOK, gin.H{"message": "Задание удалено"})
	}
}

// UploadFile загружает файл для задания
// @Summary Загрузить файл
// @Description Загружает файл (jpg, png, pdf) и возвращает URL. Требуется JWT-токен. Доступно для ролей: teacher, admin.
// @Tags assignments
// @Accept multipart/form-data
// @Produce json
// @Security BearerAuth
// @Param file formData file true "Файл (jpg, png, pdf)"
// @Success 200 {object} map[string]string "file_url"
// @Failure 400 {object} map[string]string "error"
// @Failure 401 {object} map[string]string "error"
// @Failure 403 {object} map[string]string "error"
// @Failure 500 {object} map[string]string "error"
// @Router /assignments/upload [post]
func UploadFile() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Проверка Content-Type
		if !strings.Contains(c.ContentType(), "multipart/form-data") {
			logger.Log.Errorf("Invalid Content-Type: %s", c.ContentType())
			c.JSON(http.StatusUnsupportedMediaType, gin.H{"error": "Требуется Content-Type: multipart/form-data"})
			return
		}

		// Получаем userID из контекста
		userIDRaw, exists := c.Get("userID")
		if !exists {
			logger.Log.Error("UserID not found in context")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Пользователь не аутентифицирован"})
			return
		}

		var userID uint
		switch v := userIDRaw.(type) {
		case uint:
			userID = v
		case int:
			if v < 0 {
				logger.Log.Errorf("Invalid userID: negative value %d", v)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Некорректный ID пользователя"})
				return
			}
			userID = uint(v)
		case float64:
			if v < 0 || v != float64(uint(v)) {
				logger.Log.Errorf("Invalid userID: non-integer float %f", v)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Некорректный ID пользователя"})
				return
			}
			userID = uint(v)
		default:
			logger.Log.Errorf("Invalid userID type: %T, value: %v", userIDRaw, userIDRaw)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка обработки ID пользователя"})
			return
		}

		// Проверка роли
		var user model.User
		if err := db.DB.First(&user, userID).Error; err != nil {
			logger.Log.Errorf("User %d not found: %v", userID, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка проверки пользователя"})
			return
		}
		if user.Role != model.Teacher && user.Role != model.Admin {
			logger.Log.Errorf("User %d (%s) attempted to upload file without permission", userID, user.Role)
			c.JSON(http.StatusForbidden, gin.H{"error": "Доступ запрещён"})
			return
		}

		// Обработка файла
		file, err := c.FormFile("file")
		if err != nil {
			logger.Log.Errorf("Failed to get file: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Ошибка обработки файла"})
			return
		}

		// Валидация типа файла
		allowedTypes := map[string]bool{
			"image/jpeg":      true,
			"image/png":       true,
			"application/pdf": true,
		}
		fileHeader := file.Header.Get("Content-Type")
		if !allowedTypes[fileHeader] {
			logger.Log.Errorf("Unsupported file type: %s", fileHeader)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неподдерживаемый тип файла (разрешены jpg, png, pdf)"})
			return
		}

		// Валидация размера (10 MB)
		if file.Size > 10*1024*1024 {
			logger.Log.Errorf("File too large: %d bytes", file.Size)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Файл слишком большой (макс. 10 МБ)"})
			return
		}

		// Сохранение файла
		ext := filepath.Ext(file.Filename)
		filename := fmt.Sprintf("%d-%s%s", time.Now().UnixNano(), uuid.New().String(), ext)
		uploadDir := "./uploads" // Физическая папка
		if err := os.MkdirAll(uploadDir, 0755); err != nil {
			logger.Log.Errorf("Failed to create upload directory %s: %v", uploadDir, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка создания директории для файлов"})
			return
		}
		filePath := filepath.Join(uploadDir, filename)
		logger.Log.Infof("Saving file to %s", filePath)
		if err := c.SaveUploadedFile(file, filePath); err != nil {
			logger.Log.Errorf("Failed to save file to %s: %v", filePath, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка сохранения файла"})
			return
		}
		// Проверяем, существует ли файл
		if _, err := os.Stat(filePath); os.IsNotExist(err) {
			logger.Log.Errorf("File %s does not exist after saving", filePath)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Файл не был сохранён"})
			return
		}
		fileURL := "http://localhost:8080/uploads/" + filename // URL с маленькой буквы
		logger.Log.Infof("File saved successfully: %s", fileURL)

		c.JSON(http.StatusOK, gin.H{"file_url": fileURL})
	}
}

func SubmitQuizAssignment(submissionService service.SubmissionService) gin.HandlerFunc {
	return func(c *gin.Context) {
		assignmentID, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный ID задания"})
			return
		}

		userID := c.GetUint("userID")

		var input struct {
			Answers []model.SubtaskSubmission `json:"answers" binding:"required"`
		}
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат данных"})
			return
		}

		grade, err := submissionService.ProcessQuizSubmission(uint(assignmentID), userID, input.Answers)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message": "Решение отправлено",
			"grade":   grade,
		})
	}
}

func GetSubtasks(subtaskRepo repository.SubtaskRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		assignmentID, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный ID задания"})
			return
		}

		subtasks, err := subtaskRepo.FindByAssignment(uint(assignmentID))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка получения подзаданий"})
			return
		}

		c.JSON(http.StatusOK, subtasks)
	}
}
