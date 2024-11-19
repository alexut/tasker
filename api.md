# Tasker API Documentation

## Todo API

### List Todo Files
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

### Health Check
Checks the health status of the API server.

**Endpoint**: `GET /api/todos/health`

**Response**:
```json
{
    "status": "ok",
    "server": "api"
}
```

### List Available Actions
Lists all available actions for todos.
TODO: Thionk if this is needed, used, The frontend handles actions through:

Task status updates via the PATCH endpoint
Timer functionality for task tracking
Task filtering and organization
Since the /api/todos/actions endpoint isn't currently used in the frontend, but it's properly implemented in the backend, we could potentially use it to:

Show available actions when editing a task
Add action suggestions when creating new tasks
Display action capabilities in the task viewer UI

**Endpoint**: `GET /api/todos/actions`

**Response**:
```json
{
    "actions": [
        {
            "name": "string",
            "description": "string"
        }
    ]
}
```

### Load Todo File
Loads and parses a specific todo file.

**Endpoint**: `GET /api/todos/:filename`

**Parameters**:
- `filename`: Relative or absolute path to the todo file (URL encoded)

**Response**:
```json
{
    "filename": "string",
    "content": {
        "projects": [
            {
                "id": "string",
                "name": "string",
                "tasks": [
                    {
                        "id": "string",
                        "text": "string",
                        "done": "boolean",
                        "tags": [
                            {
                                "name": "string",
                                "value": "string"
                            }
                        ]
                    }
                ]
            }
        ]
    }
}
```

### Update Task
Updates a specific task in a todo file.

**Endpoint**: `PATCH /api/todos/:filename/tasks/:taskId`

**Parameters**:
- `filename`: Relative or absolute path to the todo file (URL encoded)
- `taskId`: Task identifier (e.g., "1.1" for the first project's first task)

**Request Body Options**:
```json
{
    "text": "string",
    "done": "boolean",
    "addTag": {
        "name": "string",
        "value": "string"
    },
    "removeTag": "string"
}
```

**Response**:
```json
{
    "success": "boolean",
    "task": {
        "id": "string",
        "text": "string",
        "done": "boolean",
        "tags": [
            {
                "name": "string",
                "value": "string"
            }
        ]
    }
}
```

---

## Actions API

### List Available Actions
Lists all available actions in the system.

**Endpoint**: `GET /api/actions`

**Response**:
```json
{
    "actions": [
        {
            "name": "string",
            "description": "string"
        }
    ]
}
```

### Execute Action
**Endpoint**: `POST /api/actions/execute`
**Method**: `POST`

**Request Body**:
```json
{
    "action": "string",
    "parameters": "string"  // JSON string of parameters
}
```

### Available Actions

#### Browser Action
Control browser windows
```json
{
    "action": "browser",
    "parameters": "{
        \"url\": \"https://example.com\",
        \"width\": 1920,
        \"height\": 1080,
        \"x\": 0,
        \"y\": 0
    }"
}
```

#### Command Action
Execute system commands
```json
{
    "action": "cmd",
    "parameters": "{
        \"command\": \"echo 'Hello World'\"
    }"
}
```

#### Email Actions
Handle email operations
```json
{
    "action": "get_email",  // or "send_email", "trash_email"
    "parameters": "{
        \"account\": \"work\",
        \"query\": \"subject:important\"
    }"
}
```

#### Photoshop Action
Control Photoshop operations
```json
{
    "action": "photoshop",
    "parameters": "{
        \"script\": \"app.activeDocument.save()\"
    }"
}
```

#### File System Action
Perform file system operations
```json
{
    "action": "filesystem",
    "parameters": "{
        \"operation\": \"copy\",
        \"source\": \"path/to/source\",
        \"destination\": \"path/to/dest\"
    }"
}
```

### Response Format
```json
{
    "type": "string",     // Action type
    "success": boolean,   // Success status
    "result": object,     // Action-specific result
    "error": "string"     // Error message if failed
}
```

---

## Oracle API

### List Oracles
**URL**: `/api/oracle`
**Method**: `GET`

#### Response
```json
{
    "oracles": [
        {
            "name": "string",
            "description": "string"
        }
    ]
}
```

### Query Oracle
**URL**: `/api/oracle/query`
**Method**: `POST`

#### Request Body
```json
{
    "name": "string",     // Oracle name (required)
    "path": "string",     // Optional path
    "parameters": {       // Optional parameters
        "key": "value"
    }
}
```

#### Response
```json
{
    "result": {
        // Oracle-specific result object
    }
}
```

### Execute Oracle Script
**URL**: `/api/oracle/execute`
**Method**: `POST`

#### Request Body
```json
{
    "script": "string",    // Oracle script content
    "parameters": {        // Optional parameters
        "key": "value"
    }
}
```

#### Response
```json
{
    "success": boolean,
    "result": object,
    "error": "string"
}
```