# ProjeX - Project Management System

A full-stack project management application built with Django REST Framework backend and vanilla JavaScript frontend.

## Features

- User authentication and profiles
- Project creation and management
- Task assignment and tracking
- Member collaboration
- Dashboard with project statistics
- RESTful API endpoints

## Tech Stack

- **Backend**: Django, Django REST Framework
- **Frontend**: HTML, CSS, JavaScript
- **Database**: MySQL (optional)
- **Authentication**: Django's built-in authentication

## Prerequisites

- Python 3.8+ installed
- Git installed
- (Optional) MySQL server if you want to use MySQL instead of SQLite

## Setup Instructions

### For macOS

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd ProjeX
```

2. **Create and activate virtual environment**
```bash
python3 -m venv venv
source venv/bin/activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Configure database settings** (see Database Configuration section below)

5. **Run migrations**
```bash
python manage.py makemigrations
python manage.py migrate
```

6. **Create superuser** (optional)
```bash
python manage.py createsuperuser
```

7. **Run the development server**
```bash
python manage.py runserver
```

8. **Access the application**
   - Frontend: http://127.0.0.1:8000/
   - API: http://127.0.0.1:8000/api/
   - Admin: http://127.0.0.1:8000/admin/

### For Windows

1. **Clone the repository**
```cmd
git clone <your-repo-url>
cd ProjeX
```

2. **Create and activate virtual environment**
```cmd
python -m venv venv
venv\Scripts\activate
```

3. **Install dependencies**
```cmd
pip install -r requirements.txt
```

4. **Configure database settings** (see Database Configuration section below)

5. **Run migrations**
```cmd
python manage.py makemigrations
python manage.py migrate
```

6. **Create superuser** (optional)
```cmd
python manage.py createsuperuser
```

7. **Run the development server**
```cmd
python manage.py runserver
```

8. **Access the application**
   - Frontend: http://127.0.0.1:8000/
   - API: http://127.0.0.1:8000/api/
   - Admin: http://127.0.0.1:8000/admin/

## Database Configuration

### Option 1: SQLite (Default - Recommended for Development)

SQLite is already configured and requires no additional setup. The database file will be created automatically.

### Option 2: MySQL Configuration

If you prefer to use MySQL, follow these steps:

1. **Install MySQL Server**
   - **macOS**: `brew install mysql` then `brew services start mysql`
   - **Windows**: Download from [MySQL official website](https://dev.mysql.com/downloads/mysql/)

2. **Create a database**
```sql
CREATE DATABASE projex_db;
```

3. **Update settings.py**

Open `core/settings.py` and modify the DATABASES configuration:

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'projex_db',           # Your database name
        'USER': 'your_username',       # Your MySQL username
        'PASSWORD': 'your_password',   # Your MySQL password
        'HOST': 'localhost',           # Database host
        'PORT': '3306',               # Database port (default: 3306)
        'OPTIONS': {
            'sql_mode': 'traditional',
        }
    }
}
```

4. **Replace your credentials:**
   - `your_username`: Your MySQL username (e.g., 'root')
   - `your_password`: Your MySQL password
   - `projex_db`: Your database name (or keep as is)
   - `localhost`: Your database host (usually localhost for local development)
   - `3306`: Your database port (default MySQL port)

5. **Install MySQL client** (if not already installed)
```bash
# macOS
brew install mysql-client

# Or use PyMySQL (already in requirements.txt)
# Add this to manage.py if using PyMySQL:
import pymysql
pymysql.install_as_MySQLdb()
```

## Environment Variables (Recommended)

For security, it's recommended to use environment variables for sensitive information:

1. **Create a `.env` file** in the project root:
```env
SECRET_KEY=your-secret-key-here
DEBUG=True
DB_NAME=projex_db
DB_USER=your_username
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=3306
```

2. **Update settings.py** to use environment variables:
```python
import os
from decouple import config

# Install python-decouple: pip install python-decouple

SECRET_KEY = config('SECRET_KEY')
DEBUG = config('DEBUG', default=False, cast=bool)

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': config('DB_NAME'),
        'USER': config('DB_USER'),
        'PASSWORD': config('DB_PASSWORD'),
        'HOST': config('DB_HOST'),
        'PORT': config('DB_PORT'),
    }
}
```

3. **Install python-decouple**:
```bash
pip install python-decouple
```

## Common Issues and Solutions

### MySQL Connection Error
If you get "Access denied" error:
1. Check your MySQL username and password
2. Ensure MySQL service is running
3. Verify the database exists
4. Check if the user has proper permissions

### Virtual Environment Issues
- **macOS**: Use `source venv/bin/activate`
- **Windows**: Use `venv\Scripts\activate`

### Package Installation Issues
If `mysqlclient` fails to install:
1. Use PyMySQL instead (already configured in requirements.txt)
2. Add the following to `manage.py`:
```python
import pymysql
pymysql.install_as_MySQLdb()
```

## Project Structure

```
ProjeX/
├── core/                   # Django project settings
│   ├── settings.py        # Main settings file
│   ├── urls.py           # URL configuration
│   └── wsgi.py           # WSGI configuration
├── projects/              # Django app for project management
│   ├── models.py         # Database models
│   ├── views.py          # API views
│   ├── urls.py           # App URLs
│   └── serializers.py    # API serializers
├── frontend/              # Frontend files
│   ├── index.html        # Main dashboard
│   ├── style.css         # Styles
│   └── app.js           # JavaScript functionality
├── manage.py             # Django management script
├── requirements.txt      # Python dependencies
└── README.md            # This file
```

## API Endpoints

- `GET /api/projects/` - List all projects
- `POST /api/projects/` - Create new project
- `GET /api/projects/{id}/` - Get project details
- `PUT /api/projects/{id}/` - Update project
- `DELETE /api/projects/{id}/` - Delete project
- `GET /api/tasks/` - List all tasks
- `POST /api/tasks/` - Create new task

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.