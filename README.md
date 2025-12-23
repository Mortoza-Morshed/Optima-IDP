# Optima IDP

Optima IDP is an intelligent Individual Development Plan platform that connects employees with personalized learning resources and career path recommendations using AI.

## Project Structure

- **`backend/`**: Node.js/Express API server
- **`recommender/`**: Python/FastAPI AI recommendation service
- **`frontend/`**: React/Vite web application
- **`docs/`**: Detailed documentation

## Documentation

- **[System Design](docs/SYSTEM-DESIGN.md)**: Architecture and component details.
- **[API Specification](docs/API-SPEC.md)**: Detailed API endpoints.
- **[Database Schema](docs/DB-SCHEMA.md)**: MongoDB schema definitions.
- **[ML Model Notes](docs/ML-MODEL-NOTES.md)**: Machine learning implementation details.

## Setup Instructions

### Prerequisites
- **Node.js**: v16+
- **Python**: v3.9+
- **MongoDB**: Running locally on port `27017`
- **Redis**: Running locally on port `6379`
    - *Windows Users*: Use WSL (Windows Subsystem for Linux) to run Redis.

### Configuration
A `.env` file should be located at the root of the project containing configuration for all services.

### Running the Project

You will need to run the services in **3 separate terminals**.

#### 1. Backend
```bash
cd backend
npm install
npm run dev
```
*Expected Output:* `Server running on port 5000`

#### 2. Recommender Service
```bash
cd recommender
# Create virtual environment (if not exists)
# python -m venv .venv

# Activate virtual environment
# Windows:
.\.venv\Scripts\Activate
# Mac/Linux:
# source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run service
python main.py
```
*Expected Output:* `Uvicorn running on http://0.0.0.0:8000`

#### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
*Expected Output:* `Local: http://localhost:5173`

## Authentication
The system uses a **Dual Token** mechanism for security:
- **Access Token**: Short-lived (15 min), used for API requests.
- **Refresh Token**: Long-lived (7 days), used to get new access tokens.

Upon login, both tokens are returned. The frontend handles automatic refreshing when 401 errors occur.
