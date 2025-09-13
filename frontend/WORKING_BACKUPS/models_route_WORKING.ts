import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { accessToken, endpoint, limit = 100, offset = 0 } = await request.json();

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token is required' },
        { status: 400 }
      );
    }

    console.log(`🌐 Fetching BioDigital models from: ${endpoint}`);

    // Use the correct BioDigital Content API URL structure from documentation
    let apiUrl;
    if (endpoint === 'myhuman') {
      // Use the exact endpoint from BioDigital documentation
      apiUrl = 'https://apis.biodigital.com/services/v2/content/collections/myhuman';
    } else if (endpoint.startsWith('/services/')) {
      // Full endpoint path provided
      apiUrl = `https://apis.biodigital.com${endpoint}`;
    } else {
      // Legacy endpoints - try the old format
      apiUrl = `https://apis.biodigital.com${endpoint}?limit=${limit}&offset=${offset}`;
    }
    
    console.log(`🎯 Using BioDigital Content API URL: ${apiUrl}`);

    // Proxy the BioDigital API request server-side
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ BioDigital API failed:', response.status, errorText);
      return NextResponse.json(
        { error: `API failed: ${response.status} ${response.statusText}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`✅ Successfully fetched ${data.myhuman?.length || data.models?.length || data.items?.length || 0} models`);
    
    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ Models proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}