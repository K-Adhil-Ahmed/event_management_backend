from fastapi import FastAPI
from database import Base, engine
from routers import auth, events, registrations

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Event Registration Manager")
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(events.router)
app.include_router(registrations.router)

@app.get("/health")
def health_check():
    return {"status": "OK"}