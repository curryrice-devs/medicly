import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('🔍 Starting comprehensive BioDigital model discovery...');
  
  const biodigitalKey = process.env.NEXT_PUBLIC_BIODIGITAL_KEY;
  const biodigitalDevKey = process.env.NEXT_PUBLIC_BIODIGITAL_DEVELOPER_KEY;
  const biodigitalDevSecret = process.env.NEXT_PUBLIC_BIODIGITAL_DEVELOPER_SECRET;

  const results = {
    timestamp: new Date().toISOString(),
    discoveredModels: [] as any[],
    methods: [] as any[],
    summary: {
      totalFound: 0,
      workingModels: 0,
      failedModels: 0
    }
  };

  // Method 1: Try different Content API endpoint variations
  console.log('🌐 Method 1: Testing Content API endpoint variations...');
  try {
    // Get OAuth token first
    const oauthResponse = await fetch(`${request.nextUrl.origin}/api/biodigital/oauth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        developerKey: biodigitalDevKey, 
        developerSecret: biodigitalDevSecret 
      })
    });

    if (oauthResponse.ok) {
      const { access_token } = await oauthResponse.json();
      console.log('✅ OAuth successful for discovery');

      // Try various endpoint patterns
      const endpointsToTry = [
        '/content/v2/myhuman',
        '/content/v2/mycollections',
        '/content/v2/models',
        '/content/v2/library',
        '/content/v1/myhuman',
        '/content/v1/models',
        '/content/v1/library',
        '/content/models',
        '/content/library',
        '/v2/myhuman',
        '/v2/models',
        '/v1/models',
        '/models',
        '/library'
      ];

      for (const endpoint of endpointsToTry) {
        try {
          const response = await fetch(`https://apis.biodigital.com${endpoint}`, {
            headers: {
              'Authorization': `Bearer ${access_token}`,
              'Accept': 'application/json'
            }
          });

          const isJson = response.headers.get('content-type')?.includes('application/json');
          
          if (response.ok && isJson) {
            const data = await response.json();
            console.log(`✅ ${endpoint}: SUCCESS - ${JSON.stringify(data).substring(0, 200)}...`);
            
            results.methods.push({
              method: 'Content API',
              endpoint,
              status: 'SUCCESS',
              dataType: typeof data,
              hasModels: !!(data.models || data.content || Array.isArray(data))
            });

            // Extract models if found
            if (data.models) results.discoveredModels.push(...data.models);
            if (data.content) results.discoveredModels.push(...data.content);
            if (Array.isArray(data)) results.discoveredModels.push(...data);
          } else {
            console.log(`❌ ${endpoint}: ${response.status} ${response.statusText}`);
            results.methods.push({
              method: 'Content API',
              endpoint,
              status: 'FAILED',
              error: `${response.status} ${response.statusText}`,
              isJson
            });
          }
        } catch (error) {
          console.log(`💥 ${endpoint}: ${error}`);
          results.methods.push({
            method: 'Content API',
            endpoint,
            status: 'ERROR',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }
  } catch (error) {
    console.error('❌ Method 1 failed:', error);
  }

  // Method 2: Test known model ID patterns
  console.log('🎯 Method 2: Testing known model ID patterns...');
  const modelPatternsToTest = [
    // Your known working model
    '6PxP',
    // Common variations of your model
    '6PxO', '6PxQ', '6PxR', '6PxS', '6PxT',
    // Different character patterns
    '6PaP', '6PbP', '6PcP', '6PdP', '6PeP',
    // Number variations
    '5PxP', '7PxP', '8PxP', '9PxP', '10PxP',
    // Different starting characters
    'APxP', 'BPxP', 'CPxP', 'DPxP', 'EPxP',
    // Common BioDigital patterns
    'production/maleAdult/6PxP',
    'production/femaleAdult/6PxP',
    // Short IDs
    '6Px', '6P', '6PP', 
    // Longer patterns
    '6PxPx', '6PxPP'
  ];

  console.log(`🧪 Testing ${modelPatternsToTest.length} model ID patterns...`);
  
  for (const modelId of modelPatternsToTest) {
    try {
      // Test if model is accessible via Human Viewer API
      const testUrl = `https://human.biodigital.com/viewer/?id=${modelId}&dk=${biodigitalKey}`;
      const response = await fetch(testUrl);
      
      if (response.ok) {
        const html = await response.text();
        // Check if it's a valid BioDigital viewer page (not a 404)
        const isValidModel = html.includes('BioDigital Human Platform') && 
                           !html.includes('not found') && 
                           !html.includes('404') &&
                           !html.includes('error');
        
        if (isValidModel) {
          console.log(`✅ Found working model: ${modelId}`);
          results.discoveredModels.push({
            id: modelId,
            name: `Model ${modelId}`,
            source: 'Pattern Testing',
            viewerUrl: testUrl,
            accessible: true
          });
          results.summary.workingModels++;
        } else {
          results.summary.failedModels++;
        }
      } else {
        results.summary.failedModels++;
      }
    } catch (error) {
      console.warn(`⚠️ Error testing model ${modelId}:`, error);
      results.summary.failedModels++;
    }
  }

  // Method 3: Try to extract models from your working model's metadata
  console.log('📊 Method 3: Analyzing working model metadata...');
  try {
    // Fetch your working model and look for related models in the response
    const workingModelUrl = `https://human.biodigital.com/viewer/?id=6PxP&dk=${biodigitalKey}`;
    const response = await fetch(workingModelUrl);
    
    if (response.ok) {
      const html = await response.text();
      
      // Look for model references in the HTML
      const modelIdRegex = /["']([0-9A-Za-z]{3,8})["']/g;
      const foundIds = new Set<string>();
      let match;
      
      while ((match = modelIdRegex.exec(html)) !== null) {
        const potentialId = match[1];
        // Filter for likely model IDs (3-8 chars, alphanumeric)
        if (potentialId.length >= 3 && potentialId.length <= 8 && 
            /^[A-Za-z0-9]+$/.test(potentialId) &&
            potentialId !== '6PxP') { // Exclude the current model
          foundIds.add(potentialId);
        }
      }
      
      console.log(`🔍 Found ${foundIds.size} potential model IDs in working model HTML`);
      
      // Test these potential IDs
      for (const potentialId of Array.from(foundIds).slice(0, 20)) { // Limit to first 20
        try {
          const testResponse = await fetch(`https://human.biodigital.com/viewer/?id=${potentialId}&dk=${biodigitalKey}`);
          if (testResponse.ok) {
            const testHtml = await testResponse.text();
            if (testHtml.includes('BioDigital Human Platform') && !testHtml.includes('not found')) {
              console.log(`✅ Metadata analysis found working model: ${potentialId}`);
              results.discoveredModels.push({
                id: potentialId,
                name: `Model ${potentialId}`,
                source: 'Metadata Analysis',
                viewerUrl: `https://human.biodigital.com/viewer/?id=${potentialId}&dk=${biodigitalKey}`,
                accessible: true
              });
              results.summary.workingModels++;
            }
          }
        } catch (error) {
          // Ignore errors in metadata testing
        }
      }
    }
  } catch (error) {
    console.error('❌ Method 3 failed:', error);
  }

  // Remove duplicates
  const uniqueModels = results.discoveredModels.filter((model, index, self) => 
    index === self.findIndex(m => m.id === model.id)
  );
  
  results.discoveredModels = uniqueModels;
  results.summary.totalFound = uniqueModels.length;

  console.log(`🎉 Model discovery complete: Found ${results.summary.totalFound} unique models`);

  return NextResponse.json({
    success: true,
    ...results,
    recommendations: results.summary.totalFound > 0 ? [
      'Test each discovered model in the BioDigital viewer',
      'Integrate working models into your patient system',
      'Consider reaching out to BioDigital for proper Content API access'
    ] : [
      'Contact BioDigital support for Content API access',
      'Verify your library contains the models you expect',
      'Consider using the Human Viewer API with known model IDs'
    ]
  });
}
