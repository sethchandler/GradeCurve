# Deployment Guide for GradeCurve Pro

## 🎯 Overview

This guide covers deploying GradeCurve Pro to **Vercel** (recommended) and **GitHub Pages** (backup).

---

## ✅ Pre-Deployment Checklist

- [ ] Codebase is committed to GitHub
- [ ] `npm run build` completes without errors
- [ ] Local testing with `npm run preview` works
- [ ] (Optional) Gemini API key ready for AI features

---

## 🚀 Option 1: Deploy to Vercel (Recommended)

### Why Vercel?
- ✅ Zero configuration for Vite projects
- ✅ Automatic HTTPS and custom domains
- ✅ Better performance (global CDN)
- ✅ Built-in analytics
- ✅ Instant rollbacks

### Method A: One-Click Deploy

1. **Click the button:**

   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/GradeCurve)

2. **Connect your GitHub account** (if first time)

3. **Configure:**
   - Project Name: `gradecurve-pro`
   - Framework Preset: Vite (auto-detected)
   - Root Directory: `./`
   - Build Command: `npm run build` (default)
   - Output Directory: `dist` (default)

4. **Deploy!**
   - Your app will be live at `https://gradecurve-pro-xxxxx.vercel.app`
   - You can add a custom domain later

### Method B: Vercel CLI

```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from project root
cd /path/to/GradeCurve
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - What's your project's name? gradecurve-pro
# - In which directory is your code located? ./
# - Want to override settings? No

# For production deployment:
vercel --prod
```

### Adding Environment Variables (Optional - for AI features)

**Via Dashboard:**
1. Go to https://vercel.com/dashboard
2. Select your project → Settings → Environment Variables
3. Add:
   - **Key:** `GEMINI_API_KEY`
   - **Value:** Your API key from https://aistudio.google.com/app/apikey
   - **Environment:** Production, Preview, Development

**Via CLI:**
```bash
vercel env add GEMINI_API_KEY
# Paste your API key when prompted
# Select: Production, Preview, Development
```

### Custom Domain Setup

1. Vercel Dashboard → Your Project → Settings → Domains
2. Add domain: `gradecurve.app` (or your preferred domain)
3. Follow DNS configuration instructions
4. Vercel automatically provisions SSL certificates

---

## 📦 Option 2: GitHub Pages (Already Configured)

The project includes a GitHub Actions workflow for automatic deployment.

### Initial Setup

1. **Enable GitHub Pages:**
   - Go to your GitHub repo → Settings → Pages
   - Source: **GitHub Actions**
   - Click Save

2. **Push to master branch:**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin master
   ```

3. **Monitor deployment:**
   - Go to Actions tab in your repo
   - Watch the "Deploy static content to Pages" workflow
   - Takes ~60-90 seconds

4. **Access your app:**
   - URL: `https://yourusername.github.io/GradeCurve/`

### Notes for GitHub Pages:
- ⚠️ The `base` path in `vite.config.ts` is automatically set to `/GradeCurve/` for GitHub Actions
- ⚠️ Gemini API key must be user-provided (can't use environment variables)
- ⚠️ GitHub Pages has slower global CDN compared to Vercel

---

## 🔄 Continuous Deployment

### Vercel (Automatic)
- Push to `main`/`master` → Automatic production deployment
- Push to any branch → Automatic preview deployment
- Each PR gets its own preview URL

### GitHub Pages (Automatic)
- Push to `master` → Automatic deployment
- Workflow defined in `.github/workflows/deploy.yml`

---

## 🛠️ Post-Deployment Tasks

### 1. Update README URLs
Replace placeholders in `README.md`:
- `https://gradecurve.vercel.app` → Your actual Vercel URL
- `https://yourusername.github.io/GradeCurve` → Your actual GitHub Pages URL

### 2. Test All Features
- [ ] File upload (CSV, Excel)
- [ ] Manual score input
- [ ] Configuration editor
- [ ] Grade generation
- [ ] CSV export
- [ ] Excel export
- [ ] AI report generation (if API key configured)

### 3. Set Up Analytics (Vercel)
- Enable Vercel Analytics: Dashboard → Your Project → Analytics
- Free tier includes 2,500 events/month

### 4. Configure Custom Domain (Optional)
See "Custom Domain Setup" above for Vercel.

For GitHub Pages:
- Settings → Pages → Custom domain
- Add CNAME record in your DNS provider
- Enable "Enforce HTTPS"

---

## 🎓 Recommended Setup for Nationwide Access

**Primary:** Vercel with custom domain (e.g., `gradecurve.app`)
- Professional appearance
- Best performance
- Easy to share with colleagues

**Backup:** GitHub Pages
- Free hosting
- Institutional approval often easier for .github.io domains
- Reliable uptime

**Documentation:**
- Link to GitHub repo for transparency
- Include technical paper/algorithm explanation
- Provide example configurations for different institutions

---

## 🐛 Troubleshooting

### Build Fails on Vercel
```bash
# Test locally first:
npm run build

# Check build logs in Vercel dashboard
# Most common issues:
# - TypeScript errors (check `npm run build` output)
# - Missing dependencies (check package.json)
```

### GitHub Pages Shows 404
- Ensure GitHub Pages is enabled in Settings → Pages
- Check that workflow completed successfully (Actions tab)
- Base path is correctly set in vite.config.ts
- Wait 2-3 minutes after deployment completes

### Environment Variables Not Working
**Vercel:**
- Redeploy after adding env vars: `vercel --prod`
- Env vars are only available at **build time** for Vite
- Check that variable name matches exactly in code

**GitHub Pages:**
- Cannot use build-time environment variables securely
- API keys must be user-provided in the UI

---

## 📊 Performance Optimization

Both platforms are already optimized, but you can improve:

1. **Enable Compression** (Vercel does this automatically)
2. **Optimize Images** - Compress the banner image
3. **Code Splitting** - Vite handles this automatically
4. **CDN Caching** - Already configured in `vercel.json`

---

## 🔐 Security Considerations

1. **API Keys:**
   - Never commit `.env.local` to git (already in .gitignore)
   - For public deployment, users must provide their own Gemini API keys
   - Consider rate limiting if API key is shared

2. **Client-Side Processing:**
   - All grade calculations happen client-side
   - No student data ever uploaded to servers
   - Privacy-first design

3. **HTTPS:**
   - Both Vercel and GitHub Pages enforce HTTPS
   - Required for File System Access API to work

---

## 📞 Support

- **Vercel Docs:** https://vercel.com/docs
- **GitHub Pages Docs:** https://docs.github.com/en/pages
- **Vite Deployment:** https://vitejs.dev/guide/static-deploy.html

---

## 🚀 Quick Start Commands

```bash
# Deploy to Vercel (first time)
vercel

# Deploy to Vercel (production)
vercel --prod

# Deploy to GitHub Pages (automatic)
git push origin master

# Test production build locally
npm run build && npm run preview
```

---

**Ready to deploy?** Start with Vercel for the best experience!
