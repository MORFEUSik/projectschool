package jwt

import (
	"fmt"
	"os"
	"time"

	"github.com/dgrijalva/jwt-go"
)

var secretKey = []byte(os.Getenv("JWT_SECRET"))

const (
	accessTokenDuration  = 24 * time.Hour
	refreshTokenDuration = 7 * 24 * time.Hour
)

// GenerateToken генерирует access-токен для пользователя
func GenerateToken(userID uint) (string, error) {
	claims := jwt.MapClaims{
		"sub":  userID,
		"iss":  "projectschool",
		"aud":  "api",
		"iat":  time.Now().Unix(),
		"exp":  time.Now().Add(accessTokenDuration).Unix(),
		"type": "access",
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(secretKey)
	if err != nil {
		return "", fmt.Errorf("не удалось создать токен: %v", err)
	}

	return tokenString, nil
}

// GenerateRefreshToken генерирует refresh-токен
func GenerateRefreshToken(userID uint) (string, error) {
	claims := jwt.MapClaims{
		"sub":  userID,
		"iss":  "projectschool",
		"aud":  "api",
		"iat":  time.Now().Unix(),
		"exp":  time.Now().Add(refreshTokenDuration).Unix(),
		"type": "refresh",
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(secretKey)
	if err != nil {
		return "", fmt.Errorf("не удалось создать refresh-токен: %v", err)
	}

	return tokenString, nil
}

// ValidateToken проверяет валидность токена и возвращает userID
func ValidateToken(tokenString string) (uint, error) {
	token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("не поддерживаемый метод подписи")
		}
		return secretKey, nil
	})
	if err != nil {
		return 0, fmt.Errorf("неверный токен: %v", err)
	}

	if !token.Valid {
		return 0, fmt.Errorf("токен недействителен")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return 0, fmt.Errorf("неверные претензии")
	}

	// Проверка типа токена
	if tokenType, exists := claims["type"]; exists && tokenType == "refresh" {
		return 0, fmt.Errorf("refresh-токен нельзя использовать для авторизации")
	}

	userID, ok := claims["sub"].(float64)
	if !ok {
		return 0, fmt.Errorf("неверный userID в токене")
	}

	return uint(userID), nil
}
