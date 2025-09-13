import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('🧪 Testing BioDigital Content API setup...');
  
  const results = {
    timestamp: new Date().toISOString(),
    tests: [] as any[]
  };

  // Test 1: Environment Variables
  const biodigitalKey = process.env.NEXT_PUBLIC_BIODIGITAL_KEY;
  const biodigitalDevKey = process.env.NEXT_PUBLIC_BIODIGITAL_DEVELOPER_KEY;
  const biodigitalDevSecret = process.env.NEXT_PUBLIC_BIODIGITAL_DEVELOPER_SECRET;

  results.tests.push({
    test: 'Environment Variables',
    status: biodigitalKey && biodigitalDevKey && biodigitalDevSecret ? 'PASS' : 'FAIL',
    details: {
      NEXT_PUBLIC_BIODIGITAL_KEY: biodigitalKey ? `${biodigitalKey.substring(0, 8)}...` : 'MISSING',
      NEXT_PUBLIC_BIODIGITAL_DEVELOPER_KEY: biodigitalDevKey ? `${biodigitalDevKey.substring(0, 8)}...` : 'MISSING',
      NEXT_PUBLIC_BIODIGITAL_DEVELOPER_SECRET: biodigitalDevSecret ? `${biodigitalDevSecret.substring(0, 8)}...` : 'MISSING'
    }
  });

  // Test 2: OAuth Endpoint
  try {
    console.log('🔐 Testing OAuth endpoint...');
    const oauthResponse = await fetch(`${request.nextUrl.origin}/api/biodigital/oauth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        developerKey: biodigitalDevKey, 
        developerSecret: biodigitalDevSecret 
      })
    });

    const oauthData = await oauthResponse.json();
    
    results.tests.push({
      test: 'OAuth Authentication',
      status: oauthResponse.ok ? 'PASS' : 'FAIL',
      details: {
        status: oauthResponse.status,
        response: oauthData,
        hasAccessToken: !!oauthData.access_token
      }
    });

    // Test 3: Content API Access (if OAuth succeeded)
    if (oauthResponse.ok && oauthData.access_token) {
      console.log('📡 Testing Content API access...');
      
      const contentEndpoints = ['/content/v2/myhuman', '/content/v2/mycollections', '/content/v2/'];
      
      for (const endpoint of contentEndpoints) {
        try {
          const contentResponse = await fetch(`${request.nextUrl.origin}/api/biodigital/models`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              accessToken: oauthData.access_token,
              endpoint,
              limit: 5,
              offset: 0
            })
          });

          const contentData = await contentResponse.json();
          
          results.tests.push({
            test: `Content API: ${endpoint}`,
            status: contentResponse.ok ? 'PASS' : 'FAIL',
            details: {
              status: contentResponse.status,
              response: contentData,
              itemCount: contentData.models?.length || contentData.length || 0
            }
          });
        } catch (error) {
          results.tests.push({
            test: `Content API: ${endpoint}`,
            status: 'ERROR',
            details: { error: error instanceof Error ? error.message : 'Unknown error' }
          });
        }
      }
    }

  } catch (error) {
    results.tests.push({
      test: 'OAuth Authentication',
      status: 'ERROR',
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    });
  }

  // Test 4: Model Manager
  try {
    console.log('🎯 Testing Model Manager...');
    const { biodigitalModelManager } = await import('@/lib/biodigital-model-manager');
    
    const testAreas = ['knee pain', 'lower back issues'];
    const matches = await biodigitalModelManager.findMatchingModels(testAreas);
    
    results.tests.push({
      test: 'Model Manager',
      status: 'PASS',
      details: {
        testAreas,
        matchCount: matches.length,
        topMatch: matches[0] ? {
          modelId: matches[0].model.id,
          confidence: matches[0].confidence,
          reasons: matches[0].reasons
        } : null
      }
    });
  } catch (error) {
    results.tests.push({
      test: 'Model Manager',
      status: 'ERROR',
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    });
  }

  // Summary
  const passCount = results.tests.filter(t => t.status === 'PASS').length;
  const totalCount = results.tests.length;
  
  console.log(`🎉 Content API Test Results: ${passCount}/${totalCount} tests passed`);

  return NextResponse.json({
    summary: `${passCount}/${totalCount} tests passed`,
    overallStatus: passCount === totalCount ? 'ALL_PASS' : passCount > 0 ? 'PARTIAL' : 'FAIL',
    ...results
  });
}
