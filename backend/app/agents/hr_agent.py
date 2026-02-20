"""
Botivate HR Support - LangGraph Agentic Chatbot Engine
Core agent with nodes for Intent Understanding, Policy Search, DB Query, and Approval Routing.
"""

import json
from typing import Any, Dict, List, Optional, TypedDict, Annotated
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from langgraph.graph import StateGraph, END
from app.config import settings
from app.services.rag_service import answer_from_policies
from app.adapters.adapter_factory import get_adapter
from app.models.models import DatabaseType


# ── Agent State ───────────────────────────────────────────

class AgentState(TypedDict):
    # Session info
    company_id: str
    employee_id: str
    employee_name: str
    role: str
    schema_map: Dict[str, Any]
    db_config: Dict[str, Any]
    db_type: str

    # Conversation
    messages: List[Dict[str, str]]     # Chat history
    current_input: str                 # Latest user message
    intent: str                        # Detected intent
    response: str                      # Final response to send back
    actions: List[Dict[str, Any]]      # Interactive actions (buttons, etc.)

    # Data context
    employee_data: Dict[str, Any]      # Full employee record
    query_result: Optional[str]        # DB query result
    policy_answer: Optional[str]       # RAG search result
    approval_needed: bool              # Whether approval workflow was triggered


# ── LLM Instance ─────────────────────────────────────────

def get_llm() -> ChatOpenAI:
    return ChatOpenAI(
        model=settings.openai_model,
        api_key=settings.openai_api_key,
        temperature=0.2,
    )


# ── Node 1: Intent Understanding ─────────────────────────

async def understand_intent(state: AgentState) -> AgentState:
    """Classify the user's intent to route to the correct node."""
    llm = get_llm()

    prompt = f"""You are an intent classifier for an HR Support chatbot.

Employee: {state['employee_name']} (ID: {state['employee_id']}, Role: {state['role']})

The user said: "{state['current_input']}"

Classify the intent into EXACTLY ONE of these categories:
- "greeting" — Hello, hi, good morning, etc.
- "policy_query" — Questions about company rules, policies, leave policy, etc.
- "data_query" — Checking leave balance, salary info, personal details, etc.
- "leave_request" — Applying for leave, requesting time off
- "resignation" — Submitting resignation
- "grievance" — Filing a complaint or grievance
- "approval_action" — Manager/HR approving or rejecting a request
- "status_check" — Checking status of a previous request
- "support" — Password reset, login issues, account problems
- "general" — Everything else

Return ONLY the intent category string, nothing else.
"""

    response = await llm.ainvoke([HumanMessage(content=prompt)])
    state["intent"] = response.content.strip().lower().replace('"', '')
    return state


# ── Node 2: Greeting ─────────────────────────────────────

async def handle_greeting(state: AgentState) -> AgentState:
    """Greet the user using their profile data."""
    emp = state.get("employee_data", {})
    name = state.get("employee_name", "there")
    role = state.get("role", "employee")

    state["response"] = (
        f"Hello {name}! 👋 Welcome to your HR Support Portal. "
        f"You are logged in as **{role.title()}**. "
        f"How can I help you today? You can ask about company policies, check your leave balance, "
        f"submit requests, or anything else related to HR."
    )
    state["actions"] = []
    return state


# ── Node 3: Policy Query (RAG) ───────────────────────────

async def handle_policy_query(state: AgentState) -> AgentState:
    """Answer policy questions using ONLY company documents."""
    answer = await answer_from_policies(state["company_id"], state["current_input"])
    state["response"] = answer
    state["policy_answer"] = answer
    state["actions"] = []
    return state


# ── Node 4: Data Query (Database) ────────────────────────

async def handle_data_query(state: AgentState) -> AgentState:
    """Fetch live data from the company's database and answer."""
    try:
        db_type = DatabaseType(state.get("db_type", "google_sheets"))
        adapter = await get_adapter(db_type, state["db_config"])
        schema = state["schema_map"]
        primary_key = schema.get("primary_key", "")

        # RBAC enforcement
        role = state["role"]
        if role == "employee":
            # Can only access own data
            record = await adapter.get_record_by_key(primary_key, state["employee_id"])
            data_context = json.dumps(record, indent=2, default=str) if record else "No data found."
        elif role == "manager":
            # Can access team data (simplified: all records for now)
            records = await adapter.get_all_records()
            data_context = json.dumps(records[:20], indent=2, default=str)  # Limit
        elif role in ("hr", "admin"):
            records = await adapter.get_all_records()
            data_context = json.dumps(records[:50], indent=2, default=str)
        else:
            data_context = "Access denied for your role."

        # Use LLM to frame a human-friendly response
        llm = get_llm()
        answer_prompt = f"""You are an HR assistant. Answer the employee's question using ONLY the data below.

Employee Data:
{data_context}

Question: {state['current_input']}

Rules:
- Answer ONLY from the data provided.
- If the data does not contain the answer, say "I don't have this information in the database."
- Be professional and helpful.
- Format numbers and dates nicely.
"""
        response = await llm.ainvoke([HumanMessage(content=answer_prompt)])
        state["response"] = response.content.strip()
        state["query_result"] = state["response"]

    except Exception as e:
        state["response"] = f"I encountered an issue while fetching your data. Please try again. (Error: {str(e)})"

    state["actions"] = []
    return state


# ── Node 5: Leave Request / Grievance / Resignation ──────

async def handle_approval_request(state: AgentState) -> AgentState:
    """Handle requests that need human approval. AI NEVER approves."""
    intent = state["intent"]
    name = state["employee_name"]

    request_type_map = {
        "leave_request": "Leave Request",
        "resignation": "Resignation",
        "grievance": "Grievance",
    }
    request_label = request_type_map.get(intent, intent.replace("_", " ").title())

    state["response"] = (
        f"I understand you want to submit a **{request_label}**, {name}. "
        f"I have recorded your request and sent it to the appropriate authority for review. "
        f"You will be notified once a decision is made.\n\n"
        f"⚠️ Please note: I cannot approve requests myself — all approvals require human authorization."
    )
    state["approval_needed"] = True
    state["actions"] = [
        {"type": "info", "text": f"📋 {request_label} submitted for approval"},
        {"type": "button", "label": "Mark as Urgent", "action": "mark_urgent"},
    ]
    return state


# ── Node 6: Status Check ─────────────────────────────────

async def handle_status_check(state: AgentState) -> AgentState:
    """Check the status of previous requests."""
    state["response"] = (
        f"Let me check the status of your recent requests, {state['employee_name']}. "
        f"Please check your notifications (bell icon) for the latest updates on all your submitted requests."
    )
    state["actions"] = []
    return state


# ── Node 7: Support / Password Issues ────────────────────

async def handle_support(state: AgentState) -> AgentState:
    """Redirect to company support. AI never handles password resets."""
    state["response"] = (
        f"I understand you're facing an issue, {state['employee_name']}. "
        f"Unfortunately, I cannot reset passwords or handle account issues directly.\n\n"
        f"🔒 Please contact your company's support team for help. "
        f"You can find the support contact details in the **Help** section of the app."
    )
    state["actions"] = [
        {"type": "support_card", "text": "Show Company Support Info"},
    ]
    return state


# ── Node 8: General Response ─────────────────────────────

async def handle_general(state: AgentState) -> AgentState:
    """Handle general or unclassifiable messages."""
    llm = get_llm()

    emp_data = json.dumps(state.get("employee_data", {}), indent=2, default=str)

    prompt = f"""You are an HR Support AI assistant for {state['employee_name']} (Role: {state['role']}).

You must ONLY respond based on company policies and employee data. Do NOT use any generic HR knowledge.

Employee profile:
{emp_data}

The user said: "{state['current_input']}"

If you can answer from the data, answer helpfully. If not, politely say you can help with policy queries, leave requests, status checks, or direct them to company support.
"""
    response = await llm.ainvoke([HumanMessage(content=prompt)])
    state["response"] = response.content.strip()
    state["actions"] = []
    return state


# ── Router Function ───────────────────────────────────────

def route_intent(state: AgentState) -> str:
    """Route to the appropriate handler node based on detected intent."""
    intent = state.get("intent", "general")
    route_map = {
        "greeting": "greeting",
        "policy_query": "policy_query",
        "data_query": "data_query",
        "leave_request": "approval_request",
        "resignation": "approval_request",
        "grievance": "approval_request",
        "approval_action": "general",
        "status_check": "status_check",
        "support": "support",
        "general": "general",
    }
    return route_map.get(intent, "general")


# ── Build the LangGraph ──────────────────────────────────

def build_agent_graph() -> StateGraph:
    """Construct the LangGraph agent with all nodes and routing."""
    graph = StateGraph(AgentState)

    # Add nodes
    graph.add_node("understand_intent", understand_intent)
    graph.add_node("greeting", handle_greeting)
    graph.add_node("policy_query", handle_policy_query)
    graph.add_node("data_query", handle_data_query)
    graph.add_node("approval_request", handle_approval_request)
    graph.add_node("status_check", handle_status_check)
    graph.add_node("support", handle_support)
    graph.add_node("general", handle_general)

    # Set entry point
    graph.set_entry_point("understand_intent")

    # Add conditional routing after intent detection
    graph.add_conditional_edges(
        "understand_intent",
        route_intent,
        {
            "greeting": "greeting",
            "policy_query": "policy_query",
            "data_query": "data_query",
            "approval_request": "approval_request",
            "status_check": "status_check",
            "support": "support",
            "general": "general",
        },
    )

    # All handler nodes go to END
    for node in ["greeting", "policy_query", "data_query", "approval_request",
                  "status_check", "support", "general"]:
        graph.add_edge(node, END)

    return graph


# Compile the graph once
agent_graph = build_agent_graph().compile()


# ── Public API ────────────────────────────────────────────

async def chat_with_agent(
    company_id: str,
    employee_id: str,
    employee_name: str,
    role: str,
    schema_map: Dict[str, Any],
    db_config: Dict[str, Any],
    db_type: str,
    user_message: str,
    employee_data: Dict[str, Any],
    chat_history: List[Dict[str, str]],
) -> Dict[str, Any]:
    """
    Main entry point: send a message through the agent graph.
    Returns the AI response and any interactive actions.
    """
    initial_state: AgentState = {
        "company_id": company_id,
        "employee_id": employee_id,
        "employee_name": employee_name,
        "role": role,
        "schema_map": schema_map or {},
        "db_config": db_config or {},
        "db_type": db_type or "google_sheets",
        "messages": chat_history,
        "current_input": user_message,
        "intent": "",
        "response": "",
        "actions": [],
        "employee_data": employee_data or {},
        "query_result": None,
        "policy_answer": None,
        "approval_needed": False,
    }

    result = await agent_graph.ainvoke(initial_state)

    return {
        "reply": result.get("response", "I'm sorry, I wasn't able to process that."),
        "actions": result.get("actions", []),
        "intent": result.get("intent", ""),
        "approval_needed": result.get("approval_needed", False),
    }
