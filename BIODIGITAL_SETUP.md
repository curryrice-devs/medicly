# BioDigital Human API Setup Guide

This guide will help you set up the BioDigital Human API for the 3D anatomy viewer in Medicly.

## 🚀 Quick Start

### 1. Register with BioDigital

1. **Visit the BioDigital Developer Portal**: https://developer.biodigital.com/
2. **Create an account** or sign in with your existing account
3. **Navigate to "My Apps"** in the developer dashboard
4. **Click "Create New App"**

### 2. Configure Your Application

Fill out the application form:

- **App Name**: `Medicly - AI Movement Analysis`
- **Description**: `3D anatomy viewer for physical therapy and movement analysis`
- **App Type**: `Web Application`

### 3. Add Your Domains

In the "Application Domains" section, add:

**Development Domains:**
- `localhost:3000`
- `127.0.0.1:3000`
- `localhost:3001` (if using different port)

**Production Domains:**
- `your-domain.com`
- `www.your-domain.com`
- `app.your-domain.com` (if using subdomain)

**Important**: BioDigital requires exact domain matches. Make sure to include:
- Both `www` and non-`www` versions
- Both `http` and `https` (if applicable)
- Port numbers for development

### 4. Get Your API Key

1. **Save your application** after adding domains
2. **Copy the Developer Key** from your app dashboard
3. **Add it to your environment variables**

### 5. Environment Configuration

Add your BioDigital key to `.env.local`:

```env
# BioDigital Human API Key
NEXT_PUBLIC_BIODIGITAL_KEY=your_actual_api_key_here
```

## 🔧 Troubleshooting

### Common Issues

#### 1. "Domain not authorized" Error
- **Solution**: Make sure your domain is exactly listed in your BioDigital app settings
- **Check**: Include port numbers for development (e.g., `localhost:3000`)

#### 2. "Invalid API Key" Error
- **Solution**: Verify your API key is correct in `.env.local`
- **Check**: Restart your development server after adding the key

#### 3. Iframe Loading Issues
- **Solution**: The app will automatically fall back to a custom 3D viewer
- **Note**: The fallback viewer still shows problematic areas with color coding

### Testing Your Setup

1. **Start your development server**: `npm run dev`
2. **Navigate to**: `/dashboard/doctor/patients/P-001`
3. **Click the "3D Anatomy" tab**
4. **Verify**: You should see either the BioDigital viewer or the fallback viewer

## 🎨 Fallback Viewer

If BioDigital isn't available, the app includes a custom fallback viewer that:

- **Shows a 3D-like human figure** with highlighted problematic areas
- **Color-codes severity levels**:
  - 🔴 Red: High severity
  - 🟡 Yellow: Medium severity  
  - 🟢 Green: Low severity
- **Displays interactive legend** with area details
- **Provides smooth animations** and visual feedback

## 📱 Production Deployment

When deploying to production:

1. **Add your production domain** to BioDigital app settings
2. **Update environment variables** with production API key
3. **Test the 3D viewer** on your live domain
4. **Verify HTTPS** is working (required for production)

## 🔐 Security Notes

- **Never commit API keys** to version control
- **Use environment variables** for all sensitive data
- **Rotate keys regularly** for security
- **Monitor usage** in BioDigital dashboard

## 📞 Support

- **BioDigital Documentation**: https://developer.biodigital.com/docs
- **BioDigital Support**: Contact through their developer portal
- **Medicly Issues**: Check the project's issue tracker

## 🎯 Next Steps

Once BioDigital is set up:

1. **Test the 3D viewer** with different patient data
2. **Customize highlighting** for different injury types
3. **Add more anatomical models** as needed
4. **Integrate with patient data** for dynamic highlighting

The 3D anatomy viewer will enhance the patient experience by providing visual context for their conditions and treatment progress.
