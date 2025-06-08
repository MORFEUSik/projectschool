package service

import (
	"errors"
	"fmt"

	"time"

	"github.com/MORFEUSik/projectschool/backend/internal/db"
	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/repository"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type UserService interface {
	Register(user *model.User) error
	AdminRegister(user *model.User, adminID uint) error
	Login(email, password string) (*model.User, error)
	GetProfile(userID uint) (*model.User, error)
	GetLeaderboard(courseID uint) ([]model.User, error)
	UpdateRole(userID, adminID uint, role model.Role) error
	UpdateProfile(userID uint, username, email, fullName string) error
	ListAll() ([]model.User, error)
	GetAchievements(userID uint) ([]model.UserAchievement, error)
}

type userService struct {
	repo    repository.UserRepository
	db      *gorm.DB
	logRepo repository.ActionLogRepository
}

func NewUserService(repo repository.UserRepository, logRepo repository.ActionLogRepository) UserService {
	return &userService{
		repo:    repo,
		db:      db.DB,
		logRepo: logRepo,
	}
}

func (s *userService) Register(user *model.User) error {
	logger.Log.Infof("Attempting to register user: %s", user.Email)

	_, err := s.repo.FindByEmail(user.Email)
	if err == nil {
		logger.Log.Warnf("User with email %s already exists", user.Email)
		return errors.New("пользователь с таким email уже существует")
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		logger.Log.Errorf("Error checking email %s: %v", user.Email, err)
		return err
	}

	if err := user.Validate(); err != nil {
		logger.Log.Errorf("User validation failed: %v", err)
		return err
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		logger.Log.Errorf("Failed to hash password: %v", err)
		return err
	}
	user.Password = string(hashedPassword)
	logger.Log.Info("Password hashed successfully")

	if err := s.repo.Create(user); err != nil {
		logger.Log.Errorf("Failed to create user: %v", err)
		return err
	}

	logger.Log.Infof("User %s registered successfully", user.Email)
	log := &model.UserActionLog{
		UserID:    user.ID,
		Action:    "register",
		Details:   "Пользователь зарегистрировался",
		CreatedAt: time.Now(),
	}
	if err := s.logRepo.Create(log); err != nil {
		logger.Log.Errorf("Failed to create action log: %v", err)
	}
	return nil
}

func (s *userService) AdminRegister(user *model.User, adminID uint) error {
	logger.Log.Infof("Admin %d attempting to register user: %s", adminID, user.Email)

	admin, err := s.repo.FindByID(adminID)
	if err != nil {
		logger.Log.Errorf("Admin %d not found: %v", adminID, err)
		return errors.New("админ не найден")
	}
	if admin.Role != model.Admin {
		logger.Log.Warnf("User %d is not an admin", adminID)
		return errors.New("недостаточно прав")
	}

	_, err = s.repo.FindByEmail(user.Email)
	if err == nil {
		logger.Log.Warnf("User with email %s already exists", user.Email)
		return errors.New("пользователь с таким email уже существует")
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		logger.Log.Errorf("Error checking email %s: %v", user.Email, err)
		return err
	}

	if user.Role != model.Teacher && user.Role != model.Admin {
		logger.Log.Errorf("Invalid role for admin registration: %s", user.Role)
		return errors.New("можно регистрировать только учителей или админов")
	}

	if err := user.Validate(); err != nil {
		logger.Log.Errorf("User validation failed: %v", err)
		return err
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		logger.Log.Errorf("Failed to hash password: %v", err)
		return err
	}
	user.Password = string(hashedPassword)

	if err := s.repo.Create(user); err != nil {
		logger.Log.Errorf("Failed to create user: %v", err)
		return err
	}

	logger.Log.Infof("User %s registered by admin %d", user.Email, adminID)
	log := &model.UserActionLog{
		UserID:    adminID,
		Action:    "admin_register",
		Details:   "Админ зарегистрировал пользователя: " + user.Email,
		CreatedAt: time.Now(),
	}
	if err := s.logRepo.Create(log); err != nil {
		logger.Log.Errorf("Failed to create action log: %v", err)
	}
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
	log := &model.UserActionLog{
		UserID:    user.ID,
		Action:    "login",
		Details:   "Пользователь вошёл в систему",
		CreatedAt: time.Now(),
	}
	if err := s.logRepo.Create(log); err != nil {
		logger.Log.Errorf("Failed to create action log: %v", err)
	}
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

func (s *userService) UpdateRole(userID, adminID uint, role model.Role) error {
	logger.Log.Infof("Admin %d updating role for user %d to %s", adminID, userID, role)

	_, err := s.repo.FindByID(userID)
	if err != nil {
		logger.Log.Errorf("User %d not found: %v", userID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("пользователь не найден")
		}
		return err
	}

	admin, err := s.repo.FindByID(adminID)
	if err != nil {
		logger.Log.Errorf("Admin %d not found: %v", adminID, err)
		return err
	}
	if admin.Role != model.Admin {
		logger.Log.Warnf("User %d is not an admin", adminID)
		return errors.New("недостаточно прав")
	}

	if role != model.Student && role != model.Teacher && role != model.Admin {
		logger.Log.Errorf("Invalid role: %s", role)
		return errors.New("недопустимая роль")
	}

	if err := s.repo.UpdateRole(userID, role); err != nil {
		logger.Log.Errorf("Failed to update role for user %d: %v", userID, err)
		return err
	}

	logger.Log.Infof("Role for user %d updated to %s", userID, role)
	log := &model.UserActionLog{
		UserID:    adminID,
		Action:    "update_role",
		Details:   "Админ изменил роль пользователя " + fmt.Sprint(userID) + " на " + string(role),
		CreatedAt: time.Now(),
	}
	if err := s.logRepo.Create(log); err != nil {
		logger.Log.Errorf("Failed to create action log: %v", err)
	}
	return nil
}

func (s *userService) UpdateProfile(userID uint, username, email, fullName string) error {
	user, err := s.repo.FindByID(userID)
	if err != nil {
		return err
	}
	user.Username = username
	user.Email = email
	user.FullName = fullName
	if err := user.Validate(); err != nil {
		return err
	}
	if err := s.db.Save(user).Error; err != nil {
		return err
	}
	log := &model.UserActionLog{
		UserID:    userID,
		Action:    "update_profile",
		Details:   "Пользователь обновил профиль",
		CreatedAt: time.Now(),
	}
	if err := s.logRepo.Create(log); err != nil {
		logger.Log.Errorf("Failed to create action log: %v", err)
	}
	return nil
}

func (s *userService) ListAll() ([]model.User, error) {
	var users []model.User
	err := s.db.Find(&users).Error
	if err != nil {
		return nil, err
	}
	log := &model.UserActionLog{
		UserID:    0,
		Action:    "list_users",
		Details:   "Запрошен список всех пользователей",
		CreatedAt: time.Now(),
	}
	if err := s.logRepo.Create(log); err != nil {
		logger.Log.Errorf("Failed to create action log: %v", err)
	}
	return users, nil
}

func (s *userService) GetAchievements(userID uint) ([]model.UserAchievement, error) {
	var achievements []model.UserAchievement
	err := s.db.Preload("Achievement").Where("user_id = ?", userID).Find(&achievements).Error
	if err != nil {
		return nil, err
	}
	log := &model.UserActionLog{
		UserID:    userID,
		Action:    "get_achievements",
		Details:   "Пользователь запросил свои достижения",
		CreatedAt: time.Now(),
	}
	if err := s.logRepo.Create(log); err != nil {
		logger.Log.Errorf("Failed to create action log: %v", err)
	}
	return achievements, nil
}
