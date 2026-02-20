"""
Botivate HR Support - FastAPI Application Entry Point
Registers all routers, initializes DB, and starts the background scheduler.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.config import settings
from app.database import init_db, async_session_factory
from app.routers.company_router import router as company_router
from app.routers.auth_router import router as auth_router
from app.routers.chat_router import router as chat_router
from app.routers.approval_router import router as approval_router, notifications_router
from app.services.approval_service import check_pending_reminders


# ── Background Scheduler (48h Reminders & 72h Escalation) ─

scheduler = AsyncIOScheduler()


async def reminder_job():
    """Runs every hour to check for overdue approvals."""
    async with async_session_factory() as db:
        result = await check_pending_reminders(db)
        if result["reminders_sent"] or result["escalations"]:
            print(f"[SCHEDULER] Reminders: {result['reminders_sent']}, Escalations: {result['escalations']}")


# ── App Lifespan ──────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: create tables & start scheduler. Shutdown: stop scheduler."""
    await init_db()
    scheduler.add_job(reminder_job, "interval", hours=1)
    scheduler.start()
    print(f"🚀 {settings.app_name} is running!")
    yield
    scheduler.shutdown()


# ── Create FastAPI App ────────────────────────────────────

app = FastAPI(
    title=settings.app_name,
    description="Agentic AI-powered HR Support System - Fully Dynamic, Multi-Company",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register Routers ─────────────────────────────────────

app.include_router(company_router)
app.include_router(auth_router)
app.include_router(chat_router)
app.include_router(approval_router)
app.include_router(notifications_router)


# ── Health Check ──────────────────────────────────────────

@app.get("/")
async def root():
    return {
        "app": settings.app_name,
        "status": "running",
        "version": "1.0.0",
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}
