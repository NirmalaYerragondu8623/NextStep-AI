from datetime import date
from typing import Optional
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

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class GoogleLoginRequest(BaseModel):
    token: str
