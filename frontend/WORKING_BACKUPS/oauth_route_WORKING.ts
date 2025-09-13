import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { developerKey, developerSecret } = await request.json();

    if (!developerKey || !developerSecret) {
      return NextResponse.json(
        { error: 'Developer key and secret are required' },
        { status: 400 }
      );
    }

    console.log('🔐 Server-side BioDigital OAuth request...');
    console.log('🔑 Using credentials:', { key: developerKey.substring(0, 8) + '...', secret: developerSecret.substring(0, 8) + '...' });

    // Follow BioDigital Python example exactly:
    // Construct the Authentication String (like Python's b64encode)
    const authString = `${developerKey}:${developerSecret}`;
    const base64Credentials = Buffer.from(authString, 'utf-8').toString('base64');

    console.log('🔧 Using correct endpoint: https://apis.biodigital.com/oauth2/v2/token');
    console.log('🔧 Using correct Content-Type: application/json;charset=UTF-8');

    // Make request to the correct endpoint with correct headers
    const response = await fetch('https://apis.biodigital.com/oauth2/v2/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${base64Credentials}`,
        'Content-Type': 'application/json;charset=UTF-8',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        scope: 'contentapi'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ BioDigital OAuth failed:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: errorText
      });
      return NextResponse.json(
        { error: `OAuth failed: ${response.status} ${response.statusText}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ BioDigital OAuth successful');
    
    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ OAuth proxy error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error',
        help: 'This API key may be for Human Viewer only. Content API requires separate registration.'
      },
      { status: 500 }
    );
  }
}
