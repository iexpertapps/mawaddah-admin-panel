# Mawaddah Backend

Django 4.x backend for the Mawaddah Admin Panel.

## Features

- Django 4.2.7 with Django REST Framework
- Custom User model with email authentication
- PostgreSQL for production, SQLite for development
- Environment-based configuration
- Admin interface for user management
- RESTful API endpoints

## Setup

### Prerequisites

- Python 3.8+
- pip
- PostgreSQL (for production)

### Installation

1. **Clone the repository and navigate to backend:**
   ```bash
   cd backend
   ```

2. **Create and activate virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

5. **Run migrations:**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

6. **Create superuser:**
   ```bash
   python manage.py createsuperuser
   ```

7. **Run the development server:**
   ```bash
   python manage.py runserver
   ```

## Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
DEBUG=True
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///db.sqlite3
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

For production, add PostgreSQL configuration:

```env
DB_NAME=your_db_name
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432
```

## API Endpoints

### Users

- `GET /api/users/` - List all users (Admin only)
- `POST /api/users/` - Create a new user (Admin only)
- `GET /api/users/{id}/` - Get user details
- `PUT /api/users/{id}/` - Update user
- `DELETE /api/users/{id}/` - Delete user

## Admin Interface

Access the Django admin at `http://localhost:8000/admin/` to manage users and other data.

## Development

### Running Tests
```bash
python manage.py test
```

### Making Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### Collecting Static Files
```bash
python manage.py collectstatic
```

## Project Structure

```
backend/
├── mawaddah_backend/     # Main Django project
├── users/                # Users app
├── requirements.txt      # Python dependencies
├── .env                 # Environment variables
├── manage.py           # Django management script
└── README.md           # This file
``` 