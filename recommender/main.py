"""
Main Application Entry Point
----------------------------
FastAPI application for the Optima IDP Recommendation Service.

This service provides intelligent resource recommendations for employees
based on their skills, IDP goals, and performance data.

Endpoints:
- POST /recommend/resources - Get personalized resource recommendations
- POST /recommend/similar-skills - Find skills similar to a given skill
- GET /recommend/health - Health check endpoint
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import recommend
import os
from dotenv import load_dotenv

# Load environment variables from .env file if it exists
load_dotenv()

# Initialize FastAPI application
app = FastAPI(
    title="Optima IDP Recommendation Service",
    description="AI-powered recommendation system for learning resources",
    version="1.0.0",
    docs_url="/docs",  # Swagger UI documentation
    redoc_url="/redoc"  # ReDoc documentation
)

# Configure CORS (Cross-Origin Resource Sharing)
# This allows the backend to make requests to this service
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)

# Include recommendation router
# This registers all routes defined in routers/recommend.py
app.include_router(recommend.router)


@app.get("/")
async def root():
    """
    Root endpoint - provides basic information about the service.
    
    Returns:
        Dictionary with service information
    """
    return {
        "service": "Optima IDP Recommendation Service",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "recommendations": "/recommend/resources",
            "similar_skills": "/recommend/similar-skills",
            "health": "/recommend/health",
            "docs": "/docs"
        }
    }


@app.on_event("startup")
async def startup_event():
    """
    Startup event handler.
    Called when the application starts.
    Use this for initialization tasks like:
    - Loading ML models
    - Connecting to databases
    - Precomputing similarity matrices
    """
    print("=" * 50)
    print("Optima IDP Recommendation Service")
    print("Version: 1.0.0")
    print("=" * 50)
    print("Service is starting up...")
    print("Available endpoints:")
    print("  - POST /recommend/resources")
    print("  - POST /recommend/similar-skills")
    print("  - GET /recommend/health")
    print("  - GET /docs (Swagger UI)")
    print("=" * 50)


@app.on_event("shutdown")
async def shutdown_event():
    """
    Shutdown event handler.
    Called when the application is shutting down.
    Use this for cleanup tasks like:
    - Closing database connections
    - Saving cached data
    - Cleaning up resources
    """
    print("=" * 50)
    print("Recommendation service is shutting down...")
    print("=" * 50)


# Run the application
if __name__ == "__main__":
    import uvicorn
    
    # Get port from environment variable or use default
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    
    # Start the server
    # reload=True enables auto-reload during development
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=True,
        log_level="info"
    )

