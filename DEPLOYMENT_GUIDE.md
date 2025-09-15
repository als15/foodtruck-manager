# 🚀 Food Truck Manager - Deployment Guide

## Quick Deploy to Vercel (Recommended)

### Step 1: Prepare Your Supabase Project

1. **Go to [Supabase](https://supabase.com)** and create a new project
2. **Copy your credentials** from Settings → API:
   - Project URL
   - Anon/Public Key
3. **Enable Authentication**:
   - Go to Authentication → Settings
   - Enable "Enable signup"
   - Configure email templates (optional)

### Step 2: Deploy to Vercel

1. **Go to [Vercel](https://vercel.com)** and sign up with your GitHub account
2. **Import your GitHub repository**:
   - Click "New Project"
   - Select your `foodtruck-manager` repository
3. **Configure Environment Variables**:
   - In project settings, add:
   ```
   REACT_APP_SUPABASE_URL=https://your-project.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
   ```
4. **Deploy** - Vercel will automatically build and deploy

### Step 3: Configure Supabase for Production

1. **Update Site URL** in Supabase:
   - Go to Authentication → Settings
   - Set Site URL to your Vercel domain: `https://your-app.vercel.app`
2. **Add Redirect URLs**:
   - Add your Vercel domain to allowed redirect URLs
3. **Test Authentication** on your live site

---

## Alternative: Deploy to Netlify

### Step 1: Build for Production
```bash
npm run build
```

### Step 2: Deploy to Netlify
1. **Go to [Netlify](https://netlify.com)**
2. **Drag and drop** your `build` folder
3. **Set Environment Variables** in Site Settings
4. **Configure Redirects** for SPA routing

---

## Custom Domain Setup (Optional)

### For Vercel:
1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

### For Netlify:
1. Go to Site Settings → Domain Management
2. Add custom domain
3. Configure DNS records

---

## User Management

### Adding Users:
1. **Self-registration**: Users can sign up at `/auth`
2. **Admin invitation**: Create accounts manually in Supabase Auth dashboard
3. **Bulk import**: Use Supabase API for multiple users

### Access Control:
- All routes require authentication
- User data is isolated by user ID
- Supabase Row Level Security (RLS) recommended for production

---

## Post-Deployment Checklist

- [ ] ✅ App loads without errors
- [ ] ✅ Authentication works (login/signup/logout)
- [ ] ✅ All pages accessible when logged in
- [ ] ✅ Data loads from Supabase
- [ ] ✅ Environment variables configured
- [ ] ✅ HTTPS enabled (automatic on Vercel/Netlify)
- [ ] ✅ Custom domain configured (if needed)

---

## Troubleshooting

### Common Issues:

1. **"Missing Supabase environment variables"**
   - Ensure environment variables are set in your deployment platform
   - Variable names must start with `REACT_APP_`

2. **Authentication redirects fail**
   - Check Site URL in Supabase matches your deployed domain
   - Add all redirect URLs to Supabase Auth settings

3. **App shows blank page**
   - Check browser console for errors
   - Verify build process completed successfully

4. **Database connection issues**
   - Verify Supabase project is active
   - Check API keys are correct and have proper permissions

---

## Scaling for More Users

For **100+ concurrent users**, consider:
- Upgrade Supabase plan
- Enable Supabase connection pooling
- Monitor database performance
- Set up error tracking (Sentry)
- Configure CDN for static assets

## Support

If you encounter issues:
1. Check the browser console for errors
2. Review Supabase logs in your dashboard
3. Verify all environment variables are correctly set