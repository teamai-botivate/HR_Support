"""
Botivate HR Support - Email Utility
Sends credential distribution and notification emails using company-configured SMTP.
"""

import aiosmtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional
from app.config import settings
from jinja2 import Template


# ── Credential Distribution Email Template ────────────────

CREDENTIAL_TEMPLATE = Template("""
<!DOCTYPE html>
<html>
<head><style>
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f6f9; padding: 30px; }
  .card { background: #fff; border-radius: 12px; padding: 40px; max-width: 500px; margin: auto;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
  .header { text-align: center; margin-bottom: 30px; }
  .header h1 { color: #1a1a2e; font-size: 22px; margin: 0; }
  .header p { color: #888; font-size: 14px; }
  .info-row { display: flex; justify-content: space-between; padding: 12px 0;
              border-bottom: 1px solid #f0f0f0; }
  .label { color: #888; font-size: 13px; }
  .value { color: #1a1a2e; font-weight: 600; font-size: 14px; }
  .btn { display: block; text-align: center; background: #6C63FF; color: #fff !important;
         padding: 14px; border-radius: 8px; text-decoration: none; font-weight: 600;
         margin-top: 30px; }
  .footer { text-align: center; margin-top: 30px; color: #aaa; font-size: 12px; }
</style></head>
<body>
<div class="card">
  <div class="header">
    <h1>Welcome to {{ company_name }}</h1>
    <p>Your HR Support Portal Credentials</p>
  </div>
  <div class="info-row"><span class="label">Company ID</span><span class="value">{{ company_id }}</span></div>
  <div class="info-row"><span class="label">Employee ID</span><span class="value">{{ employee_id }}</span></div>
  <div class="info-row"><span class="label">Password</span><span class="value">{{ password }}</span></div>
  <a class="btn" href="{{ login_link }}">Login to HR Portal</a>
  <div class="footer">
    <p>This is an automated email from {{ company_name }}.<br>
    Please change your password after first login.</p>
  </div>
</div>
</body>
</html>
""")


NOTIFICATION_TEMPLATE = Template("""
<!DOCTYPE html>
<html>
<head><style>
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f6f9; padding: 30px; }
  .card { background: #fff; border-radius: 12px; padding: 40px; max-width: 500px; margin: auto;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
  h2 { color: #1a1a2e; }
  p { color: #555; line-height: 1.6; }
  .btn { display: block; text-align: center; background: #6C63FF; color: #fff !important;
         padding: 14px; border-radius: 8px; text-decoration: none; font-weight: 600;
         margin-top: 20px; }
</style></head>
<body>
<div class="card">
  <h2>{{ title }}</h2>
  <p>{{ message }}</p>
  {% if login_link %}
  <a class="btn" href="{{ login_link }}">Open HR Portal</a>
  {% endif %}
</div>
</body>
</html>
""")


async def send_credential_email(
    to_email: str,
    company_name: str,
    company_id: str,
    employee_id: str,
    password: str,
    login_link: str,
    from_email: str,
    from_password: str,
) -> bool:
    """Send credentials to a single employee from the company HR email."""
    html_body = CREDENTIAL_TEMPLATE.render(
        company_name=company_name,
        company_id=company_id,
        employee_id=employee_id,
        password=password,
        login_link=login_link,
    )

    msg = MIMEMultipart("alternative")
    msg["From"] = from_email
    msg["To"] = to_email
    msg["Subject"] = f"Your HR Portal Credentials - {company_name}"
    msg.attach(MIMEText(html_body, "html"))

    try:
        await aiosmtplib.send(
            msg,
            hostname=settings.smtp_host,
            port=settings.smtp_port,
            start_tls=settings.smtp_use_tls,
            username=from_email,
            password=from_password,
        )
        return True
    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send to {to_email}: {e}")
        return False


async def send_notification_email(
    to_email: str,
    title: str,
    message: str,
    from_email: str,
    from_password: str,
    login_link: Optional[str] = None,
) -> bool:
    """Send a notification email (approval request, status update, reminder, etc.)"""
    html_body = NOTIFICATION_TEMPLATE.render(
        title=title,
        message=message,
        login_link=login_link,
    )

    msg = MIMEMultipart("alternative")
    msg["From"] = from_email
    msg["To"] = to_email
    msg["Subject"] = title
    msg.attach(MIMEText(html_body, "html"))

    try:
        await aiosmtplib.send(
            msg,
            hostname=settings.smtp_host,
            port=settings.smtp_port,
            start_tls=settings.smtp_use_tls,
            username=from_email,
            password=from_password,
        )
        return True
    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send notification to {to_email}: {e}")
        return False
