// internal/jwt/jwt.go

package jwt

import (
	"fmt"
	"time"

	"github.com/dgrijalva/jwt-go"
)

var secretKey = []byte("your_secret_key") // Задай свой секретный ключ

// Создание JWT
func GenerateToken(userID uint) (string, error) {
	claims := jwt.MapClaims{
		"sub": userID, // user ID
		"iat": time.Now().Unix(),
		"exp": time.Now().Add(time.Hour * 24).Unix(), // Время истечения токена (24 часа)
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(secretKey)
	if err != nil {
		return "", fmt.Errorf("не удалось создать токен: %v", err)
	}

	return tokenString, nil
}

// Проверка JWT
func ValidateToken(tokenString string) (uint, error) {
	token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
		// Проверка метода подписи
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("не поддерживаемый метод подписи")
		}
		return secretKey, nil
	})
	if err != nil || !token.Valid {
		return 0, fmt.Errorf("неверный токен")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return 0, fmt.Errorf("неверные претензии")
	}

	// Возвращаем ID пользователя
	userID := uint(claims["sub"].(float64))
	return userID, nil
}
