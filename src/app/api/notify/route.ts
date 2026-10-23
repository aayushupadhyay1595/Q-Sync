import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, title, message, stage, tokenNumber, refCode } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'notifications@q-sync.io';

    if (!resendApiKey || resendApiKey.includes('placeholder')) {
      // In development or when Resend key is not yet provided, record durable log
      console.log(`[Q-Sync In-App Notification Dispatch] Stage: ${stage} | Token: ${tokenNumber} | To: ${email} | Title: ${title}`);
      return NextResponse.json({
        success: true,
        channel: 'in_app',
        message: 'Notification logged to in-app stream (Resend key not configured).'
      });
    }

    const resend = new Resend(resendApiKey);

    const emailResponse = await resend.emails.send({
      from: `Q-Sync Queue Alert <${fromEmail}>`,
      to: email,
      subject: `[Q-Sync] ${title}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <div style="background-color: #0f172a; padding: 16px; border-radius: 6px; text-align: center; color: #ffffff;">
            <h2 style="margin: 0; font-size: 20px; letter-spacing: 0.5px;">Q-Sync</h2>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8;">Smart Queue Management</p>
          </div>
          <div style="padding: 24px 0;">
            <h3 style="color: #0f172a; margin-top: 0;">${title}</h3>
            <p style="font-size: 15px; color: #334155; line-height: 1.6;">${message}</p>
            <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 16px; border-radius: 6px; margin: 20px 0; text-align: center;">
              <span style="font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600;">Your Token Number</span>
              <div style="font-size: 32px; font-weight: 700; color: #0284c7; letter-spacing: 1px; margin: 6px 0;">${tokenNumber}</div>
              <span style="font-size: 12px; color: #64748b;">Public Reference: <code>${refCode}</code></span>
            </div>
            <p style="font-size: 13px; color: #64748b;">You can track live progression in your browser without refreshing.</p>
          </div>
          <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 12px; color: #94a3b8; text-align: center;">
            &copy; ${new Date().getFullYear()} Q-Sync. Your turn. Without the wait.
          </div>
        </div>
      `
    });

    return NextResponse.json({ success: true, emailResponse });
  } catch (error: any) {
    console.error('Email dispatch error:', error);
    return NextResponse.json({ error: error.message || 'Failed to dispatch email' }, { status: 500 });
  }
}
