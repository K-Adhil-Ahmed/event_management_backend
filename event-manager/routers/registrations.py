from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from models import Registration, Event, User
from .auth import SECRET_KEY, ALGORITHM
from jose import jwt, JWTError
import uuid

router = APIRouter(prefix="/registrations", tags=["Registrations"])

# --- Auth helper ---
def get_current_user(token: str, db: Session):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user = db.query(User).filter(User.id == int(payload["sub"])).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# --- Routes ---
@router.post("/{event_id}", status_code=201)
def register_for_event(
    event_id: int,
    token: str = Query(...),
    db: Session = Depends(get_db)
):
    user = get_current_user(token, db)

    # Check event exists
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Check event is active
    if event.status != "active":
        raise HTTPException(status_code=400, detail="Event is not active")

    # Check seats available
    if event.seats_remaining <= 0:
        raise HTTPException(status_code=409, detail="Event is fully booked")

    # Check duplicate registration
    existing = db.query(Registration).filter(
        Registration.user_id == user.id,
        Registration.event_id == event_id
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="You are already registered for this event")

    # Register and decrement seat
    booking_id = str(uuid.uuid4())[:8].upper()
    registration = Registration(
        user_id=user.id,
        event_id=event_id,
        booking_id=booking_id
    )
    event.seats_remaining -= 1

    # Update status if now full
    if event.seats_remaining == 0:
        event.status = "sold_out"

    db.add(registration)
    db.commit()
    db.refresh(registration)
    return {
        "message": "Successfully registered",
        "booking_id": booking_id,
        "event": event.title,
        "seats_remaining": event.seats_remaining
    }

@router.delete("/{event_id}", status_code=200)
def cancel_registration(
    event_id: int,
    token: str = Query(...),
    db: Session = Depends(get_db)
):
    user = get_current_user(token, db)

    registration = db.query(Registration).filter(
        Registration.user_id == user.id,
        Registration.event_id == event_id
    ).first()
    if not registration:
        raise HTTPException(status_code=404, detail="Registration not found")

    # Restore the seat
    event = db.query(Event).filter(Event.id == event_id).first()
    event.seats_remaining += 1
    if event.status == "sold_out":
        event.status = "active"

    db.delete(registration)
    db.commit()
    return {
        "message": "Registration cancelled",
        "seats_remaining": event.seats_remaining
    }

@router.get("/{event_id}", status_code=200)
def get_registrants(
    event_id: int,
    token: str = Query(...),
    db: Session = Depends(get_db)
):
    user = get_current_user(token, db)
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.organizer_id != user.id:
        raise HTTPException(status_code=403, detail="Only the organizer can view registrants")

    registrations = db.query(Registration).filter(Registration.event_id == event_id).all()
    return {
        "event": event.title,
        "total_seats": event.total_seats,
        "seats_remaining": event.seats_remaining,
        "registrants": [
            {"user_id": r.user_id, "booking_id": r.booking_id, "registered_at": r.registered_at}
            for r in registrations
        ]
    }