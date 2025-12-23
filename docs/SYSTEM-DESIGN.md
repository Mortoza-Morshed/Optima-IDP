# System Design Overview

## Architecture
Optima IDP follows a microservices-inspired architecture with a main backend API and a specialized recommendation service, designed to run in a local development environment.

### Components

1.  **Backend API (Node.js / Express)**
    *   **Role**: Main application logic, user management, IDP CRUD, authentication.
    *   **Database**: MongoDB (via Mongoose).
    *   **Responsibilities**:
        *   Handles user authentication (JWT).
        *   Manages IDPs, Skills, Resources, and Performance Reports.
        *   Proxies recommendation requests to the Python service.

2.  **Recommendation Service (Python / FastAPI)**
    *   **Role**: AI/ML powered recommendations.
    *   **Responsibilities**:
        *   Analyzes user skills and performance data.
        *   Calculates skill similarities using NLP and co-occurrence matrices.
        *   Ranks learning resources based on relevance, difficulty, and user gaps.
    *   **Libraries**: scikit-learn, numpy, pandas.

3.  **Database (MongoDB)**
    *   **Role**: Central data store.
    *   **Collections**: Users, Skills, Resources, IDPs, PerformanceReports, AuditLog, CheckIn, Annoucement.

4.  **Redis & Queue**
    *   **Role**: Caching and Async Message Broker.
    *   **Usage**:
        *   Caches frequent API responses (e.g., all skills).
        *   Manages `recommendation_queue` for async IDP processing.

5.  **Python Worker**
    *   **Role**: Background processor for heavy ML tasks.
    *   **Responsibilities**:
        *   Consumes jobs from Redis queue.
        *   Generates recommendations using FAISS/Embeddings.
        *   Updates IDP status in MongoDB.

6.  **Frontend (React)**
    *   **Role**: User interface for Employees, Managers, and Admins.
    *   **Interaction**: Consumes Backend API.

## Data Flow

1.  **User Request**: Frontend sends request to Node.js Backend.
2.  **Authentication**: Backend verifies JWT.
3.  **Business Logic**: Backend processes request (e.g., create IDP).
4.  **Recommendation (Async)**:
    *   Backend creates IDP with `processing` status.
    *   Backend pushes job to **Redis Queue**.
    *   **Python Worker** picks up job, runs ML logic, and updates IDP in MongoDB.
    *   Frontend polls for status change.

## Local Development Infrastructure

This project is currently configured for local execution without Docker (though the architecture supports containerization).

### Requirements
*   **Node.js**: v16+
*   **Python**: v3.9+ (with Virtual Environment)
*   **MongoDB**: Running locally on port `27017`
*   **Redis**: Running locally on port `6379` (Use WSL on Windows)

### Reliability Patterns
*   **Reliable Queue**: The worker uses the `BRPOPLPUSH` pattern (RPOPLPUSH) to prevent data loss.
    *   Jobs are atomically moved to a `processing` queue before execution.
    *   If the worker crashes, the job remains in the processing queue for recovery.
    *   Jobs are removed only after successful completion.

## Key Features
*   **Role-Based Access Control (RBAC)**: Employee, Manager, Admin roles.
*   **Intelligent Recommendations**: Suggests resources based on skill gaps and performance reviews.
*   **Performance Integration**: IDPs are informed by manager feedback.
*   **Secure Authentication**: Dual-token system (Access + Refresh) with server-side logout.
*   **Admin Audit**: Comprehensive auditing of all critical actions.
