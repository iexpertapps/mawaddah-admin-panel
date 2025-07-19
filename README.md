# Mawaddah Admin Panel Backend

## Project Overview

The **Mawaddah Admin Panel Backend** powers the Mawaddah platform, a spiritually dignified, role-based system for managing users, appeals, donations, and wallet transactions. This repository contains the Django backend, following a clean, layered architecture, and exposes a robust REST API for the admin panel and future integrations.

## Tech Stack

- **Django 4.x**
- **Django REST Framework**
- **PostgreSQL** (production) / **SQLite** (development)
- **Clean Layered Architecture** (views, serializers, permissions, services)

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd mawaddah-admin-panel/backend
   ```
2. **Create a virtual environment**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```
4. **Set up environment variables**
   - Copy `.env.example` to `.env` and update values as needed:
     ```bash
     cp .env.example .env
     ```
5. **Run migrations**
   ```bash
   python manage.py migrate
   ```
6. **Run the development server**
   ```bash
   python manage.py runserver
   ```

## Environment Variables

All environment variables are documented in the [`env.example`](./env.example) file. Copy and adjust as needed for your environment.

## API Documentation

- **Swagger UI:** [`/api/docs/`](http://localhost:8000/api/docs/)
- **OpenAPI JSON:** [`/api/schema/`](http://localhost:8000/api/schema/)
- **Postman Collection:** [`docs/mawaddah-postman-collection.json`](./docs/mawaddah-postman-collection.json)

## Architecture

This project follows a clean, layered Django architecture for maintainability and scalability:

- `models/` – Database models
- `serializers/` – DRF serializers
- `views/` – API views (thin controllers)
- `services/` – Business logic and core operations
- `permissions/` – Custom DRF permissions
- `validators/` – Custom field and business validators

Each app (e.g., `users`, `appeals`, `donations`, `wallet`) follows this structure.

## Testing

To run the test suite:

```bash
python manage.py test
```

## Admin Credentials

To create a superuser for the Django admin panel:

```bash
python manage.py createsuperuser
```

Follow the prompts to set up your admin credentials.

## Next.js Frontend

The [`frontend/`](../frontend) directory contains a scaffolded Next.js 14 project (TypeScript, Tailwind CSS, ESLint). The frontend is currently scaffold-only and not yet integrated with the backend API.

---

For questions or contributions, please open an issue or pull request. 