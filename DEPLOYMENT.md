# Deployment Guide - Render

This guide walks you through deploying the Recipe Planner app to Render.

## Prerequisites

- GitHub repository connected (✓ Already done!)
- Render account (sign up at https://render.com)
- PostgreSQL database on Render (✓ Already created!)

## Quick Deploy

The `render.yaml` file in the root directory contains the complete deployment configuration.

### Step 1: Connect to Render

1. Go to https://render.com/dashboard
2. Click **"New +"** → **"Blueprint"**
3. Select **"Connect a repository"**
4. Choose your GitHub account and select **`mealPlanning`** repository
5. Click **"Connect"**

### Step 2: Configure Services

Render will automatically detect the `render.yaml` file and create:

- **recipe-planner-api** - Backend API server (Node.js)
- **recipe-planner-web** - Frontend static site
- **recipe-planner-db** - PostgreSQL database (using your existing one)

### Step 3: Set Environment Variables

The following environment variables will be automatically set:

**Backend (recipe-planner-api):**
- `NODE_ENV` → production
- `DATABASE_URL` → Auto-linked from database
- `JWT_SECRET` → Auto-generated
- `MAGIC_LINK_EXPIRY` → 900000

**You need to add manually (for email functionality):**
- `CLIENT_URL` → URL of your frontend (e.g., https://recipe-planner-web.onrender.com)
- `SMTP_HOST` → Your SMTP server
- `SMTP_PORT` → SMTP port (587)
- `SMTP_USER` → Your email
- `SMTP_PASS` → Your email password/app password
- `FROM_EMAIL` → Sender email address

### Step 4: Deploy

1. Click **"Apply"** to start the deployment
2. Render will:
   - Build both services
   - Run database migrations (if configured)
   - Start the services

### Step 5: Update Frontend API URL

After the backend deploys:

1. Go to the **recipe-planner-web** service
2. Add environment variable:
   - `VITE_API_URL` → Your backend URL (e.g., https://recipe-planner-api.onrender.com)
3. Trigger a manual deploy to rebuild with the new URL

## Service URLs

After deployment, you'll have:

- **Frontend**: https://recipe-planner-web.onrender.com
- **Backend API**: https://recipe-planner-api.onrender.com
- **Database**: Connected internally

## Run Database Migrations

After the backend deploys for the first time, you need to run migrations:

1. Go to **recipe-planner-api** service
2. Click **"Shell"** tab
3. Run: `npm run db:migrate`

Or use Render CLI:
```bash
render ssh recipe-planner-api
npm run db:migrate
```

## Free Tier Limitations

Render's free tier has some limitations:

- Services spin down after 15 minutes of inactivity
- First request after spin-down takes ~30 seconds
- 750 hours/month of usage
- PostgreSQL: 1GB storage, 97 connection limit

## Troubleshooting

### Build Failed
- Check build logs in Render dashboard
- Ensure all dependencies are in package.json
- Verify Node version compatibility

### Database Connection Issues
- Verify DATABASE_URL is correctly linked
- Check that SSL is enabled in connection.ts
- Ensure database is in the same region

### Frontend Not Connecting to Backend
- Verify VITE_API_URL is set correctly
- Check CORS settings in backend
- Ensure backend health check is passing

## Manual Deployment (Alternative)

If you prefer not to use the Blueprint:

### Deploy Backend
1. New → Web Service
2. Connect repository
3. Build command: `npm install && npm run build -w @recipe-planner/server`
4. Start command: `npm start -w @recipe-planner/server`
5. Add environment variables

### Deploy Frontend
1. New → Static Site
2. Connect repository
3. Build command: `npm install && npm run build -w @recipe-planner/client`
4. Publish directory: `packages/client/dist`

## Continuous Deployment

Render automatically deploys when you push to the `main` branch. To disable:

1. Go to service settings
2. Turn off "Auto-Deploy"

## Production Checklist

Before going live:

- [ ] Update JWT_SECRET to a strong random value
- [ ] Configure email (SMTP) settings
- [ ] Set correct CLIENT_URL
- [ ] Run database migrations
- [ ] Test authentication flow
- [ ] Test all major features
- [ ] Set up monitoring/alerts (if needed)
- [ ] Consider upgrading from free tier for production use

## Support

- Render Docs: https://render.com/docs
- Render Community: https://community.render.com
