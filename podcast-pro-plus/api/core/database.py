from sqlmodel import create_engine, SQLModel, Session
from sqlalchemy.event import listen
from sqlalchemy.engine import Engine

# This ensures the models are registered before the database is created
from ..models import user, podcast 

DATABASE_URL = "sqlite:///database.db"

engine = create_engine(
    DATABASE_URL, 
    echo=True, 
    connect_args={"check_same_thread": False}
)

def _enable_foreign_keys(dbapi_connection, connection_record):
    """
    This function runs for every new connection to the SQLite database
    and turns on foreign key support, which is required for cascading deletes.
    """
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()

# This is the most reliable way to attach the event listener to the engine
listen(engine, "connect", _enable_foreign_keys)

def create_db_and_tables():
    # This function creates all the tables based on your models.
    SQLModel.metadata.create_all(engine)

def get_session():
    # This function provides a database session to your API endpoints.
    with Session(engine) as session:
        yield session