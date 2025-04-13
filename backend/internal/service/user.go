// backend/internal/service/user.go
package service

import (
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"github.com/MORFEUSik/projectschool/backend/internal/repository"
)

type UserService interface {
	FindByID(id uint, user *model.User) error
}

type userService struct {
	repo repository.UserRepository
}

func NewUserService(repo repository.UserRepository) UserService {
	return &userService{repo: repo}
}

func (s *userService) FindByID(id uint, user *model.User) error {
	return s.repo.FindByID(id, user)
}
