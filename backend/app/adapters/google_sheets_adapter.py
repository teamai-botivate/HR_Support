"""
Botivate HR Support - Google Sheets Adapter
Implements BaseDatabaseAdapter for Google Sheets.
This is the DEFAULT adapter used for employee data.
"""

import json
import gspread
from google.oauth2.service_account import Credentials
from typing import Any, Dict, List, Optional
from app.adapters.base_adapter import BaseDatabaseAdapter
from app.config import settings


SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
]


class GoogleSheetsAdapter(BaseDatabaseAdapter):
    """
    Adapter for Google Sheets.
    connection_config expected format:
    {
        "spreadsheet_id": "your-google-sheet-id",
        "sheet_name": "Sheet1"   (optional, defaults to first sheet)
    }
    """

    def __init__(self):
        self.client: Optional[gspread.Client] = None
        self.spreadsheet = None
        self.worksheet = None
        self._headers: List[str] = []

    async def connect(self, config: Dict[str, Any]) -> None:
        """Connect to Google Sheets using service account credentials."""
        spreadsheet_id = config.get("spreadsheet_id")
        sheet_name = config.get("sheet_name", None)

        if not spreadsheet_id:
            raise ValueError("spreadsheet_id is required in connection_config.")

        # Load service account credentials
        sa_path = settings.google_service_account_json
        if not sa_path:
            raise ValueError("GOOGLE_SERVICE_ACCOUNT_JSON path not configured in environment.")

        credentials = Credentials.from_service_account_file(sa_path, scopes=SCOPES)
        self.client = gspread.authorize(credentials)

        self.spreadsheet = self.client.open_by_key(spreadsheet_id)

        if sheet_name:
            self.worksheet = self.spreadsheet.worksheet(sheet_name)
        else:
            self.worksheet = self.spreadsheet.sheet1

        # Cache headers
        self._headers = self.worksheet.row_values(1)

    async def get_headers(self) -> List[str]:
        """Return column headers from row 1."""
        if not self._headers and self.worksheet:
            self._headers = self.worksheet.row_values(1)
        return self._headers

    async def get_all_records(self) -> List[Dict[str, Any]]:
        """Fetch all records as a list of dicts."""
        if not self.worksheet:
            raise ConnectionError("Not connected to any worksheet.")
        return self.worksheet.get_all_records()

    async def get_record_by_key(self, key_column: str, key_value: str) -> Optional[Dict[str, Any]]:
        """Find a single record by its primary key column value."""
        records = await self.get_all_records()
        for record in records:
            if str(record.get(key_column, "")).strip().lower() == str(key_value).strip().lower():
                return record
        return None

    async def get_records_by_filter(self, filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Filter records matching all key-value pairs in filters."""
        records = await self.get_all_records()
        results = []
        for record in records:
            match = True
            for fk, fv in filters.items():
                if str(record.get(fk, "")).strip().lower() != str(fv).strip().lower():
                    match = False
                    break
            if match:
                results.append(record)
        return results

    async def update_record(self, key_column: str, key_value: str, updates: Dict[str, Any]) -> bool:
        """Update a specific employee's fields by locating their row."""
        if not self.worksheet:
            raise ConnectionError("Not connected to any worksheet.")

        headers = await self.get_headers()
        if key_column not in headers:
            raise ValueError(f"Key column '{key_column}' not found in headers.")

        key_col_index = headers.index(key_column) + 1  # gspread is 1-indexed
        cell = self.worksheet.find(str(key_value), in_column=key_col_index)

        if not cell:
            return False

        row_number = cell.row
        for col_name, value in updates.items():
            if col_name in headers:
                col_index = headers.index(col_name) + 1
                self.worksheet.update_cell(row_number, col_index, value)

        return True

    async def add_column(self, column_name: str, default_values: Optional[List[Any]] = None) -> bool:
        """Add a new column at the end of the sheet."""
        if not self.worksheet:
            raise ConnectionError("Not connected to any worksheet.")

        headers = await self.get_headers()

        # Check if column already exists
        if column_name in headers:
            return True  # Already exists, no-op

        new_col_index = len(headers) + 1
        self.worksheet.update_cell(1, new_col_index, column_name)

        # Write default values if provided
        if default_values:
            for i, val in enumerate(default_values):
                self.worksheet.update_cell(i + 2, new_col_index, val)

        # Refresh headers cache
        self._headers = self.worksheet.row_values(1)
        return True

    async def update_column_values(self, column_name: str, key_column: str,
                                    key_value_map: Dict[str, Any]) -> bool:
        """Bulk update a column's values using a mapping of {key_value: new_value}."""
        if not self.worksheet:
            raise ConnectionError("Not connected to any worksheet.")

        headers = await self.get_headers()
        if column_name not in headers:
            raise ValueError(f"Column '{column_name}' not found.")
        if key_column not in headers:
            raise ValueError(f"Key column '{key_column}' not found.")

        key_col_idx = headers.index(key_column) + 1
        target_col_idx = headers.index(column_name) + 1

        all_values = self.worksheet.col_values(key_col_idx)

        for row_idx, cell_value in enumerate(all_values):
            if row_idx == 0:
                continue  # Skip header
            clean_val = str(cell_value).strip()
            if clean_val in key_value_map:
                self.worksheet.update_cell(row_idx + 1, target_col_idx, key_value_map[clean_val])

        return True

    async def get_column_values(self, column_name: str) -> List[Any]:
        """Get all values for a specific column (excluding header)."""
        if not self.worksheet:
            raise ConnectionError("Not connected to any worksheet.")

        headers = await self.get_headers()
        if column_name not in headers:
            raise ValueError(f"Column '{column_name}' not found.")

        col_idx = headers.index(column_name) + 1
        all_values = self.worksheet.col_values(col_idx)
        return all_values[1:]  # Exclude header
