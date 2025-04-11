package handler

import (
	"net/http"
	"time"

	"github.com/MORFEUSik/projectschool/backend/internal/db"
	"github.com/MORFEUSik/projectschool/backend/internal/jwt"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

// Сравнение паролей
func ComparePasswords(hashedPassword, plainPassword string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(plainPassword))
	return err == nil
}

// Хэширование пароля
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(bytes), nil
}

// Регистрация нового пользователя
func Register(c *gin.Context) {
	var user model.User
	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат данных"})
		return
	}

	// Проверка, существует ли уже пользователь с таким email
	var existingUser model.User
	if err := db.DB.Where("email = ?", user.Email).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Пользователь с таким email уже существует"})
		return
	}

	// Хэшируем пароль
	hashedPassword, err := HashPassword(user.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка хэширования пароля"})
		return
	}

	// Создаем нового пользователя
	newUser := model.User{
		Username:  user.Username,
		Password:  hashedPassword,
		Email:     user.Email,
		Role:      user.Role, // Если роль не передана, она будет иметь значение по умолчанию
		CreatedAt: time.Now(),
	}

	// Сохраняем пользователя в базу данных
	if err := db.DB.Create(&newUser).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при создании пользователя"})
		return
	}

	// Генерация токена для нового пользователя
	token, err := jwt.GenerateToken(uint(newUser.ID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при генерации токена"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Пользователь успешно зарегистрирован", "token": token})
}

// Логин (оставляем прежний)
func Login(c *gin.Context) {
	var user model.User
	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат данных"})
		return
	}

	// Поиск пользователя в базе
	var dbUser model.User
	if err := db.DB.Where("email = ?", user.Email).First(&dbUser).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Неверные учетные данные email"})
		return
	}

	// Проверка пароля
	if !ComparePasswords(dbUser.Password, user.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Неверные учетные данные parol"})
		return
	}

	// Генерация токена
	token, err := jwt.GenerateToken(uint(dbUser.ID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при генерации токена"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"token": token})
}
