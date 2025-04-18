package service

import (
	"errors"
	"fmt"

	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/repository"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type AuthService interface {
	Register(user *model.User) error
	Login(email, password string) (*model.User, error)
}

type authService struct {
	repo repository.UserRepository
}

func NewAuthService(repo repository.UserRepository) AuthService {
	return &authService{repo: repo}
}

func (s *authService) Register(user *model.User) error {
	logger.Log.Infof("Registering user: email=%s, username=%s, role=%s, password_length=%d",
		user.Email, user.Username, user.Role, len(user.Password))

	// Проверка входных данных
	logger.Log.Info("Checking input data")
	if user.Email == "" || user.Username == "" || user.Password == "" || user.Role == "" {
		logger.Log.Errorf("Invalid input: email=%s, username=%s, role=%s, password_length=%d",
			user.Email, user.Username, user.Role, len(user.Password))
		return fmt.Errorf("все поля обязательны")
	}

	// Проверка: существует ли пользователь
	logger.Log.Info("Checking if user exists")
	existingUser, err := s.repo.FindByEmail(user.Email)
	if err == nil && existingUser != nil {
		logger.Log.Warnf("User with email %s already exists", user.Email)
		return errors.New("пользователь с таким email уже существует")
	}
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		logger.Log.Errorf("Error checking user existence: %v", err)
		return fmt.Errorf("ошибка проверки существования пользователя: %w", err)
	}
	logger.Log.Info("No existing user found")

	// Валидация пользователя
	logger.Log.Info("Validating user")
	if err := user.Validate(); err != nil {
		logger.Log.Errorf("User validation failed: %v", err)
		return fmt.Errorf("ошибка валидации пользователя: %w", err)
	}

	// Хеширование пароля
	logger.Log.Info("Hashing password")
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		logger.Log.Errorf("Failed to hash password: %v", err)
		return fmt.Errorf("ошибка хеширования пароля: %w", err)
	}
	hashStr := string(hashedPassword)
	logger.Log.Infof("Generated hash: length=%d, starts_with=%s", len(hashStr), hashStr[:7])
	user.Password = hashStr
	logger.Log.Infof("User password set to hash: length=%d", len(user.Password))

	// Создание пользователя
	logger.Log.Info("Creating user")
	if err := s.repo.Create(user); err != nil {
		logger.Log.Errorf("Failed to create user: email=%s, error=%v", user.Email, err)
		return fmt.Errorf("ошибка создания пользователя: %w", err)
	}

	logger.Log.Infof("User %s registered successfully", user.Email)
	return nil
}

func (s *authService) Login(email, password string) (*model.User, error) {
	logger.Log.Infof("Attempting login for user: email=%s, password_length=%d", email, len(password))

	// Проверка входных данных
	if email == "" || password == "" {
		logger.Log.Errorf("Invalid login input: email=%s, password_length=%d", email, len(password))
		return nil, errors.New("email и пароль обязательны")
	}

	// Поиск пользователя
	logger.Log.Info("Finding user by email")
	user, err := s.repo.FindByEmail(email)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			logger.Log.Warnf("User with email %s not found", email)
			return nil, errors.New("неверный email или пароль")
		}
		logger.Log.Errorf("Error finding user: %v", err)
		return nil, fmt.Errorf("ошибка поиска пользователя: %w", err)
	}
	logger.Log.Infof("User found: id=%d, email=%s, hash_length=%d", user.ID, user.Email, len(user.Password))

	// Проверка пароля
	logger.Log.Info("Verifying password")
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		logger.Log.Warnf("Invalid password for user %s: %v", email, err)
		return nil, errors.New("неверный email или пароль")
	}

	logger.Log.Infof("User %s logged in successfully", email)
	return user, nil
}
