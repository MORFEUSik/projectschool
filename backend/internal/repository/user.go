package repository

import (
	"github.com/MORFEUSik/projectschool/backend/internal/db"
	"github.com/MORFEUSik/projectschool/backend/internal/logger"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"gorm.io/gorm"
)

type UserRepository interface {
	Create(user *model.User) error
	FindByID(id uint) (*model.User, error)
	FindByEmail(email string) (*model.User, error)
	FindTopByPoints(limit int) ([]model.User, error)
	FindTopByPointsInCourse(courseID uint, limit int) ([]model.User, error)
	UpdateRole(id uint, role model.Role) error
}

type userRepository struct {
	db *gorm.DB
}

func NewUserRepository() UserRepository {
	return &userRepository{db: db.DB}
}

func (r *userRepository) Create(user *model.User) error {
	logger.Log.Infof("Saving user: email=%s, username=%s, role=%s, password_hash_length=%d",
		user.Email, user.Username, user.Role, len(user.Password))
	err := r.db.Create(user).Error
	if err != nil {
		logger.Log.Errorf("Failed to save user: email=%s, error=%v", user.Email, err)
	}
	return err
}

func (r *userRepository) FindByID(id uint) (*model.User, error) {
	var user model.User
	err := r.db.First(&user, id).Error
	return &user, err
}

func (r *userRepository) FindByEmail(email string) (*model.User, error) {
	var user model.User
	err := r.db.Where("email = ?", email).First(&user).Error
	return &user, err
}

func (r *userRepository) FindTopByPoints(limit int) ([]model.User, error) {
	var users []model.User
	err := r.db.Order("points DESC").Limit(limit).Find(&users).Error
	return users, err
}

func (r *userRepository) FindTopByPointsInCourse(courseID uint, limit int) ([]model.User, error) {
	var users []model.User
	err := r.db.Joins("JOIN enrollments ON enrollments.user_id = users.id").
		Where("enrollments.course_id = ?", courseID).
		Order("users.points DESC").
		Limit(limit).
		Find(&users).Error
	return users, err
}

func (r *userRepository) UpdateRole(id uint, role model.Role) error {
	logger.Log.Infof("Updating role for user %d to %s", id, role)
	return r.db.Model(&model.User{}).Where("id = ?", id).Update("role", role).Error
}
