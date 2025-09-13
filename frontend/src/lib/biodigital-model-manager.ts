// BioDigital Model Manager - Bridge between Content API and Human Viewer

export interface BioDigitalModel {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  systems: string[];
  regions: string[];
  tags: string[];
  keywords: string[];
  type: 'model' | 'collection' | 'scene';
  viewerUrl?: string;
  created?: string;
  modified?: string;
}

export interface PatientModelMatch {
  model: BioDigitalModel;
  confidence: number;
  reasons: string[];
  matchedKeywords: string[];
}

export class BioDigitalModelManager {
  private models: BioDigitalModel[] = [];
  private modelIndex: Map<string, BioDigitalModel[]> = new Map();
  private lastFetch: Date | null = null;
  private readonly CACHE_DURATION = 60 * 60 * 1000; // 1 hour

  constructor() {
    this.loadFromCache();
  }

  /**
   * Fetch all models from Content API
   */
  async fetchAllModels(): Promise<BioDigitalModel[]> {
    try {
      console.log('🌐 BioDigitalModelManager: Fetching all models...');
      
      const response = await fetch('/api/biodigital/models/all');
      
      if (!response.ok) {
        const error = await response.json();
        console.warn('⚠️ Content API fetch failed:', error);
        return this.getFallbackModels();
      }

      const data = await response.json();
      
      if (data.success && data.models) {
        this.models = data.models;
        this.buildIndex();
        this.saveToCache();
        this.lastFetch = new Date();
        
        console.log(`✅ Loaded ${this.models.length} models from Content API`);
        return this.models;
      }

      return this.getFallbackModels();
    } catch (error) {
      console.error('❌ Error fetching models:', error);
      return this.getFallbackModels();
    }
  }

  /**
   * Get models (from cache if recent, otherwise fetch)
   */
  async getModels(): Promise<BioDigitalModel[]> {
    const now = new Date();
    const needsRefresh = !this.lastFetch || 
                        (now.getTime() - this.lastFetch.getTime()) > this.CACHE_DURATION;

    if (needsRefresh || this.models.length === 0) {
      return await this.fetchAllModels();
    }

    return this.models;
  }

  /**
   * Find best matching models for patient pain areas
   */
  async findMatchingModels(patientAreas: string[]): Promise<PatientModelMatch[]> {
    const models = await this.getModels();
    const matches: PatientModelMatch[] = [];

    // Extract keywords from patient areas
    const patientKeywords = this.extractKeywords(patientAreas.join(' '));
    
    console.log('🔍 Searching for models matching:', patientKeywords);

    for (const model of models) {
      const match = this.calculateModelMatch(model, patientKeywords);
      if (match.confidence > 0.1) { // Only include matches with >10% confidence
        matches.push(match);
      }
    }

    // Sort by confidence (highest first)
    matches.sort((a, b) => b.confidence - a.confidence);
    
    console.log(`🎯 Found ${matches.length} matching models`);
    return matches.slice(0, 5); // Return top 5 matches
  }

  /**
   * Get the best single model for patient areas
   */
  async getBestModel(patientAreas: string[]): Promise<PatientModelMatch | null> {
    const matches = await this.findMatchingModels(patientAreas);
    return matches.length > 0 ? matches[0] : null;
  }

  /**
   * Calculate how well a model matches patient keywords
   */
  private calculateModelMatch(model: BioDigitalModel, patientKeywords: string[]): PatientModelMatch {
    let score = 0;
    const reasons: string[] = [];
    const matchedKeywords: string[] = [];

    // Check systems (high weight)
    for (const system of model.systems) {
      for (const keyword of patientKeywords) {
        if (this.isKeywordMatch(system, keyword)) {
          score += 0.4;
          reasons.push(`System match: ${system}`);
          matchedKeywords.push(keyword);
        }
      }
    }

    // Check regions (high weight)
    for (const region of model.regions) {
      for (const keyword of patientKeywords) {
        if (this.isKeywordMatch(region, keyword)) {
          score += 0.4;
          reasons.push(`Region match: ${region}`);
          matchedKeywords.push(keyword);
        }
      }
    }

    // Check model name (medium weight)
    for (const keyword of patientKeywords) {
      if (this.isKeywordMatch(model.name, keyword)) {
        score += 0.3;
        reasons.push(`Name match: ${model.name}`);
        matchedKeywords.push(keyword);
      }
    }

    // Check keywords/tags (lower weight)
    for (const tag of model.keywords) {
      for (const keyword of patientKeywords) {
        if (this.isKeywordMatch(tag, keyword)) {
          score += 0.2;
          reasons.push(`Keyword match: ${tag}`);
          matchedKeywords.push(keyword);
        }
      }
    }

    return {
      model,
      confidence: Math.min(score, 1.0), // Cap at 100%
      reasons: [...new Set(reasons)], // Remove duplicates
      matchedKeywords: [...new Set(matchedKeywords)]
    };
  }

  /**
   * Check if two keywords match (with fuzzy matching)
   */
  private isKeywordMatch(text1: string, text2: string): boolean {
    const normalize = (str: string) => str.toLowerCase().trim();
    const norm1 = normalize(text1);
    const norm2 = normalize(text2);

    // Exact match
    if (norm1 === norm2) return true;

    // Contains match
    if (norm1.includes(norm2) || norm2.includes(norm1)) return true;

    // Common anatomy synonyms
    const synonyms: Record<string, string[]> = {
      'leg': ['lower_limb', 'limb', 'extremity'],
      'arm': ['upper_limb', 'limb', 'extremity'],
      'back': ['spine', 'spinal', 'vertebrae'],
      'knee': ['patella', 'kneecap'],
      'shoulder': ['deltoid', 'scapula'],
      'hip': ['pelvis', 'pelvic'],
      'chest': ['thorax', 'thoracic', 'rib'],
      'head': ['skull', 'cranium', 'brain'],
    };

    for (const [key, values] of Object.entries(synonyms)) {
      if ((norm1 === key && values.includes(norm2)) ||
          (norm2 === key && values.includes(norm1)) ||
          (values.includes(norm1) && values.includes(norm2))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Extract meaningful keywords from patient text
   */
  private extractKeywords(text: string): string[] {
    const normalized = text.toLowerCase();
    
    // Common anatomy keywords
    const anatomyKeywords = [
      'head', 'skull', 'brain', 'neck', 'throat',
      'shoulder', 'arm', 'elbow', 'wrist', 'hand', 'finger',
      'chest', 'breast', 'rib', 'lung', 'heart',
      'back', 'spine', 'vertebrae', 'lumbar', 'thoracic', 'cervical',
      'abdomen', 'stomach', 'liver', 'kidney',
      'hip', 'pelvis', 'thigh', 'femur',
      'knee', 'patella', 'kneecap',
      'leg', 'shin', 'calf', 'tibia', 'fibula',
      'ankle', 'foot', 'toe',
      'muscle', 'bone', 'joint', 'ligament', 'tendon',
      'nerve', 'blood', 'vessel', 'artery', 'vein'
    ];

    return anatomyKeywords.filter(keyword => 
      normalized.includes(keyword)
    );
  }

  /**
   * Build search index for faster lookups
   */
  private buildIndex(): void {
    this.modelIndex.clear();
    
    for (const model of this.models) {
      // Index by all keywords
      const allKeywords = [
        ...model.systems,
        ...model.regions,
        ...model.keywords,
        model.name.toLowerCase(),
      ];

      for (const keyword of allKeywords) {
        const normalized = keyword.toLowerCase();
        if (!this.modelIndex.has(normalized)) {
          this.modelIndex.set(normalized, []);
        }
        this.modelIndex.get(normalized)!.push(model);
      }
    }
  }

  /**
   * Save models to localStorage cache
   */
  private saveToCache(): void {
    try {
      const cacheData = {
        models: this.models,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('biodigital_models_cache', JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to save models to cache:', error);
    }
  }

  /**
   * Load models from localStorage cache
   */
  private loadFromCache(): void {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || !window.localStorage) {
        return;
      }
      
      const cached = localStorage.getItem('biodigital_models_cache');
      if (cached) {
        const data = JSON.parse(cached);
        this.models = data.models || [];
        this.lastFetch = new Date(data.timestamp);
        this.buildIndex();
        console.log(`📦 Loaded ${this.models.length} models from cache`);
      }
    } catch (error) {
      console.warn('Failed to load models from cache:', error);
    }
  }

  /**
   * Get fallback models when Content API is unavailable
   */
  private getFallbackModels(): BioDigitalModel[] {
    return [
      {
        id: 'production/maleAdult/skeleton',
        name: 'Full Skeleton',
        description: 'Complete human skeleton system',
        systems: ['skeletal'],
        regions: ['full_body'],
        tags: ['bones', 'skeleton'],
        keywords: ['bone', 'skeleton', 'skull', 'spine', 'rib', 'pelvis', 'femur', 'tibia'],
        type: 'model'
      },
      {
        id: 'production/maleAdult/muscular',
        name: 'Muscular System',
        description: 'Complete muscular system',
        systems: ['muscular'],
        regions: ['full_body'],
        tags: ['muscles', 'muscular'],
        keywords: ['muscle', 'bicep', 'tricep', 'deltoid', 'quadriceps'],
        type: 'model'
      },
      {
        id: 'production/maleAdult/lower_limb_codepen',
        name: 'Lower Limb System',
        description: 'Legs, hips, knees, ankles, and feet',
        systems: ['skeletal', 'muscular'],
        regions: ['legs', 'hips'],
        tags: ['legs', 'lower_limb'],
        keywords: ['leg', 'hip', 'knee', 'ankle', 'foot', 'thigh', 'calf', 'femur', 'tibia', 'patella'],
        type: 'model'
      },
      {
        id: 'production/maleAdult/upper_limb',
        name: 'Upper Limb System',
        description: 'Arms, shoulders, elbows, and hands',
        systems: ['skeletal', 'muscular'],
        regions: ['arms', 'shoulders'],
        tags: ['arms', 'upper_limb'],
        keywords: ['arm', 'shoulder', 'elbow', 'wrist', 'hand', 'finger', 'humerus', 'radius', 'ulna'],
        type: 'model'
      },
      {
        id: 'production/maleAdult/cardiovascular',
        name: 'Cardiovascular System',
        description: 'Heart, blood vessels, and circulation',
        systems: ['cardiovascular'],
        regions: ['chest', 'full_body'],
        tags: ['heart', 'blood', 'circulation'],
        keywords: ['heart', 'blood', 'vessel', 'artery', 'vein', 'circulation', 'cardiac'],
        type: 'model'
      }
    ];
  }
}

// Global instance
export const biodigitalModelManager = new BioDigitalModelManager();
