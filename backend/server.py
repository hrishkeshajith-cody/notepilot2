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

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

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

class UserCreate(BaseModel):
    email: str
    password: str
    name: str

class UserLogin(BaseModel):
    email: str
    password: str

class SessionData(BaseModel):
    session_id: str

class UserSession(BaseModel):
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime

# Chatbot Models
class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatRequest(BaseModel):
    message: str
    session_id: str
    study_context: Optional[dict] = None  # Current study pack context

class ChatResponse(BaseModel):
    response: str
    suggested_questions: List[str]
    session_id: str

class ChatHistory(BaseModel):
    session_id: str
    messages: List[ChatMessage]
    created_at: datetime
    updated_at: datetime

# Custom Flashcard Models
class FlashcardItem(BaseModel):
    question: str
    answer: str

class CustomFlashcardSet(BaseModel):
    set_id: str = Field(default_factory=lambda: f"flashcard_{uuid.uuid4().hex[:12]}")
    user_id: str
    title: str
    description: Optional[str] = None
    flashcards: List[FlashcardItem]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FlashcardSetCreate(BaseModel):
    title: str
    description: Optional[str] = None
    flashcards: List[FlashcardItem]

class FlashcardSetUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    flashcards: Optional[List[FlashcardItem]] = None

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

@api_router.post("/auth/signup")
async def signup(user_data: UserCreate, response: Response):
    """Simple email/password signup"""
    try:
        # Check if user already exists
        existing_user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Create new user (storing password as-is for MVP - should hash in production)
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": user_data.email,
            "name": user_data.name,
            "password": user_data.password,  # In production, use bcrypt
            "picture": None,
            "created_at": datetime.now(timezone.utc)
        })
        
        # Create session
        session_token = f"session_{uuid.uuid4().hex}"
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        await db.user_sessions.insert_one({
            "user_id": user_id,
            "session_token": session_token,
            "expires_at": expires_at,
            "created_at": datetime.now(timezone.utc)
        })
        
        # Set cookie
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=True,
            samesite="none",
            max_age=7 * 24 * 60 * 60,
            path="/"
        )
        
        # Return user data
        user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password": 0})
        return User(**user_doc)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Signup error: {str(e)}")
        raise HTTPException(status_code=500, detail="Signup failed")


@api_router.post("/auth/login")
async def login(credentials: UserLogin, response: Response):
    """Simple email/password login"""
    try:
        # Find user
        user_doc = await db.users.find_one({"email": credentials.email}, {"_id": 0})
        if not user_doc:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Check password (simple comparison for MVP)
        if user_doc.get("password") != credentials.password:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Create new session
        session_token = f"session_{uuid.uuid4().hex}"
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        await db.user_sessions.insert_one({
            "user_id": user_doc["user_id"],
            "session_token": session_token,
            "expires_at": expires_at,
            "created_at": datetime.now(timezone.utc)
        })
        
        # Set cookie
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=True,
            samesite="none",
            max_age=7 * 24 * 60 * 60,
            path="/"
        )
        
        # Return user data (without password)
        del user_doc["password"]
        return User(**user_doc)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail="Login failed")


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

# ============ CHATBOT ENDPOINTS ============

@api_router.post("/chat", response_model=ChatResponse)
async def chat_with_notepilot(chat_request: ChatRequest, request: Request):
    """Enhanced NotePilot chatbot with session memory and study context awareness"""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        # Get OpenRouter API key
        api_key = os.environ.get('OPENROUTER_API_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="API key not configured")
        
        # Build system message with study context
        system_message = """You are NotePilot AI, an intelligent study assistant helping students learn better. 

Your capabilities:
- Explain complex concepts clearly and completely
- Create study strategies and practical tips
- Answer questions about study materials thoroughly
- Provide mnemonics and memory techniques
- Break down difficult topics into understandable parts

Guidelines:
- Be encouraging and supportive
- Use clear, student-friendly language
- Provide COMPLETE answers - don't cut off explanations
- Be concise but comprehensive - include all important information
- Use bullet points or numbered lists for clarity when appropriate
- Give practical examples when helpful
- Answer fully first, then summarize if needed
- If unsure, admit it and guide the student to find answers

IMPORTANT: Always provide COMPLETE and THOROUGH answers. Better to give a full explanation than leave students confused."""

        # Add study context if available
        if chat_request.study_context:
            context_info = f"""

Current Study Context:
- Subject: {chat_request.study_context.get('subject', 'N/A')}
- Grade: {chat_request.study_context.get('grade', 'N/A')}
- Chapter: {chat_request.study_context.get('chapter_title', 'N/A')}

The student is currently working on this material. Use this context to provide relevant, targeted help."""
            system_message += context_info
        
        # Initialize LlmChat with session for memory using OpenRouter
        chat = LlmChat(
            api_key=api_key,
            session_id=chat_request.session_id,
            system_message=system_message
        ).with_model("openrouter", "openai/gpt-3.5-turbo")
        
        # Get chat history from database
        history_doc = await db.chat_history.find_one(
            {"session_id": chat_request.session_id},
            {"_id": 0}
        )
        
        # Create user message
        user_message = UserMessage(text=chat_request.message)
        
        # Send message and get response
        response_text = await chat.send_message(user_message)
        
        # Generate suggested questions based on context
        suggested_questions = []
        if chat_request.study_context:
            subject = chat_request.study_context.get('subject', '')
            chapter = chat_request.study_context.get('chapter_title', '')
            
            # Context-aware suggestions
            suggested_questions = [
                f"Can you explain the key concepts in {chapter}?",
                f"What are some practice questions for {subject}?",
                "Can you create a study plan for this topic?",
                "What are common mistakes students make here?"
            ]
        else:
            # General suggestions
            suggested_questions = [
                "How can I study more effectively?",
                "Can you help me create flashcards?",
                "What's a good way to remember this?",
                "Can you quiz me on this topic?"
            ]
        
        # Save to database
        now = datetime.now(timezone.utc)
        new_messages = [
            {"role": "user", "content": chat_request.message, "timestamp": now},
            {"role": "assistant", "content": response_text, "timestamp": now}
        ]
        
        if history_doc:
            # Update existing history
            await db.chat_history.update_one(
                {"session_id": chat_request.session_id},
                {
                    "$push": {"messages": {"$each": new_messages}},
                    "$set": {"updated_at": now}
                }
            )
        else:
            # Create new history
            await db.chat_history.insert_one({
                "session_id": chat_request.session_id,
                "messages": new_messages,
                "created_at": now,
                "updated_at": now
            })
        
        return ChatResponse(
            response=response_text,
            suggested_questions=suggested_questions[:3],  # Return top 3
            session_id=chat_request.session_id
        )
        
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")


@api_router.get("/chat/history/{session_id}")
async def get_chat_history(session_id: str):
    """Get chat history for a session"""
    history_doc = await db.chat_history.find_one(
        {"session_id": session_id},
        {"_id": 0}
    )
    
    if not history_doc:
        return {"session_id": session_id, "messages": []}
    
    return history_doc


@api_router.delete("/chat/history/{session_id}")
async def clear_chat_history(session_id: str):
    """Clear chat history for a session"""
    result = await db.chat_history.delete_one({"session_id": session_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {"message": "Chat history cleared", "session_id": session_id}

# ============ CUSTOM FLASHCARD ENDPOINTS ============

@api_router.post("/flashcards")
async def create_flashcard_set(flashcard_data: FlashcardSetCreate, request: Request):
    """Create a new custom flashcard set"""
    try:
        # Get current user
        user = await get_current_user(request)
        
        # Create flashcard set
        flashcard_set = {
            "set_id": f"flashcard_{uuid.uuid4().hex[:12]}",
            "user_id": user.user_id,
            "title": flashcard_data.title,
            "description": flashcard_data.description,
            "flashcards": [card.dict() for card in flashcard_data.flashcards],
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        
        await db.custom_flashcards.insert_one(flashcard_set)
        
        return CustomFlashcardSet(**flashcard_set)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Create flashcard error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create flashcard set")


@api_router.get("/flashcards")
async def get_flashcard_sets(request: Request):
    """Get all flashcard sets for current user"""
    try:
        user = await get_current_user(request)
        
        flashcard_sets = await db.custom_flashcards.find(
            {"user_id": user.user_id},
            {"_id": 0}
        ).to_list(1000)
        
        return [CustomFlashcardSet(**fs) for fs in flashcard_sets]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get flashcards error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve flashcard sets")


@api_router.get("/flashcards/{set_id}")
async def get_flashcard_set(set_id: str, request: Request):
    """Get a specific flashcard set"""
    try:
        user = await get_current_user(request)
        
        flashcard_set = await db.custom_flashcards.find_one(
            {"set_id": set_id, "user_id": user.user_id},
            {"_id": 0}
        )
        
        if not flashcard_set:
            raise HTTPException(status_code=404, detail="Flashcard set not found")
        
        return CustomFlashcardSet(**flashcard_set)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get flashcard set error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve flashcard set")


@api_router.put("/flashcards/{set_id}")
async def update_flashcard_set(set_id: str, updates: FlashcardSetUpdate, request: Request):
    """Update a flashcard set"""
    try:
        user = await get_current_user(request)
        
        # Build update dict
        update_data = {"updated_at": datetime.now(timezone.utc)}
        if updates.title is not None:
            update_data["title"] = updates.title
        if updates.description is not None:
            update_data["description"] = updates.description
        if updates.flashcards is not None:
            update_data["flashcards"] = [card.dict() for card in updates.flashcards]
        
        result = await db.custom_flashcards.update_one(
            {"set_id": set_id, "user_id": user.user_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Flashcard set not found")
        
        # Return updated set
        flashcard_set = await db.custom_flashcards.find_one(
            {"set_id": set_id},
            {"_id": 0}
        )
        
        return CustomFlashcardSet(**flashcard_set)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update flashcard error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update flashcard set")


@api_router.delete("/flashcards/{set_id}")
async def delete_flashcard_set(set_id: str, request: Request):
    """Delete a flashcard set"""
    try:
        user = await get_current_user(request)
        
        result = await db.custom_flashcards.delete_one(
            {"set_id": set_id, "user_id": user.user_id}
        )
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Flashcard set not found")
        
        return {"message": "Flashcard set deleted", "set_id": set_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete flashcard error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete flashcard set")


@api_router.post("/flashcards/from-text")
async def create_flashcards_from_text(request: Request):
    """Generate flashcards from uploaded text or PDF"""
    try:
        user = await get_current_user(request)
        
        # Get form data
        form = await request.form()
        title = form.get("title", "Untitled Flashcard Set")
        content = form.get("content", "")
        file = form.get("file")
        
        # Extract text from file if provided
        if file:
            file_content = await file.read()
            filename = file.filename.lower()
            
            if filename.endswith('.txt'):
                content = file_content.decode('utf-8')
            elif filename.endswith('.pdf'):
                # Simple PDF text extraction (for MVP)
                try:
                    import PyPDF2
                    from io import BytesIO
                    pdf_reader = PyPDF2.PdfReader(BytesIO(file_content))
                    content = ""
                    for page in pdf_reader.pages:
                        content += page.extract_text() + "\n"
                except Exception as pdf_error:
                    logger.error(f"PDF extraction error: {str(pdf_error)}")
                    raise HTTPException(status_code=400, detail="Failed to extract text from PDF")
        
        if not content.strip():
            raise HTTPException(status_code=400, detail="No content provided")
        
        # Use AI to generate flashcards from content
        api_key = os.environ.get('OPENROUTER_API_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="API key not configured")
        
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        system_message = """You are a flashcard generator. Convert the given text into Q&A flashcards.
Format your response as a JSON array of objects with 'question' and 'answer' fields.
Create 10-20 flashcards that cover the key concepts.
Keep questions clear and concise. Answers should be detailed but not too long.

Example format:
[
  {"question": "What is photosynthesis?", "answer": "The process by which plants convert light energy into chemical energy..."},
  {"question": "What are the main components needed?", "answer": "Sunlight, water, and carbon dioxide"}
]

Only return the JSON array, no other text."""
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"flashcard_gen_{uuid.uuid4().hex[:8]}",
            system_message=system_message
        ).with_model("openrouter", "openai/gpt-3.5-turbo")
        
        prompt = f"Generate flashcards from this content:\n\n{content[:4000]}"  # Limit content length
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Parse JSON response
        import json
        try:
            # Extract JSON from response
            response_text = response.strip()
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0]
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0]
            
            flashcards_data = json.loads(response_text)
            
            if not isinstance(flashcards_data, list):
                raise ValueError("Response is not a list")
                
            flashcards = [FlashcardItem(**card) for card in flashcards_data]
            
        except Exception as parse_error:
            logger.error(f"Parse error: {str(parse_error)}, Response: {response}")
            raise HTTPException(status_code=500, detail="Failed to parse generated flashcards")
        
        # Create flashcard set
        flashcard_set = {
            "set_id": f"flashcard_{uuid.uuid4().hex[:12]}",
            "user_id": user.user_id,
            "title": title,
            "description": f"Generated from uploaded content ({len(flashcards)} cards)",
            "flashcards": [card.dict() for card in flashcards],
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        
        await db.custom_flashcards.insert_one(flashcard_set)
        
        return CustomFlashcardSet(**flashcard_set)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Generate flashcards error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate flashcards: {str(e)}")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
