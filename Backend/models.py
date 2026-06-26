from sqlalchemy import Column, Integer, String, Date, Boolean, DateTime, Text
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    mobile = Column(String(20), nullable=False)
    password = Column(String(255), nullable=False)  # stores the hashed password
    date_of_birth = Column(Date, nullable=False)

    # OTP properties
    otp_code = Column(String(10), nullable=True)
    otp_expires_at = Column(DateTime, nullable=True)

    # Reset password properties
    reset_token = Column(String(100), nullable=True)
    reset_token_expires_at = Column(DateTime, nullable=True)

    # Onboarding preparation details
    has_completed_prep = Column(Boolean, default=False, nullable=False)
    highest_qualification_specialization = Column(String(150), nullable=True)
    highest_qualification_year = Column(Integer, nullable=True)
    current_profession_role = Column(String(100), nullable=True)
    current_profession_tech = Column(String(100), nullable=True)
    platform_usage_goal = Column(String(100), nullable=True)
    technology_to_learn = Column(String(100), nullable=True)
    proficiency_level = Column(String(100), nullable=True)
    known_technical_skills = Column(String(255), nullable=True)  # Store as comma-separated values
    learning_duration_type = Column(String(50), nullable=True)  # 'ai_suggest' or 'user_provided'
    learning_duration = Column(String(50), nullable=True)
    learning_plan = Column(Text, nullable=True)  # JSON representation of generated plan

