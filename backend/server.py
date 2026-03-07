from fastapi import FastAPI, APIRouter, HTTPException, Request, Response
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from supabase import create_client, Client
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

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

supabase_url = os.environ['SUPABASE_URL']
supabase_key = os.environ['SUPABASE_KEY']
supabase: Client = create_client(supabase_url, supabase_key)

app = FastAPI()
api_router = APIRouter(prefix="/api")


class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

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

class ChatMessage(BaseModel):
    role: str
    content: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatRequest(BaseModel):
    message: str
    session_id: str
    study_context: Optional[dict] = None

class ChatResponse(BaseModel):
    response: str
    suggested_questions: List[str]
    session_id: str

class ChatHistory(BaseModel):
    session_id: str
    messages: List[ChatMessage]
    created_at: datetime
    updated_at: datetime

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


# ============ ROUTES ============

@api_router.get("/")
async def root():
    return {"message": "Hello World"}


@api_router.post("/generate-from-youtube")
async def generate_study_pack_from_youtube(request: Request):
    try:
        data = await request.json()
        youtube_url = data.get("youtube_url")

        if not youtube_url:
            raise HTTPException(status_code=400, detail="YouTube URL is required")

        import re
        video_id_match = re.search(r'(?:v=|\/|youtu\.be\/)([a-zA-Z0-9_-]{11})', youtube_url)
        if not video_id_match:
            raise HTTPException(status_code=400, detail="Invalid YouTube URL")

        video_id = video_id_match.group(1)

        try:
            from youtube_transcript_api import YouTubeTranscriptApi
            transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
            transcript_text = " ".join([item['text'] for item in transcript_list])
        except Exception as e:
            logger.error(f"Transcript error: {str(e)}")
            raise HTTPException(status_code=400, detail="Could not fetch video transcript. The video might not have captions/subtitles available.")

        if not transcript_text.strip():
            raise HTTPException(status_code=400, detail="Video transcript is empty")

        return {
            "success": True,
            "video_id": video_id,
            "transcript": transcript_text,
            "transcript_length": len(transcript_text)
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"YouTube processing error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to process YouTube video: {str(e)}")


@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_obj = StatusCheck(client_name=input.client_name)
    supabase.table("status_checks").insert({
        "id": status_obj.id,
        "client_name": status_obj.client_name,
        "timestamp": status_obj.timestamp.isoformat()
    }).execute()
    return status_obj


@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    result = supabase.table("status_checks").select("*").execute()
    return [StatusCheck(**row) for row in result.data]


# ============ AUTH ENDPOINTS ============

@api_router.post("/auth/signup")
async def signup(user_data: UserCreate, response: Response):
    try:
        existing = supabase.table("users").select("user_id").eq("email", user_data.email).execute()
        if existing.data:
            raise HTTPException(status_code=400, detail="Email already registered")

        user_id = f"user_{uuid.uuid4().hex[:12]}"
        now = datetime.now(timezone.utc).isoformat()
        supabase.table("users").insert({
            "user_id": user_id,
            "email": user_data.email,
            "name": user_data.name,
            "password": user_data.password,
            "picture": None,
            "created_at": now
        }).execute()

        session_token = f"session_{uuid.uuid4().hex}"
        expires_at = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
        supabase.table("user_sessions").insert({
            "user_id": user_id,
            "session_token": session_token,
            "expires_at": expires_at,
            "created_at": now
        }).execute()

        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=True,
            samesite="none",
            max_age=7 * 24 * 60 * 60,
            path="/"
        )

        user_doc = supabase.table("users").select("user_id, email, name, picture, created_at").eq("user_id", user_id).single().execute()
        return User(**user_doc.data)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Signup error: {str(e)}")
        raise HTTPException(status_code=500, detail="Signup failed")


@api_router.post("/auth/login")
async def login(credentials: UserLogin, response: Response):
    try:
        result = supabase.table("users").select("*").eq("email", credentials.email).execute()
        if not result.data:
            raise HTTPException(status_code=401, detail="Invalid email or password")

        user_doc = result.data[0]
        if user_doc.get("password") != credentials.password:
            raise HTTPException(status_code=401, detail="Invalid email or password")

        session_token = f"session_{uuid.uuid4().hex}"
        now = datetime.now(timezone.utc).isoformat()
        expires_at = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
        supabase.table("user_sessions").insert({
            "user_id": user_doc["user_id"],
            "session_token": session_token,
            "expires_at": expires_at,
            "created_at": now
        }).execute()

        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=True,
            samesite="none",
            max_age=7 * 24 * 60 * 60,
            path="/"
        )

        return User(
            user_id=user_doc["user_id"],
            email=user_doc["email"],
            name=user_doc["name"],
            picture=user_doc.get("picture"),
            created_at=user_doc["created_at"]
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail="Login failed")


@api_router.post("/auth/session")
async def exchange_session(session_data: SessionData, response: Response):
    try:
        async with httpx.AsyncClient() as http_client:
            auth_response = await http_client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_data.session_id},
                timeout=10.0
            )
            if auth_response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session")
            data = auth_response.json()

        email = data.get("email")
        name = data.get("name", "")
        picture = data.get("picture", "")
        session_token = data.get("session_token")

        if not email or not session_token:
            raise HTTPException(status_code=400, detail="Invalid session data")

        existing = supabase.table("users").select("user_id").eq("email", email).execute()
        now = datetime.now(timezone.utc).isoformat()

        if existing.data:
            user_id = existing.data[0]["user_id"]
            supabase.table("users").update({"name": name, "picture": picture}).eq("user_id", user_id).execute()
        else:
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            supabase.table("users").insert({
                "user_id": user_id,
                "email": email,
                "name": name,
                "picture": picture,
                "created_at": now
            }).execute()

        expires_at = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
        supabase.table("user_sessions").insert({
            "user_id": user_id,
            "session_token": session_token,
            "expires_at": expires_at,
            "created_at": now
        }).execute()

        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=True,
            samesite="none",
            max_age=7 * 24 * 60 * 60,
            path="/"
        )

        user_doc = supabase.table("users").select("user_id, email, name, picture, created_at").eq("user_id", user_id).single().execute()
        return User(**user_doc.data)

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Auth service timeout")
    except Exception as e:
        logger.error(f"Session exchange error: {str(e)}")
        raise HTTPException(status_code=500, detail="Session exchange failed")


async def get_session_token(request: Request) -> Optional[str]:
    session_token = request.cookies.get("session_token")
    if session_token:
        return session_token
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header.replace("Bearer ", "")
    return None


async def get_current_user(request: Request) -> User:
    session_token = await get_session_token(request)
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    result = supabase.table("user_sessions").select("*").eq("session_token", session_token).execute()
    if not result.data:
        raise HTTPException(status_code=401, detail="Invalid session")

    session_doc = result.data[0]
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at < datetime.now(timezone.utc):
        supabase.table("user_sessions").delete().eq("session_token", session_token).execute()
        raise HTTPException(status_code=401, detail="Session expired")

    user_result = supabase.table("users").select("user_id, email, name, picture, created_at").eq("user_id", session_doc["user_id"]).execute()
    if not user_result.data:
        raise HTTPException(status_code=404, detail="User not found")

    return User(**user_result.data[0])


@api_router.get("/auth/me")
async def get_current_user_info(request: Request):
    user = await get_current_user(request)
    return user


@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = await get_session_token(request)
    if session_token:
        supabase.table("user_sessions").delete().eq("session_token", session_token).execute()
    response.delete_cookie(key="session_token", path="/", secure=True, httponly=True, samesite="none")
    return {"message": "Logged out successfully"}


# ============ STUDY PACK ENDPOINTS ============

@api_router.get("/study-packs")
async def get_study_packs(request: Request):
    try:
        user = await get_current_user(request)
        result = supabase.table("study_packs").select("*").eq("user_id", user.user_id).order("created_at", desc=True).limit(20).execute()
        return result.data or []
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get study packs error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve study packs")


@api_router.delete("/study-packs/{pack_id}")
async def delete_study_pack(pack_id: str, request: Request):
    try:
        user = await get_current_user(request)
        check = supabase.table("study_packs").select("id").eq("id", pack_id).eq("user_id", user.user_id).execute()
        if not check.data:
            raise HTTPException(status_code=404, detail="Study pack not found")
        supabase.table("study_packs").delete().eq("id", pack_id).eq("user_id", user.user_id).execute()
        return {"message": "Study pack deleted", "id": pack_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete study pack error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete study pack")


# ============ CHATBOT ENDPOINTS ============

@api_router.post("/chat", response_model=ChatResponse)
async def chat_with_notepilot(chat_request: ChatRequest, request: Request):
    try:
        api_key = os.environ.get('OPENROUTER_API_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="API key not configured")

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

IMPORTANT: Always provide COMPLETE and THOROUGH answers."""

        if chat_request.study_context:
            ctx = chat_request.study_context
            summary = ctx.get('summary', {})
            key_terms = ctx.get('key_terms', [])
            notes = ctx.get('notes', [])
            flashcards = ctx.get('flashcards', [])

            terms_text = "\n".join([f"- {t.get('term','')}: {t.get('meaning','')}" for t in key_terms[:12]])
            notes_text = "\n\n".join([f"{n.get('title','')}: {n.get('content','')}" for n in notes[:4]])
            points_text = "\n".join([f"- {p}" for p in summary.get('important_points', [])[:8]])
            flashcards_text = "\n".join([f"Q: {f.get('q','')}\nA: {f.get('a','')}" for f in flashcards[:8]])

            system_message += f"""

You are helping a Grade {ctx.get('grade', '')} student study this chapter:
Subject: {ctx.get('subject', '')} | Chapter: {ctx.get('chapter_title', '')}

CHAPTER SUMMARY:
{summary.get('tl_dr', '')}

KEY POINTS FROM THE CHAPTER:
{points_text}

KEY TERMS:
{terms_text}

CHAPTER NOTES:
{notes_text}

FLASHCARD CONTENT:
{flashcards_text}

IMPORTANT INSTRUCTIONS:
- Base ALL your answers on the chapter content above
- When the student asks about something from this chapter, refer to the actual content
- Quote or reference specific details from the notes, key terms, and points above
- If asked something not covered in this chapter, say so clearly
- Answer in the same language as the chapter content if it is not English"""

        history_result = supabase.table("chat_history").select("*").eq("session_id", chat_request.session_id).execute()
        history_doc = history_result.data[0] if history_result.data else None

        messages = [{"role": "system", "content": system_message}]
        if history_doc and history_doc.get("messages"):
            for msg in history_doc["messages"]:
                if msg.get("role") in ("user", "assistant"):
                    messages.append({"role": msg["role"], "content": msg["content"]})
        messages.append({"role": "user", "content": chat_request.message})

        async with httpx.AsyncClient() as http_client:
            openrouter_response = await http_client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "google/gemini-2.0-flash-001",
                    "messages": messages,
                },
                timeout=60.0,
            )

        if openrouter_response.status_code != 200:
            logger.error(f"OpenRouter error: {openrouter_response.text}")
            raise HTTPException(status_code=500, detail="Failed to get response from AI service")

        response_text = openrouter_response.json()["choices"][0]["message"]["content"]

        if chat_request.study_context:
            subject = chat_request.study_context.get('subject', '')
            chapter = chat_request.study_context.get('chapter_title', '')
            suggested_questions = [
                f"Can you explain the key concepts in {chapter}?",
                f"What are some practice questions for {subject}?",
                "Can you create a study plan for this topic?",
            ]
        else:
            suggested_questions = [
                "How can I study more effectively?",
                "Can you help me create flashcards?",
                "What's a good way to remember this?",
            ]

        now = datetime.now(timezone.utc).isoformat()
        new_messages = [
            {"role": "user", "content": chat_request.message, "timestamp": now},
            {"role": "assistant", "content": response_text, "timestamp": now}
        ]

        if history_doc:
            existing_messages = history_doc.get("messages", [])
            existing_messages.extend(new_messages)
            supabase.table("chat_history").update({
                "messages": existing_messages,
                "updated_at": now
            }).eq("session_id", chat_request.session_id).execute()
        else:
            supabase.table("chat_history").insert({
                "session_id": chat_request.session_id,
                "messages": new_messages,
                "created_at": now,
                "updated_at": now
            }).execute()

        return ChatResponse(
            response=response_text,
            suggested_questions=suggested_questions,
            session_id=chat_request.session_id
        )

    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")


@api_router.get("/chat/history/{session_id}")
async def get_chat_history(session_id: str):
    result = supabase.table("chat_history").select("*").eq("session_id", session_id).execute()
    if not result.data:
        return {"session_id": session_id, "messages": []}
    return result.data[0]


@api_router.delete("/chat/history/{session_id}")
async def clear_chat_history(session_id: str):
    result = supabase.table("chat_history").delete().eq("session_id", session_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"message": "Chat history cleared", "session_id": session_id}


# ============ CUSTOM FLASHCARD ENDPOINTS ============

@api_router.post("/flashcards")
async def create_flashcard_set(flashcard_data: FlashcardSetCreate, request: Request):
    try:
        user = await get_current_user(request)
        now = datetime.now(timezone.utc).isoformat()
        flashcard_set = {
            "set_id": f"flashcard_{uuid.uuid4().hex[:12]}",
            "user_id": user.user_id,
            "title": flashcard_data.title,
            "description": flashcard_data.description,
            "flashcards": [card.dict() for card in flashcard_data.flashcards],
            "created_at": now,
            "updated_at": now
        }
        supabase.table("custom_flashcards").insert(flashcard_set).execute()
        return CustomFlashcardSet(**flashcard_set)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Create flashcard error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create flashcard set")


@api_router.get("/flashcards")
async def get_flashcard_sets(request: Request):
    try:
        user = await get_current_user(request)
        result = supabase.table("custom_flashcards").select("*").eq("user_id", user.user_id).execute()
        return [CustomFlashcardSet(**fs) for fs in result.data]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get flashcards error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve flashcard sets")


@api_router.get("/flashcards/{set_id}")
async def get_flashcard_set(set_id: str, request: Request):
    try:
        user = await get_current_user(request)
        result = supabase.table("custom_flashcards").select("*").eq("set_id", set_id).eq("user_id", user.user_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Flashcard set not found")
        return CustomFlashcardSet(**result.data[0])
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get flashcard set error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve flashcard set")


@api_router.put("/flashcards/{set_id}")
async def update_flashcard_set(set_id: str, updates: FlashcardSetUpdate, request: Request):
    try:
        user = await get_current_user(request)
        update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
        if updates.title is not None:
            update_data["title"] = updates.title
        if updates.description is not None:
            update_data["description"] = updates.description
        if updates.flashcards is not None:
            update_data["flashcards"] = [card.dict() for card in updates.flashcards]

        result = supabase.table("custom_flashcards").update(update_data).eq("set_id", set_id).eq("user_id", user.user_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Flashcard set not found")
        return CustomFlashcardSet(**result.data[0])
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update flashcard error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update flashcard set")


@api_router.delete("/flashcards/{set_id}")
async def delete_flashcard_set(set_id: str, request: Request):
    try:
        user = await get_current_user(request)
        check = supabase.table("custom_flashcards").select("set_id").eq("set_id", set_id).eq("user_id", user.user_id).execute()
        if not check.data:
            raise HTTPException(status_code=404, detail="Flashcard set not found")
        supabase.table("custom_flashcards").delete().eq("set_id", set_id).eq("user_id", user.user_id).execute()
        return {"message": "Flashcard set deleted", "set_id": set_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete flashcard error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete flashcard set")


@api_router.post("/flashcards/from-text")
async def create_flashcards_from_text(request: Request):
    try:
        user = await get_current_user(request)

        form = await request.form()
        title = form.get("title", "Untitled Flashcard Set")
        content = form.get("content", "")
        file = form.get("file")

        if file:
            file_content = await file.read()
            filename = file.filename.lower()
            if filename.endswith('.txt'):
                content = file_content.decode('utf-8')
            elif filename.endswith('.pdf'):
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

        api_key = os.environ.get('OPENROUTER_API_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="API key not configured")

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

        prompt = f"Generate flashcards from this content:\n\n{content[:4000]}"

        async with httpx.AsyncClient() as http_client:
            openrouter_response = await http_client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "google/gemini-2.0-flash-001",
                    "messages": [
                        {"role": "system", "content": system_message},
                        {"role": "user", "content": prompt},
                    ],
                },
                timeout=60.0,
            )

        if openrouter_response.status_code != 200:
            logger.error(f"OpenRouter error: {openrouter_response.text}")
            raise HTTPException(status_code=500, detail="Failed to get response from AI service")

        response = openrouter_response.json()["choices"][0]["message"]["content"]

        import json
        try:
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

        now = datetime.now(timezone.utc).isoformat()
        flashcard_set = {
            "set_id": f"flashcard_{uuid.uuid4().hex[:12]}",
            "user_id": user.user_id,
            "title": title,
            "description": f"Generated from uploaded content ({len(flashcards)} cards)",
            "flashcards": [card.dict() for card in flashcards],
            "created_at": now,
            "updated_at": now
        }
        supabase.table("custom_flashcards").insert(flashcard_set).execute()
        return CustomFlashcardSet(**flashcard_set)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Generate flashcards error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate flashcards: {str(e)}")


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)
