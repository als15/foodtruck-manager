import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation resources
const resources = {
  en: {
    translation: {
      // Navigation
      "dashboard": "Dashboard",
      "order_management": "Order Management",
      "menu_management": "Menu Management",
      "customers": "Customers",
      "employees": "Employees",
      "ingredients": "Ingredients",
      "inventory": "Inventory",
      "suppliers": "Suppliers",
      "financial": "Financial",
      "analytics": "Analytics",
      
      // Orders
      "orders": "Orders",
      "all_orders": "All Orders",
      "add_order_record": "Add Order Record",
      "import_orders": "Import Orders",
      "new_order": "New Order",
      "order_number": "Order #",
      "customer": "Customer",
      "items": "Items",
      "total": "Total",
      "payment": "Payment",
      "status": "Status",
      "source": "Source",
      "actions": "Actions",
      "walk_in": "Walk-in",
      "time": "Time",
      
      // Dashboard
      "todays_performance": "Today's Performance",
      "this_week": "This Week",
      "this_month": "This Month",
      "top_selling_items": "Top Selling Items",
      "key_metrics": "Key Metrics",
      "payment_methods": "Payment Methods",
      "location_performance": "Location Performance",
      "avg_order_value": "Avg Order Value",
      "total_orders": "Total Orders",
      "peak_hour": "Peak Hour",
      "total_revenue": "Total Revenue",
      "orders_count": "{{count}} orders",
      "revenue": "Revenue",
      "sold": "sold",
      "orders_text": "orders",
      
      // Order Creation
      "customer_information": "Customer Information",
      "select_customer": "Select Customer",
      "walk_in_customer": "Walk-in Customer",
      "add_new_customer": "Add New Customer",
      "cancel_new_customer": "Cancel New Customer",
      "first_name": "First Name",
      "last_name": "Last Name",
      "email": "Email",
      "phone": "Phone",
      "select_menu_items": "Select Menu Items",
      "order_summary": "Order Summary",
      "no_items_selected": "No items selected",
      "each": "each",
      "subtotal": "Subtotal",
      "tax": "Tax",
      "tip_amount": "Tip Amount",
      "order_date_time": "Order Date & Time",
      "location": "Location",
      "payment_method": "Payment Method",
      "special_instructions": "Special Instructions",
      "cancel": "Cancel",
      "create_order": "Create Order",
      
      // Payment Methods
      "cash": "Cash",
      "card": "Card",
      "mobile": "Mobile",
      "online": "Online",
      "other": "Other",
      
      // Common
      "delete": "Delete",
      "edit": "Edit",
      "save": "Save",
      "close": "Close",
      "yes": "Yes",
      "no": "No",
      "loading": "Loading...",
      "error": "Error",
      "success": "Success",
      "warning": "Warning",
      "info": "Info",
      
      // Messages
      "order_created_successfully": "Order created successfully",
      "failed_to_create_order": "Failed to create order",
      "order_deleted_successfully": "Order deleted successfully",
      "failed_to_delete_order": "Failed to delete order",
      "failed_to_load_data": "Failed to load data"
    }
  },
  he: {
    translation: {
      // Navigation
      "dashboard": "לוח בקרה",
      "order_management": "ניהול הזמנות",
      "menu_management": "ניהול תפריט",
      "customers": "לקוחות",
      "employees": "עובדים",
      "ingredients": "מרכיבים",
      "inventory": "מלאי",
      "suppliers": "ספקים",
      "financial": "כספים",
      "analytics": "אנליטיקה",
      
      // Orders
      "orders": "הזמנות",
      "all_orders": "כל ההזמנות",
      "add_order_record": "הוסף רשומת הזמנה",
      "import_orders": "ייבא הזמנות",
      "new_order": "הזמנה חדשה",
      "order_number": "הזמנה מס'",
      "customer": "לקוח",
      "items": "פריטים",
      "total": "סך הכל",
      "payment": "תשלום",
      "status": "סטטוס",
      "source": "מקור",
      "actions": "פעולות",
      "walk_in": "לקוח חולף",
      "time": "זמן",
      
      // Dashboard
      "todays_performance": "ביצועי היום",
      "this_week": "השבוע",
      "this_month": "החודש",
      "top_selling_items": "הפריטים הנמכרים ביותר",
      "key_metrics": "מדדים עיקריים",
      "payment_methods": "אמצעי תשלום",
      "location_performance": "ביצועי מיקומים",
      "avg_order_value": "ערך הזמנה ממוצע",
      "total_orders": "סך הזמנות",
      "peak_hour": "שעת שיא",
      "total_revenue": "סך הכנסות",
      "orders_count": "{{count}} הזמנות",
      "revenue": "הכנסות",
      "sold": "נמכר",
      "orders_text": "הזמנות",
      
      // Order Creation
      "customer_information": "פרטי לקוח",
      "select_customer": "בחר לקוח",
      "walk_in_customer": "לקוח חולף",
      "add_new_customer": "הוסף לקוח חדש",
      "cancel_new_customer": "בטל לקוח חדש",
      "first_name": "שם פרטי",
      "last_name": "שם משפחה",
      "email": "אימייל",
      "phone": "טלפון",
      "select_menu_items": "בחר פריטי תפריט",
      "order_summary": "סיכום הזמנה",
      "no_items_selected": "לא נבחרו פריטים",
      "each": "כל אחד",
      "subtotal": "סיכום ביניים",
      "tax": "מס",
      "tip_amount": "סכום טיפ",
      "order_date_time": "תאריך ושעת הזמנה",
      "location": "מיקום",
      "payment_method": "אמצעי תשלום",
      "special_instructions": "הוראות מיוחדות",
      "cancel": "בטל",
      "create_order": "צור הזמנה",
      
      // Payment Methods
      "cash": "מזומן",
      "card": "כרטיס אשראי",
      "mobile": "נייד",
      "online": "אונליין",
      "other": "אחר",
      
      // Common
      "delete": "מחק",
      "edit": "ערוך",
      "save": "שמור",
      "close": "סגור",
      "yes": "כן",
      "no": "לא",
      "loading": "טוען...",
      "error": "שגיאה",
      "success": "הצלחה",
      "warning": "אזהרה",
      "info": "מידע",
      
      // Messages
      "order_created_successfully": "ההזמנה נוצרה בהצלחה",
      "failed_to_create_order": "נכשל ביצירת ההזמנה",
      "order_deleted_successfully": "ההזמנה נמחקה בהצלחה",
      "failed_to_delete_order": "נכשל במחיקת ההזמנה",
      "failed_to_load_data": "נכשל בטעינת הנתונים"
    }
  }
};

i18n
  // detect user language
  .use(LanguageDetector)
  // pass the i18n instance to react-i18next
  .use(initReactI18next)
  // init i18next
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    
    detection: {
      // options for language detection
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    }
  });

export default i18n;