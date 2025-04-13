// backend/internal/repository/user.go
package repository

import (
	"github.com/MORFEUSik/projectschool/backend/internal/db"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"gorm.io/gorm"
)

type UserRepository interface {
	Create(user *model.User) error
	FindByID(id uint, user *model.User) error
	FindByEmail(email string, user *model.User) error
	Update(user *model.User) error // Новый метод
}

type userRepository struct {
	db *gorm.DB
}

func NewUserRepository() UserRepository {
	return &userRepository{db: db.DB}
}

func (r *userRepository) Create(user *model.User) error {
	return r.db.Create(user).Error
}

func (r *userRepository) FindByID(id uint, user *model.User) error {
	return r.db.First(user, id).Error
}

func (r *userRepository) FindByEmail(email string, user *model.User) error {
	return r.db.Where("email = ?", email).First(user).Error
}

func (r *userRepository) Update(user *model.User) error {
	return r.db.Save(user).Error
}
