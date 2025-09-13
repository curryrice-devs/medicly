# BioDigital Model Lookup Guide

## How to Find the Correct BioDigital Model IDs

### 1. Browse BioDigital Human Library
Visit: https://human.biodigital.com/

### 2. Find Models by Body Region
- **Lower Limb**: Look for leg, knee, hip, ankle models
- **Upper Limb**: Look for arm, shoulder, hand models  
- **Spine**: Look for back, neck, vertebral models
- **Cardiovascular**: Look for heart, circulatory models
- **Skeletal**: Look for bone, joint models
- **Muscular**: Look for muscle, tendon models

### 3. Extract Model IDs from URLs
When you find a model you want to use:

1. Click on the model
2. Look at the URL in your browser
3. Extract the model ID from the URL

**Example URLs:**
```
https://human.biodigital.com/viewer/?id=production/maleAdult/lower_limb_codepen&ui-info=false&ui-menu=false
```
**Model ID**: `production/maleAdult/lower_limb_codepen`

### 4. Test Model IDs
Test each model ID by creating a URL:
```
https://human.biodigital.com/viewer/?id=YOUR_MODEL_ID&ui-info=false&ui-menu=false
```

### 5. Find Anatomy Object IDs
Once you have a working model:

1. Load the model in the viewer
2. Open browser developer tools (F12)
3. Go to Console tab
4. Run this JavaScript code:

```javascript
// Load the BioDigital API first
if (typeof HumanAPI !== 'undefined') {
  HumanAPI.send("scene.getAnatomyObjects", {}, function(objects) {
    console.log("Available anatomy objects:", objects);
    
    // Filter for specific body parts
    const filtered = objects.filter(obj => 
      obj.name.toLowerCase().includes('shoulder') || 
      obj.name.toLowerCase().includes('knee') ||
      obj.name.toLowerCase().includes('spine')
    );
    console.log("Filtered objects:", filtered);
  });
} else {
  console.log("HumanAPI not loaded yet. Wait for the model to load completely.");
}
```

### 6. Common BioDigital Model IDs

Based on research, here are the most common model IDs:

#### Lower Body Models
- `production/maleAdult/lower_limb_codepen` - Lower limb (legs, hips, knees, ankles)
- `production/maleAdult/lower_limb` - Alternative lower limb model
- `production/maleAdult/hip` - Hip-specific model
- `production/maleAdult/knee` - Knee-specific model

#### Upper Body Models  
- `production/maleAdult/upper_limb` - Upper limb (arms, shoulders, hands)
- `production/maleAdult/shoulder` - Shoulder-specific model
- `production/maleAdult/arm` - Arm-specific model

#### Spine Models
- `production/maleAdult/spine` - Spine and back
- `production/maleAdult/vertebral_column` - Vertebral column
- `production/maleAdult/lumbar_spine` - Lumbar spine

#### System Models
- `production/maleAdult/skeleton` - Full skeletal system
- `production/maleAdult/muscular` - Muscular system
- `production/maleAdult/cardiovascular` - Cardiovascular system
- `production/maleAdult/nervous` - Nervous system

### 7. How to Update the Mapping Table

When you find new model IDs:

1. Open `frontend/src/components/BioDigitalViewer.tsx`
2. Find the `BIODIGITAL_MAPPING` object
3. Add new entries:

```javascript
"new_anatomy_key": {
  "model": "production/maleAdult/your_model_id",
  "objectIds": ["object_id_1", "object_id_2"],
  "description": "Description of what this represents"
}
```

### 8. Testing Your Mappings

1. Navigate to a patient with the specific pain area
2. Check the browser console for mapping logs
3. Verify the correct model is selected
4. Check that anatomy objects are found

### 9. Debugging Tips

- **Check Console Logs**: Look for mapping scores and reasoning
- **Verify Model URLs**: Test model URLs directly in browser
- **Check Object IDs**: Use the anatomy object lookup code above
- **Update Descriptions**: Keep descriptions accurate and helpful

### 10. Common Issues

- **Model Not Found**: Check if the model ID is correct
- **No Anatomy Objects**: The model might not have the expected objects
- **Wrong Model Selected**: Check the mapping logic and scoring
- **API Key Issues**: Ensure BioDigital API key is valid

## Current Implementation Status

The system now uses:
- **Lower Limb**: `production/maleAdult/lower_limb_codepen` for leg-related issues
- **Muscular System**: `production/maleAdult/muscular` for muscle-related issues  
- **Skeletal System**: `production/maleAdult/skeleton` for bone-related issues
- **Cardiovascular**: `production/maleAdult/cardiovascular` for heart-related issues

This should provide accurate model selection for most patient pain points.
