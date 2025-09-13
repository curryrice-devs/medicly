/**
 * BioDigital Content API Integration with OAuth Authentication
 * Fetches available models from BioDigital's Content API using proper OAuth flow
 */

export interface BioDigitalAPIModel {
  id: string;
  title: string;
  name?: string;
  description?: string;
  systems?: string[];
  regions?: string[];
  metadata?: Record<string, any>;
}

export interface BioDigitalCollection {
  id: string;
  name: string;
  title: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface BioDigitalAuthResponse {
  service_version: number;
  access_token: string;
  token_type: string;
  expires_in: number;
  timestamp: string;
}

export interface BioDigitalCollectionResponse {
  total: number;
  items: BioDigitalCollection[];
}

export interface BioDigitalContentResponse {
  total: number;
  items: BioDigitalAPIModel[];
}

/**
 * Authenticates with BioDigital OAuth via proxy to avoid CORS issues
 */
export async function authenticateBioDigital(developerKey: string, developerSecret: string): Promise<string> {
  try {
    console.log('🔐 Authenticating with BioDigital OAuth via proxy...');
    
    const response = await fetch('/api/biodigital/oauth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        developerKey,
        developerSecret
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ BioDigital OAuth proxy failed:', response.status, errorData);
      throw new Error(`OAuth proxy failed: ${response.status} ${errorData.error || response.statusText}`);
    }

    const authData: BioDigitalAuthResponse = await response.json();
    console.log('🔐 BioDigital OAuth successful, token expires in:', authData.expires_in, 'seconds');
    
    return authData.access_token;
  } catch (error) {
    console.error('❌ BioDigital OAuth authentication failed:', error);
    throw error;
  }
}

/**
 * Fetches all public models from BioDigital Content API via proxy (paginated)
 */
export async function fetchAllPublicModels(accessToken: string): Promise<BioDigitalAPIModel[]> {
  try {
    const allModels: BioDigitalAPIModel[] = [];
    let offset = 0;
    const limit = 100; // Max per request
    let hasMore = true;

    console.log('🌍 Fetching all public BioDigital models via proxy...');

    while (hasMore) {
      const response = await fetch('/api/biodigital/models', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accessToken,
          endpoint: '/content/v2/',
          limit,
          offset
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to fetch public models: ${response.status} ${errorData.error || response.statusText}`);
      }

      const data: BioDigitalContentResponse = await response.json();
      const models = data.items || [];
      
      allModels.push(...models);
      console.log(`📄 Fetched ${models.length} models (offset: ${offset}, total so far: ${allModels.length})`);
      
      // Check if we have more models to fetch
      hasMore = models.length === limit;
      offset += limit;

      // Safety break to avoid infinite loops
      if (offset > 10000) {
        console.warn('⚠️ Reached safety limit of 10,000 models');
        break;
      }
    }

    console.log(`🎉 Successfully fetched ${allModels.length} total public models from BioDigital`);
    return allModels;
    
  } catch (error) {
    console.error('❌ Failed to fetch public BioDigital models:', error);
    throw error;
  }
}

/**
 * Fetches all collections from user's BioDigital library (fallback)
 */
export async function fetchBioDigitalCollections(accessToken: string): Promise<BioDigitalCollection[]> {
  try {
    const response = await fetch('https://api.biodigital.com/content/v2/users/me/collections', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch collections: ${response.status} ${response.statusText}`);
    }

    const data: BioDigitalCollectionResponse = await response.json();
    console.log('📂 Found', data.total, 'collections in BioDigital library');
    
    return data.items || [];
  } catch (error) {
    console.error('❌ Failed to fetch BioDigital collections:', error);
    throw error;
  }
}

/**
 * Fetches models from a specific collection
 */
export async function fetchCollectionModels(accessToken: string, collectionId: string): Promise<BioDigitalAPIModel[]> {
  try {
    const response = await fetch(`https://api.biodigital.com/content/v2/collections/${collectionId}/content`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch collection models: ${response.status} ${response.statusText}`);
    }

    const data: BioDigitalContentResponse = await response.json();
    console.log(`📄 Found ${data.total} models in collection ${collectionId}`);
    
    return data.items || [];
  } catch (error) {
    console.error(`❌ Failed to fetch models from collection ${collectionId}:`, error);
    throw error;
  }
}

/**
 * Fetches all available BioDigital models (public + library)
 */
export async function fetchAllBioDigitalModels(developerKey: string, developerSecret: string): Promise<BioDigitalAPIModel[]> {
  try {
    console.log('🚀 Starting BioDigital API authentication and comprehensive model fetch...');
    
    // Step 1: Authenticate and get access token
    const accessToken = await authenticateBioDigital(developerKey, developerSecret);
    
    // Step 2: Try to fetch ALL public models first (this gives us the most comprehensive list)
    try {
      console.log('🌍 Attempting to fetch all public models...');
      const publicModels = await fetchAllPublicModels(accessToken);
      
      if (publicModels.length > 0) {
        // Normalize model data
        const normalizedModels = publicModels.map(model => ({
          ...model,
          name: model.name || model.title,
          title: model.title || model.name,
          description: model.description || 'BioDigital 3D anatomy model',
          systems: model.systems || [],
          regions: model.regions || []
        }));
        
        console.log(`🎉 Successfully fetched ${normalizedModels.length} total public models from BioDigital`);
        return normalizedModels;
      }
    } catch (error) {
      console.warn('⚠️ Failed to fetch public models, falling back to library approach:', error);
    }
    
    // Step 3: Fallback to user library approach
    console.log('📚 Falling back to user library collections...');
    const collections = await fetchBioDigitalCollections(accessToken);
    
    if (collections.length === 0) {
      console.log('📭 No collections found in BioDigital library');
      return [];
    }
    
    // Step 4: Fetch models from each collection
    const allModels: BioDigitalAPIModel[] = [];
    
    for (const collection of collections) {
      try {
        const models = await fetchCollectionModels(accessToken, collection.id);
        
        // Normalize model data
        const normalizedModels = models.map(model => ({
          ...model,
          name: model.name || model.title,
          title: model.title || model.name,
          description: model.description || `Model from ${collection.name} collection`,
          systems: model.systems || [],
          regions: model.regions || []
        }));
        
        allModels.push(...normalizedModels);
        console.log(`✅ Added ${normalizedModels.length} models from collection: ${collection.name}`);
      } catch (error) {
        console.warn(`⚠️ Failed to fetch models from collection ${collection.name}:`, error);
        // Continue with other collections
      }
    }
    
    console.log(`🎉 Successfully fetched ${allModels.length} total models from BioDigital library`);
    return allModels;
    
  } catch (error) {
    console.error('❌ Failed to fetch BioDigital models:', error);
    throw error;
  }
}

/**
 * Simplified function that uses the developer key as both key and secret for now
 * In production, you should have separate key and secret
 */
export async function fetchMyBioDigitalModels(apiToken: string): Promise<BioDigitalAPIModel[]> {
  try {
    console.log('🔑 BioDigital API Key received:', apiToken ? `${apiToken.substring(0, 8)}...` : 'undefined');
    
    // Check if we have a valid API token
    if (!apiToken || apiToken === 'YOUR_APP_KEY' || apiToken === 'YOUR_BIODIGITAL_KEY' || apiToken === 'YOUR_DEVELOPER_KEY' || apiToken === 'YOUR_DEVELOPER_SECRET') {
      console.log('⚠️ No valid BioDigital API key provided, skipping API fetch');
      return [];
    }

    // For now, use the API key as both developer key and secret
    // In production, you should have separate BIODIGITAL_KEY and BIODIGITAL_SECRET
    const developerKey = apiToken;
    const developerSecret = apiToken; // This should be different in production
    
    return await fetchAllBioDigitalModels(developerKey, developerSecret);
    
  } catch (error) {
    console.warn('⚠️ BioDigital API fetch failed, using fallback models:', error);
    return [];
  }
}

/**
 * Builds a comprehensive model index from API responses
 */
export function buildModelIndex(models: BioDigitalAPIModel[]): Record<string, BioDigitalAPIModel> {
  const index: Record<string, BioDigitalAPIModel> = {};
  
  models.forEach(model => {
    // Index by model ID
    index[model.id] = model;
    
    // Index by name (normalized)
    const modelName = model.name || model.title;
    if (modelName) {
      const normalizedName = modelName.toLowerCase().replace(/[^a-z0-9]/g, '_');
      index[normalizedName] = model;
    }
    
    // Index by title (normalized)
    if (model.title) {
      const normalizedTitle = model.title.toLowerCase().replace(/[^a-z0-9]/g, '_');
      index[normalizedTitle] = model;
    }
    
    // Index by systems
    if (model.systems) {
      model.systems.forEach(system => {
        const normalizedSystem = system.toLowerCase().replace(/[^a-z0-9]/g, '_');
        index[normalizedSystem] = model;
      });
    }
    
    // Index by regions
    if (model.regions) {
      model.regions.forEach(region => {
        const normalizedRegion = region.toLowerCase().replace(/[^a-z0-9]/g, '_');
        index[normalizedRegion] = model;
      });
    }
  });
  
  return index;
}

/**
 * Maps patient text to BioDigital models using the API index
 */
export function mapPatientTextToModels(
  patientText: string, 
  modelIndex: Record<string, BioDigitalAPIModel>
): { model: BioDigitalAPIModel; confidence: number; reasoning: string }[] {
  const results: { model: BioDigitalAPIModel; confidence: number; reasoning: string }[] = [];
  const text = patientText.toLowerCase();
  
  // Extract body regions from patient text
  const bodyRegions = extractBodyRegions(text);
  
  // Find matches for each region
  bodyRegions.forEach(region => {
    const matches = findModelMatches(region, text, modelIndex);
    results.push(...matches);
  });
  
  // If no specific regions found, try general matching
  if (results.length === 0) {
    const generalMatches = findGeneralMatches(text, modelIndex);
    results.push(...generalMatches);
  }
  
  // Remove duplicates and sort by confidence
  const uniqueResults = results.filter((result, index, self) => 
    index === self.findIndex(r => r.model.id === result.model.id)
  ).sort((a, b) => b.confidence - a.confidence);
  
  return uniqueResults;
}

/**
 * Extracts body regions from patient text
 */
function extractBodyRegions(text: string): string[] {
  const regions: string[] = [];
  
  const regionPatterns = [
    { pattern: /\b(left|right)?\s*shoulder\b/g, region: 'shoulder' },
    { pattern: /\b(left|right)?\s*arm\b/g, region: 'arm' },
    { pattern: /\b(left|right)?\s*elbow\b/g, region: 'elbow' },
    { pattern: /\b(left|right)?\s*wrist\b/g, region: 'wrist' },
    { pattern: /\b(left|right)?\s*hand\b/g, region: 'hand' },
    { pattern: /\b(left|right)?\s*hip\b/g, region: 'hip' },
    { pattern: /\b(left|right)?\s*thigh\b/g, region: 'thigh' },
    { pattern: /\b(left|right)?\s*knee\b/g, region: 'knee' },
    { pattern: /\b(left|right)?\s*shin\b/g, region: 'shin' },
    { pattern: /\b(left|right)?\s*ankle\b/g, region: 'ankle' },
    { pattern: /\b(left|right)?\s*foot\b/g, region: 'foot' },
    { pattern: /\b(lower|upper)?\s*back\b/g, region: 'back' },
    { pattern: /\b(lower|upper)?\s*spine\b/g, region: 'spine' },
    { pattern: /\b(lumbar|cervical|thoracic)\b/g, region: 'spine' },
    { pattern: /\bneck\b/g, region: 'neck' },
    { pattern: /\bchest\b/g, region: 'chest' },
    { pattern: /\bheart\b/g, region: 'heart' },
    { pattern: /\b(patella|kneecap)\b/g, region: 'knee' },
    { pattern: /\b(femur|thighbone)\b/g, region: 'thigh' },
    { pattern: /\b(tibia|fibula)\b/g, region: 'shin' },
    { pattern: /\b(humerus)\b/g, region: 'arm' },
    { pattern: /\b(radius|ulna)\b/g, region: 'forearm' }
  ];
  
  for (const { pattern, region } of regionPatterns) {
    if (pattern.test(text)) {
      regions.push(region);
    }
  }
  
  return [...new Set(regions)];
}

/**
 * Finds model matches for a specific region
 */
function findModelMatches(
  region: string, 
  fullText: string, 
  modelIndex: Record<string, BioDigitalAPIModel>
): { model: BioDigitalAPIModel; confidence: number; reasoning: string }[] {
  const matches: { model: BioDigitalAPIModel; confidence: number; reasoning: string }[] = [];
  
  // Direct region match
  const directMatch = modelIndex[region];
  if (directMatch) {
    matches.push({
      model: directMatch,
      confidence: 0.9,
      reasoning: `Direct region match: ${region}`
    });
  }
  
  // Search for models containing the region in their metadata
  Object.values(modelIndex).forEach(model => {
    let score = 0;
    const reasons: string[] = [];
    
    // Check name/title
    const modelName = model.name || model.title || '';
    if (modelName.toLowerCase().includes(region)) {
      score += 0.8;
      reasons.push(`Name contains "${region}"`);
    }
    
    // Check systems
    if (model.systems?.some(system => system.toLowerCase().includes(region))) {
      score += 0.7;
      reasons.push(`System contains "${region}"`);
    }
    
    // Check regions
    if (model.regions?.some(r => r.toLowerCase().includes(region))) {
      score += 0.8;
      reasons.push(`Region contains "${region}"`);
    }
    
    // Check description
    if (model.description?.toLowerCase().includes(region)) {
      score += 0.6;
      reasons.push(`Description contains "${region}"`);
    }
    
    if (score > 0.3) {
      matches.push({
        model,
        confidence: Math.min(score, 1),
        reasoning: reasons.join('; ')
      });
    }
  });
  
  return matches;
}

/**
 * Finds general matches when no specific regions are identified
 */
function findGeneralMatches(
  text: string, 
  modelIndex: Record<string, BioDigitalAPIModel>
): { model: BioDigitalAPIModel; confidence: number; reasoning: string }[] {
  const matches: { model: BioDigitalAPIModel; confidence: number; reasoning: string }[] = [];
  
  // Check for general body system mentions
  if (text.includes('muscle') || text.includes('muscular')) {
    const muscularMatch = Object.values(modelIndex).find(model => {
      const name = (model.name || model.title || '').toLowerCase();
      return name.includes('muscular') || 
             model.systems?.some(s => s.toLowerCase().includes('muscular'));
    });
    if (muscularMatch) {
      matches.push({
        model: muscularMatch,
        confidence: 0.7,
        reasoning: 'Text mentions muscular system'
      });
    }
  }
  
  if (text.includes('bone') || text.includes('skeletal')) {
    const skeletalMatch = Object.values(modelIndex).find(model => {
      const name = (model.name || model.title || '').toLowerCase();
      return name.includes('skeleton') || 
             model.systems?.some(s => s.toLowerCase().includes('skeletal'));
    });
    if (skeletalMatch) {
      matches.push({
        model: skeletalMatch,
        confidence: 0.7,
        reasoning: 'Text mentions skeletal system'
      });
    }
  }
  
  if (text.includes('heart') || text.includes('cardiac')) {
    const cardiacMatch = Object.values(modelIndex).find(model => {
      const name = (model.name || model.title || '').toLowerCase();
      return name.includes('cardiovascular') || 
             model.systems?.some(s => s.toLowerCase().includes('cardiovascular'));
    });
    if (cardiacMatch) {
      matches.push({
        model: cardiacMatch,
        confidence: 0.7,
        reasoning: 'Text mentions cardiovascular system'
      });
    }
  }
  
  return matches;
}

/**
 * Caches model data in localStorage
 */
export function cacheModelData(models: BioDigitalAPIModel[]): void {
  try {
    localStorage.setItem('biodigital_models', JSON.stringify({
      models,
      timestamp: Date.now()
    }));
    console.log('💾 Cached', models.length, 'BioDigital models');
  } catch (error) {
    console.warn('Failed to cache model data:', error);
  }
}

/**
 * Retrieves cached model data
 */
export function getCachedModelData(): BioDigitalAPIModel[] | null {
  try {
    const cached = localStorage.getItem('biodigital_models');
    if (!cached) return null;
    
    const data = JSON.parse(cached);
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    if (Date.now() - data.timestamp > maxAge) {
      localStorage.removeItem('biodigital_models');
      return null;
    }
    
    return data.models;
  } catch (error) {
    console.warn('Failed to retrieve cached model data:', error);
    return null;
  }
}