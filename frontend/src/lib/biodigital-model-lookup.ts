/**
 * BioDigital Model Lookup System
 * Maps patient pain areas to appropriate BioDigital 3D models
 */

export interface BioDigitalModel {
  id: string;
  name: string;
  description: string;
  bodyRegions: string[];
  keywords: string[];
  url: string;
}

export interface PainAreaMapping {
  region: string;
  model_id: string;
  model_name: string;
  confidence: number;
  reasoning: string;
}

// Comprehensive BioDigital model database
export const BIODIGITAL_MODELS: BioDigitalModel[] = [
  // Skeletal System Models
  {
    id: "production/maleAdult/skeleton",
    name: "Full Skeleton System",
    description: "Complete skeletal system including all bones and joints",
    bodyRegions: ["full_body", "skeleton", "bones"],
    keywords: ["skeleton", "bones", "skeletal", "full_body", "complete"],
    url: "https://human.biodigital.com/embedded.html?be=YsM&uaid=1FCVr&ui-panel=false&ui-tools=true"
  },
  
  // Muscular System Models
  {
    id: "production/maleAdult/muscular",
    name: "Muscular System",
    description: "Complete muscular system including all major muscle groups",
    bodyRegions: ["full_body", "muscles", "muscular"],
    keywords: ["muscles", "muscular", "muscle_groups", "full_body"],
    url: "https://human.biodigital.com/embedded.html?be=YsM&uaid=1FCVr&ui-panel=false&ui-tools=true"
  },
  
  // Cardiovascular System
  {
    id: "production/maleAdult/cardiovascular",
    name: "Cardiovascular System",
    description: "Heart and circulatory system",
    bodyRegions: ["heart", "chest", "cardiovascular"],
    keywords: ["heart", "cardiac", "cardiovascular", "circulation", "chest"],
    url: "https://human.biodigital.com/embedded.html?be=YsM&uaid=1FCVr&ui-panel=false&ui-tools=true"
  },
  
  // Lower Limb Models
  {
    id: "production/maleAdult/lower_limb_codepen",
    name: "Lower Limb System",
    description: "Hips, legs, knees, ankles, and feet",
    bodyRegions: ["hips", "legs", "knees", "ankles", "feet", "lower_limb"],
    keywords: ["hip", "leg", "knee", "ankle", "foot", "thigh", "calf", "shin", "lower_limb", "pelvis", "femur", "tibia", "fibula", "patella"],
    url: "https://human.biodigital.com/embedded.html?be=YsM&uaid=1FCVr&ui-panel=false&ui-tools=true"
  },
  
  // Upper Limb Models
  {
    id: "production/maleAdult/upper_limb",
    name: "Upper Limb System",
    description: "Shoulders, arms, hands, wrists, and elbows",
    bodyRegions: ["shoulders", "arms", "hands", "wrists", "elbows", "upper_limb"],
    keywords: ["shoulder", "arm", "hand", "wrist", "elbow", "upper_limb", "deltoid", "biceps", "triceps", "forearm", "humerus", "radius", "ulna"],
    url: "https://human.biodigital.com/embedded.html?be=YsM&uaid=1FCVr&ui-panel=false&ui-tools=true"
  },
  
  // Spine Models
  {
    id: "production/maleAdult/spine",
    name: "Spine System",
    description: "Cervical, thoracic, and lumbar spine",
    bodyRegions: ["spine", "back", "cervical", "thoracic", "lumbar"],
    keywords: ["spine", "back", "cervical", "thoracic", "lumbar", "vertebrae", "spinal", "erector_spinae", "lumbar_vertebrae"],
    url: "https://human.biodigital.com/embedded.html?be=YsM&uaid=1FCVr&ui-panel=false&ui-tools=true"
  },
  
  // Shoulder-Specific Models
  {
    id: "production/maleAdult/shoulder_complex",
    name: "Shoulder Complex",
    description: "Detailed shoulder anatomy including rotator cuff",
    bodyRegions: ["shoulder", "rotator_cuff"],
    keywords: ["shoulder", "rotator_cuff", "deltoid", "supraspinatus", "infraspinatus", "subscapularis", "teres_minor", "shoulder_pain", "shoulder_impingement"],
    url: "https://human.biodigital.com/embedded.html?be=YsM&uaid=1FCVr&ui-panel=false&ui-tools=true"
  },
  
  // Knee-Specific Models
  {
    id: "production/maleAdult/knee_complex",
    name: "Knee Complex",
    description: "Detailed knee anatomy including ligaments and menisci",
    bodyRegions: ["knee", "patella"],
    keywords: ["knee", "patella", "meniscus", "acl", "pcl", "mcl", "lcl", "knee_pain", "knee_injury"],
    url: "https://human.biodigital.com/embedded.html?be=YsM&uaid=1FCVr&ui-panel=false&ui-tools=true"
  },
  
  // Hip-Specific Models
  {
    id: "production/maleAdult/hip_complex",
    name: "Hip Complex",
    description: "Detailed hip anatomy including joint and surrounding muscles",
    bodyRegions: ["hip", "pelvis"],
    keywords: ["hip", "pelvis", "femur", "hip_joint", "hip_pain", "hip_flexor", "glutes"],
    url: "https://human.biodigital.com/embedded.html?be=YsM&uaid=1FCVr&ui-panel=false&ui-tools=true"
  },
  
  // Ankle/Foot Models
  {
    id: "production/maleAdult/ankle_foot",
    name: "Ankle and Foot",
    description: "Detailed ankle and foot anatomy",
    bodyRegions: ["ankle", "foot"],
    keywords: ["ankle", "foot", "tibia", "fibula", "talus", "calcaneus", "ankle_pain", "foot_pain"],
    url: "https://human.biodigital.com/embedded.html?be=YsM&uaid=1FCVr&ui-panel=false&ui-tools=true"
  }
];

/**
 * Maps patient pain areas to appropriate BioDigital models
 */
export function mapPatientPainToBioDigitalModels(patientText: string): PainAreaMapping[] {
  const results: PainAreaMapping[] = [];
  const text = patientText.toLowerCase();
  
  // Extract body regions from patient text
  const bodyRegions = extractBodyRegions(text);
  
  for (const region of bodyRegions) {
    const mapping = findBestModelForRegion(region, text);
    if (mapping) {
      results.push(mapping);
    }
  }
  
  // If no specific regions found, try to match general terms
  if (results.length === 0) {
    const generalMapping = findGeneralModelMatch(text);
    if (generalMapping) {
      results.push(generalMapping);
    }
  }
  
  return results;
}

/**
 * Extracts body regions from patient text
 */
function extractBodyRegions(text: string): string[] {
  const regions: string[] = [];
  
  // Common body region patterns
  const regionPatterns = [
    { pattern: /\b(left|right)?\s*shoulder\b/g, region: "shoulder" },
    { pattern: /\b(left|right)?\s*arm\b/g, region: "arm" },
    { pattern: /\b(left|right)?\s*elbow\b/g, region: "elbow" },
    { pattern: /\b(left|right)?\s*wrist\b/g, region: "wrist" },
    { pattern: /\b(left|right)?\s*hand\b/g, region: "hand" },
    { pattern: /\b(left|right)?\s*hip\b/g, region: "hip" },
    { pattern: /\b(left|right)?\s*thigh\b/g, region: "thigh" },
    { pattern: /\b(left|right)?\s*knee\b/g, region: "knee" },
    { pattern: /\b(left|right)?\s*shin\b/g, region: "shin" },
    { pattern: /\b(left|right)?\s*ankle\b/g, region: "ankle" },
    { pattern: /\b(left|right)?\s*foot\b/g, region: "foot" },
    { pattern: /\b(lower|upper)?\s*back\b/g, region: "back" },
    { pattern: /\b(lower|upper)?\s*spine\b/g, region: "spine" },
    { pattern: /\b(lumbar|cervical|thoracic)\b/g, region: "spine" },
    { pattern: /\bneck\b/g, region: "neck" },
    { pattern: /\bchest\b/g, region: "chest" },
    { pattern: /\bheart\b/g, region: "heart" }
  ];
  
  for (const { pattern, region } of regionPatterns) {
    if (pattern.test(text)) {
      regions.push(region);
    }
  }
  
  return [...new Set(regions)]; // Remove duplicates
}

/**
 * Finds the best BioDigital model for a specific body region
 */
function findBestModelForRegion(region: string, fullText: string): PainAreaMapping | null {
  let bestModel: BioDigitalModel | null = null;
  let bestScore = 0;
  let reasoning = "";
  
  for (const model of BIODIGITAL_MODELS) {
    let score = 0;
    const modelReasons: string[] = [];
    
    // Check if region matches body regions
    if (model.bodyRegions.includes(region)) {
      score += 20;
      modelReasons.push(`Region "${region}" matches model body regions`);
    }
    
    // Check keyword matches
    for (const keyword of model.keywords) {
      if (fullText.includes(keyword)) {
        score += 10;
        modelReasons.push(`Keyword "${keyword}" found in text`);
      }
    }
    
    // Check for specific anatomical terms
    if (region === "shoulder" && model.id.includes("shoulder")) {
      score += 15;
      modelReasons.push("Specific shoulder model available");
    } else if (region === "knee" && model.id.includes("knee")) {
      score += 15;
      modelReasons.push("Specific knee model available");
    } else if (region === "hip" && model.id.includes("hip")) {
      score += 15;
      modelReasons.push("Specific hip model available");
    } else if (region === "spine" && model.id.includes("spine")) {
      score += 15;
      modelReasons.push("Specific spine model available");
    }
    
    if (score > bestScore) {
      bestScore = score;
      bestModel = model;
      reasoning = modelReasons.join("; ");
    }
  }
  
  if (bestModel && bestScore > 0) {
    return {
      region: region,
      model_id: bestModel.id,
      model_name: bestModel.name,
      confidence: Math.min(bestScore / 30, 1), // Normalize to 0-1
      reasoning: reasoning
    };
  }
  
  return null;
}

/**
 * Finds a general model match if no specific regions are found
 */
function findGeneralModelMatch(text: string): PainAreaMapping | null {
  // Check for general body system mentions
  if (text.includes("muscle") || text.includes("muscular")) {
    return {
      region: "muscular_system",
      model_id: "production/maleAdult/muscular",
      model_name: "Muscular System",
      confidence: 0.8,
      reasoning: "Text mentions muscular system"
    };
  }
  
  if (text.includes("bone") || text.includes("skeletal")) {
    return {
      region: "skeletal_system",
      model_id: "production/maleAdult/skeleton",
      model_name: "Full Skeleton System",
      confidence: 0.8,
      reasoning: "Text mentions skeletal system"
    };
  }
  
  if (text.includes("heart") || text.includes("cardiac")) {
    return {
      region: "cardiovascular_system",
      model_id: "production/maleAdult/cardiovascular",
      model_name: "Cardiovascular System",
      confidence: 0.8,
      reasoning: "Text mentions cardiovascular system"
    };
  }
  
  // Default to full skeleton if nothing specific found
  return {
    region: "general",
    model_id: "production/maleAdult/skeleton",
    model_name: "Full Skeleton System",
    confidence: 0.3,
    reasoning: "No specific region identified, using general skeleton model"
  };
}

/**
 * Example usage function
 */
export function analyzePatientPain(patientText: string) {
  const mappings = mapPatientPainToBioDigitalModels(patientText);
  
  return {
    input: {
      patient_text: patientText
    },
    output: mappings.map(mapping => ({
      region: mapping.region,
      model_id: mapping.model_id,
      label: mapping.model_name,
      confidence: mapping.confidence,
      reasoning: mapping.reasoning
    }))
  };
}
