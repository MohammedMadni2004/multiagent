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
          subject: `Quick question about your AI systems, ${contact.name || 'there'}`,
          html: `
            <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 20px; color: #1a1a1a; line-height: 1.6;">
              <p style="font-size: 16px; margin-bottom: 20px;">Hi ${contact.name || 'there'},</p>
              
              <p style="font-size: 16px; margin-bottom: 20px;">I'm reaching out because I noticed your team is working hard to scale operations, and we've been helping similar forward-thinking companies automate their workflows using autonomous AI agents.</p>
              
              <p style="font-size: 16px; margin-bottom: 20px;">Instead of manually processing leads or handling repetitive support queries, our AI systems can seamlessly integrate into your pipeline—freeing your team to focus on high-leverage work.</p>
              
              <p style="font-size: 16px; margin-bottom: 24px;">Would you be open to a brief 10-minute chat next week to see if this could be a fit for your current goals?</p>
              
              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #eaeaea;">
                <p style="font-size: 15px; font-weight: 600; margin: 0;">The AI Operations Team</p>
                <p style="font-size: 14px; color: #666; margin: 4px 0 0 0;"><a href="https://nowg.ai" style="color: #4f46e5; text-decoration: none;">nowg.ai</a></p>
              </div>
            </div>
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
