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
		&model.Notification{},
		&model.GlobalAchievement{},
		&model.UserAchievement{},
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

	// Проверка и добавление столбца teacher_id в таблицу assignments
	log.Println("Checking teacher_id column in assignments")
	var assignmentColumnExists int
	err = db.Raw("SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'assignments' AND column_name = 'teacher_id'").Scan(&assignmentColumnExists).Error
	if err != nil {
		log.Printf("Предупреждение: не удалось проверить столбец teacher_id в assignments: %v", err)
	} else if assignmentColumnExists == 0 {
		log.Println("Adding teacher_id column to assignments")
		err = db.Exec("ALTER TABLE assignments ADD COLUMN teacher_id BIGINT NOT NULL DEFAULT 0").Error
		if err != nil {
			log.Printf("Предупреждение: не удалось добавить teacher_id в assignments: %v", err)
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

	// Проверка и добавление столбца class_number в таблицу users
	log.Println("Checking class_number column in users")
	var classNumberColumnExists int
	err = db.Raw("SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'class_number'").Scan(&classNumberColumnExists).Error
	if err != nil {
		log.Printf("Предупреждение: не удалось проверить столбец class_number: %v", err)
	} else if classNumberColumnExists == 0 {
		log.Println("Adding class_number column to users")
		err = db.Exec("ALTER TABLE users ADD COLUMN class_number INTEGER DEFAULT 0").Error
		if err != nil {
			log.Printf("Предупреждение: не удалось добавить class_number: %v", err)
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
		log.Printf("Предупреждение: не удалось добавить индексы: %v", err)
	}

	// Проверка и добавление столбца is_read в таблицу notifications
	log.Println("Checking is_read column in notifications")
	var isReadColumnExists int
	err = db.Raw("SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'is_read'").Scan(&isReadColumnExists).Error
	if err != nil {
		log.Printf("Предупреждение: не удалось проверить столбец is_read: %v", err)
	} else if isReadColumnExists == 0 {
		log.Println("Adding is_read column to notifications")
		err = db.Exec("ALTER TABLE notifications ADD COLUMN is_read BOOLEAN DEFAULT FALSE").Error
		if err != nil {
			log.Printf("Предупреждение: не удалось добавить is_read: %v", err)
		}
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

	// Логирование схемы таблицы assignments
	var assignmentSchemas []ColumnSchema
	err = db.Raw("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'assignments'").Scan(&assignmentSchemas).Error
	if err != nil {
		log.Printf("Предупреждение: не удалось получить схему таблицы assignments: %v", err)
	} else {
		log.Println("Table assignments schema:")
		for _, schema := range assignmentSchemas {
			log.Printf("  Column: %s, Type: %s", schema.ColumnName, schema.DataType)
		}
	}

	// Логирование схемы таблицы notifications
	var notificationSchemas []ColumnSchema
	err = db.Raw("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'notifications'").Scan(&notificationSchemas).Error
	if err != nil {
		log.Printf("Предупреждение: не удалось получить схему таблицы notifications: %v", err)
	} else {
		log.Println("Table notifications schema:")
		for _, schema := range notificationSchemas {
			log.Printf("  Column: %s, Type: %s", schema.ColumnName, schema.DataType)
		}
	}

	// Логирование схемы таблицы global_achievements
	var globalAchievementSchemas []ColumnSchema
	err = db.Raw("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'global_achievements'").Scan(&globalAchievementSchemas).Error
	if err != nil {
		log.Printf("Предупреждение: не удалось получить схему таблицы global_achievements: %v", err)
	} else {
		log.Println("Table global_achievements schema:")
		for _, schema := range globalAchievementSchemas {
			log.Printf("  Column: %s, Type: %s", schema.ColumnName, schema.DataType)
		}
	}

	// Логирование схемы таблицы user_achievements
	var userAchievementSchemas []ColumnSchema
	err = db.Raw("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'user_achievements'").Scan(&userAchievementSchemas).Error
	if err != nil {
		log.Printf("Предупреждение: не удалось получить схему таблицы user_achievements: %v", err)
	} else {
		log.Println("Table user_achievements schema:")
		for _, schema := range userAchievementSchemas {
			log.Printf("  Column: %s, Type: %s", schema.ColumnName, schema.DataType)
		}
	}

	DB = db
}
