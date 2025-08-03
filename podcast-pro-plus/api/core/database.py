from sqlmodel import create_engine, SQLModel, Session

# The database URL tells SQLAlchemy where to find the database file.
# In this case, it will be a file named "database.db" in the project's root.
DATABASE_URL = "sqlite:///database.db" 

# The engine is the core interface to the database.
# connect_args is needed for SQLite to allow it to be used in a multi-threaded
# environment like FastAPI.
engine = create_engine(
    DATABASE_URL, 
    echo=True, # Set to False in production
    connect_args={"check_same_thread": False}
)

def create_db_and_tables():
    """
    Creates the database file and all tables defined by our SQLModels.
    This is called once when the application starts up.
    """
    SQLModel.metadata.create_all(engine)

def get_session():
    """
    Dependency to get a database session for a single request.
    """
    with Session(engine) as session:
        yield session
