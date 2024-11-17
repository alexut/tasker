# Tasker: Advanced Todo Management System

A powerful Node.js-based task management system that combines traditional todo functionality with email integration, command execution, and intelligent data querying.

## Table of Contents
- [Introduction](#introduction)
- [Core Features](#core-features)
- [Features](#features)
- [File Structure and Syntax](#file-structure-and-syntax)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage Examples](#usage-examples)
- [API Reference](#api-reference)

## Introduction

Tasker is a sophisticated todo management system that enhances traditional task tracking with:
- Hierarchical projects and tasks
- Smart data querying through oracles
- Automated actions for task completion
- Email integration and management
- Command execution capabilities

## Core Features

### Todo System

1. **Projects and Tasks**
   ```plaintext
   Project X:
       [ ] Task 1 @due(2024-01-01) @assign(John) >cmd("echo 'Starting...'") #invoices(column("amount").row(1))
           [ ] Subtask 1.1 >cmd("echo 'Subtask 1.1'")
           [ ] Subtask 1.2 #invoices(column("amount").row(1))
   ```

2. **Task Properties**
   - Status: `[ ]`, `[x]`, `[~]`, etc.
   - Tags: `@due()`, `@assign()`, etc.
   - Actions: `>cmd()`, `>send_email()`, etc.
   - Oracles: `#invoices()`, `#projects()`, etc.
   - Notes and attachments

### Action System

Actions are automated tasks that execute when a todo is completed:

1. **Command Execution** (`cmd`)
   ```plaintext
   [ ] Deploy website >cmd("npm run deploy")
   ```

2. **Email Management**
   ```plaintext
   [ ] Send invoice >send_email("billing@company.com", "Invoice Ready", "Please find attached...")
   [ ] Archive old emails >trash_email("user@company.com", "123")
   ```

### Oracle System

Oracles provide dynamic data validation and lookup:

1. **JSON Oracles**
   ```plaintext
   [ ] Review project status #projects(active).count
   [ ] Check budget #projects(web-app).budget
   ```

2. **CSV Oracles**
   ```plaintext
   [ ] Process invoice #invoices(column("status").row(1))
   [ ] Update client info #clients(column("name").row(last))
   ```

3. **Script Oracles**
   ```plaintext
   [ ] Convert budget #curs(convert(1000, "EUR", "RON"))
   ```

## Features

### Core Functionality
- **Projects and Tasks**: Organize tasks into projects with hierarchical subtasks, allowing complex task breakdowns
- **Tags**: Use tags to add metadata to tasks (e.g., `@due(2024-01-01)`, `@assign(John)`, `@priority(high)`)
- **Actions**: Define actions to be executed when tasks are completed (e.g., `>cmd(deploy)`, `>send_email(...)`)
- **Oracles**: Associate oracles for validation or checking conditions (e.g., `#invoices(status)`, `#projects(budget)`)
- **Notes**: Add detailed notes to tasks for additional context, supporting multi-line text
- **RESTful API**: Interact with the application using HTTP requests for automation and integration

### File Structure and Syntax

#### Basic Structure
```plaintext
Project Name:
    [ ] Task 1 @tag1(value) @tag2(value) >cmd("npm test") #oracle(check-status)
        Notes for Task 1 (indented at same level)
        More notes...
        [ ] Subtask 1.1 @due(2024-01-01) >cmd("npm test")
        [ ] Subtask 1.2 @assign(John) >cmd("npm test") #oracle(check-status)
    
    [x] Task 2 @due(2024-01-01) @assign(John) >cmd("npm test") #oracle(check-status)
```

#### Components
1. **Projects**
   - Defined by a line ending with a colon `:`
   - Can contain multiple tasks and subprojects
   - Example:
     ```plaintext
     Backend:
         API Development:
             [ ] Implement endpoints @type(feature) >cmd("npm run build")
     ```

2. **Tasks**
   - Start with a status symbol: `[ ]`, `[x]`, `[~]`, etc.
   - Can have subtasks (indented)
   - Tags, actions, and oracles must be on the same line as the task
   - Example:
     ```plaintext
     [ ] Review pull request @assign(Sarah) @due(today) #projects(status)
         [x] Check code style @type(review)
         [ ] Run tests @coverage(80) >cmd("npm test") #tests(coverage)
     ```

3. **Tags**
   - Must be on the same line as the task
   - Start with `@` symbol
   - Format: `@name(value)`
   - Common tags:
     ```plaintext
     [ ] Task with tags @due(2024-01-01) @assign(John) @priority(high) @status(blocked) @repeat(daily)
     ```

4. **Actions**
   - Start with `>` symbol
   - Execute when task is completed
   - Format: `>action("param1", "param2", ...)`
   - Parameters must be quoted
   - Examples:
     ```plaintext
     >cmd("npm run deploy")                                # Run command
     >send_email("team@company.com", "Update", "Hello")    # Send email with subject and body
     >trash_email("support@company.com", "123")            # Archive email with UID
     ```

5. **Oracles**
   - Start with `#` symbol
   - Query external data sources
   - Format: `#oracle(query-path)`
   - Examples:
     ```plaintext
     #invoices(status)                   # Check invoice status
     #projects(web-app).budget           # Get project budget
     #curs(convert(1000, "EUR", "RON"))   # Currency conversion
     ```

6. **Notes**
   - Lines following a task at the same indentation
   - Support multiple lines
   - Can contain any text content
   - Example:
     ```plaintext
     [ ] Implement login
         Technical notes:
         - Use JWT for authentication
         - Add rate limiting
         - Implement OAuth providers
     ```

### Task States
- `[ ]` - Pending/Todo
- `[x]` - Completed
- `[~]` - In Progress
- `[-]` - Cancelled
- `[?]` - Needs Review
- `[!]` - Urgent/Important

### Indentation Rules
- Each level uses 4 spaces
- Subtasks are indented under parent tasks
- Notes are indented at same level as their task
- Actions/oracles can be on same line or indented

### Example with All Features
```plaintext
Development Tasks:
    [ ] API Implementation @due(2024-02-01) @assign(John) >cmd("npm run build")
        Notes:
        - Use REST architecture
        - Follow OpenAPI spec
        
        [ ] Setup project >cmd("npm init")
            #projects(template).copy
        
        [ ] Implement endpoints @priority(high) >cmd("npm run build")
            [ ] Authentication
                #security(oauth-config)
                >cmd("npm install passport")
            
            [ ] User management
                Notes:
                - Include GDPR compliance
                - Add audit logging
                #users(schema).validate
        
        [ ] Write tests @coverage(80) >cmd("npm test")
            #tests(coverage).check

    [x] Database Setup @completed(2024-01-15)
        Used PostgreSQL version 14
        >cmd("docker-compose up db")
        #db(status).verify
```

## Usage Examples

### 1. Project Management
```plaintext
Website Redesign:
    [ ] Gather requirements @due(2024-02-01) >cmd("npm run build")
        [ ] Client meeting #calendar(next-meeting)
        [ ] Document specs >cmd("code specs.md")
    
    [ ] Design phase @assign(Sarah) >cmd("npm run build")
        [ ] Create mockups
        [ ] Get approval >send_email("client@example.com", "Design Review")
    
    [ ] Development @budget(5000) >cmd("npm run build")
        [ ] Setup environment >cmd("npm install")
        [ ] Implement design #projects(web-app).status
```

### 2. Invoice Processing
```plaintext
Finance:
    [ ] Process new invoices >cmd("npm run build")
        [ ] Check amount #invoices(latest).amount
        [ ] Send to client >send_email("client@example.com", "Invoice")
        [ ] Record payment >cmd("node record-payment.js")
```

### 3. Email Management
```plaintext
Communications:
    [ ] Handle support emails >cmd("npm run build")
        [ ] Check inbox #get_email("support@company.com")
        [ ] Archive old tickets >trash_email("support@company.com", "old")
        [ ] Send updates >send_email("team@company.com", "Support Update")
```

### Real-World Example: Email Template System

```plaintext
Email Templates:
    [ ] Update invoice template >cmd("npm run build")
        Notes:
        - Use company branding
        - Include payment instructions
        - Add dynamic fields
        
        [ ] Check current template >cmd("code templates/invoice.html")
            #templates(emails.type("invoice")).content
            >cmd("code templates/invoice.html")
        
        [ ] Update variables >cmd("npm run build")
            #templates(emails.type("invoice")).fields
            [ ] Add amount field @required
            [ ] Add due date @format(YYYY-MM-DD)
        
        [ ] Test template @assign(Sarah) >cmd("npm run build")
            [ ] Get test invoice data
                #invoices(latest).data
            [ ] Send test email
                >send_email("test@company.com", "Invoice Test")
            [ ] Verify formatting
                #templates(validate).check
        
        [ ] Deploy template @requires(approval) >cmd("npm run build")
            [ ] Get approval
                >send_email("manager@company.com", "Template Review")
                #get_email("manager@company.com").response
            [ ] Update production
                >cmd("npm run deploy:templates")
                #templates(status).verify

    [ ] Clean old templates @auto-archive >cmd("npm run build")
        [ ] Find unused templates
            #templates(unused).list
        [ ] Archive emails
            >trash_email("templates@company.com", "old")
        [ ] Update registry
            #templates(registry).clean
```

This example shows:

1. **Task Organization**
   - Hierarchical structure with projects and subtasks
   - Notes for additional context
   - Dependencies between tasks (`@requires`)

2. **Data Integration**
   - Template content querying: `#templates(emails.type("invoice")).content`
   - Invoice data lookup: `#invoices(latest).data`
   - Template validation: `#templates(validate).check`

3. **Email Workflow**
   - Send review request: `>send_email("manager@company.com", "Template Review")`
   - Check response: `#get_email("manager@company.com").response`
   - Archive old emails: `>trash_email("templates@company.com", "old")`

4. **Command Execution**
   - Edit template: `>cmd("code templates/invoice.html")`
   - Deploy changes: `>cmd("npm run deploy:templates")`

5. **Task Metadata**
   - Assignments: `@assign(Sarah)`
   - Requirements: `@required`, `@requires(approval)`
   - Formatting rules: `@format(YYYY-MM-DD)`
   - Automation flags: `@auto-archive`

6. **Validation Flow**
   1. Check current template
   2. Update and validate fields
   3. Test with real data
   4. Get approval
   5. Deploy to production
   6. Clean up old templates

This example demonstrates how tasks, actions, and oracles work together in a real business process, combining:
- Email template management
- Approval workflows
- Data validation
- Deployment automation
- Cleanup procedures

## Future Enhancements

1. **Oracle-Action Integration**
   ```plaintext
   Planned Features:
   [ ] Enable oracle results in action parameters
       Examples:
       >send_email("client@company.com", #templates(invoice).subject, #templates(invoice).body)
       >cmd(#projects(current).deploy_command)
       Notes:
       - Parse oracle results before action execution
       - Support multiple oracles per action
       - Handle oracle errors gracefully
   
   [ ] Add action parameter validation
       [ ] Type checking
       [ ] Required vs optional parameters
       [ ] Default values
   
   [ ] Improve error handling
       [ ] Better error messages
       [ ] Fallback options
       [ ] Retry mechanisms
   ```

## API Reference

### Todo API

#### Get Todo List
```http
GET /api/todos/{filePath}

Response:
{
    "projects": [
        {
            "name": "Website Redesign",
            "tasks": [
                {
                    "id": "1.1",
                    "text": "Gather requirements",
                    "status": "pending",
                    "tags": [
                        { "name": "due", "value": "2024-02-01" }
                    ]
                }
            ]
        }
    ]
}
```

#### Update Task
```http
PATCH /api/todos/{filePath}/tasks/{taskId}
{
    "status": "completed",
    "addTag": {
        "name": "completed",
        "value": "2024-01-20"
    }
}
```

### Actions API

#### List Actions
```http
GET /api/actions

Response:
{
    "actions": [
        {
            "name": "cmd",
            "description": "Execute a command in the console"
        },
        {
            "name": "send_email",
            "description": "Send an email from a specified account"
        },
        {
            "name": "get_email",
            "description": "Get emails from accounts"
        },
        {
            "name": "trash_email",
            "description": "Move emails to trash"
        }
    ]
}
```

#### Execute Action
```http
POST /api/actions/execute
Content-Type: application/json

{
    "action": "cmd",
    "parameters": "echo \"test\""
}

Response:
{
    "type": "cmd",
    "success": true,
    "result": {
        "stdout": "test",
        "stderr": ""
    }
}
```

### Oracles API

#### List Oracles
```http
GET /api/oracles

Response:
{
    "oracles": [
        {
            "name": "invoices",
            "type": "csv",
            "parameters": "client (string), status (string), date (date)",
            "returns": "List of invoices"
        },
        {
            "name": "projects",
            "type": "json"
        }
    ]
}
```

#### Query Oracle
```http
POST /api/oracles/query
Content-Type: application/json

{
    "name": "invoices",
    "path": "column(\"amount\").row(1)",
    "parameters": {
        "client": "ACME Corp"
    }
}

Response:
{
    "result": "1000.00"
}
```

## Configuration

### Todo Settings
```javascript
module.exports = {
    symbols: {
        pending: '[ ]',
        completed: '[x]',
        actions: '>',
        oracles: '#',
        tags: '@'
    }
}
```

### Email Accounts
```json
{
  "accounts": [
    {
      "account_name": "user@example.com",
      "password": "app-specific-password",
      "server": "imap.gmail.com",
      "port": 993,
      "security": "SSL/TLS"
    }
  ]
}
```

### Oracles
```javascript
module.exports = {
    oracles: {
        'invoices': 'finances/invoices.csv',
        'projects': 'core/projects.json',
        'templates': 'templates/templates.json',
        'curs': 'core/scripts/cursvalutar.oracle'
    }
};
```

## Error Handling

Actions and oracles provide detailed error messages:

```json
{
    "type": "cmd",
    "success": false,
    "error": "Command execution failed: Command not found"
}
```

## Testing

Run the test suite:
```bash
npm test
```

Integration tests cover:
- Action execution
- Oracle querying
- Email operations
- Command execution