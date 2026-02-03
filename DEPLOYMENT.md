# OSRS Bingo - Deployment Guide

This guide will help you deploy the frontend to GitHub Pages and the backend to Render (free).

---

## Part 1: Prepare Your Repository

### Step 1: Create GitHub Repository

1. Go to [github.com](https://github.com) and log in
2. Click the **+** button → **New repository**
3. Name it: `osrs-bingo`
4. Make it **Public** (required for free GitHub Pages)
5. **Don't** initialize with README (we have files already)
6. Click **Create repository**

### Step 2: Initialize Git Locally

Open terminal in your project folder (`osrs-bingo`) and run:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/osrs-bingo.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

---

## Part 2: Deploy Backend to Render

### Step 3: Create Render Account

1. Go to [render.com](https://render.com)
2. Click **Get Started for Free**
3. Sign up with GitHub (easiest)

### Step 4: Create New Web Service

1. Click **New** → **Web Service**
2. Connect your GitHub repository
3. Select the `osrs-bingo` repository
4. Configure:
   - **Name**: `osrs-bingo-api`
   - **Region**: Frankfurt (EU) or closest to you
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: `Free`

### Step 5: Add Environment Variables

1. Scroll down to **Environment Variables**
2. Click **Add Environment Variable**
3. Add:
   - **Key**: `ADMIN_PASSWORD`
   - **Value**: Your secure admin password
4. Click **Create Web Service**

### Step 6: Get Your Backend URL

1. Wait for deployment (2-3 minutes)
2. Copy your URL, it will be like: `https://osrs-bingo-api.onrender.com`
3. **Save this URL** - you need it for the frontend!

---

## Part 3: Deploy Frontend to GitHub Pages

### Step 7: Update Frontend Config

Create a file `frontend/.env.production`:

```
VITE_API_URL=https://osrs-bingo-api.onrender.com
```

Replace the URL with your actual Render backend URL from Step 6.

### Step 8: Build and Deploy Frontend

Run these commands:

```bash
cd frontend
npm run build
```

### Step 9: Enable GitHub Pages

1. Go to your GitHub repository
2. Click **Settings** → **Pages** (left sidebar)
3. Under **Source**, select **GitHub Actions**

### Step 10: Create GitHub Actions Workflow

Create the file `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Install and Build
        run: |
          cd frontend
          npm install
          npm run build
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./frontend/dist
```

### Step 11: Add GitHub Secret

1. Go to repository **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://osrs-bingo-api.onrender.com` (your Render URL)

### Step 12: Push and Deploy

```bash
git add .
git commit -m "Add deployment config"
git push
```

The GitHub Action will automatically build and deploy!

---

## Part 4: Verify Deployment

### Your URLs:

- **Frontend**: `https://YOUR_USERNAME.github.io/osrs-bingo/`
- **Backend**: `https://osrs-bingo-api.onrender.com`

### Test:

1. Open your GitHub Pages URL
2. Try logging into admin with your password
3. Create a team and verify data persists

---

## Troubleshooting

### "API not working"

- Check that VITE_API_URL is set correctly in GitHub secrets
- Check Render logs for errors

### "CORS error"

The backend already has CORS enabled. If issues persist, check the Render URL is correct.

### "Free tier sleeping"

Render free tier sleeps after 15 min of inactivity. First request after sleep takes ~30 seconds.

---

## Quick Reference

| Service  | URL                  | Dashboard                    |
| -------- | -------------------- | ---------------------------- |
| Frontend | github.io/osrs-bingo | GitHub repo Settings → Pages |
| Backend  | onrender.com         | render.com dashboard         |
| Logs     | -                    | Render dashboard → Logs      |
