"""
Botivate HR Support - Authentication API Router
Login system: Role + Company ID + Employee ID + Password
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.schemas import LoginRequest, LoginResponse
from app.services.company_service import get_company
from app.adapters.adapter_factory import get_adapter
from app.utils.auth import create_access_token

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/login", response_model=LoginResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    """
    Single entry point login.
    Validates: Company ID → Employee ID → Password → Role
    """
    # Step 1: Verify company exists
    company = await get_company(db, data.company_id)
    if not company:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Company ID. Company not found.",
        )

    # Step 2: Get company's database connection
    from app.models.models import DatabaseConnection
    from sqlalchemy import select
    result = await db.execute(
        select(DatabaseConnection).where(
            DatabaseConnection.company_id == data.company_id,
            DatabaseConnection.is_active == True,
        )
    )
    db_conn = result.scalars().first()
    if not db_conn or not db_conn.schema_map:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Company database not configured properly.",
        )

    # Step 3: Fetch employee record from the external database
    adapter = await get_adapter(db_conn.db_type, db_conn.connection_config)
    schema = db_conn.schema_map
    primary_key = schema.get("primary_key", "")

    employee = await adapter.get_record_by_key(primary_key, data.employee_id)
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Employee ID. Employee not found.",
        )

    # Step 4: Validate password
    stored_password = str(employee.get("system_password", "")).strip()
    if not stored_password or stored_password != data.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid password.",
        )

    # Step 5: Get employee name
    name_col = schema.get("employee_name", "")
    employee_name = str(employee.get(name_col, "Employee")).strip()

    # Step 6: Create JWT token
    token_data = {
        "company_id": data.company_id,
        "employee_id": data.employee_id,
        "employee_name": employee_name,
        "role": data.role.value,
    }
    access_token = create_access_token(token_data)

    return LoginResponse(
        access_token=access_token,
        employee_id=data.employee_id,
        employee_name=employee_name,
        company_id=data.company_id,
        company_name=company.name,
        role=data.role,
    )
