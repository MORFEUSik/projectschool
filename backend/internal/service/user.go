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
	Login(email, password string) (*model.User, error)
	GetProfile(userID uint) (*model.User, error)
	GetLeaderboard(courseID uint) ([]model.User, error)
}

type userService struct {
	repo repository.UserRepository
	db   *gorm.DB
}

func NewUserService(repo repository.UserRepository) UserService {
	return &userService{
		repo: repo,
		db:   db.DB,
	}
}

func (s *userService) Register(user *model.User) error {
	logger.Log.Infof("Attempting to register user: %s", user.Email)

	// Проверка: существует ли пользователь
	_, err := s.repo.FindByEmail(user.Email)
	if err == nil {
		logger.Log.Warnf("User with email %s already exists", user.Email)
		return errors.New("пользователь с таким email уже существует")
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		logger.Log.Errorf("Error checking email %s: %v", user.Email, err)
		return err
	}

	// Валидация модели
	if err := user.Validate(); err != nil {
		logger.Log.Errorf("User validation failed: %v", err)
		return err
	}

	// Хеширование пароля
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		logger.Log.Errorf("Failed to hash password: %v", err)
		return err
	}
	user.Password = string(hashedPassword)
	logger.Log.Info("Password hashed successfully")

	// Создание пользователя
	if err := s.repo.Create(user); err != nil {
		logger.Log.Errorf("Failed to create user: %v", err)
		return err
	}

	logger.Log.Infof("User %s registered successfully", user.Email)
	return nil
}

func (s *userService) Login(email, password string) (*model.User, error) {
	logger.Log.Infof("Attempting login for user: %s", email)

	user, err := s.repo.FindByEmail(email)
	if err != nil {
		logger.Log.Errorf("User %s not found: %v", email, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("неверный email или пароль")
		}
		return nil, err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		logger.Log.Warnf("Invalid password for user %s", email)
		return nil, errors.New("неверный email или пароль")
	}

	logger.Log.Infof("User %s logged in successfully", email)
	return user, nil
}

func (s *userService) GetProfile(userID uint) (*model.User, error) {
	logger.Log.Infof("Fetching profile for user %d", userID)

	user, err := s.repo.FindByID(userID)
	if err != nil {
		logger.Log.Errorf("User %d not found: %v", userID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("пользователь не найден")
		}
		return nil, err
	}

	logger.Log.Infof("Profile fetched for user %d", userID)
	return user, nil
}

func (s *userService) GetLeaderboard(courseID uint) ([]model.User, error) {
	logger.Log.Info("Fetching leaderboard")

	var users []model.User
	var err error
	if courseID == 0 {
		users, err = s.repo.FindTopByPoints(10)
	} else {
		users, err = s.repo.FindTopByPointsInCourse(courseID, 10)
	}
	if err != nil {
		logger.Log.Errorf("Failed to fetch leaderboard: %v", err)
		return nil, err
	}

	logger.Log.Infof("Leaderboard fetched with %d users", len(users))
	return users, nil
}
