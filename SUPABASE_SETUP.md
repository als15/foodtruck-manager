# 🚀 Supabase Setup Instructions

## Quick Setup Guide

### 1. Create a Supabase Account
1. Go to [https://supabase.com](https://supabase.com)
2. Sign up for a free account
3. Create a new project

### 2. Get Your Project Credentials
1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy your **Project URL** and **anon public** key
3. Update the `.env` file in your project root:

```env
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Set Up Database Schema
1. In your Supabase dashboard, go to **SQL Editor**
2. Copy and paste the contents of `supabase/schema.sql`
3. Click **Run** to create all tables and functions

### 4. Add Sample Data (Optional)
1. Still in the **SQL Editor**
2. Copy and paste the contents of `supabase/sample-data.sql`
3. Click **Run** to populate with sample data

### 5. Start Your Application
```bash
npm start
```

## 🎯 What You Get

### ✅ **Persistent Data Storage**
- All ingredients, menu items, employees, etc. are stored in PostgreSQL
- Data survives browser refreshes and app restarts

### ✅ **Real-time Updates**
- Changes made in one browser tab appear instantly in others
- Multiple users can collaborate in real-time

### ✅ **Automatic Calculations**
- Menu item costs are automatically calculated when ingredients change
- Profit margins update in real-time

### ✅ **Scalable Database**
- PostgreSQL with proper indexes and relationships
- Ready for production use

## 🔧 Database Schema Overview

### Core Tables
- **ingredients** - Ingredient database with costs and suppliers
- **menu_items** - Menu items with pricing and categories
- **menu_item_ingredients** - Junction table linking menu items to ingredients
- **employees** - Staff information and roles
- **shifts** - Work schedules and hours
- **transactions** - Financial records (revenue/expenses)
- **locations** - Food truck locations and permits
- **customers** - Customer loyalty and order history
- **inventory_items** - Current inventory levels
- **routes** - Planned routes and locations

### Key Features
- **Automatic cost calculation** for menu items
- **Real-time profit margin** updates
- **Row Level Security** for future multi-tenancy
- **Audit trails** with created/updated timestamps
- **Foreign key constraints** for data integrity

## 🔒 Security

The current setup uses permissive policies for development. For production:

1. Set up proper user authentication
2. Implement Row Level Security policies
3. Create user roles and permissions
4. Enable email confirmation for signups

## 🚨 Troubleshooting

### Environment Variables Not Working?
- Make sure your `.env` file is in the project root
- Restart your development server after updating `.env`
- Ensure variables start with `REACT_APP_`

### Database Connection Issues?
- Verify your Project URL and anon key are correct
- Check that your Supabase project is active
- Run the schema.sql script if tables don't exist

### Real-time Not Working?
- Check browser console for WebSocket errors
- Ensure your Supabase project has realtime enabled
- Verify your anon key has proper permissions

## 📚 Next Steps

### Potential Enhancements
1. **User Authentication** - Add login/signup for multiple users
2. **File Upload** - Add photos for menu items and ingredients
3. **Advanced Analytics** - More detailed reporting and insights
4. **Mobile App** - React Native version using same Supabase backend
5. **POS Integration** - Connect with payment systems
6. **Multi-location** - Support for multiple food trucks

### Production Deployment
1. Set up production Supabase project
2. Configure proper environment variables
3. Implement backup strategies
4. Set up monitoring and alerts
5. Configure custom domain (optional)

---

🤖 *Generated with [Claude Code](https://claude.ai/code)*