/**
 * Lightweight Email Service for Plantio.ge
 * Directly communicates with Resend API via native fetch.
 * Works in Mock Mode until RESEND_API_KEY is configured in environment.
 */

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

export async function sendEmail({
  to,
  subject,
  html,
  from,
  replyTo,
}: SendEmailParams): Promise<{ success: boolean; id?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const senderEmail = from || process.env.EMAIL_FROM || "Plantio.ge <notifications@plantsale.ge>";

  // Graceful fallback if Resend API key is not yet set up
  if (!apiKey) {
    if (process.env.NODE_ENV !== "production") {
      console.log("[EmailService: Mock Mode] Email notification recorded:", {
        to,
        subject,
        senderEmail,
        timestamp: new Date().toISOString(),
      });
    }
    return { success: true, id: `mock-${Date.now()}` };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: senderEmail,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        reply_to: replyTo,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("[EmailService] Resend API Error:", data);
      return { success: false, error: data.message || "Email dispatch failed" };
    }

    return { success: true, id: data.id };
  } catch (error: any) {
    console.error("[EmailService] Network exception:", error);
    return { success: false, error: error?.message || "Network error" };
  }
}

/**
 * Send alert to Admin when new feedback / inquiry is submitted
 */
export async function sendFeedbackAdminNotification(payload: {
  name: string;
  email: string;
  phone?: string | null;
  type: string;
  subject?: string | null;
  message: string;
}) {
  const adminEmail = process.env.ADMIN_EMAIL || "tokolejo@gmail.com";

  const typeMap: Record<string, string> = {
    general: "ზოგადი შეკითხვა",
    suggestion: "რჩევა & იდეა",
    bug: "ხარვეზის დაფიქსირება",
    correction: "შესწორება / დაზუსტება",
    partnership: "თანამშრომლობა / B2B",
  };

  const categoryLabel = typeMap[payload.type] || payload.type;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; padding: 20px; }
          .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
          .header { background: #166534; padding: 24px; color: #ffffff; }
          .badge { display: inline-block; padding: 4px 10px; background: rgba(255,255,255,0.2); border-radius: 20px; font-size: 12px; font-weight: bold; margin-top: 8px; }
          .body { padding: 24px; }
          .field { margin-bottom: 12px; }
          .field-label { font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; }
          .field-val { font-size: 15px; font-weight: 500; color: #0f172a; margin-top: 2px; }
          .msg-box { background: #f1f5f9; border-left: 4px solid #166534; padding: 16px; border-radius: 8px; margin-top: 16px; white-space: pre-wrap; font-size: 14px; line-height: 1.6; }
          .footer { padding: 16px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; }
          .btn { display: inline-block; padding: 10px 20px; background: #166534; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 13px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h2 style="margin:0; font-size: 18px;">🌱 ახალი შეტყობინება Plantio.ge-ზე</h2>
            <div class="badge">${categoryLabel}</div>
          </div>
          <div class="body">
            <div class="field">
              <div class="field-label">გამომგზავნი:</div>
              <div class="field-val">${payload.name} &lt;${payload.email}&gt;</div>
            </div>
            ${
              payload.phone
                ? `
            <div class="field">
              <div class="field-label">ტელეფონი:</div>
              <div class="field-val">${payload.phone}</div>
            </div>`
                : ""
            }
            ${
              payload.subject
                ? `
            <div class="field">
              <div class="field-label">თემა:</div>
              <div class="field-val"><strong>${payload.subject}</strong></div>
            </div>`
                : ""
            }
            <div class="field">
              <div class="field-label">შეტყობინების ტექსტი:</div>
              <div class="msg-box">${payload.message}</div>
            </div>
          </div>
          <div class="footer">
            <a href="mailto:${payload.email}?subject=Re: ${encodeURIComponent(payload.subject || "Plantio.ge")}" class="btn">
              წერილზე პასუხის გაცემა (Reply)
            </a>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: adminEmail,
    subject: `🌱 [${categoryLabel}] ${payload.subject || payload.name} - Plantio.ge`,
    html,
    replyTo: payload.email,
  });
}

/**
 * Send automated confirmation receipt to the user who reached out
 */
export async function sendFeedbackUserConfirmation(payload: {
  name: string;
  email: string;
  subject?: string | null;
  message: string;
}) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; padding: 20px; }
          .card { max-width: 550px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; }
          .header { background: #15803d; padding: 24px; color: #ffffff; text-align: center; }
          .body { padding: 24px; font-size: 14px; line-height: 1.6; color: #334155; }
          .quote { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin: 16px 0; font-style: italic; font-size: 13px; color: #64748b; }
          .footer { padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h2 style="margin:0; font-size: 18px;">მადლობა დაკავშირებისთვის! 🌱</h2>
          </div>
          <div class="body">
            <p>გამარჯობა <strong>${payload.name}</strong>,</p>
            <p>თქვენი შეტყობინება წარმატებით მივიღეთ. Plantio.ge-ს გუნდი უმოკლეს დროში განიხილავს თქვენს წერილს და საჭიროებისამებრ დაგიკავშირდებათ ამ ელ-ფოსტაზე.</p>
            <div class="quote">"${payload.message.slice(0, 300)}${payload.message.length > 300 ? "..." : ""}"</div>
            <p style="margin-top: 16px;">პატივისცემით,<br><strong>Plantio.ge-ს გუნდი</strong></p>
          </div>
          <div class="footer">
            ეს არის ავტომატური შეტყობინება.
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: payload.email,
    subject: "თქვენი შეტყობინება მიღებულია - Plantio.ge",
    html,
  });
}

/**
 * Prepared Welcome Email for newly registered users
 */
export async function sendWelcomeEmail(user: { email: string; name?: string | null }) {
  const displayName = user.name || "მებაღე";
  const html = `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: sans-serif; background-color: #f8fafc; padding: 24px; color: #0f172a;">
        <div style="max-width: 560px; margin: 0 auto; background: #fff; padding: 32px; border-radius: 16px; border: 1px solid #e2e8f0;">
          <h2 style="color: #15803d; margin-top: 0;">მოგესალმებით Plantio-ში, ${displayName}! 🌱</h2>
          <p style="line-height: 1.6; color: #334155;">მოხარული ვართ, რომ შემოუერთდით საქართველოს უდიდეს მცენარეების ეკოსისტემას.</p>
          <p style="line-height: 1.6; color: #334155;">ახლა თქვენ შეგიძლიათ:</p>
          <ul style="color: #334155; line-height: 1.8;">
            <li>უფასოდ განათავსოთ მცენარეების განცხადებები</li>
            <li>გახსნათ საკუთარი ონლაინ ორანჟერეა და მაღაზია</li>
            <li>დაუკავშირდეთ სხვა კოლექციონერებსა და გამწვანების სპეციალისტებს</li>
          </ul>
          <div style="text-align: center; margin-top: 24px;">
            <a href="https://plantsale.ge/dashboard" style="background: #15803d; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; display: inline-block;">
              ორანჟერეის გახსნა →
            </a>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: user.email,
    subject: "კეთილი იყოს თქვენი მობრძანება Plantio.ge-ზე! 🌱",
    html,
  });
}
