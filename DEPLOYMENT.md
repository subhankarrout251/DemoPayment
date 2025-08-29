# Deployment Guide

## Overview
This coaching centre website is designed to be deployed with:
- **Backend (Server)**: Render.com
- **Frontend (Client)**: Netlify

## Pre-deployment Steps

### 1. Update URLs
Before deploying, you need to update the following URLs:

#### Server (server.js)
- Line 22: Replace `"https://your-netlify-site.netlify.app"` with your actual Netlify URL

#### Client Environment
- Create `.env` file in `/client/` directory with:
```
VITE_API_URL=https://your-render-app.onrender.com
```

## Deployment Steps

### Deploy Backend to Render

1. **Create Render Account**: Go to [render.com](https://render.com) and sign up
2. **Connect Repository**: Link your GitHub repository
3. **Create Web Service**:
   - Choose "Web Service"
   - Select your repository
   - Root Directory: `server`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
4. **Set Environment Variables**:
   - `NODE_ENV=production`
   - `CLIENT_URL=https://your-netlify-site.netlify.app`
   - Add any other environment variables from `.env.example`
5. **Deploy**: Click "Create Web Service"

### Deploy Frontend to Netlify

1. **Create Netlify Account**: Go to [netlify.com](https://netlify.com) and sign up
2. **Connect Repository**: Link your GitHub repository
3. **Configure Build Settings**:
   - Base directory: `client`
   - Build command: `npm run build`
   - Publish directory: `client/dist`
4. **Set Environment Variables**:
   - `VITE_API_URL=https://your-render-app.onrender.com`
5. **Deploy**: Click "Deploy site"

## Post-deployment

1. **Update CORS**: Update the server's CORS configuration with your actual Netlify URL
2. **Test**: Verify all API endpoints work correctly
3. **Custom Domain** (optional): Configure custom domains on both platforms

## Important Notes

- Render free tier has cold starts (apps sleep after 15 minutes of inactivity)
- Netlify free tier includes 100GB bandwidth per month
- Both platforms support automatic deployments from GitHub
- File uploads will work but files are ephemeral on Render free tier
