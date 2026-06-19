from sqlalchemy import Column, Integer, String, Date
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    mobile = Column(String(20), nullable=False)
    password = Column(String(255), nullable=False)  # stores the hashed password
    date_of_birth = Column(Date, nullable=False)
