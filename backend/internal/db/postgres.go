package db

import (
	"fmt"
	"log"

	"github.com/MORFEUSik/projectschool/backend/config"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Init(cfg *config.Config) {
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
		cfg.DBHost, cfg.DBUser, cfg.DBPassword, cfg.DBName, cfg.DBPort)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Не удалось подключиться к БД: %v", err)
	}

	// Автомиграция моделей
	log.Println("Running AutoMigrate")
	err = db.AutoMigrate(
		&model.User{},
		&model.Course{},
		&model.Enrollment{},
		&model.Assignment{},
		&model.Submission{},
		&model.Test{},
		&model.Achievement{},
	)
	if err != nil {
		log.Fatalf("Ошибка миграции: %v", err)
	}

	// Проверка и добавление столбца teacher_id в таблицу courses
	log.Println("Checking teacher_id column in courses")
	var columnExists int
	err = db.Raw("SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'teacher_id'").Scan(&columnExists).Error
	if err != nil {
		log.Printf("Предупреждение: не удалось проверить столбец teacher_id: %v", err)
	} else if columnExists == 0 {
		log.Println("Adding teacher_id column to courses")
		err = db.Exec("ALTER TABLE courses ADD COLUMN teacher_id BIGINT NOT NULL DEFAULT 0").Error
		if err != nil {
			log.Printf("Предупреждение: не удалось добавить teacher_id: %v", err)
		}
	}

	// Проверка и обновление колонки password
	log.Println("Checking password column type")
	var columnType string
	err = db.Raw("SELECT data_type FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password'").Scan(&columnType).Error
	if err != nil {
		log.Printf("Предупреждение: не удалось проверить тип колонки password: %v", err)
	} else if columnType != "character varying" {
		log.Println("Updating password column to varchar(255)")
		err = db.Exec(`ALTER TABLE users ALTER COLUMN password TYPE varchar(255)`).Error
		if err != nil {
			log.Printf("Предупреждение: не удалось обновить колонку password: %v", err)
		}
	}

	// Проверка уникальных индексов
	log.Println("Ensuring unique constraints")
	err = db.Exec(`
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM pg_constraint
                WHERE conname = 'users_email_key'
            ) THEN
                ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);
            END IF;
            IF NOT EXISTS (
                SELECT 1
                FROM pg_constraint
                WHERE conname = 'users_username_key'
            ) THEN
                ALTER TABLE users ADD CONSTRAINT users_username_key UNIQUE (username);
            END IF;
        END $$;
    `).Error
	if err != nil {
		log.Printf("Предупреждение: не удалось добавить уникальные индексы: %v", err)
	}

	// Логирование схемы таблицы users
	type ColumnSchema struct {
		ColumnName string `gorm:"column:column_name"`
		DataType   string `gorm:"column:data_type"`
	}
	var schemas []ColumnSchema
	err = db.Raw("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'").Scan(&schemas).Error
	if err != nil {
		log.Printf("Предупреждение: не удалось получить схему таблицы users: %v", err)
	} else {
		log.Println("Table users schema:")
		for _, schema := range schemas {
			log.Printf("  Column: %s, Type: %s", schema.ColumnName, schema.DataType)
		}
	}

	// Логирование схемы таблицы courses
	var courseSchemas []ColumnSchema
	err = db.Raw("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'courses'").Scan(&courseSchemas).Error
	if err != nil {
		log.Printf("Предупреждение: не удалось получить схему таблицы courses: %v", err)
	} else {
		log.Println("Table courses schema:")
		for _, schema := range courseSchemas {
			log.Printf("  Column: %s, Type: %s", schema.ColumnName, schema.DataType)
		}
	}

	DB = db
}
