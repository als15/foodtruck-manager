export interface Ingredient {
  id: string;
  name: string;
  costPerUnit: number;
  unit: string; // e.g., "lbs", "oz", "cups", "pieces"
  supplier: string;
  category: string;
  isAvailable: boolean;
  lastUpdated: Date;
}

export interface MenuItemIngredient {
  ingredientId: string;
  quantity: number;
  unit: string;
  cost?: number; // calculated from ingredient cost * quantity
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  ingredients: MenuItemIngredient[];
  allergens: string[];
  isAvailable: boolean;
  prepTime: number;
  totalIngredientCost?: number; // calculated total cost of all ingredients
  profitMargin?: number; // calculated (price - totalIngredientCost) / price
}

export interface MenuCategory {
  id: string;
  name: string;
  description: string;
  displayOrder: number;
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  hourlyRate: number;
  hireDate: Date;
  isActive: boolean;
}

export interface Shift {
  id: string;
  employeeId: string;
  date: Date;
  startTime: string;
  endTime: string;
  hoursWorked: number;
  role: string;
  location?: string;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  type: 'event' | 'regular' | 'special';
  permitsRequired: string[];
}

export interface Route {
  id: string;
  name: string;
  date: Date;
  locations: Location[];
  estimatedRevenue: number;
  actualRevenue?: number;
  expenses: number;
  status: 'planned' | 'active' | 'completed';
}

export interface Transaction {
  id: string;
  date: Date;
  type: 'revenue' | 'expense';
  category: string;
  amount: number;
  description: string;
  location?: string;
  paymentMethod?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  unit: string;
  minThreshold: number;
  costPerUnit: number;
  supplier?: string;
  lastRestocked: Date;
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  loyaltyPoints: number;
  totalOrders: number;
  totalSpent: number;
  favoriteItems: string[];
  lastVisit: Date;
}

export interface Order {
  id: string;
  customerId?: string;
  items: {
    menuItemId: string;
    quantity: number;
    specialInstructions?: string;
  }[];
  total: number;
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  orderTime: Date;
  location: string;
  paymentMethod: string;
}