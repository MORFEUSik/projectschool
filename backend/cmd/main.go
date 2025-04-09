package main

import (
	"github.com/MORFEUSik/projectschool/backend/config"
	"github.com/MORFEUSik/projectschool/backend/internal/db"
)

func main() {
	cfg := config.LoadConfig()
	db.Init(cfg)

	// Здесь позже подключим router, handler и т.д.
}
