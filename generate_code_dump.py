import os
from pathlib import Path

# Конфигурация
FRONTEND_DIR = "frontend"
BACKEND_DIR = "backend"
OUTPUT_DIR = "code_dumps"

# Расширения и исключения (остаются как в предыдущей версии)
ALLOWED_EXTENSIONS = {".ts", ".tsx", ".go"}
IGNORED_DIRS = {"node_modules", ".next", "docs", "uploads", "Uploads"}
IGNORED_FILES = {
    "bun.lockb", "package.json", "tsconfig.json", "next.config.ts", 
    "next-env.d.ts", "postcss.config.mjs", "eslint.config.mjs", 
    "README.md", ".gitignore", "go.mod", "go.sum", ".env", 
    "check_password.go", "cmd/docs/docs.go", "cmd/docs/swagger.json",
    "cmd/docs/swagger.yaml", "docs/docs.go", "docs/swagger.json",
    "docs/swagger.yaml"
}

def generate_tree(directory, prefix=""):
    """Генерирует ASCII-дерево файлов"""
    tree = []
    try:
        entries = sorted(os.listdir(directory))
        for i, entry in enumerate(entries):
            path = os.path.join(directory, entry)
            if entry in IGNORED_DIRS or entry.startswith('.'):
                continue
                
            is_last = i == len(entries) - 1
            marker = "└── " if is_last else "├── "
            
            tree.append(f"{prefix}{marker}{entry}")
            
            if os.path.isdir(path):
                extension = "    " if is_last else "│   "
                tree.extend(generate_tree(
                    path, 
                    prefix=f"{prefix}{extension}"
                ))
    except Exception as e:
        print(f"⚠️ Ошибка при сканировании {directory}: {e}")
    return tree

def scan_project(directory, project_type):
    """Сканирует весь проект и возвращает структурированные данные"""
    # Генерируем дерево файлов
    tree = [f"{project_type}/"] + generate_tree(directory)
    tree_str = "\n".join(tree)
    
    # Собираем код файлов
    code_entries = []
    for root, dirs, files in os.walk(directory):
        dirs[:] = [d for d in dirs if d not in IGNORED_DIRS and not d.startswith('.')]
        for file in files:
            if (any(file.endswith(ext) for ext in ALLOWED_EXTENSIONS) and file not in IGNORED_FILES):
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, directory)
                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        content = f.read()
                    code_entries.append({
                        "path": f"{project_type}/{rel_path}",
                        "content": content
                    })
                except Exception as e:
                    print(f"⚠️ Ошибка при чтении {file_path}: {e}")
    
    return {
        "tree": tree_str,
        "files": code_entries
    }

def generate_output(project_data, separator_length=80):
    """Генерирует форматированный вывод для проекта"""
    output = []
    
    # Добавляем дерево файлов
    output.append("=" * separator_length)
    output.append("ФАЙЛОВАЯ СТРУКТУРА")
    output.append("=" * separator_length)
    output.append(project_data["tree"])
    
    # Добавляем содержимое файлов
    output.append("\n" + "=" * separator_length)
    output.append("СОДЕРЖИМОЕ ФАЙЛОВ")
    output.append("=" * separator_length)
    
    for entry in project_data["files"]:
        output.append(f"\n\n{'═' * separator_length}")
        output.append(f"║ {entry['path']}")
        output.append(f"{'═' * separator_length}\n")
        output.append(entry["content"])
    
    return "\n".join(output)

def main():
    print("🛠️ Подготовка структуры проекта...")
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    print("🔍 Сканирую frontend...")
    frontend_data = scan_project(FRONTEND_DIR, "frontend")
    
    print("🔍 Сканирую backend...")
    backend_data = scan_project(BACKEND_DIR, "backend")
    
    # Генерируем отдельные файлы
    print("\n📝 Сохраняю результаты...")
    with open(os.path.join(OUTPUT_DIR, "FRONTEND.md"), "w", encoding="utf-8") as f:
        f.write(generate_output(frontend_data))
    
    with open(os.path.join(OUTPUT_DIR, "BACKEND.md"), "w", encoding="utf-8") as f:
        f.write(generate_output(backend_data))
    
    # Генерируем объединенный файл
    with open(os.path.join(OUTPUT_DIR, "FULL_PROJECT.md"), "w", encoding="utf-8") as f:
        f.write("🚀 ПОЛНАЯ СТРУКТУРА ПРОЕКТА 🚀\n\n")
        f.write("=" * 80 + "\n")
        f.write("🎨 FRONTEND ЧАСТЬ\n")
        f.write("=" * 80 + "\n\n")
        f.write(generate_output(frontend_data))
        f.write("\n\n" + "=" * 80 + "\n")
        f.write("⚙️ BACKEND ЧАСТЬ\n")
        f.write("=" * 80 + "\n\n")
        f.write(generate_output(backend_data))
    
    print(f"""
✅ Готово! Результаты сохранены в папке {OUTPUT_DIR}:
- FRONTEND.md - фронтенд часть
- BACKEND.md - бэкенд часть
- FULL_PROJECT.md - объединенная версия

📁 Структура проектов и содержимое файлов сохранены в Markdown-формате
с четким разделением и визуальными границами.
""")

if __name__ == "__main__":
    main()
