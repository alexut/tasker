# Todo API Documentation

## Base URL: `/api/todos`

### 1. List Todo Files
Lists all `.todo` files in the configured base directory and its subdirectories.

**Endpoint**: `GET /api/todos`

**Response**:
```json
{
    "files": [
        "work.todo",
        "personal/tasks.todo",
        "projects/project1/todos.todo"
    ]
}
```

---

### 2. Load Todo File
Loads and parses a specific todo file.

**Endpoint**: `GET /api/todos/:filePath`

**Parameters**:
- `filePath`: Relative or absolute path to the todo file (URL encoded)

**Response**:
```json
[
    {
        "name": "Project1",
        "tasks": [
            {
                "text": "Task1 @due(2024-01-01) @assign(John)",
                "status": "uncompleted",
                "tasks": [],
                "note": "",
                "tags": [
                    {
                        "name": "due",
                        "value": "2024-01-01"
                    },
                    {
                        "name": "assign",
                        "value": "John"
                    }
                ],
                "actions": [],
                "oracles": []
            }
        ]
    }
]
```

---

### 3. Update Task
Updates a specific task in a todo file.

**Endpoint**: `PATCH /api/todos/:filePath/tasks/:taskId`

**Parameters**:
- `filePath`: Relative or absolute path to the todo file (URL encoded)
- `taskId`: Task identifier (e.g., "1.1" for the first project's first task)

**Request Body Options**:
```json
{
    "text": "Updated task text",
    "status": "completed",
    "note": "New note text",
    "addTag": {
        "name": "priority",
        "value": "high"
    },
    "removeTag": "assign"
}
```

**Response**:
```json
{
    "text": "Updated task text @priority(high)",
    "status": "completed",
    "note": "New note text",
    "tasks": [],
    "tags": [
        {
            "name": "priority",
            "value": "high"
        }
    ],
    "actions": [],
    "oracles": []
}
```

---

### 4. Execute Task Actions
Executes all actions associated with a task and marks it as completed.

**Endpoint**: `POST /api/todos/:filePath/tasks/:taskId/execute`

**Parameters**:
- `filePath`: Relative or absolute path to the todo file (URL encoded)
- `taskId`: Task identifier (e.g., "1.1" for the first project's first task)

**Response**:
```json
{
    "text": "Task with actions >cmd(echo 'test')",
    "status": "completed",
    "tasks": [],
    "note": "",
    "tags": [],
    "actions": [
        {
            "type": "cmd",
            "params": "echo 'test'"
        }
    ],
    "oracles": []
}
```

---

## Usage Examples

### List all todo files:
```bash
curl http://localhost:3000/api/todos
```

### Load a specific todo file:
```bash
curl http://localhost:3000/api/todos/work.todo
```

### Update a task:
```bash
curl -X PATCH http://localhost:3000/api/todos/work.todo/tasks/1.1 \
-H "Content-Type: application/json" \
-d '{
    "text": "Updated task",
    "addTag": {
        "name": "priority",
        "value": "high"
    }
}'
```

### Execute task actions:
```bash
curl -X POST http://localhost:3000/api/todos/work.todo/tasks/1.1/execute
```

## Task ID Format
Task IDs use a dot-notation format to identify tasks, such as `1.1` for the first project’s first task.

---