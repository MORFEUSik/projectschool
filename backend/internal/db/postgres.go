package db

import (
	"fmt"
	"log"
	"strconv"

	"github.com/MORFEUSik/projectschool/backend/config"
	"github.com/MORFEUSik/projectschool/backend/internal/model"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Init(cfg *config.Config) error {
	port, err := strconv.Atoi(cfg.DBPort)
	if err != nil {
		log.Fatalf("Не удалось преобразовать порт %s в число: %v", cfg.DBPort, err)
	}
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%d",
		cfg.DBHost, cfg.DBUser, cfg.DBPassword, cfg.DBName, port)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Не удалось подключиться к БД: %v", err)
	}

	// Проверка и добавление столбца subject в таблице courses
	log.Println("Checking subject column in courses")
	var subjectColumnExists int
	if err := db.Raw("SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'subject'").Scan(&subjectColumnExists).Error; err != nil {
		log.Printf("Ошибка: не удалось проверить столбец subject: %v", err)
		return err
	}
	if subjectColumnExists == 0 {
		log.Println("Adding subject column to courses")
		if err := db.Exec("ALTER TABLE courses ADD COLUMN subject TEXT").Error; err != nil {
			log.Printf("Ошибка добавления столбца subject: %v", err)
			return err
		}
		log.Println("Updating NULL subject values to default")
		if err := db.Exec("UPDATE courses SET subject = 'Не указан' WHERE subject IS NULL").Error; err != nil {
			log.Printf("Ошибка обновления NULL значений для subject: %v", err)
			return err
		}
		log.Println("Adding NOT NULL constraint to subject")
		if err := db.Exec("ALTER TABLE courses ALTER COLUMN subject SET NOT NULL").Error; err != nil {
			log.Printf("Ошибка установки NOT NULL для subject: %v", err)
			return err
		}
	}

	// Проверка и добавление столбца class_number в таблице courses
	log.Println("Checking class_number column in courses")
	var classNumberColumnExists int
	if err := db.Raw("SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'class_number'").Scan(&classNumberColumnExists).Error; err != nil {
		log.Printf("Ошибка: не удалось проверить столбец class_number: %v", err)
		return err
	}
	if classNumberColumnExists == 0 {
		log.Println("Adding class_number column to courses")
		if err := db.Exec("ALTER TABLE courses ADD COLUMN class_number INTEGER").Error; err != nil {
			log.Printf("Ошибка добавления столбца class_number: %v", err)
			return err
		}
		log.Println("Updating NULL class_number values to default")
		if err := db.Exec("UPDATE courses SET class_number = 0 WHERE class_number IS NULL").Error; err != nil {
			log.Printf("Ошибка обновления NULL значений для class_number: %v", err)
			return err
		}
		log.Println("Adding NOT NULL constraint to class_number")
		if err := db.Exec("ALTER TABLE courses ALTER COLUMN class_number SET NOT NULL").Error; err != nil {
			log.Printf("Ошибка установки NOT NULL для class_number: %v", err)
			return err
		}
	}

	// Автомиграция моделей
	log.Println("Running AutoMigrate")
	err = db.AutoMigrate(
		&model.User{},
		&model.Course{},
		&model.Enrollment{},
		&model.Assignment{},
		&model.Submission{},
		&model.Notification{},
		&model.GlobalAchievement{},
		&model.UserAchievement{},
	)
	if err != nil {
		log.Printf("Ошибка миграции: %v", err)
		return err
	}

	// Проверка и добавление столбца teacher_id в таблице courses
	log.Println("Checking teacher_id column in courses")
	var columnExists int
	err = db.Raw("SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'teacher_id'").Scan(&columnExists).Error
	if err != nil {
		log.Printf("Ошибка: не удалось проверить столбец teacher_id: %v", err)
		return err
	}
	if columnExists == 0 {
		log.Println("Adding teacher_id column to courses")
		if err = db.Exec("ALTER TABLE courses ADD COLUMN teacher_id BIGINT NOT NULL DEFAULT 0").Error; err != nil {
			log.Printf("Ошибка: не удалось добавить teacher_id: %v", err)
			return err
		}
	}

	// Проверка и добавление столбца teacher_id в таблицу assignments
	log.Println("Checking teacher_id column in assignments")
	var assignmentColumnExists int
	err = db.Raw("SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'assignments' AND column_name = 'teacher_id'").Scan(&assignmentColumnExists).Error
	if err != nil {
		log.Printf("Ошибка: не удалось проверить столбец teacher_id в assignments: %v", err)
		return err
	}
	if assignmentColumnExists == 0 {
		log.Println("Adding teacher_id column to assignments")
		if err := db.Exec("ALTER TABLE assignments ADD COLUMN teacher_id BIGINT NOT NULL DEFAULT 0").Error; err != nil {
			log.Printf("Ошибка: не удалось добавить teacher_id: %v", err)
			return err
		}
	}

	// Проверка и обновление столбца password
	log.Println("Checking password column type")
	var columnType string
	err = db.Raw("SELECT data_type FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password'").Scan(&columnType).Error
	if err != nil {
		log.Printf("Ошибка: не удалось проверить тип столбца password: %v", err)
		return err
	}
	if columnType != "character varying" {
		log.Println("Updating password column to varchar(255)")
		if err := db.Exec(`ALTER TABLE users ALTER COLUMN password TYPE VARCHAR(255)`).Error; err != nil {
			log.Printf("Ошибка: не удалось обновить колонку password: %v", err)
			return err
		}
	}

	// Проверка и добавление столбца class_number в таблице users
	log.Println("Checking class_number column in users")
	var classNumberColumnExistsUsers int
	err = db.Raw("SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'class_number'").Scan(&classNumberColumnExistsUsers).Error
	if err != nil {
		log.Printf("Ошибка: не удалось проверить столбец class_number: %v", err)
		return err
	}
	if classNumberColumnExistsUsers == 0 {
		log.Println("Adding class_number column to users")
		if err := db.Exec("ALTER TABLE users ADD COLUMN class_number INTEGER DEFAULT 0").Error; err != nil {
			log.Printf("Ошибка: не удалось добавить class_number: %v", err)
			return err
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
		log.Printf("Ошибка: не удалось добавить уникальные индексы: %v", err)
		return err
	}

	// Добавление индексов для оптимизации
	log.Println("Ensuring indexes")
	err = db.Exec(`
		DO $$
		BEGIN
			IF NOT EXISTS (
				SELECT 1
				FROM pg_indexes
				WHERE indexname = 'idx_submissions_user_id'
			) THEN
				CREATE INDEX idx_submissions_user_id ON submissions(user_id);
			END IF;
			IF NOT EXISTS (
				SELECT 1
				FROM pg_indexes
				WHERE indexname = 'idx_assignments_course_id'
			) THEN
				CREATE INDEX idx_assignments_course_id ON assignments(course_id);
			END IF;
			IF NOT EXISTS (
				SELECT 1
				FROM pg_indexes
				WHERE indexname = 'idx_notifications_user_id'
			) THEN
				CREATE INDEX idx_notifications_user_id ON notifications(user_id);
			END IF;
			IF NOT EXISTS (
				SELECT 1
				FROM pg_indexes
				WHERE indexname = 'idx_user_achievements_user_id'
			) THEN
				CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
			END IF;
		END $$;
	`).Error
	if err != nil {
		log.Printf("Ошибка: не удалось добавить индексы: %v", err)
		return err
	}

	// Проверка и добавление столбца is_read в таблице notifications
	log.Println("Checking is_read column in notifications")
	var isReadColumnExists int
	if err := db.Raw("SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'is_read'").Scan(&isReadColumnExists).Error; err != nil {
		log.Printf("Ошибка: не удалось проверить столбец is_read: %v", err)
		return err
	}
	if isReadColumnExists == 0 {
		log.Println("Adding is_read column to notifications")
		if err := db.Exec("ALTER TABLE notifications ADD COLUMN is_read BOOLEAN DEFAULT FALSE").Error; err != nil {
			log.Printf("Ошибка: не удалось добавить is_read: %v", err)
			return err
		}
	}

	// Логирование схем таблиц
	type ColumnSchema struct {
		ColumnName string `gorm:"column:column_name"`
		DataType   string `gorm:"column:data_type"`
	}

	// Схема таблицы users
	var schemas []ColumnSchema
	err = db.Raw("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'").Scan(&schemas).Error
	if err != nil {
		log.Printf("Ошибка: не удалось получить схему таблицы users: %v", err)
		return err
	}
	log.Println("Table users schema:")
	for _, schema := range schemas {
		log.Printf("  Column: %s, Type: %s", schema.ColumnName, schema.DataType)
	}

	// Схема таблицы courses
	var courseSchemas []ColumnSchema
	err = db.Raw("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'courses'").Scan(&courseSchemas).Error
	if err != nil {
		log.Printf("Ошибка: не удалось получить схему таблицы courses: %v", err)
		return err
	}
	log.Println("Table courses schema:")
	for _, schema := range courseSchemas {
		log.Printf("  Column: %s, Type: %s", schema.ColumnName, schema.DataType)
	}

	// Схема таблицы assignments
	var assignmentSchemas []ColumnSchema
	err = db.Raw("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'assignments'").Scan(&assignmentSchemas).Error
	if err != nil {
		log.Printf("Ошибка: не удалось получить схему таблицы assignments: %v", err)
		return err
	}
	log.Println("Table assignments schema:")
	for _, schema := range assignmentSchemas {
		log.Printf("  Column: %s, Type: %s", schema.ColumnName, schema.DataType)
	}

	// Схема таблицы notifications
	var notificationSchemas []ColumnSchema
	err = db.Raw("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'notifications'").Scan(&notificationSchemas).Error
	if err != nil {
		log.Printf("Ошибка: не удалось получить схему таблицы notifications: %v", err)
		return err
	}
	log.Println("Table notifications schema:")
	for _, schema := range notificationSchemas {
		log.Printf("  Column: %s, Type: %s", schema.ColumnName, schema.DataType)
	}

	// Схема таблицы global_achievements
	var globalAchievementSchemas []ColumnSchema
	err = db.Raw("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'global_achievements'").Scan(&globalAchievementSchemas).Error
	if err != nil {
		log.Printf("Ошибка: не удалось получить схему таблицы global_achievements: %v", err)
		return err
	}
	log.Println("Table global_achievements schema:")
	for _, schema := range globalAchievementSchemas {
		log.Printf("  Column: %s, Type: %s", schema.ColumnName, schema.DataType)
	}

	// Схема таблицы user_achievements
	var userAchievementSchemas []ColumnSchema
	err = db.Raw("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'user_achievements'").Scan(&userAchievementSchemas).Error
	if err != nil {
		log.Printf("Ошибка: не удалось получить схему таблицы user_achievements: %v", err)
		return err
	}
	log.Println("Table user_achievements schema:")
	for _, schema := range userAchievementSchemas {
		log.Printf("  Column: %s, Type: %s", schema.ColumnName, schema.DataType)
	}

	DB = db
	return nil
}
