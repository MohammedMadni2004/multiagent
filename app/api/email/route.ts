import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(req: NextRequest) {
  try {
    const { contacts } = await req.json();

    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json({ error: 'No contacts provided' }, { status: 400 });
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const RESEND_FROM = process.env.RESEND_FROM || 'Acme <onboarding@resend.dev>';

    if (!RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'Missing RESEND_API_KEY in environment variables (.env.local)' },
        { status: 500 }
      );
    }

    const resend = new Resend(RESEND_API_KEY);
    const results = [];

    // Trigger emails for each contact
    for (const contact of contacts) {
      // Validate email presence
      if (!contact.email) {
        results.push({
          name: contact.name,
          email: contact.email,
          status: 'skipped',
          reason: 'No email address provided'
        });
        continue;
      }

      try {
        const { data, error } = await resend.emails.send({
          from: RESEND_FROM,
          to: [contact.email],
          subject: `Automate your operations, ${contact.name || 'there'} ⚡️`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
              <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                
                <!-- Header -->
                <div style="background-color: #000000; padding: 32px 40px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">LEAD GENERATOR</h1>
                </div>

                <!-- Body -->
                <div style="padding: 40px;">
                  <p style="font-size: 18px; color: #111827; margin-top: 0; margin-bottom: 24px; font-weight: 500;">
                    Hi ${contact.name || 'there'},
                  </p>
                  
                  <p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin-bottom: 24px;">
                    I'm reaching out because I noticed your team is working hard to scale operations. We've been helping forward-thinking companies <strong>automate their entire workflows</strong> using autonomous AI agents.
                  </p>
                  
                  <div style="background-color: #f3f4f6; border-left: 4px solid #4f46e5; padding: 20px; border-radius: 0 8px 8px 0; margin-bottom: 28px;">
                    <p style="font-size: 16px; color: #374151; margin: 0; font-style: italic;">
                      "Instead of manually processing leads or handling repetitive support queries, our AI systems seamlessly integrate into your pipeline—freeing your team to focus on high-leverage work."
                    </p>
                  </div>
                  
                  <p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin-bottom: 32px;">
                    Would you be open to a brief 10-minute chat next week to see if this could be a fit for your current growth goals?
                  </p>

                  <!-- CTA Button -->
                  <div style="text-align: center; margin-bottom: 40px;">
                    <a href="https://meet.google.com/ndx-wzbe-hnx" style="display: inline-block; background-color: #4f46e5; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px; box-shadow: 0 2px 4px rgba(79, 70, 229, 0.3);">
                      Book a 10-Min Intro Call
                    </a>
                  </div>

                  <!-- Divider -->
                  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 0 0 24px 0;">

                  <!-- Signature -->
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding-right: 16px; width: 48px;">
                        <div style="width: 48px; height: 48px; border-radius: 50%; background-color: #e5e7eb; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #4b5563; font-size: 20px; text-align: center; line-height: 48px;">
                          AI
                        </div>
                      </td>
                      <td>
                        <p style="margin: 0; font-size: 16px; font-weight: 600; color: #111827;">The AI Operations Team</p>
                        <p style="margin: 4px 0 0 0; font-size: 14px; color: #6b7280;">Lead Generation & Automation</p>
                        <p style="margin: 4px 0 0 0; font-size: 14px;"><a href="https://nowg.ai" style="color: #4f46e5; text-decoration: none;">nowg.ai</a></p>
                      </td>
                    </tr>
                  </table>
                </div>
                
                <!-- Footer -->
                <div style="background-color: #f9fafb; padding: 24px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                    You are receiving this email because you opted in to hear from us. <br>
                    <a href="#" style="color: #6b7280; text-decoration: underline;">Unsubscribe</a>
                  </p>
                </div>
              </div>
            </body>
            </html>
          `,
        });

        if (error) {
          results.push({
            name: contact.name,
            email: contact.email,
            status: 'error',
            reason: error.message || 'Failed to send email'
          });
        } else {
          results.push({
            name: contact.name,
            email: contact.email,
            status: 'success',
            emailId: data?.id
          });
        }
      } catch (error: any) {
        results.push({
          name: contact.name,
          email: contact.email,
          status: 'error',
          reason: error.message || 'Network error'
        });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('Error sending emails:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
