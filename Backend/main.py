from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import inspect, text
from datetime import timedelta, date, datetime, timezone
import urllib.request
import urllib.error
import json
import random
import secrets

import models, schemas, auth
import plan_generator
from database import get_db, engine

def run_migrations():
    inspector = inspect(engine)
    if 'users' not in inspector.get_table_names():
        return
    columns = [col['name'] for col in inspector.get_columns('users')]
    
    with engine.begin() as connection:
        if 'otp_code' not in columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN otp_code VARCHAR(10) NULL"))
        if 'otp_expires_at' not in columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN otp_expires_at TIMESTAMP NULL"))
        if 'reset_token' not in columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN reset_token VARCHAR(100) NULL"))
        if 'reset_token_expires_at' not in columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN reset_token_expires_at TIMESTAMP NULL"))
        if 'has_completed_prep' not in columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN has_completed_prep BOOLEAN NOT NULL DEFAULT FALSE"))
        if 'highest_qualification_specialization' not in columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN highest_qualification_specialization VARCHAR(150) NULL"))
        if 'highest_qualification_year' not in columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN highest_qualification_year INTEGER NULL"))
        if 'current_profession_role' not in columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN current_profession_role VARCHAR(100) NULL"))
        if 'current_profession_tech' not in columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN current_profession_tech VARCHAR(100) NULL"))
        if 'platform_usage_goal' not in columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN platform_usage_goal VARCHAR(100) NULL"))
        if 'technology_to_learn' not in columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN technology_to_learn VARCHAR(100) NULL"))
        if 'proficiency_level' not in columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN proficiency_level VARCHAR(100) NULL"))
        if 'known_technical_skills' not in columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN known_technical_skills VARCHAR(255) NULL"))
        if 'learning_duration_type' not in columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN learning_duration_type VARCHAR(50) NULL"))
        if 'learning_duration' not in columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN learning_duration VARCHAR(50) NULL"))
        if 'learning_plan' not in columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN learning_plan TEXT NULL"))

# Create tables (fallback, though init_db.py will do this too)
models.Base.metadata.create_all(bind=engine)
try:
    run_migrations()
except Exception as e:
    print(f"Migration error: {e}")

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
        date_of_birth=user_in.date_of_birth,
        has_completed_prep=False
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
    learning_plan_list = []
    if current_user.learning_plan:
        try:
            learning_plan_list = json.loads(current_user.learning_plan)
        except Exception:
            pass

    # Return custom dashboard data personalized for the authenticated user
    return {
        "user": {
            "name": current_user.name,
            "email": current_user.email,
            "mobile": current_user.mobile,
            "date_of_birth": current_user.date_of_birth.strftime("%Y-%m-%d"),
            "has_completed_prep": current_user.has_completed_prep,
            "learning_plan": learning_plan_list
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

@app.post("/forgot-password")
def forgot_password(req: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == req.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="An account with this email address does not exist."
        )
    # Generate secure verification token
    token = secrets.token_urlsafe(32)
    user.reset_token = token
    user.reset_token_expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
    db.commit()
    
    # Generate verification link
    reset_link = f"http://localhost:5173/?token={token}"
    return {
        "message": "Verification link generated successfully.",
        "link": reset_link,
        "token": token
    }

@app.post("/reset-password")
def reset_password(req: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.reset_token == req.token).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token."
        )
    
    expiry = user.reset_token_expires_at
    if expiry.tzinfo is None:
        expiry = expiry.replace(tzinfo=timezone.utc)
        
    if expiry < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token has expired."
        )
        
    # Update password securely
    hashed_password = auth.get_password_hash(req.new_password)
    user.password = hashed_password
    user.reset_token = None
    user.reset_token_expires_at = None
    db.commit()
    return {"message": "Password updated successfully."}

@app.get("/api/users/me", response_model=schemas.UserOut)
def get_current_user_profile(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@app.post("/api/preparation/submit")
def submit_preparation(
    req: schemas.PreparationFormSubmit,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    current_user.highest_qualification_specialization = req.highest_qualification_specialization
    current_user.highest_qualification_year = req.highest_qualification_year
    current_user.current_profession_role = req.current_profession_role
    current_user.current_profession_tech = req.current_profession_tech
    current_user.platform_usage_goal = req.platform_usage_goal
    current_user.technology_to_learn = req.technology_to_learn
    current_user.proficiency_level = req.proficiency_level
    current_user.known_technical_skills = ", ".join(req.known_technical_skills)
    current_user.learning_duration_type = req.learning_duration_type
    current_user.learning_duration = req.learning_duration
    
    # Generate customized plan
    plan = plan_generator.generate_custom_plan(
        tech_to_learn=req.technology_to_learn,
        proficiency=req.proficiency_level,
        goal=req.platform_usage_goal,
        duration_type=req.learning_duration_type,
        duration=req.learning_duration
    )
    
    current_user.learning_plan = json.dumps(plan)
    current_user.has_completed_prep = True
    
    db.commit()
    db.refresh(current_user)
    
    return {"message": "Preparation form submitted successfully.", "learning_plan": plan}

