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

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  deliveryDays: string[]; // e.g., ['Monday', 'Wednesday', 'Friday']
  orderSubmissionDays: string[]; // e.g., ['Friday', 'Tuesday'] - days to submit orders
  minimumOrderAmount: number;
  leadTime: number; // days
  autoOrderEnabled: boolean;
  paymentTerms: string; // e.g., 'Net 30', 'COD', etc.
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
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

// Financial Management Interfaces
export interface FinancialGoal {
  id: string;
  name: string;
  type: 'monthly_revenue' | 'monthly_profit' | 'break_even' | 'custom';
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  type: 'fixed' | 'variable' | 'one_time';
  description?: string;
  isActive: boolean;
}

export interface Expense {
  id: string;
  categoryId?: string | null;
  name: string;
  amount: number;
  type: 'fixed' | 'variable' | 'one_time';
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'one_time';
  startDate: Date;
  endDate?: Date;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FinancialProjection {
  id: string;
  name: string;
  projectionPeriod: 'monthly' | 'quarterly' | 'yearly';
  projectedRevenue: number;
  projectedExpenses: number;
  projectedProfit: number;
  averageOrderValue: number;
  ordersPerDay: number;
  workingDaysPerMonth: number;
  profitMarginPercentage: number;
  breakEvenPoint: number; // orders needed to break even
  createdAt: Date;
  updatedAt: Date;
}

export interface CashFlow {
  id: string;
  date: Date;
  type: 'inflow' | 'outflow';
  amount: number;
  category: string;
  description: string;
  recurring: boolean;
  recurringPeriod?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  createdAt: Date;
}

// Labor Cost Management Interfaces
export interface LaborCost {
  id: string;
  employeeId: string;
  periodStart: Date;
  periodEnd: Date;
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  regularRate: number;
  overtimeRate: number;
  grossPay: number;
  taxes: number;
  benefits: number;
  netPay: number;
  totalCost: number; // Gross pay + employer taxes + benefits
  createdAt: Date;
  updatedAt: Date;
}

export interface PayrollPeriod {
  id: string;
  startDate: Date;
  endDate: Date;
  payDate: Date;
  status: 'draft' | 'calculated' | 'paid' | 'closed';
  totalGrossPay: number;
  totalNetPay: number;
  totalEmployerCosts: number;
  employeeCounts: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface LaborProjection {
  id: string;
  name: string;
  projectionPeriod: 'weekly' | 'monthly' | 'quarterly';
  averageHoursPerEmployee: number;
  averageWage: number;
  employeeCount: number;
  projectedLaborCost: number;
  projectedOvertimeCost: number;
  projectedBenefitsCost: number;
  totalProjectedCost: number;
  laborCostPercentage: number; // As percentage of revenue
  createdAt: Date;
  updatedAt: Date;
}