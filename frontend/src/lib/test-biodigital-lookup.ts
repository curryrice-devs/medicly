/**
 * Test file for BioDigital Model Lookup System
 * Demonstrates how to map patient pain areas to BioDigital models
 */

import { analyzePatientPain, mapPatientPainToBioDigitalModels } from './biodigital-model-lookup';

// Test cases
const testCases = [
  "Patient reports pain in left shoulder and lower back",
  "Right knee pain with swelling",
  "Hip flexor tightness and lower back stiffness",
  "Chest pain and heart palpitations",
  "Wrist pain from repetitive motion",
  "Ankle sprain with difficulty walking",
  "Muscle soreness throughout the body",
  "Bone fracture in the right arm"
];

console.log("🧪 Testing BioDigital Model Lookup System\n");

testCases.forEach((testCase, index) => {
  console.log(`\n📋 Test Case ${index + 1}:`);
  console.log(`Input: "${testCase}"`);
  
  const result = analyzePatientPain(testCase);
  
  console.log("📊 Results:");
  result.output.forEach((mapping, i) => {
    console.log(`  ${i + 1}. Region: ${mapping.region}`);
    console.log(`     Model ID: ${mapping.model_id}`);
    console.log(`     Model Name: ${mapping.label}`);
    console.log(`     Confidence: ${(mapping.confidence * 100).toFixed(1)}%`);
    console.log(`     Reasoning: ${mapping.reasoning}`);
    console.log("");
  });
});

// Example of the specific case you mentioned
console.log("\n🎯 Specific Example:");
const specificCase = "Patient reports pain in left shoulder and lower back";
const specificResult = analyzePatientPain(specificCase);

console.log(`Input: "${specificCase}"`);
console.log("Output:");
console.log(JSON.stringify(specificResult, null, 2));
