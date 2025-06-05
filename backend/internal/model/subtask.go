// model/subtask.go
package model

type Subtask struct {
	ID           uint     `gorm:"primaryKey"`
	AssignmentID uint     `gorm:"not null;index"`             // привязка к заданию
	Question     string   `gorm:"type:text;not null"`         // текст вопроса
	Options      []string `gorm:"type:jsonb;serializer:json"` // список вариантов ответа
	Answer       string   `gorm:"not null"`                   // правильный ответ
	SortOrder    int      `gorm:"column:sort_order"`
	File_url     string   `json:"file_url,omitempty"` // Новое поле для URL файла

}
