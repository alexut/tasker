# Todo Application Documentation

This documentation provides an overview of the Todo application, including its features, installation instructions, usage guidelines, API endpoints, and testing procedures.

## Table of Contents
- [Introduction](#introduction)
- [Features](#features)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Data Format](#data-format)
## Introduction
The Todo application is a Node.js-based task management system that allows users to create, update, and manage tasks organized into projects. It supports advanced features such as tags, actions, oracles, and notes associated with tasks. The application provides a RESTful API for interacting with todo files and tasks.

## Features
- **Projects and Tasks**: Organize tasks into projects with hierarchical subtasks.
- **Tags**: Use tags to add metadata to tasks (e.g., due dates, assignments).
- **Actions**: Define actions to be executed when tasks are completed.
- **Oracles**: Associate oracles for validation or checking conditions.
- **Notes**: Add detailed notes to tasks for additional context.
- **RESTful API**: Interact with the application using HTTP requests.
## Installation
### Prerequisites
- **Node.js**: Version 12 or higher.
- **npm**: Node.js package manager.

### Steps
#### Clone the Repository
```bash
# Clone repository
 git clone https://github.com/yourusername/todo-app.git
 cd todo-app
```

#### Install Dependencies
## Configuration
The application can be configured via the `src/config/index.js` file. Key configuration options include:

- **Symbols**: Define symbols used for task statuses, tags, actions, and oracles.
- **Settings**:
    - `format`: Date-time format.
    - `timezone`: Application timezone.
    - `locale`: Localization settings.
## Usage
### Starting the Server
To start the server, run:
```bash
npm start
```
The server will listen on `http://localhost:3000` by default.

### Environment Variables
## API Endpoints
### Base URL
```
http://localhost:3000/api/todos
```

### Endpoints
1. **Get Todos**
   - **URL**: `/api/todos/{filePath}`
   #### Example Request:
   ```http
   GET /api/todos/project1.todo HTTP/1.1
   Host: localhost:3000
   ```

2. **Update a Task**
   - **URL**: `/api/todos/{filePath}/tasks/{taskId}`
   - **Method**: `PATCH`
   - **Description**: Updates a task's properties.
   - **Parameters**:
     - `filePath`: Path to the todo file.
     - `taskId`: Identifier of the task (e.g., 1.1 for the first task of the first project).
   - **Request Body**: JSON object with any of the following fields:
     - `text` (string): New text for the task.
     - `status` (string): New status ('completed', 'uncompleted', etc.).
     - `note` (string): New note content.
     - `addTag` (object): `{ "name": "tagName", "value": "tagValue" }` to add a tag.
     - `removeTag` (string): Name of the tag to remove.
   #### Example Request:
   ```http
   PATCH /api/todos/project1.todo/tasks/1.1 HTTP/1.1
   Host: localhost:3000
   Content-Type: application/json

   {
     "text": "Updated Task Text",
     "addTag": {
       "name": "priority",
       "value": "high"
     }
   }
   ```
   #### Example Request:
   ```http
   POST /api/todos/project1.todo/tasks/1.2/execute HTTP/1.1
## Data Format
### Todo File Structure
- **Projects**: Defined by a line ending with a colon `:`.
- **Tasks**: Lines starting with a status symbol (e.g., `[ ]`).
- **Subtasks**: Indented tasks under a parent task.
- **Tags**: Included in the task text using the symbol `@` (e.g., `@due(2024-01-01)`).
- **Actions**: Included using the symbol `>` (e.g., `>notify(email)`).
- **Oracles**: Included using the symbol `#` (e.g., `#health(check)`).
- **Notes**: Lines immediately following a task at the same indentation level.

#### Example:
```plaintext
Project1:
    [ ] Task1 @due(2024-01-01) @assign(John)
### Task Identifiers
Tasks are identified using a dot notation based on their position.
- **Format**: `{projectIndex}.{taskIndex}.{subtaskIndex}...`
- **Example**: `1.2` refers to the second task in the first project.

## Testing
### Running Tests
The application includes comprehensive tests using Jest. To run the tests:
```bash
npm test
```

### Test Structure
- **Unit Tests**: Located in `tests/infrastructure` and `tests/services`.
  - Test parsing, serialization, and service methods.
- **Integration Tests**: Located in `tests/integration`.
  - Test API endpoints and overall application behavior.

### Coverage
Ensure all tests pass and cover key functionalities. Use coverage tools to assess test completeness.

## Contributing
Contributions are welcome! To contribute:
1. Fork the Repository
2. Create a Feature Branch
   ```bash
   git checkout -b feature/your-feature
   ```
## License
This project is licensed under the MIT License.

## Contact
For questions or support, please open an issue on the project's GitHub repository or contact the maintainer at youremail@example.com.

## Additional Notes
- **Logging**: The application uses debug logging. You can enable it by setting `debug: true` in the configuration or by using environment variables.
- **Error Handling**: The API returns meaningful error messages and HTTP status codes to help diagnose issues.

   ```bash
   git commit -m "Add your message"
   ```
4. Push to Your Fork
   ```bash
   git push origin feature/your-feature
   ```
5. Open a Pull Request

Please ensure that new code includes appropriate tests and follows the project's coding standards.
    [ ] Task2 >cmd(echo "Hello World")
```
   ```
3. **Execute Task Actions**
   - **URL**: `/api/todos/{filePath}/tasks/{taskId}/execute`
   - **Method**: `POST`
   - **Description**: Executes actions associated with a task and marks it as completed.
   - **Parameters**:
     - `filePath`: Path to the todo file.
     - `taskId`: Identifier of the task.
   - **Response**:
     - **Status**: 200 OK
     - **Body**: JSON object of the updated task.
     - **Status**: 200 OK
     - **Body**: JSON object of the updated task.
   - **Description**: Retrieves the list of projects and tasks from the specified todo file.
   - **Parameters**:
     - `filePath`: Path to the todo file (URL-encoded if necessary).
   - **Response**:
     - **Status**: 200 OK
     - **Body**: JSON array of projects with tasks.
- `PORT`: Specify the port the server should listen on.
- `TODO_BASE_PATH`: Specify the base path for todo files.
- **Debug**: Enable or disable debug mode.
npm install
```

#### Set Up the Configuration
- Copy the example configuration if necessary.
- Adjust settings in `src/config/index.js` as needed.

#### Start the Application
```bash
npm start
```
The server will start on the default port 3000 unless specified otherwise.
- **Testing**: Comprehensive unit and integration tests ensure reliability.
- [Contributing](#contributing)
- [License](#license)