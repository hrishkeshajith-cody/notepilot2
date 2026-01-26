from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Cookie
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import httpx


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# Auth Models
class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    created_at: datetime

class SessionData(BaseModel):
    session_id: str

class UserSession(BaseModel):
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# ============ AUTH ENDPOINTS ============

@api_router.post("/auth/session")
async def exchange_session(session_data: SessionData, response: Response):
    """Exchange session_id for user data and session_token"""
    try:
        # Call Emergent Auth API to get session data
        async with httpx.AsyncClient() as client:
            auth_response = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_data.session_id},
                timeout=10.0
            )
            
            if auth_response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session")
            
            data = auth_response.json()
        
        # Extract user data
        email = data.get("email")
        name = data.get("name", "")
        picture = data.get("picture", "")
        session_token = data.get("session_token")
        
        if not email or not session_token:
            raise HTTPException(status_code=400, detail="Invalid session data")
        
        # Check if user exists
        user_doc = await db.users.find_one({"email": email}, {"_id": 0})
        
        if user_doc:
            # Update existing user
            user_id = user_doc["user_id"]
            await db.users.update_one(
                {"email": email},
                {"$set": {"name": name, "picture": picture}}
            )
        else:
            # Create new user with custom user_id
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            await db.users.insert_one({
                "user_id": user_id,
                "email": email,
                "name": name,
                "picture": picture,
                "created_at": datetime.now(timezone.utc)
            })
        
        # Store session in database with 7-day expiry
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        await db.user_sessions.insert_one({
            "user_id": user_id,
            "session_token": session_token,
            "expires_at": expires_at,
            "created_at": datetime.now(timezone.utc)
        })
        
        # Set httpOnly cookie
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=True,
            samesite="none",
            max_age=7 * 24 * 60 * 60,  # 7 days in seconds
            path="/"
        )
        
        # Return user data
        user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
        return User(**user_doc)
        
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Auth service timeout")
    except Exception as e:
        logger.error(f"Session exchange error: {str(e)}")
        raise HTTPException(status_code=500, detail="Session exchange failed")


async def get_session_token(request: Request) -> Optional[str]:
    """Helper to get session token from cookie or Authorization header"""
    # Try cookie first
    session_token = request.cookies.get("session_token")
    if session_token:
        return session_token
    
    # Fallback to Authorization header
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header.replace("Bearer ", "")
    
    return None


async def get_current_user(request: Request) -> User:
    """Authenticator helper - validates session and returns user"""
    session_token = await get_session_token(request)
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Find session in database
    session_doc = await db.user_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if not session_doc:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    # Check expiry with timezone awareness
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        # Clean up expired session
        await db.user_sessions.delete_one({"session_token": session_token})
        raise HTTPException(status_code=401, detail="Session expired")
    
    # Get user data
    user_doc = await db.users.find_one(
        {"user_id": session_doc["user_id"]},
        {"_id": 0}
    )
    
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    return User(**user_doc)


@api_router.get("/auth/me")
async def get_current_user_info(request: Request):
    """Get current authenticated user data"""
    user = await get_current_user(request)
    return user


@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout user and clear session"""
    session_token = await get_session_token(request)
    
    if session_token:
        # Delete session from database
        await db.user_sessions.delete_one({"session_token": session_token})
    
    # Clear cookie
    response.delete_cookie(
        key="session_token",
        path="/",
        secure=True,
        httponly=True,
        samesite="none"
    )
    
    return {"message": "Logged out successfully"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
