# 🚛 Food Truck Manager - User Walkthrough

A step-by-step guide to getting started and using the Food Truck Manager application.

---

## 🎯 Getting Started

### 1. Signup Page

When you first visit the application, you'll be presented with the signup page.

**What you'll see:**
- **NomNom Logo** at the top (120px height)
- **Purple gradient background** (from #667eea to #764ba2)
- **Clean white card** with the signup form

**How to sign up:**

1. **Enter your personal information:**
   - **First Name** - Your first name (required)
   - **Last Name** - Your last name (required)
   - **Email** - Your email address (must be valid format, required)
   - **Password** - Choose a secure password (minimum 6 characters, required)
   - **Confirm Password** - Re-enter your password (must match, required)

2. **Form Features:**
   - All fields show helpful icons (user icon, mail icon, lock icon)
   - Password fields have a toggle to show/hide the password (eye icon)
   - Real-time validation ensures:
     - Email is in correct format
     - Password is at least 6 characters
     - Passwords match
   - Error messages appear immediately if validation fails

3. **Submit the form:**
   - Click the purple gradient **"Signup"** button
   - While processing, the button shows a loading spinner
   - If there's an error (e.g., email already exists), you'll see a red alert message

4. **Success:**
   - After successful signup, you'll see a success message
   - The message says "Account created successfully" with instructions to check your email
   - After 4 seconds, you'll automatically be redirected to the login page
   - Or click the **"Go to Login"** button immediately

**Already have an account?**
- Click the **"Login"** link at the bottom to switch to the login page

**RTL Support:**
- The form is displayed in RTL (right-to-left) format for languages like Arabic and Hebrew

---

### 2. Login Page

After signing up (or if you already have an account), you'll use the login page.

**What you'll see:**
- Same purple gradient background
- NomNom logo
- Login form

**How to log in:**

1. **Enter your credentials:**
   - **Email** - The email you used to sign up
   - **Password** - Your password

2. **Submit:**
   - Click the **"Login"** button
   - If credentials are correct, you'll be logged in
   - If there's an error, you'll see an error message

**Don't have an account?**
- Click the **"Signup"** link at the bottom

---

### 3. Welcome Animation

**First-time users only:**

After your first successful login, you'll see an animated welcome screen that appears for about 4 seconds.

**What happens:**
1. **Step 1** (0.5s): Logo fades in
2. **Step 2** (1.5s): Welcome message appears with your name: "Welcome aboard [YourName]! 🎉"
3. **Step 3** (2.5s): Three feature icons slide in:
   - 🚀 **Quick Setup** - Get started quickly
   - ⚡ **Powerful Tools** - Access comprehensive features
   - ⭐ **Grow Business** - Scale your food truck business
4. **Step 4** (4s): Success checkmark appears
5. **Auto-close** (4.8s): Welcome screen automatically closes

**Background:**
- Beautiful teal/turquoise gradient (#7FD3C7 to #5CDBDF)

**Note:** This welcome animation only shows once per user. It won't appear on subsequent logins.

---

## 📱 Main Application

### 4. Dashboard (Home Page)

After the welcome animation, you'll land on the **Dashboard** - your command center.

**Key Metrics Displayed:**

**Revenue & Orders:**
- **Today's Revenue** - Total sales for today with comparison to yesterday
- **Today's Orders** - Number of orders with trend indicator (↑/↓)
- **Weekly Revenue** - Last 7 days revenue
- **Monthly Revenue** - Current month revenue

**Operational Metrics:**
- **Active Employees** - Staff working today
- **Low Stock Items** - Products running low with warning icon
- **Pending Orders** - Orders awaiting fulfillment
- **Top Customers** - VIP customers with star icon

**Visual Elements:**
- Color-coded cards (green for revenue, blue for orders, orange for warnings)
- Icons for each metric
- Trend indicators showing increase/decrease from previous period

---

### 5. Menu Management

Manage your food truck's menu items, pricing, and ingredients.

**Features:**

**Menu Items Display:**
- View all menu items in a card grid
- Each card shows:
  - Item photo
  - Name and category
  - Price
  - Preparation time
  - Availability toggle
  - Ingredient list
  - Cost and profit margin

**Add New Item:**
1. Click **"Add Menu Item"** button
2. Fill in:
   - Name
   - Description
   - Category (Burgers, Tacos, Drinks, etc.)
   - Price
   - Cost (for profit calculation)
   - Preparation time
   - Photo URL
   - Ingredients
3. Click **"Save"**

**Edit Item:**
- Click edit icon on any menu card
- Modify details
- Save changes

**Delete Item:**
- Click delete icon
- Confirm deletion

**Filter by Category:**
- Use category tabs to filter items
- Categories: All, Burgers, Tacos, Sandwiches, Sides, Drinks, Desserts

---

### 6. Products/Ingredients Management

Track all ingredients and products used in your menu items.

**Features:**

**View Ingredients:**
- Searchable table of all ingredients
- Shows: Name, Cost, Unit, Supplier, Category, Availability

**Add Ingredient:**
1. Click **"Add Ingredient"**
2. Enter:
   - Name (e.g., "Ground Beef")
   - Cost per unit (e.g., $12.00)
   - Unit (e.g., "lb", "kg", "piece")
   - Category (Meat, Vegetables, Dairy, Spices, etc.)
   - Supplier
3. Toggle availability
4. Save

**Real-time Features:**
- Changes sync instantly across all browser tabs (Supabase real-time)
- Auto-calculate menu item costs based on ingredients
- See profit margins update live

**Cost Tracking:**
- Each ingredient has cost per unit
- Menu items automatically calculate total cost based on ingredient quantities
- Profit margin = Price - Total Ingredient Cost

---

### 7. Financial Management

Track revenue, expenses, and overall profitability.

**Revenue Tracking:**
- Record daily sales
- Categorize by payment method (Cash, Credit Card, Mobile Payment)
- View revenue by date range

**Expense Tracking:**
- Log all business expenses
- Categories: Supplies, Fuel, Permits, Marketing, Maintenance, etc.
- Attach notes and receipts

**Reports:**
- Profit/Loss statements
- Revenue vs. Expenses charts
- Tax preparation data
- Monthly/Weekly/Daily breakdowns

**Financial Goals:**
- Set monthly revenue targets
- Track progress toward goals
- Visual progress indicators

---

### 8. Inventory Management

Monitor stock levels and prevent shortages.

**Features:**

**Inventory Overview:**
- View all inventory items
- Current stock levels
- Par levels (minimum stock thresholds)
- Low-stock alerts (red warning for items below par)

**Stock Management:**
- Add/update stock quantities
- Set reorder points
- Track cost per unit
- Supplier information

**Alerts:**
- Automatic low-stock warnings
- Suggested reorder quantities
- Critical inventory notifications on dashboard

**Stock Takes:**
- Perform regular inventory counts
- Adjust discrepancies
- Generate waste reports

---

### 9. Employee Management

Manage your team and track hours.

**Employee Profiles:**
- Name, contact info, role
- Hourly wage or salary
- Emergency contact
- Start date and status

**Shift Scheduling:**
- Create shifts by date, time, and location
- Assign employees to shifts
- Track hours worked
- Calculate payroll

**Payroll Tracking:**
- View total hours by employee
- Calculate wages owed
- Export for payroll processing
- Track overtime

**Performance:**
- Monitor attendance
- Track sales by employee
- Notes and reviews

---

### 10. Logistics & Route Planning

Plan your food truck locations and routes.

**Location Management:**
- Save favorite locations
- GPS coordinates
- Notes about each spot
- Permit status

**Route Planning:**
- Schedule locations by day/time
- Optimize routes
- Track which locations perform best

**Event Scheduling:**
- Book festivals, events, private parties
- Track event details
- Permit and license tracking

**Performance by Location:**
- Revenue comparison by location
- Best performing spots
- Traffic patterns

---

### 11. Customer Management

Build customer loyalty and track preferences.

**Customer Profiles:**
- Name and contact info
- Order history
- Preferences and favorites
- Dietary restrictions

**Loyalty Program:**
- Points system (earn points per dollar spent)
- Tier levels (Bronze, Silver, Gold, Platinum)
- Rewards and discounts
- Point balance tracking

**Analytics:**
- Top customers (by revenue)
- Frequent buyers
- Customer lifetime value
- Retention metrics

**Marketing:**
- Email lists
- SMS notifications
- Birthday rewards
- Special offers

---

### 12. Analytics & Reports

Gain insights into your business performance.

**Visual Charts:**
- Revenue trends (line charts)
- Sales by category (pie charts)
- Location performance (bar charts)
- Employee productivity (comparison charts)

**Key Metrics:**
- Average order value
- Items per transaction
- Peak hours analysis
- Best selling items
- Slowest moving items

**Comparative Analysis:**
- Week-over-week growth
- Month-over-month trends
- Year-over-year comparison
- Location comparisons

**Export Options:**
- Download reports as CSV
- Print-friendly formats
- Share with stakeholders

---

### 13. Supplier Management

Track suppliers and manage orders.

**Supplier Directory:**
- Company name and contact
- Products supplied
- Payment terms
- Delivery schedules
- Rating/notes

**Supplier Orders:**
- Create purchase orders
- Track order status (Pending, Confirmed, Delivered)
- Receive shipments
- Match invoices

**Cost Tracking:**
- Compare prices between suppliers
- Track price changes over time
- Identify cost-saving opportunities

---

### 14. Team Management

Collaborate with your team (multi-user support).

**User Roles:**
- Owner - Full access
- Manager - Most features
- Staff - Limited access

**Invite Team Members:**
1. Go to Team Management
2. Click **"Invite Team Member"**
3. Enter email address
4. Select role
5. Send invitation
6. They'll receive an email to join

**Permissions:**
- Control who can view/edit what
- Restrict sensitive financial data
- Audit trail of changes

---

### 15. Business Settings

Configure your business information and preferences.

**Business Profile:**
- Business name
- Logo
- Contact information
- Tax ID
- Operating hours

**Preferences:**
- Currency (USD, EUR, etc.)
- Date format
- Time zone
- Language (English, Hebrew, Arabic - RTL support)
- Theme (Light/Dark mode)

**Notifications:**
- Low-stock alerts
- Order notifications
- Financial goal updates
- Employee shift reminders

---

### 16. User Settings

Manage your personal account settings.

**Profile:**
- First and last name
- Email address
- Password change
- Profile photo

**Preferences:**
- Language preference
- Notification settings
- Display preferences

**Security:**
- Two-factor authentication (if enabled)
- Active sessions
- Login history

---

## 🎨 User Interface Features

### Navigation

**Sidebar Menu:**
- Collapsible sidebar on desktop
- Bottom navigation on mobile
- Icons + labels for each section
- Active page highlighting
- RTL support for Arabic/Hebrew

**Top Bar:**
- Business switcher (for multi-business users)
- User profile dropdown
- Notifications bell
- Language selector
- Logout button

### Responsive Design

**Desktop (1200px+):**
- Full sidebar navigation
- Multi-column layouts
- Expanded data tables
- Side-by-side forms

**Tablet (768px - 1199px):**
- Collapsible sidebar
- 2-column layouts
- Responsive tables
- Touch-friendly buttons

**Mobile (< 768px):**
- Bottom tab navigation
- Single column layouts
- Swipeable cards
- Mobile-optimized forms
- Hamburger menu

### Theme Support

**Light Mode (Default):**
- White backgrounds
- Dark text
- Purple/teal accents

**RTL Support:**
- Automatic layout flip for Arabic/Hebrew
- Right-aligned text
- Mirrored icons and navigation
- Culturally appropriate formatting

---

## 💡 Tips & Best Practices

### Getting Started
1. **Complete your business profile** first (Settings → Business)
2. **Add your suppliers** before adding inventory
3. **Set up ingredients** before creating menu items
4. **Invite your team** early for collaboration
5. **Set financial goals** to track progress

### Daily Operations
1. **Start each day** by checking the dashboard
2. **Update inventory** after restocking
3. **Record all transactions** in real-time
4. **Review orders** regularly throughout the day
5. **Check low-stock alerts** before closing

### Weekly Tasks
1. **Review analytics** to identify trends
2. **Schedule shifts** for the upcoming week
3. **Plan routes** and locations
4. **Process payroll** for employees
5. **Analyze best-selling items**

### Monthly Tasks
1. **Review financial reports**
2. **Update menu** based on performance
3. **Evaluate supplier** relationships
4. **Check progress** toward goals
5. **Plan promotions** and events

---

## 🔒 Data & Privacy

**Data Storage:**
- All data stored in Supabase (PostgreSQL database)
- Real-time synchronization across devices
- Automatic backups
- Encrypted connections (HTTPS)

**Security:**
- Row-level security (RLS) enabled
- User authentication required
- Business data isolation
- Audit trails for changes

**Multi-Tenancy:**
- Each business has its own data
- Team members can only access their business
- Invitations required for access

---

## 🆘 Troubleshooting

### Can't Sign Up
- **Error: Email already exists** - Use login instead or reset password
- **Error: Password too short** - Use at least 6 characters
- **Error: Invalid email** - Check email format

### Can't Log In
- **Wrong email/password** - Double-check credentials
- **Email not confirmed** - Check your email for confirmation link
- **Account disabled** - Contact support

### Data Not Showing
- **Refresh the page** - Browser refresh (Cmd+R or Ctrl+R)
- **Check internet connection** - Ensure you're online
- **Clear cache** - Try clearing browser cache
- **Check business selection** - Ensure correct business is selected

### Real-time Updates Not Working
- **Check Supabase status** - Ensure your Supabase project is active
- **Verify environment variables** - Check .env.local file
- **Network issues** - Check firewall/VPN settings

---

## 🚀 Next Steps

Now that you understand the basics:

1. **Explore each section** of the app
2. **Add sample data** to test features
3. **Invite team members** to collaborate
4. **Set up your menu** and pricing
5. **Start tracking** your daily operations
6. **Monitor analytics** to grow your business

**Need help?** Refer back to this walkthrough or check the README.md file for technical information.

---

🤖 *Generated with [Claude Code](https://claude.ai/code)*
