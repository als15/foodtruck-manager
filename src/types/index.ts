// Business Management Interfaces
export interface Business {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  settings?: Record<string, any>;
  address?: string;
  phone?: string;
  email?: string;
  taxId?: string;
  currency?: string;
  timezone?: string;
  subscriptionTier?: 'free' | 'starter' | 'professional' | 'enterprise';
  subscriptionStatus?: 'active' | 'inactive' | 'trial' | 'suspended';
}

export interface UserBusiness {
  id: string;
  userId: string;
  businessId: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  joinedAt: Date;
  permissions?: Record<string, boolean>;
}

export interface BusinessInvitation {
  id: string;
  businessId: string;
  email: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  invitedBy: string;
  token: string;
  expiresAt: Date;
  acceptedAt?: Date;
  createdAt: Date;
}

export interface Product {
  id: string;
  businessId: string;
  name: string;
  costPerUnit: number;
  unit: string; // e.g., "lbs", "oz", "cups", "pieces", "count"
  supplier: string;
  category: string;
  isAvailable: boolean;
  lastUpdated: Date;
  // Packaging information
  unitsPerPackage?: number; // e.g., 12 for a box of 12 bottles
  packageType?: string; // e.g., "box", "case", "bag", "crate"
  minimumOrderQuantity?: number; // Minimum units that can be ordered
  orderByPackage?: boolean; // Whether this product must be ordered by package
}

// Legacy type alias for backwards compatibility
export type Ingredient = Product;

export interface MenuItemIngredient {
  ingredientId: string; // Still called ingredientId as it represents food products used in menu items
  quantity: number;
  unit: string;
  cost?: number; // calculated from product cost * quantity
}

export interface MenuItem {
  id: string;
  businessId: string;
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
  businessId: string;
  name: string;
  description: string;
  displayOrder: number;
}

export interface ProductMapping {
  id: string;
  businessId: string;
  originalName: string;
  sourceType: string;
  menuItemId?: string;
  confidence: number;
  isManual: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt: Date;
}

export interface Employee {
  id: string;
  businessId: string;
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
  businessId: string;
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
  businessId: string;
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
  businessId: string;
  name: string;
  category: string;
  currentStock: number;
  unit: string;
  minThreshold: number;
  costPerUnit: number;
  supplier?: string;
  lastRestocked: Date;
  reservedQuantity?: number; // quantity reserved for pending orders
  productId?: string; // link to product table
  ingredientId?: string; // legacy field name, same as productId
  lastMovementDate?: Date;
  disposedQuantity?: number; // quantity marked as disposed/wasted
}

// New interface for tracking all inventory movements
export interface InventoryTransaction {
  id: string;
  businessId: string;
  inventoryItemId: string;
  ingredientId?: string; // for easier querying
  type: 'in' | 'out' | 'adjustment';
  quantity: number; // positive for in, negative for out
  reason: 'supplier_delivery' | 'order_sale' | 'manual_adjustment' | 'waste' | 'return' | 'initial_stock';
  referenceId?: string; // Order ID, Supplier Order ID, etc.
  referenceName?: string; // Order #, Supplier Order #, etc. for display
  notes?: string;
  unitCost?: number; // cost per unit at time of transaction
  totalValue?: number; // quantity * unitCost
  balanceAfter: number; // inventory balance after this transaction
  createdAt: Date;
  createdBy?: string;
}

// Interface for inventory availability validation
export interface InventoryValidationResult {
  isValid: boolean;
  insufficientItems: {
    ingredientId: string;
    ingredientName: string;
    required: number;
    available: number;
    shortfall: number;
    unit: string;
  }[];
  warnings: {
    ingredientId: string;
    ingredientName: string;
    currentStock: number;
    minThreshold: number;
    unit: string;
  }[];
}

// Interface for low stock alerts
export interface InventoryAlert {
  id: string;
  businessId: string;
  inventoryItemId: string;
  ingredientId?: string;
  ingredientName: string;
  currentStock: number;
  minThreshold: number;
  unit: string;
  alertType: 'low_stock' | 'out_of_stock' | 'overstock';
  severity: 'info' | 'warning' | 'critical';
  isResolved: boolean;
  createdAt: Date;
  resolvedAt?: Date;
}

// Interface for batch stock movements
export interface StockMovement {
  ingredientId: string;
  inventoryItemId?: string;
  quantity: number;
  unitCost?: number;
  notes?: string;
}

export interface Customer {
  id: string;
  businessId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  loyaltyPoints?: number;
  totalOrders?: number;
  totalSpent?: number;
  favoriteItems?: string[];
  lastVisit?: Date;
}

export interface Supplier {
  id: string;
  businessId: string;
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
  deliveryMethods: ('pickup' | 'delivery')[]; // e.g., ['pickup'], ['delivery'], or ['pickup', 'delivery']
  notes?: string;
  isActive: boolean;
  // Payment details
  accountName?: string;
  bankName?: string;
  bankCode?: string;
  branchNumber?: string;
  accountNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id?: string;
  menuItemId: string;
  menuItem?: {
    name: string;
    description: string;
    price: number;
  };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  specialInstructions?: string;
}


export interface Order {
  id: string;
  businessId: string;
  orderNumber?: string;
  customerId?: string;
  customer?: Customer;
  items: OrderItem[];
  total: number;
  subtotal: number;
  taxAmount?: number;
  tipAmount?: number;
  discountAmount?: number;
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled' | 'refunded';
  orderTime: Date;
  completedTime?: Date;
  location: string;
  paymentMethod: 'cash' | 'card' | 'mobile' | 'online' | 'other';
  paymentStatus?: 'pending' | 'completed' | 'failed' | 'refunded';
  specialInstructions?: string;
  externalOrderId?: string;
  externalSource?: string;
  prepTimeMinutes?: number;
  employeeId?: string;
}

// Financial Management Interfaces
export interface FinancialGoal {
  id: string;
  businessId: string;
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
  businessId: string;
  name: string;
  type: 'fixed' | 'variable' | 'one_time';
  description?: string;
  isActive: boolean;
}

export interface Expense {
  id: string;
  businessId: string;
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
  businessId: string;
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

// Supplier Order Management Interfaces
export interface SupplierOrderItem {
  id?: string;
  productId?: string;
  ingredientId: string; // kept for backwards compatibility, represents productId
  ingredient?: {
    name: string;
    unit: string;
    costPerUnit: number;
  };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

export interface SupplierOrder {
  id: string;
  businessId: string;
  orderNumber: string;
  supplierId: string;
  supplier?: Supplier;
  items: SupplierOrderItem[];
  totalAmount: number;
  status: 'draft' | 'submitted' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  orderDate: Date;
  expectedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  submittedDate?: Date;
  notes?: string;
  autoGenerated: boolean; // Whether this order was auto-generated based on low stock
  createdAt: Date;
  updatedAt: Date;
}