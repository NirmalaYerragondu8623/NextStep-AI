import sys
from database import Base, engine
import models

def init_database():
    print("Connecting to the database and creating tables...")
    try:
        # Create all tables defined in models.py
        Base.metadata.create_all(bind=engine)
        print("Database tables created successfully!")
    except Exception as e:
        print("Error creating database tables:", file=sys.stderr)
        print(e, file=sys.stderr)
        print("\nPlease make sure that:")
        print("1. PostgreSQL is installed and running.")
        print("2. The database 'nextstep_ai' exists.")
        print("3. The DATABASE_URL connection string in '.env' is correct.")
        sys.exit(1)

if __name__ == "__main__":
    init_database()
