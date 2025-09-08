import { supabase } from '../lib/supabase';
import { Ingredient, MenuItem, MenuItemIngredient, Employee, Shift, Transaction, Location, InventoryItem, Customer } from '../types';

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

// ==================== EMPLOYEES ====================

export const employeesService = {
  async getAll(): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('first_name', { ascending: true });
    
    if (error) handleError(error, 'fetch employees');
    
    return (data || []).map(emp => ({
      id: emp.id,
      firstName: emp.first_name,
      lastName: emp.last_name,
      email: emp.email,
      phone: emp.phone,
      position: emp.position,
      hourlyRate: emp.hourly_rate,
      hireDate: new Date(emp.hire_date),
      isActive: emp.is_active
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
  }
};