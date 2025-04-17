package main

import (
	"fmt"

	"golang.org/x/crypto/bcrypt"
)

func main() {
	// Вставь хеш пароля из базы
	hash := "$2a$10$UnG5qiU1.YMwM4bAnTvl9OCFU8EO1BQmH902eHw/2iWk0Rzrtkqcm"
	password := "adminpass123"

	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	if err != nil {
		fmt.Printf("Пароль не совпадает: %v\n", err)
	} else {
		fmt.Println("Пароль совпадает!")
	}
}
