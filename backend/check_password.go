package main

import (
	"fmt"
	"os"

	"golang.org/x/crypto/bcrypt"
)

func main() {
	// Использование: go run check_password.go "<хеш_из_базы>" "<пароль>"
	// Пример: go run check_password.go "$2a$10$UnG5qiU1.YMwM4bAnTvl9OCFU8EO1BQmH902eHw/2iWk0Rzrtkqcm" "adminpass123"
	if len(os.Args) < 3 {
		fmt.Println("Использование: go run check_password.go <хеш_из_базы> <пароль>")
		os.Exit(1)
	}

	hash := os.Args[1]
	password := os.Args[2]

	fmt.Printf("Проверка хеша: %s\n", hash)
	fmt.Printf("Пароль: %s\n", password)

	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	if err != nil {
		fmt.Printf("Пароль не совпадает: %v\n", err)
	} else {
		fmt.Println("Пароль совпадает!")
	}
}
