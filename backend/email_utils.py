"""
Shared email utilities for Hampious.
All emails go through Brevo transactional API.
"""
import os

BREVO_API_KEY      = os.environ.get("BREVO_API_KEY", "")
BREVO_SENDER_EMAIL = os.environ.get("BREVO_SENDER_EMAIL", "team.hampious@gmail.com")
BREVO_SENDER_NAME  = os.environ.get("BREVO_SENDER_NAME", "Hampious")
FRONTEND_URL       = os.environ.get("FRONTEND_URL", "https://hampious-beta.vercel.app")

# SMTP fallback (Gmail App Password)
SMTP_HOST     = os.environ.get("EMAIL_HOST", "smtp.gmail.com")
SMTP_PORT     = int(os.environ.get("EMAIL_PORT", "587"))
SMTP_USER     = os.environ.get("EMAIL_USERNAME", BREVO_SENDER_EMAIL)
SMTP_PASSWORD = os.environ.get("EMAIL_PASSWORD", "")

# Logo URL — points to the logo served by the frontend.
# Works when FRONTEND_URL is set to the live deployed domain.
LOGO_URL = f"{FRONTEND_URL}/logo.jpg"

# ── Shared header / footer ────────────────────────────────────────────────────

def _email_header() -> str:
    return f"""
    <div style="background:#1A0F15;padding:1.5rem 2rem;text-align:center;">
      <a href="{FRONTEND_URL}" style="text-decoration:none;">
        <img src="{LOGO_URL}" alt="Hampious"
             style="height:52px;width:auto;object-fit:contain;display:inline-block;vertical-align:middle;"
             onerror="this.style.display='none'" />
        <span style="display:block;color:#D4789A;font-size:1.6rem;font-family:'Georgia',serif;
                     letter-spacing:0.16em;margin-top:6px;">HAMPIOUS</span>
      </a>
      <p style="color:rgba(255,245,248,0.45);font-size:0.7rem;letter-spacing:0.22em;
                text-transform:uppercase;margin:4px 0 0;">PREMIUM GIFT HAMPERS</p>
    </div>"""

def _email_footer() -> str:
    return f"""
    <div style="background:#FCEAF1;padding:1rem 2rem;text-align:center;
                border-top:1px solid rgba(212,120,154,0.15);">
      <p style="color:rgba(30,26,23,0.4);font-size:0.72rem;margin:0;">
        © 2025 Hampious. All rights reserved. &nbsp;|&nbsp;
        <a href="{FRONTEND_URL}" style="color:#B84E78;text-decoration:none;">Visit our store</a>
      </p>
    </div>"""

def _email_wrap(body: str) -> str:
    return f"""<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:20px;background:#f5f5f5;font-family:'Georgia',serif;">
  <div style="max-width:560px;margin:0 auto;background:#FFF5F8;border-radius:16px;
              overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    {_email_header()}
    {body}
    {_email_footer()}
  </div>
</body></html>"""


# ── Brevo sender ──────────────────────────────────────────────────────────────

def send_email(to_email: str, subject: str, html_body: str) -> bool:
    """Send via Brevo first, fall back to SMTP if Brevo fails."""

    # ── 1. Try Brevo ──────────────────────────────────────────────────────────
    if BREVO_API_KEY:
        try:
            import sib_api_v3_sdk
            config = sib_api_v3_sdk.Configuration()
            config.api_key["api-key"] = BREVO_API_KEY
            api = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(config))
            email_obj = sib_api_v3_sdk.SendSmtpEmail(
                to=[{"email": to_email}],
                sender={"name": BREVO_SENDER_NAME, "email": BREVO_SENDER_EMAIL},
                subject=subject,
                html_content=html_body,
            )
            api.send_transac_email(email_obj)
            print(f"[email:brevo] ✓ Sent '{subject}' to {to_email}")
            return True
        except Exception as e:
            print(f"[email:brevo] ✗ Error: {e} — trying SMTP fallback")
    else:
        print("[email:brevo] BREVO_API_KEY not set — trying SMTP fallback")

    # ── 2. SMTP fallback (Gmail App Password) ─────────────────────────────────
    if SMTP_PASSWORD:
        try:
            import smtplib
            from email.mime.multipart import MIMEMultipart
            from email.mime.text import MIMEText
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"]    = f"{BREVO_SENDER_NAME} <{SMTP_USER}>"
            msg["To"]      = to_email
            msg.attach(MIMEText(html_body, "html"))
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
                server.ehlo()
                server.starttls()
                server.login(SMTP_USER, SMTP_PASSWORD)
                server.sendmail(SMTP_USER, to_email, msg.as_string())
            print(f"[email:smtp] ✓ Sent '{subject}' to {to_email}")
            return True
        except Exception as e:
            print(f"[email:smtp] ✗ Error: {e}")
    else:
        print("[email:smtp] EMAIL_PASSWORD not set — email not sent")

    return False


# ── Email templates ───────────────────────────────────────────────────────────

def otp_email(otp: str, name: str = "there") -> str:
    body = f"""
    <div style="padding:2.5rem 2rem;text-align:center;">
      <h2 style="color:#3D1A2A;font-size:1.4rem;margin:0 0 0.5rem;">Hi {name}! 👋</h2>
      <p style="color:rgba(30,26,23,0.6);margin:0 0 1.5rem;">Your one-time login code is:</p>
      <div style="background:#fff;border:2px dashed #D4789A;border-radius:14px;
                  padding:1.5rem;margin:0 auto 1.5rem;display:inline-block;min-width:200px;">
        <span style="font-size:2.5rem;font-weight:bold;color:#B84E78;
                     letter-spacing:12px;font-family:monospace;">{otp}</span>
      </div>
      <p style="color:rgba(30,26,23,0.45);font-size:0.85rem;margin:0;">
        ⏱ Valid for <strong>10 minutes</strong>. Do not share with anyone.
      </p>
    </div>"""
    return _email_wrap(body)


def reset_password_email(reset_link: str) -> str:
    body = f"""
    <div style="padding:2.5rem 2rem;text-align:center;">
      <div style="width:64px;height:64px;border-radius:50%;border:2px solid #D4789A;
                  background:rgba(212,120,154,0.1);display:inline-flex;align-items:center;
                  justify-content:center;margin-bottom:1.5rem;font-size:1.8rem;">🔑</div>
      <h2 style="color:#3D1A2A;font-size:1.5rem;margin:0 0 0.75rem;">Reset Your Password</h2>
      <p style="color:rgba(30,26,23,0.55);font-size:0.9rem;line-height:1.8;margin:0 0 2rem;">
        We received a request to reset your password.<br/>
        Click the button below to set a new one.
      </p>
      <a href="{reset_link}"
         style="display:inline-block;background:#D4789A;color:#FFFFFF;text-decoration:none;
                padding:0.85rem 2.5rem;border-radius:50px;font-size:0.9rem;font-weight:600;
                letter-spacing:0.08em;">Reset Password →</a>
      <p style="color:rgba(30,26,23,0.35);font-size:0.78rem;margin:2rem 0 0;line-height:1.7;">
        This link expires in <strong>1 hour</strong>.<br/>
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>"""
    return _email_wrap(body)


STATUS_LABELS = {
    "pending":    ("Order Received",  "#F59E0B"),
    "confirmed":  ("Confirmed",       "#3B82F6"),
    "processing": ("Processing",      "#6366F1"),
    "shipped":    ("Shipped",         "#8B5CF6"),
    "out_for_delivery": ("Out for Delivery", "#F97316"),
    "delivered":  ("Delivered",       "#10B981"),
    "cancelled":  ("Cancelled",       "#EF4444"),
}

STATUS_MESSAGES = {
    "pending":    "We've received your order and will start preparing it shortly.",
    "confirmed":  "Great news! Your order has been confirmed and is being prepared.",
    "processing": "Your order is being carefully packed with love.",
    "shipped":    "Your order is on its way! Track it with the details below.",
    "out_for_delivery": "Your order is out for delivery. Expect it today!",
    "delivered":  "Your order has been delivered. We hope you love it! 🎁",
    "cancelled":  "Your order has been cancelled. If you have questions, please contact us.",
}

def order_status_email(order: dict) -> str:
    status = order.get("status", "pending")
    label, color = STATUS_LABELS.get(status, (status.title(), "#D4789A"))
    message = STATUS_MESSAGES.get(status, f"Your order status has been updated to {label}.")
    customer_name = order.get("customer_name") or order.get("name") or "Valued Customer"
    order_id = order.get("id", "")

    tracking_html = ""
    if order.get("tracking_number"):
        courier = order.get("courier", "")
        tracking_html = f"""
        <div style="background:#fff;border:1px solid rgba(212,120,154,0.2);border-radius:12px;
                    padding:1rem 1.5rem;margin:1.5rem 0;text-align:left;">
          <p style="margin:0 0 4px;font-size:0.78rem;color:rgba(30,26,23,0.4);
                    text-transform:uppercase;letter-spacing:0.1em;">Tracking Number</p>
          <p style="margin:0;font-size:1.1rem;font-weight:700;color:#3D1A2A;
                    font-family:monospace;">{order["tracking_number"]}</p>
          {"<p style='margin:4px 0 0;font-size:0.82rem;color:#7c5a6a;'>via " + courier + "</p>" if courier else ""}
        </div>"""

    items = order.get("items", [])
    items_html = ""
    if items:
        rows = "".join(
            f"""<tr>
              <td style="padding:8px 0;color:#3D1A2A;font-size:0.88rem;">{i.get("name","Item")}</td>
              <td style="padding:8px 0;text-align:right;color:#7c5a6a;font-size:0.88rem;">
                x{i.get("qty",i.get("quantity",1))} &nbsp; ₹{i.get("price","")}</td>
            </tr>"""
            for i in items
        )
        items_html = f"""
        <table style="width:100%;border-collapse:collapse;margin:1.5rem 0;font-family:'Georgia',serif;">
          <thead>
            <tr style="border-bottom:1.5px solid rgba(212,120,154,0.2);">
              <th style="text-align:left;padding:0 0 8px;font-size:0.78rem;color:rgba(30,26,23,0.4);
                         text-transform:uppercase;letter-spacing:0.1em;font-weight:500;">Item</th>
              <th style="text-align:right;padding:0 0 8px;font-size:0.78rem;color:rgba(30,26,23,0.4);
                         text-transform:uppercase;letter-spacing:0.1em;font-weight:500;">Details</th>
            </tr>
          </thead>
          <tbody>{rows}</tbody>
          <tfoot>
            <tr style="border-top:1.5px solid rgba(212,120,154,0.2);">
              <td style="padding:12px 0 0;font-weight:700;color:#3D1A2A;">Total</td>
              <td style="padding:12px 0 0;text-align:right;font-weight:700;color:#B84E78;font-size:1rem;">
                ₹{order.get("total","")}</td>
            </tr>
          </tfoot>
        </table>"""

    body = f"""
    <div style="padding:2rem 2rem 1.5rem;">
      <div style="margin-bottom:1.25rem;">
        <span style="background:{color};color:#fff;border-radius:50px;padding:5px 16px;
                     font-size:0.78rem;font-weight:600;letter-spacing:0.06em;
                     text-transform:uppercase;">{label}</span>
      </div>
      <h2 style="color:#3D1A2A;font-size:1.35rem;margin:0 0 0.5rem;">
        Hi {customer_name}!</h2>
      <p style="color:rgba(30,26,23,0.6);margin:0 0 0.25rem;font-size:0.9rem;">
        Order <strong style="color:#3D1A2A;">#{order_id}</strong>
      </p>
      <p style="color:rgba(30,26,23,0.7);font-size:0.95rem;line-height:1.7;margin:1rem 0 0;">
        {message}
      </p>
      {tracking_html}
      {items_html}
      <div style="text-align:center;margin-top:1.5rem;">
        <a href="{FRONTEND_URL}/my-orders"
           style="display:inline-block;background:#D4789A;color:#FFFFFF;text-decoration:none;
                  padding:0.85rem 2.5rem;border-radius:50px;font-size:0.88rem;font-weight:600;
                  letter-spacing:0.06em;">View My Orders →</a>
      </div>
    </div>"""
    return _email_wrap(body)


def shipment_dispatched_email(order: dict, awb_code: str, courier_name: str, tracking_url: str = "") -> str:
    customer_name = (order.get("shipping_address") or {}).get("full_name") or order.get("customer_name", "there")
    order_id = str(order.get("id", "")).replace("ORD-", "")[:8].upper()
    addr = order.get("shipping_address") or {}
    address_str = ", ".join(filter(None, [
        addr.get("address") or addr.get("line1"),
        addr.get("city"),
        addr.get("state"),
        str(addr.get("pincode", "")),
    ]))

    tracking_section = ""
    if awb_code:
        tracking_section = f"""
      <div style="background:#EDE9FE;border:1px solid #c4b5fd;border-radius:14px;
                  padding:1.5rem;margin:1.25rem 0;text-align:center;">
        <p style="margin:0 0 6px;font-size:0.8rem;font-weight:700;color:#5B21B6;
                  letter-spacing:0.1em;text-transform:uppercase;">Tracking Number</p>
        <p style="margin:0;font-size:1.6rem;font-weight:800;color:#4C1D95;
                  letter-spacing:4px;font-family:monospace;">{awb_code}</p>
        <p style="margin:6px 0 0;font-size:0.82rem;color:#7C3AED;">via {courier_name}</p>
        {f'<a href="{tracking_url}" style="display:inline-block;margin-top:10px;background:#7C3AED;color:#fff;text-decoration:none;padding:8px 20px;border-radius:50px;font-size:0.8rem;font-weight:600;">Track Shipment →</a>' if tracking_url else ''}
      </div>"""

    body = f"""
    <div style="padding:2rem 2rem 1.5rem;">
      <div style="margin-bottom:1.25rem;">
        <span style="background:#7C3AED;color:#fff;border-radius:50px;padding:5px 16px;
                     font-size:0.78rem;font-weight:600;letter-spacing:0.06em;
                     text-transform:uppercase;">🚚 Shipped!</span>
      </div>
      <h2 style="color:#3D1A2A;font-size:1.35rem;margin:0 0 0.5rem;">
        Your order is on its way, {customer_name}! 🎁</h2>
      <p style="color:rgba(30,26,23,0.6);margin:0 0 0.25rem;font-size:0.9rem;">
        Order <strong style="color:#3D1A2A;">#{order_id}</strong>
      </p>
      <p style="color:rgba(30,26,23,0.7);font-size:0.95rem;line-height:1.7;margin:1rem 0 0;">
        Great news! Your Hampious gift hamper has been handed over to <strong>{courier_name}</strong> and is on its way to:
      </p>
      <div style="background:#FFF5F8;border:1px solid #f3d0dd;border-radius:10px;
                  padding:12px 16px;margin:1rem 0;font-size:0.9rem;color:#3D1A2A;line-height:1.7;">
        📍 {address_str or "Your delivery address"}
      </div>
      {tracking_section}
      <div style="text-align:center;margin-top:1.5rem;">
        <a href="{FRONTEND_URL}/my-orders"
           style="display:inline-block;background:#D4789A;color:#FFFFFF;text-decoration:none;
                  padding:0.85rem 2.5rem;border-radius:50px;font-size:0.88rem;font-weight:600;
                  letter-spacing:0.06em;">View My Orders →</a>
      </div>
    </div>"""
    return _email_wrap(body)


def order_confirmation_email(order: dict) -> str:
    customer_name = (order.get("shipping_address") or {}).get("full_name") or order.get("customer_name", "there")
    order_id = str(order.get("id", "")).upper()
    items = order.get("items", [])
    addr = order.get("shipping_address") or {}
    address_str = ", ".join(filter(None, [
        addr.get("address") or addr.get("line1"),
        addr.get("city"),
        addr.get("state"),
        str(addr.get("pincode", "")),
    ]))
    final_amount = order.get("final_amount") or order.get("total") or 0
    discount = order.get("discount_amount", 0)
    coupon = order.get("coupon_code", "")
    payment_method = (order.get("payment_method") or "").upper()

    # Items HTML
    items_html = ""
    if items:
        rows = "".join(f"""
          <tr>
            <td style="padding:10px 16px;border-bottom:1px solid #fdeef3;font-size:13px;color:#3D1A2A;">
              {item.get('product_name') or item.get('name','Product')}
              <span style="color:#a0728a;font-size:11px;"> × {item.get('quantity',1)}</span>
            </td>
            <td style="padding:10px 16px;border-bottom:1px solid #fdeef3;font-size:13px;font-weight:700;color:#B84E78;text-align:right;">
              ₹{int(float(item.get('price',0)) * int(item.get('quantity',1))):,}
            </td>
          </tr>""" for item in items)

        discount_row = f"""
          <tr style="background:#FFF5F8;">
            <td style="padding:8px 16px;font-size:12px;color:#065F46;">🎟️ Coupon ({coupon})</td>
            <td style="padding:8px 16px;font-size:12px;font-weight:700;color:#065F46;text-align:right;">- ₹{int(float(discount)):,}</td>
          </tr>""" if discount and coupon else ""

        items_html = f"""
        <div style="margin:1.5rem 0;">
          <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #f3d0dd;">
            {rows}
            {discount_row}
            <tr style="background:#FCEAF1;">
              <td style="padding:13px 16px;font-weight:700;color:#1A0F15;font-size:15px;">Total Paid</td>
              <td style="padding:13px 16px;font-weight:800;color:#B84E78;font-size:17px;text-align:right;">₹{int(float(final_amount)):,}</td>
            </tr>
          </table>
        </div>"""

    address_html = f"""
        <div style="background:#fff;border:1px solid #f3d0dd;border-radius:10px;padding:12px 16px;margin:1rem 0;font-size:13px;color:#3D1A2A;line-height:1.7;">
          📍 {address_str or "Your delivery address"}
        </div>""" if address_str else ""

    payment_html = f'<p style="margin:0.5rem 0 0;font-size:12px;color:#a0728a;">Payment: {payment_method}</p>' if payment_method else ""

    body = f"""
    <div style="padding:2rem 2rem 1.5rem;">
      <div style="margin-bottom:1.25rem;">
        <span style="background:#D4789A;color:#fff;border-radius:50px;padding:5px 16px;
                     font-size:0.78rem;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;">
          🎁 Order Confirmed!
        </span>
      </div>
      <h2 style="color:#3D1A2A;font-size:1.35rem;margin:0 0 0.4rem;">
        Thank you, {customer_name}! 💕</h2>
      <p style="color:rgba(30,26,23,0.55);font-size:0.88rem;margin:0 0 0.25rem;">
        Order <strong style="color:#3D1A2A;">#{order_id}</strong> has been placed successfully.
      </p>
      {payment_html}
      <p style="color:rgba(30,26,23,0.7);font-size:0.95rem;line-height:1.7;margin:1rem 0 0;">
        We're carefully preparing your Hampious gift hamper with love. You'll receive another email once it's shipped.
      </p>
      {items_html}
      <p style="font-size:13px;color:#7c5a6a;margin:0.5rem 0 0.25rem;font-weight:600;">Delivering to:</p>
      {address_html}
      <div style="text-align:center;margin-top:1.5rem;">
        <a href="{FRONTEND_URL}/my-orders"
           style="display:inline-block;background:#D4789A;color:#FFFFFF;text-decoration:none;
                  padding:0.85rem 2.5rem;border-radius:50px;font-size:0.88rem;font-weight:600;
                  letter-spacing:0.06em;">Track My Order →</a>
      </div>
    </div>"""
    return _email_wrap(body)


def order_cancellation_admin_email(order: dict, reason: str = "") -> str:
    customer_name = (order.get("shipping_address") or {}).get("full_name") or order.get("customer_name", "Customer")
    customer_email = order.get("customer_email", "")
    customer_phone = order.get("customer_phone", "") or (order.get("shipping_address") or {}).get("phone", "")
    order_id = str(order.get("id", "")).upper()
    final_amount = order.get("final_amount") or order.get("total_amount") or 0
    items = order.get("items", [])

    items_html = "".join(f"""
      <tr>
        <td style="padding:8px 16px;border-bottom:1px solid #fdeef3;font-size:13px;color:#3D1A2A;">
          {item.get('product_name') or item.get('name','Product')} × {item.get('quantity',1)}
        </td>
        <td style="padding:8px 16px;border-bottom:1px solid #fdeef3;font-size:13px;font-weight:700;color:#B84E78;text-align:right;">
          ₹{int(float(item.get('price',0)) * int(item.get('quantity',1))):,}
        </td>
      </tr>""" for item in items)

    reason_html = f"""
      <div style="background:#FEF3C7;border:1px solid #FDE68A;border-radius:10px;padding:12px 16px;margin:1rem 0;font-size:13px;color:#92400E;">
        <strong>Cancellation Reason:</strong> {reason}
      </div>""" if reason else ""

    body = f"""
    <div style="padding:2rem 2rem 1.5rem;">
      <div style="margin-bottom:1.25rem;">
        <span style="background:#EF4444;color:#fff;border-radius:50px;padding:5px 16px;
                     font-size:0.78rem;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;">
          ❌ Order Cancelled
        </span>
      </div>
      <h2 style="color:#3D1A2A;font-size:1.35rem;margin:0 0 0.5rem;">Order Cancellation Request</h2>
      <p style="color:rgba(30,26,23,0.6);font-size:0.9rem;margin:0 0 1rem;">
        Order <strong style="color:#3D1A2A;">#{order_id}</strong> has been cancelled by the customer.
      </p>

      <div style="background:#FFF5F8;border:1px solid #f3d0dd;border-radius:12px;padding:16px;margin:1rem 0;">
        <p style="margin:0 0 6px;font-size:13px;"><strong>Customer:</strong> {customer_name}</p>
        <p style="margin:0 0 6px;font-size:13px;"><strong>Email:</strong> {customer_email}</p>
        {f'<p style="margin:0 0 6px;font-size:13px;"><strong>Phone:</strong> {customer_phone}</p>' if customer_phone else ''}
        <p style="margin:0;font-size:13px;"><strong>Order Value:</strong> ₹{int(float(final_amount)):,}</p>
      </div>

      {reason_html}

      <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #f3d0dd;margin:1rem 0;">
        {items_html}
        <tr style="background:#FCEAF1;">
          <td style="padding:12px 16px;font-weight:700;color:#1A0F15;">Total</td>
          <td style="padding:12px 16px;font-weight:800;color:#B84E78;text-align:right;">₹{int(float(final_amount)):,}</td>
        </tr>
      </table>

      <div style="text-align:center;margin-top:1.5rem;">
        <a href="{FRONTEND_URL}/admin/orders"
           style="display:inline-block;background:#D4789A;color:#FFFFFF;text-decoration:none;
                  padding:0.85rem 2.5rem;border-radius:50px;font-size:0.88rem;font-weight:600;
                  letter-spacing:0.06em;">View in Admin Portal →</a>
      </div>
    </div>"""
    return _email_wrap(body)


def order_cancellation_customer_email(order: dict) -> str:
    customer_name = (order.get("shipping_address") or {}).get("full_name") or order.get("customer_name", "there")
    order_id = str(order.get("id", "")).upper()
    final_amount = order.get("final_amount") or order.get("total_amount") or 0

    body = f"""
    <div style="padding:2rem 2rem 1.5rem;text-align:center;">
      <div style="margin-bottom:1.25rem;">
        <span style="background:#6B7280;color:#fff;border-radius:50px;padding:5px 16px;
                     font-size:0.78rem;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;">
          Order Cancelled
        </span>
      </div>
      <h2 style="color:#3D1A2A;font-size:1.35rem;margin:0 0 0.5rem;">
        Your order has been cancelled, {customer_name}.</h2>
      <p style="color:rgba(30,26,23,0.6);font-size:0.9rem;margin:0 0 1rem;">
        Order <strong style="color:#3D1A2A;">#{order_id}</strong> (₹{int(float(final_amount)):,}) has been successfully cancelled.
      </p>
      <p style="color:rgba(30,26,23,0.65);font-size:0.9rem;line-height:1.7;margin:0 0 1.5rem;">
        If you paid online, your refund will be processed within 5–7 business days.<br/>
        For any queries, reply to this email or contact us at <a href="mailto:{BREVO_SENDER_EMAIL}" style="color:#B84E78;">{BREVO_SENDER_EMAIL}</a>.
      </p>
      <a href="{FRONTEND_URL}/products"
         style="display:inline-block;background:#D4789A;color:#FFFFFF;text-decoration:none;
                padding:0.85rem 2.5rem;border-radius:50px;font-size:0.88rem;font-weight:600;
                letter-spacing:0.06em;">Continue Shopping →</a>
    </div>"""
    return _email_wrap(body)
