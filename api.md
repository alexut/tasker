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

---

## Action API

### Execute Action
**URL**: `/api/action/execute`
**Method**: `POST`

#### Request Body
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
        \"command\": \"echo\",
        \"args\": [\"Hello World\"]
    }"
}
```

#### Email Actions

##### Send Email
```json
{
    "action": "send_email",
    "parameters": "{
        \"to\": \"recipient@example.com\",
        \"subject\": \"Test Email\",
        \"body\": \"Hello World\",
        \"attachments\": [\"path/to/file.txt\"]
    }"
}
```

##### Get Email
```json
{
    "action": "get_email",
    "parameters": "{
        \"account\": \"myaccount\",
        \"folder\": \"INBOX\",
        \"limit\": 10
    }"
}
```

##### Trash Email
```json
{
    "action": "trash_email",
    "parameters": "{
        \"account\": \"myaccount\",
        \"messageId\": \"12345\"
    }"
}
```

#### Photoshop Actions

##### Create Document
```json
{
    "action": "photoshop",
    "parameters": "{
        \"command\": \"create\",
        \"width\": 800,
        \"height\": 600,
        \"name\": \"test\"
    }"
}
```

##### Add Text
```json
{
    "action": "photoshop",
    "parameters": "{
        \"command\": \"addText\",
        \"text\": \"Hello World\",
        \"x\": 400,
        \"y\": 300,
        \"size\": 48,
        \"color\": [0, 0, 0]
    }"
}
```

##### Add Image
```json
{
    "action": "photoshop",
    "parameters": "{
        \"command\": \"addImage\",
        \"path\": \"path/to/image.jpg\",
        \"width\": 500,
        \"height\": 300
    }"
}
```

##### Save Document
```json
{
    "action": "photoshop",
    "parameters": "{
        \"command\": \"save\",
        \"format\": \"psd\",
        \"path\": \"path/to/save.psd\"
    }"
}
```

### Response Format
```json
{
    "type": "string",     // Action type
    "success": boolean,   // Success status
    "result": object,     // Action result (if successful)
    "error": "string"     // Error message (if failed)
}
```

---