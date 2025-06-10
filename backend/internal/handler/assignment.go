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

	"github.com/MORFEUSik/projectschool/backend/internal/db"
	errorpkg "github.com/MORFEUSik/projectschool/backend/internal/error"
	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
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
// @Param type formData string true "Тип задания (text | multiple_choice)"
// @Param subtasks_json formData string false "JSON подзаданий для multiple_choice"
// @Param file formData file false "Файл (jpg, png, pdf)"
// @Param subtask_image_0 formData file false "Файл для подзадания 0 (jpg, png, pdf)"
// @Param subtask_image_1 formData file false "Файл для подзадания 1 (jpg, png, pdf)"
// @Success 200 {object} map[string]interface{} "message, assignment_id"
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
			Title        string    `form:"title" validate:"required,min=3,max=100"`
			Description  string    `form:"description"`
			MaxScore     uint      `form:"max_score" validate:"required,gte=0"`
			DueDate      time.Time `form:"due_date" validate:"required"`
			CourseID     uint      `form:"course_id" validate:"required"`
			Type         string    `form:"type" validate:"required,oneof=text multiple_choice"`
			SubtasksJSON string    `form:"subtasks_json"` // Синхронизировано с фронтендом
		}

		var input AssignmentInput
		if err := c.ShouldBind(&input); err != nil {
			logger.Log.Errorf("Failed to bind form data: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат данных"})
			return
		}

		// Десериализация подзаданий
		var subtasks []model.Subtask
		if input.Type == "multiple_choice" {
			if input.SubtasksJSON == "" {
				logger.Log.Errorf("Subtasks required for multiple_choice assignment")
				c.JSON(http.StatusBadRequest, gin.H{"error": "Тест должен содержать подзадания"})
				return
			}
			if err := json.Unmarshal([]byte(input.SubtasksJSON), &subtasks); err != nil {
				logger.Log.Errorf("Failed to parse subtasks JSON: %v", err)
				c.JSON(http.StatusBadRequest, gin.H{"error": "Ошибка обработки подзаданий"})
				return
			}
			logger.Log.Infof("Successfully deserialized %d subtasks", len(subtasks))
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

		// Обработка файлов
		files := make(map[string]string)
		uploadDir := "./uploads"
		if err := os.MkdirAll(uploadDir, 0755); err != nil {
			logger.Log.Errorf("Failed to create upload directory %s: %v", uploadDir, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка создания директории для файлов"})
			return
		}

		// Файл для задания
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

		// Файлы для подзаданий
		for i := range subtasks {
			fileKey := fmt.Sprintf("subtask_image_%d", i)
			file, err := c.FormFile(fileKey)
			if err == nil { // Файл загружен
				// Валидация типа файла
				allowedTypes := map[string]bool{
					"image/jpeg":      true,
					"image/png":       true,
					"application/pdf": true,
				}
				fileHeader := file.Header.Get("Content-Type")
				if !allowedTypes[fileHeader] {
					logger.Log.Errorf("Unsupported file type for %s: %s", fileKey, fileHeader)
					c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Неподдерживаемый тип файла для подзадания %d (разрешены jpg, png, pdf)", i)})
					return
				}

				// Валидация размера (10 MB)
				if file.Size > 10*1024*1024 {
					logger.Log.Errorf("File too large for %s: %d bytes", fileKey, file.Size)
					c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Файл подзадания %d слишком большой (макс. 10 МБ)", i)})
					return
				}

				// Сохранение файла
				ext := filepath.Ext(file.Filename)
				filename := fmt.Sprintf("subtask_%d-%s%s", time.Now().UnixNano(), uuid.New().String(), ext)
				filePath := filepath.Join(uploadDir, filename)
				logger.Log.Infof("Saving subtask file to %s", filePath)
				if err := c.SaveUploadedFile(file, filePath); err != nil {
					logger.Log.Errorf("Failed to save subtask file to %s: %v", filePath, err)
					c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Ошибка сохранения файла подзадания %d", i)})
					return
				}
				if _, err := os.Stat(filePath); os.IsNotExist(err) {
					logger.Log.Errorf("Subtask file %s does not exist after saving", filePath)
					c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Файл подзадания %d не был сохранён", i)})
					return
				}
				fileURL := "http://localhost:8080/uploads/" + filename
				files[fileKey] = fileURL
				logger.Log.Infof("Subtask file saved successfully: %s", fileURL)
			} else if !errors.Is(err, http.ErrMissingFile) {
				logger.Log.Errorf("Failed to get subtask file %s: %v", fileKey, err)
				c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Ошибка обработки файла подзадания %d", i)})
				return
			}
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
		if err := assignmentService.Create(&assignment, subtasks, files); err != nil {
			logger.Log.Errorf("Failed to create assignment: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		logger.Log.Infof("Assignment %s (ID: %d) created by user %d with file: %s", assignment.Title, assignment.ID, userID, fileURL)
		c.JSON(http.StatusOK, gin.H{"message": "Задание создано", "assignment_id": assignment.ID})
	}
}

// GetAssignment возвращает задание по ID в контексте курса
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

		// Удаляем задание, передавая teacherID
		if err := assignmentService.Delete(uint(id), user.ID); err != nil {
			logger.Log.Errorf("Failed to delete assignment %d: %v", id, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось удалить задание"})
			return
		}

		logger.Log.Infof("Assignment %d deleted by user %d (%s)", id, user.ID, user.Role)
		c.JSON(http.StatusOK, gin.H{"message": "Задание удалено"})
	}
}

// UploadFile загружает файл для задания
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
		fileURL := "http://localhost:8080/uploads/" + filename
		logger.Log.Infof("File saved successfully: %s", fileURL)

		c.JSON(http.StatusOK, gin.H{"file_url": fileURL})
	}
}

// SubmitQuizAssignment отправляет ответы на тест
// @Summary Отправить ответы на тест
// @Description Отправляет ответы на тест (multiple_choice). Требуется JWT-токен. Доступно для роли: student.
// @Tags assignments
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID задания"
// @Param answers body object true "Ответы на подзадания"
// @Success 200 {object} map[string]interface{} "message, grade, totalScore, answers"
// @Failure 400 {object} map[string]string "error"
// @Failure 401 {object} map[string]string "error"
// @Failure 500 {object} map[string]string "error"
// @Router /assignments/{id}/submit-quiz [post]
func SubmitQuizAssignment(submissionService service.SubmissionService) gin.HandlerFunc {
	return func(c *gin.Context) {
		assignmentID, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			logger.Log.Errorf("Invalid assignment ID: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный ID задания"})
			return
		}

		userID := c.GetUint("userID")
		if userID == 0 {
			logger.Log.Error("UserID not found in context")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Пользователь не аутентифицирован"})
			return
		}

		var input struct {
			Answers []model.SubtaskSubmission `json:"answers" binding:"required"`
		}
		if err := c.ShouldBindJSON(&input); err != nil {
			logger.Log.Errorf("Failed to bind JSON data: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат данных"})
			return
		}

		result, err := submissionService.ProcessQuizSubmission(uint(assignmentID), userID, input.Answers)
		if err != nil {
			logger.Log.Errorf("Failed to process quiz submission: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message":    "Решение отправлено",
			"grade":      result["grade"],
			"totalScore": result["totalScore"],
			"answers":    result["answers"],
		})
	}
}

// GetSubtasks возвращает подзадания для задания
func GetSubtasks(subtaskService service.SubtaskService) gin.HandlerFunc {
	return func(c *gin.Context) {
		assignmentID, err := strconv.ParseUint(c.Param("id"), 10, 64)
		if err != nil {
			logger.Log.Errorf("Invalid assignment ID: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный ID задания"})
			return
		}
		subtasks, err := subtaskService.GetByAssignmentID(uint(assignmentID))
		if err != nil {
			logger.Log.Errorf("Failed to get subtasks: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка получения подзаданий"})
			return
		}
		c.JSON(http.StatusOK, subtasks)
	}
}

// CheckSubtaskAnswer проверяет ответ на подзадание
// @Summary Проверить ответ на подзадание
// @Description Проверяет, является ли ответ на подзадание правильным. Требуется JWT-токен. Доступно для роли: student.
// @Tags assignments
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "ID задания"
// @Param subtask_id body int true "ID подзадания"
// @Param answer body string true "Ответ"
// @Success 200 {object} map[string]interface{} "isCorrect, attempts"
// @Failure 400 {object} map[string]string "error"
// @Failure 401 {object} map[string]string "error"
// @Failure 403 {object} map[string]string "error"
// @Failure 404 {object} map[string]string "error"
// @Failure 500 {object} map[string]string "error"
// @Router /assignments/{id}/check-subtask [post]
func CheckSubtaskAnswer(subtaskService service.SubtaskService, submissionService service.SubmissionService) gin.HandlerFunc {
	return func(c *gin.Context) {
		assignmentID, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			logger.Log.Errorf("Invalid assignment ID: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный ID задания"})
			return
		}

		userID := c.GetUint("userID")
		if userID == 0 {
			logger.Log.Error("UserID not found in context")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Пользователь не аутентифицирован"})
			return
		}

		var input struct {
			SubtaskID uint   `json:"subtask_id" binding:"required"`
			Answer    string `json:"answer" binding:"required"`
		}
		if err := c.ShouldBindJSON(&input); err != nil {
			logger.Log.Errorf("Failed to bind JSON data: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат данных"})
			return
		}

		// Проверка роли
		var user model.User
		if err := db.DB.First(&user, userID).Error; err != nil {
			logger.Log.Errorf("User %d not found: %v", userID, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка проверки пользователя"})
			return
		}
		if user.Role != model.Student {
			logger.Log.Errorf("User %d (%s) attempted to check subtask without permission", userID, user.Role)
			c.JSON(http.StatusForbidden, gin.H{"error": "Доступ запрещён"})
			return
		}

		// Проверка существования подзадания
		var subtask model.Subtask
		if err := db.DB.Where("id = ? AND assignment_id = ?", input.SubtaskID, assignmentID).First(&subtask).Error; err != nil {
			logger.Log.Errorf("Subtask %d not found for assignment %d: %v", input.SubtaskID, assignmentID, err)
			c.JSON(http.StatusNotFound, gin.H{"error": "Подзадание не найдено"})
			return
		}

		// Проверка, не отправлено ли уже решение для задания
		var existingSubmission model.Submission
		if err := db.DB.Where("user_id = ? AND assignment_id = ?", userID, assignmentID).First(&existingSubmission).Error; err == nil {
			logger.Log.Warnf("Submission already exists for user %d, assignment %d", userID, assignmentID)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Решение уже отправлено"})
			return
		}

		// Проверка ответа
		isCorrect := strings.TrimSpace(strings.ToLower(input.Answer)) == strings.TrimSpace(strings.ToLower(subtask.Answer))

		// Сохраняем попытку
		var subtaskSubmission model.SubtaskSubmission
		err = db.DB.Where("user_id = ? AND subtask_id = ?", userID, input.SubtaskID).First(&subtaskSubmission).Error
		if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			logger.Log.Errorf("Error checking subtask submission: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка обработки попытки"})
			return
		}

		attempts := 1
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// Создаём новую запись
			subtaskSubmission = model.SubtaskSubmission{
				SubtaskID: input.SubtaskID,
				UserID:    userID,
				Answer:    input.Answer,
				IsCorrect: isCorrect,
				Attempts:  1,
			}
			if err := db.DB.Create(&subtaskSubmission).Error; err != nil {
				logger.Log.Errorf("Failed to create subtask submission: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка сохранения попытки"})
				return
			}
		} else {
			// Обновляем существующую запись
			attempts = subtaskSubmission.Attempts + 1
			if err := db.DB.Model(&subtaskSubmission).Updates(map[string]interface{}{
				"answer":     input.Answer,
				"is_correct": isCorrect,
				"attempts":   attempts,
			}).Error; err != nil {
				logger.Log.Errorf("Failed to update subtask submission: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка обновления попытки"})
				return
			}
		}

		logger.Log.Infof("Subtask %d checked for user %d: answer=%s, isCorrect=%v, attempts=%d", input.SubtaskID, userID, input.Answer, isCorrect, attempts)
		c.JSON(http.StatusOK, gin.H{"isCorrect": isCorrect, "attempts": attempts})
	}
}
