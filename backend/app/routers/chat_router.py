"""
Botivate HR Support - Chat API Router
Connects the frontend chatbot to the LangGraph agent.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.schemas import ChatMessage, ChatResponse, TokenPayload, ApprovalRequestCreate
from app.models.models import DatabaseConnection, RequestPriority, UserRole
from app.utils.auth import get_current_user
from app.agents.hr_agent import chat_with_agent
from app.adapters.adapter_factory import get_adapter
from app.services.company_service import get_company
from app.services.approval_service import create_approval_request

router = APIRouter(prefix="/api/chat", tags=["Chat"])


@router.post("/send", response_model=ChatResponse)
async def send_message(
    data: ChatMessage,
    user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Send a message to the AI chatbot.
    The agent handles intent detection, RAG, DB queries, and approval routing.
    """
    # Fetch company's database connection & schema
    result = await db.execute(
        select(DatabaseConnection).where(
            DatabaseConnection.company_id == user.company_id,
            DatabaseConnection.is_active == True,
        )
    )
    db_conn = result.scalars().first()
    schema_map = db_conn.schema_map if db_conn else {}
    db_config = db_conn.connection_config if db_conn else {}
    db_type = db_conn.db_type.value if db_conn else "google_sheets"

    # Fetch employee data from external DB
    employee_data = {}
    if db_conn and schema_map:
        try:
            adapter = await get_adapter(db_conn.db_type, db_config)
            primary_key = schema_map.get("primary_key", "")
            employee_data = await adapter.get_record_by_key(primary_key, user.employee_id) or {}
        except Exception as e:
            print(f"[CHAT] Error fetching employee data: {e}")

    # Run through LangGraph agent
    agent_result = await chat_with_agent(
        company_id=user.company_id,
        employee_id=user.employee_id,
        employee_name=user.employee_name,
        role=user.role.value if isinstance(user.role, UserRole) else user.role,
        schema_map=schema_map,
        db_config=db_config,
        db_type=db_type,
        user_message=data.message,
        employee_data=employee_data,
        chat_history=[],  # Can be extended with session-based history
    )

    # If approval is needed, create the request in DB
    if agent_result.get("approval_needed"):
        intent = agent_result.get("intent", "general")
        try:
            await create_approval_request(
                db=db,
                company_id=user.company_id,
                data=ApprovalRequestCreate(
                    employee_id=user.employee_id,
                    employee_name=user.employee_name,
                    request_type=intent,
                    context=data.message,
                    priority=RequestPriority.NORMAL,
                    assigned_to_role=UserRole.MANAGER,
                ),
            )
        except Exception as e:
            print(f"[CHAT] Error creating approval request: {e}")

    return ChatResponse(
        reply=agent_result.get("reply", "I'm sorry, something went wrong."),
        actions=agent_result.get("actions"),
    )
