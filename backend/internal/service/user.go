package service

import (
	"errors"

	"github.com/MORFEUSik/projectschool/backend/internal/db"
	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/repository"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type UserService interface {
	Register(user *model.User) error
	FindByEmail(email string) (*model.User, error)
	FindByID(id uint) (*model.User, error)
}

type userService struct {
	repo repository.UserRepository
}

func NewUserService(repo repository.UserRepository) UserService {
	return &userService{repo: repo}
}

func (s *userService) Register(user *model.User) error {
	logger.Log.Infof("Registering user: %s", user.Email)

	// Проверка: существует ли пользователь
	_, err := s.FindByEmail(user.Email)
	if err == nil {
		logger.Log.Warnf("User with email %s already exists", user.Email)
		return errors.New("пользователь с таким email уже существует")
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		logger.Log.Errorf("Error checking user existence: %v", err)
		return err
	}

	// Хеширование пароля
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		logger.Log.Errorf("Failed to hash password: %v", err)
		return errors.New("ошибка при регистрации")
	}
	user.Password = string(hashedPassword)

	// Создание пользователя
	if err := s.repo.Create(user); err != nil {
		logger.Log.Errorf("Failed to create user: %v", err)
		return err
	}

	logger.Log.Infof("User %s registered successfully", user.Email)
	return nil
}

func (s *userService) FindByEmail(email string) (*model.User, error) {
	logger.Log.Infof("Finding user by email: %s", email)
	user, err := s.repo.FindByEmail(email)
	if err != nil {
		logger.Log.Errorf("Failed to find user by email %s: %v", email, err)
		return nil, err
	}
	return user, nil
}

func (s *userService) FindByID(id uint) (*model.User, error) {
	logger.Log.Infof("Finding user by ID: %d", id)
	var user model.User
	if err := db.DB.First(&user, id).Error; err != nil {
		logger.Log.Errorf("Failed to find user %d: %v", id, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("пользователь не найден")
		}
		return nil, err
	}
	return &user, nil
}
