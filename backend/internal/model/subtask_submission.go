// model/subtask_submission.go
package model

type SubtaskSubmission struct {
	ID        uint   `gorm:"primaryKey"`
	UserID    uint   `gorm:"not null;index"`
	SubtaskID uint   `gorm:"not null;index"`
	Answer    string `gorm:"not null"` // ответ пользователя
	IsCorrect bool   `gorm:"not null"` // правильно ли
	Attempts  int    `gorm:"not null"` // сколько попыток потребовалось
}
