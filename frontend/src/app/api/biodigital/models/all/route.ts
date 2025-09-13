import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🌐 Fetching all BioDigital models via Content API...');
    
    // Get credentials from environment
    const developerKey = process.env.NEXT_PUBLIC_BIODIGITAL_DEVELOPER_KEY;
    const developerSecret = process.env.NEXT_PUBLIC_BIODIGITAL_DEVELOPER_SECRET;

    if (!developerKey || !developerSecret) {
      console.warn('🚧 BioDigital credentials not configured, using fallback models...');
      
      // Return fallback models for development/demo purposes
      const fallbackModels = [
        {
          id: 'production/maleAdult/skeleton',
          name: 'Full Skeleton System',
          description: 'Complete skeletal system including all bones and joints',
          thumbnail: 'https://images.biodigital.com/production/maleAdult/skeleton/thumbnail.jpg',
          viewerUrl: 'https://human.biodigital.com/viewer/?id=production/maleAdult/skeleton',
          systems: ['skeletal'],
          regions: ['full_body'],
          tags: ['skeleton', 'bones'],
          type: 'model',
          keywords: ['skeleton', 'bones', 'skeletal', 'full_body', 'complete']
        },
        {
          id: 'production/maleAdult/muscular',
          name: 'Muscular System',
          description: 'Complete muscular system including all major muscle groups',
          thumbnail: 'https://images.biodigital.com/production/maleAdult/muscular/thumbnail.jpg',
          viewerUrl: 'https://human.biodigital.com/viewer/?id=production/maleAdult/muscular',
          systems: ['muscular'],
          regions: ['full_body'],
          tags: ['muscles', 'muscular'],
          type: 'model',
          keywords: ['muscles', 'muscular', 'muscle_groups', 'full_body']
        },
        {
          id: 'production/maleAdult/upper_limb',
          name: 'Upper Limb System',
          description: 'Arms, shoulders, elbows, and hands',
          thumbnail: 'https://images.biodigital.com/production/maleAdult/upper_limb/thumbnail.jpg',
          viewerUrl: 'https://human.biodigital.com/viewer/?id=production/maleAdult/upper_limb',
          systems: ['skeletal', 'muscular'],
          regions: ['arms', 'shoulders'],
          tags: ['arms', 'upper_limb', 'shoulder'],
          type: 'model',
          keywords: ['arm', 'shoulder', 'elbow', 'wrist', 'hand', 'finger', 'humerus', 'radius', 'ulna']
        },
        {
          id: 'production/maleAdult/lower_limb',
          name: 'Lower Limb System',
          description: 'Legs, hips, knees, ankles, and feet',
          thumbnail: 'https://images.biodigital.com/production/maleAdult/lower_limb/thumbnail.jpg',
          viewerUrl: 'https://human.biodigital.com/viewer/?id=production/maleAdult/lower_limb',
          systems: ['skeletal', 'muscular'],
          regions: ['legs', 'hips'],
          tags: ['legs', 'lower_limb', 'knee', 'hip'],
          type: 'model',
          keywords: ['leg', 'hip', 'knee', 'ankle', 'foot', 'thigh', 'calf', 'femur', 'tibia', 'patella']
        },
        {
          id: 'production/maleAdult/cardiovascular',
          name: 'Cardiovascular System',
          description: 'Heart, blood vessels, and circulation',
          thumbnail: 'https://images.biodigital.com/production/maleAdult/cardiovascular/thumbnail.jpg',
          viewerUrl: 'https://human.biodigital.com/viewer/?id=production/maleAdult/cardiovascular',
          systems: ['cardiovascular'],
          regions: ['chest', 'full_body'],
          tags: ['heart', 'blood', 'circulation'],
          type: 'model',
          keywords: ['heart', 'blood', 'vessel', 'artery', 'vein', 'circulation', 'cardiac']
        },
        {
          id: 'production/maleAdult/spine',
          name: 'Spinal Column',
          description: 'Complete spinal column with vertebrae and discs',
          thumbnail: 'https://images.biodigital.com/production/maleAdult/spine/thumbnail.jpg',
          viewerUrl: 'https://human.biodigital.com/viewer/?id=production/maleAdult/spine',
          systems: ['skeletal'],
          regions: ['spine', 'back'],
          tags: ['spine', 'vertebrae', 'back'],
          type: 'model',
          keywords: ['spine', 'vertebra', 'disc', 'cervical', 'thoracic', 'lumbar', 'back', 'spinal']
        }
      ];

      return NextResponse.json({
        success: true,
        count: fallbackModels.length,
        models: fallbackModels,
        timestamp: new Date().toISOString(),
        note: 'Using fallback models - configure NEXT_PUBLIC_BIODIGITAL_DEVELOPER_KEY and NEXT_PUBLIC_BIODIGITAL_DEVELOPER_SECRET for real API access'
      });
    }

    // Step 1: Get access token
    console.log('🔐 Getting OAuth access token...');
    const tokenResponse = await fetch(`${request.nextUrl.origin}/api/biodigital/oauth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ developerKey, developerSecret })
    });

    if (!tokenResponse.ok) {
      const tokenError = await tokenResponse.json();
      console.error('❌ OAuth failed:', tokenError);
      return NextResponse.json({
        error: 'OAuth authentication failed',
        details: tokenError,
        help: 'Your API key may not have Content API access. Contact BioDigital support.'
      }, { status: tokenResponse.status });
    }

    const { access_token } = await tokenResponse.json();
    console.log('✅ OAuth successful, fetching models...');

    // Step 2: Fetch all available content endpoints using correct URLs
    const allModels: any[] = [];
    const endpoints = [
      'myhuman',                       // Your saved models - correct endpoint
      '/services/v2/content/collections/mycollections',  // Your collections
      '/services/v2/content/collections/team',           // Team library models
      '/services/v2/content/collections/shared',         // Shared team models
      '/content/v2/',                  // Public models (if accessible)
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`📡 Fetching from ${endpoint}...`);
        const modelsResponse = await fetch(`${request.nextUrl.origin}/api/biodigital/models`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accessToken: access_token,
            endpoint,
            limit: 100,
            offset: 0
          })
        });

        if (modelsResponse.ok) {
          const data = await modelsResponse.json();
          const itemCount = data.myhuman?.length || data.models?.length || data.team?.length || data.shared?.length || data.length || 0;
          console.log(`✅ ${endpoint}: Found ${itemCount} items`);
          
          // Handle different response formats
          if (data.myhuman) {
            // Handle myhuman endpoint response format
            allModels.push(...data.myhuman);
          } else if (data.team) {
            // Handle team endpoint response format
            allModels.push(...data.team);
          } else if (data.shared) {
            // Handle shared endpoint response format
            allModels.push(...data.shared);
          } else if (data.models) {
            allModels.push(...data.models);
          } else if (Array.isArray(data)) {
            allModels.push(...data);
          } else if (data.content) {
            allModels.push(...data.content);
          }
        } else {
          console.warn(`⚠️ ${endpoint}: ${modelsResponse.status} ${modelsResponse.statusText}`);
        }
      } catch (error) {
        console.warn(`⚠️ ${endpoint}: ${error}`);
      }
    }

    // Step 3: Process and normalize models
    const processedModels = allModels.map(model => ({
      id: model.content_id || model.id || model.model_id || model.uuid,
      name: model.content_title || model.name || model.title || model.display_name,
      description: model.description || model.summary || '',
      thumbnail: model.content_thumbnail_url || model.thumbnail_url || model.image_url || '',
      viewerUrl: model.content_url || '',
      systems: model.systems || [],
      regions: model.regions || [],
      tags: model.tags || [],
      type: model.content_type || model.type || 'model',
      gender: model.content_gender || '',
      accessibility: model.content_accessibility || [],
      teams: model.content_teams || [],
      flags: model.content_flags || {},
      created: model.content_authored_date || model.created_at || model.date_created,
      modified: model.modified_at || model.date_modified,
      // Add metadata for better matching
      keywords: [
        ...(model.systems || []),
        ...(model.regions || []),
        ...(model.tags || []),
        model.content_title?.toLowerCase() || '',
        model.name?.toLowerCase() || '',
        model.title?.toLowerCase() || '',
        model.content_gender || '',
        model.content_type || '',
      ].filter(Boolean)
    }));

    console.log(`🎉 Total models processed: ${processedModels.length}`);

    // If no models found from real API, use fallback models
    if (processedModels.length === 0) {
      console.warn('🚧 No models found from BioDigital API, using fallback models...');
      
      const fallbackModels = [
        {
          id: 'production/maleAdult/skeleton',
          name: 'Full Skeleton System',
          description: 'Complete skeletal system including all bones and joints',
          thumbnail: 'https://images.biodigital.com/production/maleAdult/skeleton/thumbnail.jpg',
          viewerUrl: 'https://human.biodigital.com/viewer/?id=production/maleAdult/skeleton&dk=f3bc3cd69b148bbd7008f543c4e4a1bbf20c52c0',
          systems: ['skeletal'],
          regions: ['full_body'],
          tags: ['skeleton', 'bones'],
          type: 'model',
          keywords: ['skeleton', 'bones', 'skeletal', 'full_body', 'complete']
        },
        {
          id: 'production/maleAdult/muscular',
          name: 'Muscular System',
          description: 'Complete muscular system including all major muscle groups',
          thumbnail: 'https://images.biodigital.com/production/maleAdult/muscular/thumbnail.jpg',
          viewerUrl: 'https://human.biodigital.com/viewer/?id=production/maleAdult/muscular&dk=f3bc3cd69b148bbd7008f543c4e4a1bbf20c52c0',
          systems: ['muscular'],
          regions: ['full_body'],
          tags: ['muscles', 'muscular'],
          type: 'model',
          keywords: ['muscles', 'muscular', 'muscle_groups', 'full_body']
        },
        {
          id: 'production/maleAdult/upper_limb',
          name: 'Upper Limb System',
          description: 'Arms, shoulders, elbows, and hands',
          thumbnail: 'https://images.biodigital.com/production/maleAdult/upper_limb/thumbnail.jpg',
          viewerUrl: 'https://human.biodigital.com/viewer/?id=production/maleAdult/upper_limb&dk=f3bc3cd69b148bbd7008f543c4e4a1bbf20c52c0',
          systems: ['skeletal', 'muscular'],
          regions: ['arms', 'shoulders'],
          tags: ['arms', 'upper_limb', 'shoulder'],
          type: 'model',
          keywords: ['arm', 'shoulder', 'elbow', 'wrist', 'hand', 'finger', 'humerus', 'radius', 'ulna']
        },
        {
          id: 'production/maleAdult/lower_limb',
          name: 'Lower Limb System',
          description: 'Legs, hips, knees, ankles, and feet',
          thumbnail: 'https://images.biodigital.com/production/maleAdult/lower_limb/thumbnail.jpg',
          viewerUrl: 'https://human.biodigital.com/viewer/?id=production/maleAdult/lower_limb&dk=f3bc3cd69b148bbd7008f543c4e4a1bbf20c52c0',
          systems: ['skeletal', 'muscular'],
          regions: ['legs', 'hips'],
          tags: ['legs', 'lower_limb', 'knee', 'hip'],
          type: 'model',
          keywords: ['leg', 'hip', 'knee', 'ankle', 'foot', 'thigh', 'calf', 'femur', 'tibia', 'patella']
        },
        {
          id: 'production/maleAdult/cardiovascular',
          name: 'Cardiovascular System',
          description: 'Heart, blood vessels, and circulation',
          thumbnail: 'https://images.biodigital.com/production/maleAdult/cardiovascular/thumbnail.jpg',
          viewerUrl: 'https://human.biodigital.com/viewer/?id=production/maleAdult/cardiovascular&dk=f3bc3cd69b148bbd7008f543c4e4a1bbf20c52c0',
          systems: ['cardiovascular'],
          regions: ['chest', 'full_body'],
          tags: ['heart', 'blood', 'circulation'],
          type: 'model',
          keywords: ['heart', 'blood', 'vessel', 'artery', 'vein', 'circulation', 'cardiac']
        },
        {
          id: 'production/maleAdult/spine',
          name: 'Spinal Column',
          description: 'Complete spinal column with vertebrae and discs',
          thumbnail: 'https://images.biodigital.com/production/maleAdult/spine/thumbnail.jpg',
          viewerUrl: 'https://human.biodigital.com/viewer/?id=production/maleAdult/spine&dk=f3bc3cd69b148bbd7008f543c4e4a1bbf20c52c0',
          systems: ['skeletal'],
          regions: ['spine', 'back'],
          tags: ['spine', 'vertebrae', 'back'],
          type: 'model',
          keywords: ['spine', 'vertebra', 'disc', 'cervical', 'thoracic', 'lumbar', 'back', 'spinal']
        }
      ];

      return NextResponse.json({
        success: true,
        count: fallbackModels.length,
        models: fallbackModels,
        timestamp: new Date().toISOString(),
        note: 'Using fallback models - BioDigital API returned no models',
        endpoints_checked: endpoints
      });
    }

    return NextResponse.json({
      success: true,
      count: processedModels.length,
      models: processedModels,
      timestamp: new Date().toISOString(),
      endpoints_checked: endpoints
    });

  } catch (error) {
    console.error('❌ Error fetching all models:', error);
    return NextResponse.json({
      error: 'Failed to fetch models',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
