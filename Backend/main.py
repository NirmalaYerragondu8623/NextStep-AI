from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import timedelta, date
import urllib.request
import urllib.error
import json

import models, schemas, auth
from database import get_db, engine

# Create tables (fallback, though init_db.py will do this too)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="NextStep AI API", version="1.0.0")

# Set up CORS middleware to allow the frontend to access our API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development; restrict this to ["http://localhost:5173"] in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/register", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )
    
    # Hash the password
    hashed_password = auth.get_password_hash(user_in.password)
    
    # Create the user object
    db_user = models.User(
        name=user_in.name,
        email=user_in.email,
        mobile=user_in.mobile,
        password=hashed_password,
        date_of_birth=user_in.date_of_birth
    )
    
    # Add to database
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/login", response_model=schemas.Token)
def login(login_in: schemas.UserLogin, db: Session = Depends(get_db)):
    # Find user by email
    user = db.query(models.User).filter(models.User.email == login_in.email).first()
    if not user or not auth.verify_password(login_in.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )
    
    # Create JWT Access Token
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/login/google", response_model=schemas.Token)
def login_google(login_in: schemas.GoogleLoginRequest, db: Session = Depends(get_db)):
    token = login_in.token
    
    # 1. Handle mock token for simulation mode
    if token.startswith("mock_google"):
        email = "test.googleuser@gmail.com"
        name = "Google Test User"
    else:
        # 2. Call Google Tokeninfo API to verify token
        url = f"https://oauth2.googleapis.com/tokeninfo?access_token={token}"
        try:
            req = urllib.request.Request(url)
            with urllib.request.urlopen(req) as response:
                google_data = json.loads(response.read().decode('utf-8'))
                
                # Check for errors in response
                if "error" in google_data or "error_description" in google_data:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Invalid Google OAuth token."
                    )
                
                email = google_data.get("email")
                name = google_data.get("name", "Google User")
                if not email:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Google token does not contain email address."
                    )
        except urllib.error.HTTPError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Google validation failed: {e.reason}"
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error connecting to Google authentication servers: {str(e)}"
            )

    # 3. Check if user already exists
    user = db.query(models.User).filter(models.User.email == email).first()
    
    if not user:
        dummy_hashed_password = auth.get_password_hash("google-auth-dummy-password-value")
        user = models.User(
            name=name,
            email=email,
            mobile="Google OAuth",
            password=dummy_hashed_password,
            date_of_birth=date(2000, 1, 1)
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
    # 4. Generate our backend JWT Access Token for the user session
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/dashboard")
def get_dashboard_data(current_user: models.User = Depends(auth.get_current_user)):
    # Return custom dashboard data personalized for the authenticated user
    return {
        "user": {
            "name": current_user.name,
            "email": current_user.email,
            "mobile": current_user.mobile,
            "date_of_birth": current_user.date_of_birth.strftime("%Y-%m-%d")
        },
        "projectMonitor": {
            "suggested": [
                {
                    "id": "p1",
                    "title": "Autonomous AI Agent Framework",
                    "level": "Advanced",
                    "techStack": ["React", "FastAPI", "PostgreSQL", "LangChain"],
                    "description": "Build a multi-agent system that collaborates to solve user coding tasks dynamically.",
                    "duration": "4 weeks"
                },
                {
                    "id": "p2",
                    "title": "Premium Glassmorphic E-Commerce Dashboard",
                    "level": "Intermediate",
                    "techStack": ["React", "Tailwind CSS", "Framer Motion"],
                    "description": "Design a highly responsive and animated dashboard for tracking sales data visually.",
                    "duration": "2 weeks"
                },
                {
                    "id": "p3",
                    "title": "Task Organizer & Flow",
                    "level": "Beginner",
                    "techStack": ["HTML", "Vanilla CSS", "JavaScript"],
                    "description": "Develop a lightweight browser-based daily planner with local storage backups.",
                    "duration": "3 days"
                }
            ],
            "saved": []
        },
        "certificationTracker": {
            "suggested": [
                {
                    "id": "c1",
                    "name": "AWS Certified Developer - Associate",
                    "provider": "Amazon Web Services",
                    "relevance": "High (matches cloud technology interest)",
                    "estHours": "40 hours"
                },
                {
                    "id": "c2",
                    "name": "Meta Front-End Developer Professional Certificate",
                    "provider": "Coursera / Meta",
                    "relevance": "High (matches React interest)",
                    "estHours": "60 hours"
                }
            ],
            "saved": []
        },
        "webinarTracker": {
            "upcoming": [
                {
                    "id": "w1",
                    "title": "Scaling FastAPI Applications to Millions of Users",
                    "speakers": ["Sebastian Ramírez (FastAPI Creator)"],
                    "date": "2026-07-15",
                    "time": "18:00 UTC",
                    "registrationLink": "https://fastapi.tiangolo.com/"
                },
                {
                    "id": "w2",
                    "title": "Modern Frontend Design Trends with Tailwind & Framer Motion",
                    "speakers": ["Adam Wathan", "Matt Perry"],
                    "date": "2026-07-22",
                    "time": "16:30 UTC",
                    "registrationLink": "https://tailwindcss.com/"
                }
            ]
        },
        "dailyReporter": {
            "tasks": [
                {"id": "t1", "text": "Learn FastAPI dependency injection basics", "completed": False},
                {"id": "t2", "text": "Set up PostgreSQL and configure DB connections", "completed": True},
                {"id": "t3", "text": "Implement login screen visuals and fields", "completed": False}
            ]
        }
    }
