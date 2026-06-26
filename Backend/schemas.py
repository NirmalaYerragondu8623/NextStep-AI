from datetime import date
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field

class UserCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    mobile: str = Field(..., min_length=8, max_length=20)
    password: str = Field(..., min_length=8, max_length=100)
    date_of_birth: date

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    mobile: str
    date_of_birth: date
    has_completed_prep: bool

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class GoogleLoginRequest(BaseModel):
    token: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8, max_length=100)

class PreparationFormSubmit(BaseModel):
    highest_qualification_specialization: str = Field(..., min_length=1)
    highest_qualification_year: int
    current_profession_role: str = Field(..., min_length=1)
    current_profession_tech: str = Field(..., min_length=1)
    platform_usage_goal: str = Field(..., min_length=1)
    technology_to_learn: str = Field(..., min_length=1)
    proficiency_level: str = Field(..., min_length=1)
    known_technical_skills: List[str]
    learning_duration_type: str = Field(..., min_length=1)  # 'ai_suggest' or 'user_provided'
    learning_duration: Optional[str] = None

