import { supabase } from '../lib/supabase';
import { 
  Ingredient, 
  MenuItem, 
  MenuItemIngredient, 
  Employee, 
  Shift, 
  Transaction, 
  Location, 
  InventoryItem, 
  Customer, 
  Supplier,
  Expense,
  FinancialGoal,
  FinancialProjection
} from '../types';

// Helper function to handle Supabase errors
const handleError = (error: any, operation: string) => {
  console.error(`Error in ${operation}:`, error);
  throw new Error(`Failed to ${operation}: ${error.message}`);
};

// ==================== INGREDIENTS ====================

export const ingredientsService = {
  async getAll(): Promise<Ingredient[]> {
    const { data, error } = await supabase
      .from('ingredients')
      .select('*')
      .order('category', { ascending: true });
    
    if (error) handleError(error, 'fetch ingredients');
    
    return (data || []).map(item => ({
      id: item.id,
      name: item.name,
      costPerUnit: item.cost_per_unit,
      unit: item.unit,
      supplier: item.supplier,
      category: item.category,
      isAvailable: item.is_available,
      lastUpdated: new Date(item.last_updated)
    }));
  },

  async create(ingredient: Omit<Ingredient, 'id' | 'lastUpdated'>): Promise<Ingredient> {
    const { data, error } = await supabase
      .from('ingredients')
      .insert({
        name: ingredient.name,
        cost_per_unit: ingredient.costPerUnit,
        unit: ingredient.unit,
        supplier: ingredient.supplier,
        category: ingredient.category,
        is_available: ingredient.isAvailable
      })
      .select()
      .single();
    
    if (error) handleError(error, 'create ingredient');
    
    return {
      id: data.id,
      name: data.name,
      costPerUnit: data.cost_per_unit,
      unit: data.unit,
      supplier: data.supplier,
      category: data.category,
      isAvailable: data.is_available,
      lastUpdated: new Date(data.last_updated)
    };
  },

  async update(id: string, ingredient: Partial<Ingredient>): Promise<Ingredient> {
    const updateData: any = {};
    if (ingredient.name !== undefined) updateData.name = ingredient.name;
    if (ingredient.costPerUnit !== undefined) updateData.cost_per_unit = ingredient.costPerUnit;
    if (ingredient.unit !== undefined) updateData.unit = ingredient.unit;
    if (ingredient.supplier !== undefined) updateData.supplier = ingredient.supplier;
    if (ingredient.category !== undefined) updateData.category = ingredient.category;
    if (ingredient.isAvailable !== undefined) updateData.is_available = ingredient.isAvailable;
    
    const { data, error } = await supabase
      .from('ingredients')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) handleError(error, 'update ingredient');
    
    return {
      id: data.id,
      name: data.name,
      costPerUnit: data.cost_per_unit,
      unit: data.unit,
      supplier: data.supplier,
      category: data.category,
      isAvailable: data.is_available,
      lastUpdated: new Date(data.last_updated)
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('ingredients')
      .delete()
      .eq('id', id);
    
    if (error) handleError(error, 'delete ingredient');
  }
};

// ==================== MENU ITEMS ====================

export const menuItemsService = {
  async getAll(): Promise<MenuItem[]> {
    const { data, error } = await supabase
      .from('menu_items')
      .select(`
        *,
        menu_item_ingredients (
          id,
          ingredient_id,
          quantity,
          unit,
          cost,
          ingredients (
            name,
            cost_per_unit,
            unit
          )
        )
      `)
      .order('category', { ascending: true });
    
    if (error) handleError(error, 'fetch menu items');
    
    return (data || []).map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      ingredients: item.menu_item_ingredients.map((mii: any) => ({
        ingredientId: mii.ingredient_id,
        quantity: mii.quantity,
        unit: mii.unit,
        cost: mii.cost
      })),
      allergens: item.allergens || [],
      isAvailable: item.is_available,
      prepTime: item.prep_time,
      totalIngredientCost: item.total_ingredient_cost,
      profitMargin: item.profit_margin
    }));
  },

  async create(menuItem: Omit<MenuItem, 'id' | 'totalIngredientCost' | 'profitMargin'>): Promise<MenuItem> {
    // Start a transaction
    const { data: newMenuItem, error: menuItemError } = await supabase
      .from('menu_items')
      .insert({
        name: menuItem.name,
        description: menuItem.description,
        price: menuItem.price,
        category: menuItem.category,
        allergens: menuItem.allergens,
        is_available: menuItem.isAvailable,
        prep_time: menuItem.prepTime
      })
      .select()
      .single();
    
    if (menuItemError) handleError(menuItemError, 'create menu item');
    
    // Insert ingredients
    if (menuItem.ingredients.length > 0) {
      const ingredientInserts = menuItem.ingredients.map(ing => ({
        menu_item_id: newMenuItem.id,
        ingredient_id: ing.ingredientId,
        quantity: ing.quantity,
        unit: ing.unit
      }));
      
      const { error: ingredientsError } = await supabase
        .from('menu_item_ingredients')
        .insert(ingredientInserts);
      
      if (ingredientsError) handleError(ingredientsError, 'create menu item ingredients');
    }
    
    // Fetch the complete menu item with calculated costs
    const { data: completeMenuItem, error: fetchError } = await supabase
      .from('menu_items')
      .select(`
        *,
        menu_item_ingredients (
          id,
          ingredient_id,
          quantity,
          unit,
          cost
        )
      `)
      .eq('id', newMenuItem.id)
      .single();
    
    if (fetchError) handleError(fetchError, 'fetch created menu item');
    
    return {
      id: completeMenuItem.id,
      name: completeMenuItem.name,
      description: completeMenuItem.description,
      price: completeMenuItem.price,
      category: completeMenuItem.category,
      ingredients: completeMenuItem.menu_item_ingredients.map((mii: any) => ({
        ingredientId: mii.ingredient_id,
        quantity: mii.quantity,
        unit: mii.unit,
        cost: mii.cost
      })),
      allergens: completeMenuItem.allergens || [],
      isAvailable: completeMenuItem.is_available,
      prepTime: completeMenuItem.prep_time,
      totalIngredientCost: completeMenuItem.total_ingredient_cost,
      profitMargin: completeMenuItem.profit_margin
    };
  },

  async update(id: string, menuItem: Partial<MenuItem>): Promise<MenuItem> {
    const updateData: any = {};
    if (menuItem.name !== undefined) updateData.name = menuItem.name;
    if (menuItem.description !== undefined) updateData.description = menuItem.description;
    if (menuItem.price !== undefined) updateData.price = menuItem.price;
    if (menuItem.category !== undefined) updateData.category = menuItem.category;
    if (menuItem.allergens !== undefined) updateData.allergens = menuItem.allergens;
    if (menuItem.isAvailable !== undefined) updateData.is_available = menuItem.isAvailable;
    if (menuItem.prepTime !== undefined) updateData.prep_time = menuItem.prepTime;
    
    const { error: updateError } = await supabase
      .from('menu_items')
      .update(updateData)
      .eq('id', id);
    
    if (updateError) handleError(updateError, 'update menu item');
    
    // Update ingredients if provided
    if (menuItem.ingredients !== undefined) {
      // Delete existing ingredients
      const { error: deleteError } = await supabase
        .from('menu_item_ingredients')
        .delete()
        .eq('menu_item_id', id);
      
      if (deleteError) handleError(deleteError, 'delete old menu item ingredients');
      
      // Insert new ingredients
      if (menuItem.ingredients.length > 0) {
        const ingredientInserts = menuItem.ingredients.map(ing => ({
          menu_item_id: id,
          ingredient_id: ing.ingredientId,
          quantity: ing.quantity,
          unit: ing.unit
        }));
        
        const { error: insertError } = await supabase
          .from('menu_item_ingredients')
          .insert(ingredientInserts);
        
        if (insertError) handleError(insertError, 'insert new menu item ingredients');
      }
    }
    
    // Fetch and return updated menu item
    const { data, error: fetchError } = await supabase
      .from('menu_items')
      .select(`
        *,
        menu_item_ingredients (
          id,
          ingredient_id,
          quantity,
          unit,
          cost
        )
      `)
      .eq('id', id)
      .single();
    
    if (fetchError) handleError(fetchError, 'fetch updated menu item');
    
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      price: data.price,
      category: data.category,
      ingredients: data.menu_item_ingredients.map((mii: any) => ({
        ingredientId: mii.ingredient_id,
        quantity: mii.quantity,
        unit: mii.unit,
        cost: mii.cost
      })),
      allergens: data.allergens || [],
      isAvailable: data.is_available,
      prepTime: data.prep_time,
      totalIngredientCost: data.total_ingredient_cost,
      profitMargin: data.profit_margin
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', id);
    
    if (error) handleError(error, 'delete menu item');
  }
};


// ==================== INVENTORY ITEMS ====================

export const inventoryService = {
  async getAll(): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .order('category', { ascending: true });
    
    if (error) handleError(error, 'fetch inventory items');
    
    return (data || []).map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      currentStock: item.current_stock,
      unit: item.unit,
      minThreshold: item.min_threshold,
      costPerUnit: item.cost_per_unit,
      supplier: item.supplier || '',
      lastRestocked: new Date(item.last_restocked)
    }));
  },

  async create(inventoryItem: Omit<InventoryItem, 'id'>): Promise<InventoryItem> {
    const { data, error } = await supabase
      .from('inventory_items')
      .insert({
        name: inventoryItem.name,
        category: inventoryItem.category,
        current_stock: inventoryItem.currentStock,
        unit: inventoryItem.unit,
        min_threshold: inventoryItem.minThreshold,
        cost_per_unit: inventoryItem.costPerUnit,
        supplier: inventoryItem.supplier,
        last_restocked: inventoryItem.lastRestocked.toISOString().split('T')[0]
      })
      .select()
      .single();
    
    if (error) handleError(error, 'create inventory item');
    
    return {
      id: data.id,
      name: data.name,
      category: data.category,
      currentStock: data.current_stock,
      unit: data.unit,
      minThreshold: data.min_threshold,
      costPerUnit: data.cost_per_unit,
      supplier: data.supplier || '',
      lastRestocked: new Date(data.last_restocked)
    };
  },

  async update(id: string, inventoryItem: Partial<InventoryItem>): Promise<InventoryItem> {
    const updateData: any = {};
    if (inventoryItem.name !== undefined) updateData.name = inventoryItem.name;
    if (inventoryItem.category !== undefined) updateData.category = inventoryItem.category;
    if (inventoryItem.currentStock !== undefined) updateData.current_stock = inventoryItem.currentStock;
    if (inventoryItem.unit !== undefined) updateData.unit = inventoryItem.unit;
    if (inventoryItem.minThreshold !== undefined) updateData.min_threshold = inventoryItem.minThreshold;
    if (inventoryItem.costPerUnit !== undefined) updateData.cost_per_unit = inventoryItem.costPerUnit;
    if (inventoryItem.supplier !== undefined) updateData.supplier = inventoryItem.supplier;
    if (inventoryItem.lastRestocked !== undefined) updateData.last_restocked = inventoryItem.lastRestocked.toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('inventory_items')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) handleError(error, 'update inventory item');
    
    return {
      id: data.id,
      name: data.name,
      category: data.category,
      currentStock: data.current_stock,
      unit: data.unit,
      minThreshold: data.min_threshold,
      costPerUnit: data.cost_per_unit,
      supplier: data.supplier || '',
      lastRestocked: new Date(data.last_restocked)
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', id);
    
    if (error) handleError(error, 'delete inventory item');
  },

  // Create inventory items from existing ingredients
  async createFromIngredients(ingredientIds: string[]): Promise<InventoryItem[]> {
    // Get ingredients data
    const { data: ingredients, error: ingredientsError } = await supabase
      .from('ingredients')
      .select('*')
      .in('id', ingredientIds);
    
    if (ingredientsError) handleError(ingredientsError, 'fetch ingredients for inventory');
    
    // Create inventory items from ingredients
    const inventoryData = (ingredients || []).map(ing => ({
      name: ing.name,
      category: ing.category,
      current_stock: 0, // Start with 0 stock
      unit: ing.unit,
      min_threshold: 5, // Default threshold
      cost_per_unit: ing.cost_per_unit,
      supplier: ing.supplier,
      last_restocked: new Date().toISOString().split('T')[0]
    }));
    
    const { data, error } = await supabase
      .from('inventory_items')
      .insert(inventoryData)
      .select();
    
    if (error) handleError(error, 'create inventory items from ingredients');
    
    return (data || []).map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      currentStock: item.current_stock,
      unit: item.unit,
      minThreshold: item.min_threshold,
      costPerUnit: item.cost_per_unit,
      supplier: item.supplier || '',
      lastRestocked: new Date(item.last_restocked)
    }));
  }
};

// ==================== SUPPLIERS ====================

export const suppliersService = {
  async getAll(): Promise<Supplier[]> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) handleError(error, 'fetch suppliers');
    
    return (data || []).map(supplier => ({
      id: supplier.id,
      name: supplier.name,
      contactPerson: supplier.contact_person,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      deliveryDays: supplier.delivery_days || [],
      orderSubmissionDays: supplier.order_submission_days || [],
      minimumOrderAmount: supplier.minimum_order_amount,
      leadTime: supplier.lead_time,
      autoOrderEnabled: supplier.auto_order_enabled,
      paymentTerms: supplier.payment_terms,
      notes: supplier.notes || '',
      isActive: supplier.is_active,
      createdAt: new Date(supplier.created_at),
      updatedAt: new Date(supplier.updated_at)
    }));
  },

  async create(supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Promise<Supplier> {
    const { data, error } = await supabase
      .from('suppliers')
      .insert({
        name: supplier.name,
        contact_person: supplier.contactPerson,
        email: supplier.email,
        phone: supplier.phone,
        address: supplier.address,
        delivery_days: supplier.deliveryDays,
        order_submission_days: supplier.orderSubmissionDays,
        minimum_order_amount: supplier.minimumOrderAmount,
        lead_time: supplier.leadTime,
        auto_order_enabled: supplier.autoOrderEnabled,
        payment_terms: supplier.paymentTerms,
        notes: supplier.notes,
        is_active: supplier.isActive
      })
      .select()
      .single();
    
    if (error) handleError(error, 'create supplier');
    
    return {
      id: data.id,
      name: data.name,
      contactPerson: data.contact_person,
      email: data.email,
      phone: data.phone,
      address: data.address,
      deliveryDays: data.delivery_days || [],
      orderSubmissionDays: data.order_submission_days || [],
      minimumOrderAmount: data.minimum_order_amount,
      leadTime: data.lead_time,
      autoOrderEnabled: data.auto_order_enabled,
      paymentTerms: data.payment_terms,
      notes: data.notes || '',
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  },

  async update(id: string, supplier: Partial<Supplier>): Promise<Supplier> {
    const updateData: any = {};
    if (supplier.name !== undefined) updateData.name = supplier.name;
    if (supplier.contactPerson !== undefined) updateData.contact_person = supplier.contactPerson;
    if (supplier.email !== undefined) updateData.email = supplier.email;
    if (supplier.phone !== undefined) updateData.phone = supplier.phone;
    if (supplier.address !== undefined) updateData.address = supplier.address;
    if (supplier.deliveryDays !== undefined) updateData.delivery_days = supplier.deliveryDays;
    if (supplier.orderSubmissionDays !== undefined) updateData.order_submission_days = supplier.orderSubmissionDays;
    if (supplier.minimumOrderAmount !== undefined) updateData.minimum_order_amount = supplier.minimumOrderAmount;
    if (supplier.leadTime !== undefined) updateData.lead_time = supplier.leadTime;
    if (supplier.autoOrderEnabled !== undefined) updateData.auto_order_enabled = supplier.autoOrderEnabled;
    if (supplier.paymentTerms !== undefined) updateData.payment_terms = supplier.paymentTerms;
    if (supplier.notes !== undefined) updateData.notes = supplier.notes;
    if (supplier.isActive !== undefined) updateData.is_active = supplier.isActive;
    
    const { data, error } = await supabase
      .from('suppliers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) handleError(error, 'update supplier');
    
    return {
      id: data.id,
      name: data.name,
      contactPerson: data.contact_person,
      email: data.email,
      phone: data.phone,
      address: data.address,
      deliveryDays: data.delivery_days || [],
      orderSubmissionDays: data.order_submission_days || [],
      minimumOrderAmount: data.minimum_order_amount,
      leadTime: data.lead_time,
      autoOrderEnabled: data.auto_order_enabled,
      paymentTerms: data.payment_terms,
      notes: data.notes || '',
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id);
    
    if (error) handleError(error, 'delete supplier');
  },

  // Get low stock items for suppliers with auto-order enabled
  async getLowStockItemsForAutoOrder(): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*');
    
    if (error) handleError(error, 'fetch inventory items for auto order');
    
    // Filter client-side for now (could be optimized with a database function)
    const lowStockItems = (data || []).filter(item => item.current_stock <= item.min_threshold);
    
    return lowStockItems.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      currentStock: item.current_stock,
      unit: item.unit,
      minThreshold: item.min_threshold,
      costPerUnit: item.cost_per_unit,
      supplier: item.supplier || '',
      lastRestocked: new Date(item.last_restocked)
    }));
  }
};

// ==================== TRANSACTIONS ====================

export const transactionsService = {
  async getAll(): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) handleError(error, 'fetch transactions');
    
    return (data || []).map(txn => ({
      id: txn.id,
      date: new Date(txn.date),
      type: txn.type as 'revenue' | 'expense',
      category: txn.category,
      amount: txn.amount,
      description: txn.description,
      location: txn.location,
      paymentMethod: txn.payment_method
    }));
  },

  async create(transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        date: transaction.date.toISOString().split('T')[0],
        type: transaction.type,
        category: transaction.category,
        amount: transaction.amount,
        description: transaction.description,
        location: transaction.location,
        payment_method: transaction.paymentMethod
      })
      .select()
      .single();
    
    if (error) handleError(error, 'create transaction');
    
    return {
      id: data.id,
      date: new Date(data.date),
      type: data.type,
      category: data.category,
      amount: data.amount,
      description: data.description,
      location: data.location,
      paymentMethod: data.payment_method
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);
    
    if (error) handleError(error, 'delete transaction');
  }
};

// ==================== REAL-TIME SUBSCRIPTIONS ====================

export const subscriptions = {
  ingredients: (callback: (payload: any) => void) => {
    return supabase
      .channel('ingredients_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'ingredients' }, 
        callback
      )
      .subscribe();
  },

  menuItems: (callback: (payload: any) => void) => {
    return supabase
      .channel('menu_items_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'menu_items' }, 
        callback
      )
      .subscribe();
  },

  transactions: (callback: (payload: any) => void) => {
    return supabase
      .channel('transactions_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'transactions' }, 
        callback
      )
      .subscribe();
  },

  inventory: (callback: (payload: any) => void) => {
    return supabase
      .channel('inventory_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'inventory_items' }, 
        callback
      )
      .subscribe();
  },

  suppliers: (callback: (payload: any) => void) => {
    return supabase
      .channel('suppliers_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'suppliers' }, 
        callback
      )
      .subscribe();
  },

  expenses: (callback: (payload: any) => void) => {
    return supabase
      .channel('expenses_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'expenses' }, 
        callback
      )
      .subscribe();
  },

  financialGoals: (callback: (payload: any) => void) => {
    return supabase
      .channel('financial_goals_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'financial_goals' }, 
        callback
      )
      .subscribe();
  },

  employees: (callback: (payload: any) => void) => {
    return supabase
      .channel('employees_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'employees' }, 
        callback
      )
      .subscribe();
  },

  shifts: (callback: (payload: any) => void) => {
    return supabase
      .channel('shifts_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'shifts' }, 
        callback
      )
      .subscribe();
  }
};

// Financial Management Services
export const expensesService = {
  async getAll(): Promise<Expense[]> {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) handleError(error, 'fetch expenses');
    
    return (data || []).map(expense => ({
      id: expense.id,
      categoryId: expense.category_id || null,
      name: expense.name,
      amount: expense.amount,
      type: expense.type,
      frequency: expense.frequency,
      startDate: new Date(expense.start_date),
      endDate: expense.end_date ? new Date(expense.end_date) : undefined,
      description: expense.description || '',
      isActive: expense.is_active,
      createdAt: new Date(expense.created_at),
      updatedAt: new Date(expense.updated_at)
    }));
  },

  async create(expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>): Promise<Expense> {
    const { data, error } = await supabase
      .from('expenses')
      .insert({
        category_id: expense.categoryId,
        name: expense.name,
        amount: expense.amount,
        type: expense.type,
        frequency: expense.frequency,
        start_date: expense.startDate.toISOString().split('T')[0],
        end_date: expense.endDate?.toISOString().split('T')[0],
        description: expense.description,
        is_active: expense.isActive
      })
      .select()
      .single();
    
    if (error) handleError(error, 'create expense');
    
    return {
      id: data.id,
      categoryId: data.category_id || null,
      name: data.name,
      amount: data.amount,
      type: data.type,
      frequency: data.frequency,
      startDate: new Date(data.start_date),
      endDate: data.end_date ? new Date(data.end_date) : undefined,
      description: data.description || '',
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  },

  async update(id: string, expense: Partial<Expense>): Promise<Expense> {
    const updateData: any = {};
    if (expense.categoryId !== undefined) updateData.category_id = expense.categoryId;
    if (expense.name !== undefined) updateData.name = expense.name;
    if (expense.amount !== undefined) updateData.amount = expense.amount;
    if (expense.type !== undefined) updateData.type = expense.type;
    if (expense.frequency !== undefined) updateData.frequency = expense.frequency;
    if (expense.startDate !== undefined) updateData.start_date = expense.startDate.toISOString().split('T')[0];
    if (expense.endDate !== undefined) updateData.end_date = expense.endDate?.toISOString().split('T')[0];
    if (expense.description !== undefined) updateData.description = expense.description;
    if (expense.isActive !== undefined) updateData.is_active = expense.isActive;
    
    const { data, error } = await supabase
      .from('expenses')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) handleError(error, 'update expense');
    
    return {
      id: data.id,
      categoryId: data.category_id || null,
      name: data.name,
      amount: data.amount,
      type: data.type,
      frequency: data.frequency,
      startDate: new Date(data.start_date),
      endDate: data.end_date ? new Date(data.end_date) : undefined,
      description: data.description || '',
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);
    
    if (error) handleError(error, 'delete expense');
  }
};

export const financialGoalsService = {
  async getAll(): Promise<FinancialGoal[]> {
    const { data, error } = await supabase
      .from('financial_goals')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) handleError(error, 'fetch financial goals');
    
    return (data || []).map(goal => ({
      id: goal.id,
      name: goal.name,
      type: goal.type,
      targetAmount: goal.target_amount,
      currentAmount: goal.current_amount,
      targetDate: new Date(goal.target_date),
      isActive: goal.is_active,
      createdAt: new Date(goal.created_at),
      updatedAt: new Date(goal.updated_at)
    }));
  },

  async create(goal: Omit<FinancialGoal, 'id' | 'createdAt' | 'updatedAt'>): Promise<FinancialGoal> {
    const { data, error } = await supabase
      .from('financial_goals')
      .insert({
        name: goal.name,
        type: goal.type,
        target_amount: goal.targetAmount,
        current_amount: goal.currentAmount,
        target_date: goal.targetDate.toISOString().split('T')[0],
        is_active: goal.isActive
      })
      .select()
      .single();
    
    if (error) handleError(error, 'create financial goal');
    
    return {
      id: data.id,
      name: data.name,
      type: data.type,
      targetAmount: data.target_amount,
      currentAmount: data.current_amount,
      targetDate: new Date(data.target_date),
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  },

  async update(id: string, goal: Partial<FinancialGoal>): Promise<FinancialGoal> {
    const updateData: any = {};
    if (goal.name !== undefined) updateData.name = goal.name;
    if (goal.type !== undefined) updateData.type = goal.type;
    if (goal.targetAmount !== undefined) updateData.target_amount = goal.targetAmount;
    if (goal.currentAmount !== undefined) updateData.current_amount = goal.currentAmount;
    if (goal.targetDate !== undefined) updateData.target_date = goal.targetDate.toISOString().split('T')[0];
    if (goal.isActive !== undefined) updateData.is_active = goal.isActive;
    
    const { data, error } = await supabase
      .from('financial_goals')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) handleError(error, 'update financial goal');
    
    return {
      id: data.id,
      name: data.name,
      type: data.type,
      targetAmount: data.target_amount,
      currentAmount: data.current_amount,
      targetDate: new Date(data.target_date),
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('financial_goals')
      .delete()
      .eq('id', id);
    
    if (error) handleError(error, 'delete financial goal');
  }
};

export const financialProjectionsService = {
  async getAll(): Promise<FinancialProjection[]> {
    const { data, error } = await supabase
      .from('financial_projections')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) handleError(error, 'fetch financial projections');
    
    return (data || []).map(projection => ({
      id: projection.id,
      name: projection.name,
      projectionPeriod: projection.projection_period,
      projectedRevenue: projection.projected_revenue,
      projectedExpenses: projection.projected_expenses,
      projectedProfit: projection.projected_profit,
      averageOrderValue: projection.average_order_value,
      ordersPerDay: projection.orders_per_day,
      workingDaysPerMonth: projection.working_days_per_month,
      profitMarginPercentage: projection.profit_margin_percentage,
      breakEvenPoint: projection.break_even_point,
      createdAt: new Date(projection.created_at),
      updatedAt: new Date(projection.updated_at)
    }));
  },

  async create(projection: Omit<FinancialProjection, 'id' | 'createdAt' | 'updatedAt'>): Promise<FinancialProjection> {
    const { data, error } = await supabase
      .from('financial_projections')
      .insert({
        name: projection.name,
        projection_period: projection.projectionPeriod,
        projected_revenue: projection.projectedRevenue,
        projected_expenses: projection.projectedExpenses,
        projected_profit: projection.projectedProfit,
        average_order_value: projection.averageOrderValue,
        orders_per_day: projection.ordersPerDay,
        working_days_per_month: projection.workingDaysPerMonth,
        profit_margin_percentage: projection.profitMarginPercentage,
        break_even_point: projection.breakEvenPoint
      })
      .select()
      .single();
    
    if (error) handleError(error, 'create financial projection');
    
    return {
      id: data.id,
      name: data.name,
      projectionPeriod: data.projection_period,
      projectedRevenue: data.projected_revenue,
      projectedExpenses: data.projected_expenses,
      projectedProfit: data.projected_profit,
      averageOrderValue: data.average_order_value,
      ordersPerDay: data.orders_per_day,
      workingDaysPerMonth: data.working_days_per_month,
      profitMarginPercentage: data.profit_margin_percentage,
      breakEvenPoint: data.break_even_point,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }
};

// Employee Management Services
export const employeesService = {
  async getAll(): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('first_name', { ascending: true });
    
    if (error) handleError(error, 'fetch employees');
    
    return (data || []).map(employee => ({
      id: employee.id,
      firstName: employee.first_name,
      lastName: employee.last_name,
      email: employee.email,
      phone: employee.phone,
      position: employee.position,
      hourlyRate: employee.hourly_rate,
      hireDate: new Date(employee.hire_date),
      isActive: employee.is_active
    }));
  },

  async create(employee: Omit<Employee, 'id'>): Promise<Employee> {
    const { data, error } = await supabase
      .from('employees')
      .insert({
        first_name: employee.firstName,
        last_name: employee.lastName,
        email: employee.email,
        phone: employee.phone,
        position: employee.position,
        hourly_rate: employee.hourlyRate,
        hire_date: employee.hireDate.toISOString().split('T')[0],
        is_active: employee.isActive
      })
      .select()
      .single();
    
    if (error) handleError(error, 'create employee');
    
    return {
      id: data.id,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      phone: data.phone,
      position: data.position,
      hourlyRate: data.hourly_rate,
      hireDate: new Date(data.hire_date),
      isActive: data.is_active
    };
  },

  async update(id: string, employee: Partial<Employee>): Promise<Employee> {
    const updateData: any = {};
    if (employee.firstName !== undefined) updateData.first_name = employee.firstName;
    if (employee.lastName !== undefined) updateData.last_name = employee.lastName;
    if (employee.email !== undefined) updateData.email = employee.email;
    if (employee.phone !== undefined) updateData.phone = employee.phone;
    if (employee.position !== undefined) updateData.position = employee.position;
    if (employee.hourlyRate !== undefined) updateData.hourly_rate = employee.hourlyRate;
    if (employee.hireDate !== undefined) updateData.hire_date = employee.hireDate.toISOString().split('T')[0];
    if (employee.isActive !== undefined) updateData.is_active = employee.isActive;
    
    const { data, error } = await supabase
      .from('employees')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) handleError(error, 'update employee');
    
    return {
      id: data.id,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      phone: data.phone,
      position: data.position,
      hourlyRate: data.hourly_rate,
      hireDate: new Date(data.hire_date),
      isActive: data.is_active
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);
    
    if (error) handleError(error, 'delete employee');
  }
};

export const shiftsService = {
  async getAll(): Promise<Shift[]> {
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) handleError(error, 'fetch shifts');
    
    return (data || []).map(shift => ({
      id: shift.id,
      employeeId: shift.employee_id,
      date: new Date(shift.date),
      startTime: shift.start_time,
      endTime: shift.end_time,
      hoursWorked: shift.hours_worked,
      role: shift.role,
      location: shift.location
    }));
  },

  async create(shift: Omit<Shift, 'id'>): Promise<Shift> {
    const { data, error } = await supabase
      .from('shifts')
      .insert({
        employee_id: shift.employeeId,
        date: shift.date.toISOString().split('T')[0],
        start_time: shift.startTime,
        end_time: shift.endTime,
        hours_worked: shift.hoursWorked,
        role: shift.role,
        location: shift.location || 'Main Location' // Default location since business operates from one place
      })
      .select()
      .single();
    
    if (error) handleError(error, 'create shift');
    
    return {
      id: data.id,
      employeeId: data.employee_id,
      date: new Date(data.date),
      startTime: data.start_time,
      endTime: data.end_time,
      hoursWorked: data.hours_worked,
      role: data.role,
      location: data.location
    };
  },

  async update(id: string, shift: Partial<Shift>): Promise<Shift> {
    const updateData: any = {};
    if (shift.employeeId !== undefined) updateData.employee_id = shift.employeeId;
    if (shift.date !== undefined) updateData.date = shift.date.toISOString().split('T')[0];
    if (shift.startTime !== undefined) updateData.start_time = shift.startTime;
    if (shift.endTime !== undefined) updateData.end_time = shift.endTime;
    if (shift.hoursWorked !== undefined) updateData.hours_worked = shift.hoursWorked;
    if (shift.role !== undefined) updateData.role = shift.role;
    if (shift.location !== undefined) updateData.location = shift.location || 'Main Location';
    
    const { data, error } = await supabase
      .from('shifts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) handleError(error, 'update shift');
    
    return {
      id: data.id,
      employeeId: data.employee_id,
      date: new Date(data.date),
      startTime: data.start_time,
      endTime: data.end_time,
      hoursWorked: data.hours_worked,
      role: data.role,
      location: data.location
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('shifts')
      .delete()
      .eq('id', id);
    
    if (error) handleError(error, 'delete shift');
  }
};