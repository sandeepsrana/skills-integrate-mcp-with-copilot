# Mergington High School Activities API

A super simple FastAPI application that allows everyone to view activities,
while only teachers can register and unregister students.

## Features

- View all available extracurricular activities
- Teacher login for administrative actions
- Register and unregister students (teacher-only)

## Getting Started

1. Install the dependencies:

   ```
   pip install fastapi uvicorn
   ```

2. Run the application:

   ```
   python app.py
   ```

3. Open your browser and go to:
   - API documentation: http://localhost:8000/docs
   - Alternative documentation: http://localhost:8000/redoc

## API Endpoints

| Method | Endpoint                                                          | Description                                                         |
| ------ | ----------------------------------------------------------------- | ------------------------------------------------------------------- |
| GET    | `/activities`                                                     | Get all activities with their details and current participant count |
| GET    | `/auth/login`                                                     | Verify teacher credentials (Basic auth required)                    |
| POST   | `/activities/{activity_name}/signup?email=student@mergington.edu` | Register a student for an activity (teacher-only)                   |
| DELETE | `/activities/{activity_name}/unregister?email=student@...`        | Unregister a student from an activity (teacher-only)                |

## Data Model

The application uses a simple data model with meaningful identifiers:

1. **Activities** - Uses activity name as identifier:

   - Description
   - Schedule
   - Maximum number of participants allowed
   - List of student emails who are signed up

2. **Students** - Uses email as identifier:
   - Name
   - Grade level

Activity data is stored in memory, which means participant changes reset when the server restarts.

Teacher credentials are stored in `teachers.json` and used by the backend for Basic authentication.
