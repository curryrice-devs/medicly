# BioDigital Model and Anatomy Object ID Guide

This guide will help you find the correct model IDs and anatomy object IDs for the BioDigital 3D viewer.

## 🔍 **Finding Valid Model IDs**

### **Step 1: Browse Available Models**
1. **Go to**: https://human.biodigital.com/
2. **Sign in** with your BioDigital account
3. **Browse the library** to find the model you want
4. **Click on a model** to view it

### **Step 2: Get the Model ID**
1. **Look at the URL** when viewing a model
2. **The model ID** is in the URL after `?id=`
3. **Example URLs**:
   - `https://human.biodigital.com/viewer/?id=production/maleAdult/skeleton`
   - `https://human.biodigital.com/viewer/?id=production/femaleAdult/muscular`
   - `https://human.biodigital.com/viewer/?id=production/maleAdult/cardiovascular`

### **Step 3: Common Model IDs**
Here are some commonly used model IDs:

```
production/maleAdult/skeleton          # Male skeleton
production/femaleAdult/skeleton        # Female skeleton
production/maleAdult/muscular          # Male muscular system
production/femaleAdult/muscular        # Female muscular system
production/maleAdult/cardiovascular    # Male cardiovascular system
production/maleAdult/nervous           # Male nervous system
production/maleAdult/lymphatic         # Male lymphatic system
```

## 🎯 **Finding Anatomy Object IDs**

### **Method 1: Using the Debug Button**
1. **Load the 3D viewer** in your app
2. **Click "🔍 Debug Objects"** button
3. **Browse the list** of available objects
4. **Click on objects** to highlight them
5. **Check the console** for full object details

### **Method 2: Using Browser Console**
1. **Open browser dev tools** (F12)
2. **Go to Console tab**
3. **Run this command**:
   ```javascript
   HumanAPI.send('scene.getAnatomyObjects', {}, function(objects) {
     console.log('All Objects:', objects);
   });
   ```

### **Method 3: Using BioDigital Website**
1. **Go to**: https://human.biodigital.com/
2. **Load a model**
3. **Open browser dev tools** (F12)
4. **In Console, run**:
   ```javascript
   HumanAPI.send('scene.getAnatomyObjects', {}, function(objects) {
     console.log('Available Objects:', objects);
   });
   ```

## 🔧 **Updating Your Model ID**

### **In the Code:**
Update the model ID in `BioDigitalViewer.tsx`:

```typescript
// Change this line:
src={`https://human.biodigital.com/viewer?id=production/maleAdult/skeleton&ui-info=false&ui-menu=false&dk=${biodigitalKey}`}

// To your desired model:
src={`https://human.biodigital.com/viewer?id=production/maleAdult/muscular&ui-info=false&ui-menu=false&dk=${biodigitalKey}`}
```

## 🎨 **Common Anatomy Object Mappings**

### **Shoulder/Upper Body:**
```javascript
// Common shoulder-related object IDs:
'deltoid_right'           // Right deltoid muscle
'deltoid_left'            // Left deltoid muscle
'supraspinatus_right'     // Right supraspinatus
'supraspinatus_left'      // Left supraspinatus
'shoulder_joint_right'    // Right shoulder joint
'shoulder_joint_left'     // Left shoulder joint
'clavicle_right'          // Right clavicle
'clavicle_left'           // Left clavicle
```

### **Spine/Back:**
```javascript
// Common spine-related object IDs:
'lumbar_vertebrae'        // Lumbar vertebrae
'thoracic_vertebrae'      // Thoracic vertebrae
'cervical_vertebrae'      // Cervical vertebrae
'erector_spinae'          // Erector spinae muscles
'trapezius'               // Trapezius muscle
'latissimus_dorsi'        // Latissimus dorsi
```

### **Hip/Lower Body:**
```javascript
// Common hip-related object IDs:
'hip_joint_right'         // Right hip joint
'hip_joint_left'          // Left hip joint
'femur_right'             // Right femur
'femur_left'              // Left femur
'pelvis'                  // Pelvis
'gluteus_maximus'         // Gluteus maximus
```

## 🚀 **Testing Your Setup**

### **Step 1: Load the Viewer**
1. **Navigate to**: `/dashboard/doctor/patients/P-001`
2. **Click "3D Anatomy" tab**
3. **Wait for the viewer to load**

### **Step 2: Debug Objects**
1. **Click "🔍 Debug Objects"** button
2. **Browse the available objects**
3. **Click on objects** to highlight them
4. **Note the object IDs** you want to use

### **Step 3: Update Patient Data**
Update the `problematicAreas` in your patient data with the correct object IDs:

```typescript
problematicAreas: [
  {
    id: 'deltoid_right',  // Use actual object ID from debug
    name: 'Right Shoulder',
    severity: 'high',
    description: 'Limited range of motion',
    color: { r: 1, g: 0, b: 0 },
    opacity: 0.8
  }
]
```

## 🔍 **Debugging Tips**

### **Check Console Logs**
The app will log:
- Available anatomy objects
- Object mapping attempts
- Highlighting results

### **Common Issues**
1. **"Object not found"**: The object ID doesn't exist in the current model
2. **"Model not found"**: The model ID is invalid
3. **"API key invalid"**: Check your BioDigital API key

### **Fallback Viewer**
If BioDigital fails, the app automatically shows a fallback 3D viewer that still highlights problematic areas.

## 📱 **Production Considerations**

### **Model Selection**
- **Skeleton models**: Good for bone-related issues
- **Muscular models**: Good for muscle-related issues
- **Full body models**: Good for general anatomy

### **Performance**
- **Larger models**: More detailed but slower to load
- **Smaller models**: Faster loading but less detail
- **Mobile devices**: Consider simpler models for better performance

## 🎯 **Next Steps**

1. **Test with different models** to find the best fit
2. **Use the debug button** to explore available objects
3. **Update patient data** with correct object IDs
4. **Customize highlighting** for different injury types
5. **Add more anatomical models** as needed

The debug functionality makes it easy to explore and find the exact anatomy objects you need for highlighting problematic areas!
