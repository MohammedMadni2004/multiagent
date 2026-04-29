import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { contacts } = await req.json();

    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json({ error: 'No contacts provided' }, { status: 400 });
    }

    const VAPI_PRIVATE_KEY = process.env.VAPI_PRIVATE_KEY;
    const VAPI_ASSISTANT_ID = process.env.VAPI_ASSISTANT_ID;
    const VAPI_PHONE_NUMBER_ID = process.env.VAPI_PHONE_NUMBER_ID;

    if (!VAPI_PRIVATE_KEY || !VAPI_ASSISTANT_ID || !VAPI_PHONE_NUMBER_ID) {
      return NextResponse.json(
        { error: 'Missing Vapi configuration in environment variables (.env.local)' },
        { status: 500 }
      );
    }

    const results = [];

    // Trigger calls for each contact
    for (const contact of contacts) {
      // Validate phone number presence
      if (!contact.phone) {
        results.push({
          name: contact.name,
          phone: contact.phone,
          status: 'skipped',
          reason: 'No phone number provided'
        });
        continue;
      }

      try {
        const response = await fetch('https://api.vapi.ai/call', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${VAPI_PRIVATE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            assistantId: VAPI_ASSISTANT_ID,
            phoneNumberId: VAPI_PHONE_NUMBER_ID,
            customer: {
              number: contact.phone,
              name: contact.name || 'Customer'
            }
          }),
        });

        const data = await response.json();

        if (response.ok) {
          results.push({
            name: contact.name,
            phone: contact.phone,
            status: 'success',
            callId: data.id
          });
        } else {
          results.push({
            name: contact.name,
            phone: contact.phone,
            status: 'error',
            reason: data.message || 'Failed to initiate call'
          });
        }
      } catch (error: any) {
        results.push({
          name: contact.name,
          phone: contact.phone,
          status: 'error',
          reason: error.message || 'Network error'
        });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('Error initiating calls:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
