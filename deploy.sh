#!/bin/bash

echo "🚀 Food Truck Manager - Deployment Helper"
echo "=========================================="

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "⚠️  No .env.local file found."
    echo "📝 Please create .env.local with your Supabase credentials:"
    echo ""
    echo "REACT_APP_SUPABASE_URL=https://your-project.supabase.co"
    echo "REACT_APP_SUPABASE_ANON_KEY=your-anon-key"
    echo ""
    exit 1
fi

echo "✅ Environment file found"

# Build the project
echo "🔨 Building project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "🌐 Ready for deployment!"
    echo ""
    echo "Next steps:"
    echo "1. Deploy to Vercel: https://vercel.com/new"
    echo "2. Or deploy to Netlify: https://app.netlify.com/drop"
    echo "3. Set environment variables in your deployment platform"
    echo "4. Configure Supabase Site URL to match your deployed domain"
    echo ""
    echo "📖 See DEPLOYMENT_GUIDE.md for detailed instructions"
else
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi