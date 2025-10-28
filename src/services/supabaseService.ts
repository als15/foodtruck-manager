import { supabase } from '../lib/supabase';
import {
  Product,
  Ingredient,
  MenuItem,
  MenuItemIngredient,
  Employee,
  Shift,
  Transaction,
  Location,
  InventoryItem,
  InventoryTransaction,
  InventoryValidationResult,
  InventoryAlert,
  StockMovement,
  Customer,
  Supplier,
  Expense,
  ExpenseCategory,
  FinancialGoal,
  FinancialProjection,
  Order,
  OrderItem,
  SupplierOrder,
  SupplierOrderItem,
  ProductMapping
} from '../types';

// Helper function to handle Supabase errors
const handleError = (error: any, operation: string) => {
  console.error(`Error in ${operation}:`, error);
  
  // Handle schema-related errors with helpful messages
  if (error.message && error.message.includes('delivery_methods')) {
    throw new Error(`Database schema needs updating. Please run the database migration to add the delivery_methods column. See DATABASE_MIGRATION_INSTRUCTIONS.md for details.`);
  }
  
  if (error.message && error.message.includes('column') && error.message.includes('does not exist')) {
    throw new Error(`Database schema is outdated. Please check DATABASE_MIGRATION_INSTRUCTIONS.md for required database updates.`);
  }
  
  throw new Error(`Failed to ${operation}: ${error.message}`);
};

// Helper function to get current business ID
const getCurrentBusinessId = (): string => {
  const businessId = localStorage.getItem('currentBusinessId');
  if (!businessId) {
    throw new Error('No business selected. Please select a business to continue.');
  }
  return businessId;
};

// ==================== MENU CATEGORIES ====================

export const menuCategoriesService = {
  async getAll(): Promise<string[]> {
    try {
      const businessId = getCurrentBusinessId();
      const { data, error } = await supabase
        .from('menu_categories')
        .select('name')
        .eq('business_id', businessId)
        .order('name');

      if (error) {
        // If table doesn't exist, return default categories
        if (error.message.includes('relation "menu_categories" does not exist')) {
          return ['salads', 'sandwiches', 'desserts', 'sweet pastries', 'savory pastries', 'fruit shakes', 'hot drinks', 'cold drinks'];
        }
        throw error;
      }

      // If no categories exist, return default categories
      if (!data || data.length === 0) {
        const defaultCategories = ['salads', 'sandwiches', 'desserts', 'sweet pastries', 'savory pastries', 'fruit shakes', 'hot drinks', 'cold drinks'];
        // Create default categories in database
        await Promise.all(defaultCategories.map(name => this.create(name)));
        return defaultCategories;
      }

      return data.map(item => item.name);
    } catch (error) {
      return ['salads', 'sandwiches', 'desserts', 'sweet pastries', 'savory pastries', 'fruit shakes', 'hot drinks', 'cold drinks'];
    }
  },

  async create(name: string): Promise<void> {
    try {
      const businessId = getCurrentBusinessId();
      const { error } = await supabase
        .from('menu_categories')
        .insert([
          {
            business_id: businessId,
            name: name.toLowerCase().trim()
          }
        ]);

      if (error) {
        // If table doesn't exist, silently fail and continue with localStorage fallback
        if (error.message.includes('relation "menu_categories" does not exist')) {
          return;
        }
        handleError(error, 'create category');
      }
    } catch (error) {
      handleError(error, 'create category');
    }
  },

  async update(oldName: string, newName: string): Promise<void> {
    try {
      const businessId = getCurrentBusinessId();
      const { error } = await supabase
        .from('menu_categories')
        .update({ name: newName.toLowerCase().trim() })
        .eq('business_id', businessId)
        .eq('name', oldName);

      if (error) {
        // If table doesn't exist, silently fail
        if (error.message.includes('relation "menu_categories" does not exist')) {
          return;
        }
        handleError(error, 'update category');
      }
    } catch (error) {
      handleError(error, 'update category');
    }
  },

  async delete(name: string): Promise<void> {
    try {
      const businessId = getCurrentBusinessId();
      const { error } = await supabase
        .from('menu_categories')
        .delete()
        .eq('business_id', businessId)
        .eq('name', name);

      if (error) {
        // If table doesn't exist, silently fail
        if (error.message.includes('relation "menu_categories" does not exist')) {
          return;
        }
        handleError(error, 'delete category');
      }
    } catch (error) {
      handleError(error, 'delete category');
    }
  }
};

// ==================== INGREDIENTS ====================

export const ingredientsService = {
  async getAll(): Promise<Ingredient[]> {
    const businessId = getCurrentBusinessId();
    const { data, error } = await supabase
      .from('ingredients')
      .select('*')
      .eq('business_id', businessId)
      .order('category', { ascending: true })
      .order('name', { ascending: true });
    
    if (error) handleError(error, 'fetch ingredients');
    
    return (data || []).map(item => ({
      id: item.id,
      businessId: item.business_id,
      name: item.name,
      costPerUnit: item.cost_per_unit,
      unit: item.unit,
      supplier: item.supplier,
      category: item.category,
      isAvailable: item.is_available,
      lastUpdated: new Date(item.last_updated),
      unitsPerPackage: item.units_per_package,
      packageType: item.package_type,
      minimumOrderQuantity: item.minimum_order_quantity,
      orderByPackage: item.order_by_package
    }));
  },

  async getById(id: string): Promise<Ingredient> {
    const businessId = getCurrentBusinessId();
    const { data, error } = await supabase
      .from('ingredients')
      .select('*')
      .eq('id', id)
      .eq('business_id', businessId)
      .single();
    
    if (error) handleError(error, 'fetch ingredient');
    
    return {
      id: data.id,
      businessId: data.business_id,
      name: data.name,
      costPerUnit: data.cost_per_unit,
      unit: data.unit,
      supplier: data.supplier,
      category: data.category,
      isAvailable: data.is_available,
      lastUpdated: new Date(data.last_updated),
      unitsPerPackage: data.units_per_package,
      packageType: data.package_type,
      minimumOrderQuantity: data.minimum_order_quantity,
      orderByPackage: data.order_by_package
    };
  },

  async create(ingredient: Omit<Ingredient, 'id' | 'lastUpdated' | 'businessId'>): Promise<Ingredient> {
    const businessId = getCurrentBusinessId();
    const { data, error } = await supabase
      .from('ingredients')
      .insert({
        business_id: businessId,
        name: ingredient.name,
        cost_per_unit: ingredient.costPerUnit,
        unit: ingredient.unit,
        supplier: ingredient.supplier,
        category: ingredient.category,
        is_available: ingredient.isAvailable,
        units_per_package: ingredient.unitsPerPackage,
        package_type: ingredient.packageType,
        minimum_order_quantity: ingredient.minimumOrderQuantity,
        order_by_package: ingredient.orderByPackage
      })
      .select()
      .single();
    
    if (error) handleError(error, 'create ingredient');
    
    return {
      id: data.id,
      businessId: data.business_id,
      name: data.name,
      costPerUnit: data.cost_per_unit,
      unit: data.unit,
      supplier: data.supplier,
      category: data.category,
      isAvailable: data.is_available,
      lastUpdated: new Date(data.last_updated),
      unitsPerPackage: data.units_per_package,
      packageType: data.package_type,
      minimumOrderQuantity: data.minimum_order_quantity,
      orderByPackage: data.order_by_package
    };
  },

  async update(id: string, ingredient: Partial<Ingredient>): Promise<Ingredient> {
    const businessId = getCurrentBusinessId();
    const updateData: any = {};
    if (ingredient.name !== undefined) updateData.name = ingredient.name;
    if (ingredient.costPerUnit !== undefined) updateData.cost_per_unit = ingredient.costPerUnit;
    if (ingredient.unit !== undefined) updateData.unit = ingredient.unit;
    if (ingredient.supplier !== undefined) updateData.supplier = ingredient.supplier;
    if (ingredient.category !== undefined) updateData.category = ingredient.category;
    if (ingredient.isAvailable !== undefined) updateData.is_available = ingredient.isAvailable;
    if (ingredient.unitsPerPackage !== undefined) updateData.units_per_package = ingredient.unitsPerPackage;
    if (ingredient.packageType !== undefined) updateData.package_type = ingredient.packageType;
    if (ingredient.minimumOrderQuantity !== undefined) updateData.minimum_order_quantity = ingredient.minimumOrderQuantity;
    if (ingredient.orderByPackage !== undefined) updateData.order_by_package = ingredient.orderByPackage;
    
    const { data, error } = await supabase
      .from('ingredients')
      .update(updateData)
      .eq('id', id)
      .eq('business_id', businessId)
      .select()
      .single();
    
    if (error) handleError(error, 'update ingredient');
    
    return {
      id: data.id,
      businessId: data.business_id,
      name: data.name,
      costPerUnit: data.cost_per_unit,
      unit: data.unit,
      supplier: data.supplier,
      category: data.category,
      isAvailable: data.is_available,
      lastUpdated: new Date(data.last_updated),
      unitsPerPackage: data.units_per_package,
      packageType: data.package_type,
      minimumOrderQuantity: data.minimum_order_quantity,
      orderByPackage: data.order_by_package
    };
  },

  async delete(id: string): Promise<void> {
    const businessId = getCurrentBusinessId();
    const { error } = await supabase
      .from('ingredients')
      .delete()
      .eq('id', id)
      .eq('business_id', businessId);
    
    if (error) handleError(error, 'delete ingredient');
  }
};

// Product service (alias for ingredients service with updated terminology)
export const productsService = ingredientsService;

// ==================== MENU ITEMS ====================

export const menuItemsService = {
  async getAll(): Promise<MenuItem[]> {
    const businessId = getCurrentBusinessId();
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
      .eq('business_id', businessId)
      .order('category', { ascending: true });
    
    if (error) handleError(error, 'fetch menu items');
    
    return (data || []).map(item => ({
      id: item.id,
      businessId: item.business_id,
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

  async getById(id: string): Promise<MenuItem> {
    const businessId = getCurrentBusinessId();
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
      .eq('id', id)
      .eq('business_id', businessId)
      .single();
    
    if (error) handleError(error, 'fetch menu item');
    
    return {
      id: data.id,
      businessId: data.business_id,
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

  async create(menuItem: Omit<MenuItem, 'id' | 'totalIngredientCost' | 'profitMargin' | 'businessId'>): Promise<MenuItem> {
    const businessId = getCurrentBusinessId();
    // Start a transaction
    const { data: newMenuItem, error: menuItemError } = await supabase
      .from('menu_items')
      .insert({
        business_id: businessId,
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
      
      if (ingredientsError) {
        // Provide helpful error message if table doesn't exist
        if (ingredientsError.message.includes('relation "menu_item_ingredients" does not exist')) {
          throw new Error('Database schema needs updating. Please run the database migration to create the menu_item_ingredients table. See DATABASE_MIGRATION_INSTRUCTIONS.md for details.');
        }
        handleError(ingredientsError, 'create menu item ingredients');
      }
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
      businessId: completeMenuItem.business_id,
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
    const businessId = getCurrentBusinessId();
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
      .eq('id', id)
      .eq('business_id', businessId);
    
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
      businessId: data.business_id,
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
    const businessId = getCurrentBusinessId();
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', id)
      .eq('business_id', businessId);
    
    if (error) handleError(error, 'delete menu item');
  }
};

// ==================== MENU ITEM INGREDIENTS ====================

export const menuItemIngredientsService = {
  async getAll(): Promise<MenuItemIngredient[]> {
    const businessId = getCurrentBusinessId();
    const { data, error } = await supabase
      .from('menu_item_ingredients')
      .select(`
        *,
        menu_items!inner (
          business_id
        )
      `)
      .eq('menu_items.business_id', businessId);
    
    if (error) handleError(error, 'fetch menu item ingredients');
    
    return (data || []).map(item => ({
      id: item.id,
      businessId: item.menu_items.business_id,
      menuItemId: item.menu_item_id,
      ingredientId: item.ingredient_id,
      quantity: item.quantity,
      unit: item.unit,
      cost: item.cost
    }));
  }
};

// ==================== INVENTORY ITEMS ====================

export const inventoryService = {
  async getAll(): Promise<InventoryItem[]> {
    const businessId = getCurrentBusinessId();
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('business_id', businessId)
      .order('category', { ascending: true });
    
    if (error) handleError(error, 'fetch inventory items');
    
    return (data || []).map(item => ({
      id: item.id,
      businessId: item.business_id,
      name: item.name,
      category: item.category,
      currentStock: item.current_stock,
      unit: item.unit,
      minThreshold: item.min_threshold,
      costPerUnit: item.cost_per_unit,
      supplier: item.supplier || '',
      lastRestocked: new Date(item.last_restocked),
      disposedQuantity: item.disposed_quantity || 0
    }));
  },

  async getById(id: string): Promise<InventoryItem> {
    const businessId = getCurrentBusinessId();
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('id', id)
      .eq('business_id', businessId)
      .single();
    
    if (error) handleError(error, 'fetch inventory item');
    
    return {
      id: data.id,
      businessId: data.business_id,
      name: data.name,
      category: data.category,
      currentStock: data.current_stock,
      unit: data.unit,
      minThreshold: data.min_threshold,
      costPerUnit: data.cost_per_unit,
      supplier: data.supplier || '',
      lastRestocked: new Date(data.last_restocked),
      disposedQuantity: data.disposed_quantity || 0
    };
  },

  async create(inventoryItem: Omit<InventoryItem, 'id' | 'businessId'>): Promise<InventoryItem> {
    const businessId = getCurrentBusinessId();
    const { data, error } = await supabase
      .from('inventory_items')
      .insert({
        business_id: businessId,
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
      businessId: data.business_id,
      name: data.name,
      category: data.category,
      currentStock: data.current_stock,
      unit: data.unit,
      minThreshold: data.min_threshold,
      costPerUnit: data.cost_per_unit,
      supplier: data.supplier || '',
      lastRestocked: new Date(data.last_restocked),
      disposedQuantity: data.disposed_quantity || 0
    };
  },

  async update(id: string, inventoryItem: Partial<InventoryItem>): Promise<InventoryItem> {
    const businessId = getCurrentBusinessId();
    const updateData: any = {};
    if (inventoryItem.name !== undefined) updateData.name = inventoryItem.name;
    if (inventoryItem.category !== undefined) updateData.category = inventoryItem.category;
    if (inventoryItem.currentStock !== undefined) updateData.current_stock = inventoryItem.currentStock;
    if (inventoryItem.unit !== undefined) updateData.unit = inventoryItem.unit;
    if (inventoryItem.minThreshold !== undefined) updateData.min_threshold = inventoryItem.minThreshold;
    if (inventoryItem.costPerUnit !== undefined) updateData.cost_per_unit = inventoryItem.costPerUnit;
    if (inventoryItem.supplier !== undefined) updateData.supplier = inventoryItem.supplier;
    if (inventoryItem.lastRestocked !== undefined) updateData.last_restocked = inventoryItem.lastRestocked.toISOString().split('T')[0];
    if (inventoryItem.disposedQuantity !== undefined) updateData.disposed_quantity = inventoryItem.disposedQuantity;
    
    const { data, error } = await supabase
      .from('inventory_items')
      .update(updateData)
      .eq('id', id)
      .eq('business_id', businessId)
      .select()
      .single();
    
    if (error) handleError(error, 'update inventory item');
    
    return {
      id: data.id,
      businessId: data.business_id,
      name: data.name,
      category: data.category,
      currentStock: data.current_stock,
      unit: data.unit,
      minThreshold: data.min_threshold,
      costPerUnit: data.cost_per_unit,
      supplier: data.supplier || '',
      lastRestocked: new Date(data.last_restocked),
      disposedQuantity: data.disposed_quantity || 0
    };
  },

  async delete(id: string): Promise<void> {
    const businessId = getCurrentBusinessId();
    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', id)
      .eq('business_id', businessId);
    
    if (error) handleError(error, 'delete inventory item');
  },

  // Create inventory items from existing ingredients
  async createFromIngredients(ingredientIds: string[]): Promise<InventoryItem[]> {
    const businessId = getCurrentBusinessId();
    // Get ingredients data
    const { data: ingredients, error: ingredientsError } = await supabase
      .from('ingredients')
      .select('*')
      .in('id', ingredientIds)
      .eq('business_id', businessId);
    
    if (ingredientsError) handleError(ingredientsError, 'fetch ingredients for inventory');
    
    // Create inventory items from ingredients
    const inventoryData = (ingredients || []).map(ing => ({
      business_id: businessId,
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
      businessId: item.business_id,
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

// ==================== INVENTORY TRANSACTIONS ====================

export const inventoryTransactionService = {
  async getAll(): Promise<InventoryTransaction[]> {
    const businessId = getCurrentBusinessId();
    const { data, error } = await supabase
      .from('inventory_transactions')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });
    
    if (error) handleError(error, 'fetch inventory transactions');
    
    return (data || []).map(item => ({
      id: item.id,
      businessId: item.business_id,
      inventoryItemId: item.inventory_item_id,
      ingredientId: item.ingredient_id,
      type: item.type,
      quantity: item.quantity,
      reason: item.reason,
      referenceId: item.reference_id,
      referenceName: item.reference_name,
      notes: item.notes,
      unitCost: item.unit_cost,
      totalValue: item.total_value,
      balanceAfter: item.balance_after,
      createdAt: new Date(item.created_at),
      createdBy: item.created_by
    }));
  },

  async getByInventoryItem(inventoryItemId: string): Promise<InventoryTransaction[]> {
    const businessId = getCurrentBusinessId();
    const { data, error } = await supabase
      .from('inventory_transactions')
      .select('*')
      .eq('business_id', businessId)
      .eq('inventory_item_id', inventoryItemId)
      .order('created_at', { ascending: false });
    
    if (error) handleError(error, 'fetch inventory transactions for item');
    
    return (data || []).map(item => ({
      id: item.id,
      businessId: item.business_id,
      inventoryItemId: item.inventory_item_id,
      ingredientId: item.ingredient_id,
      type: item.type,
      quantity: item.quantity,
      reason: item.reason,
      referenceId: item.reference_id,
      referenceName: item.reference_name,
      notes: item.notes,
      unitCost: item.unit_cost,
      totalValue: item.total_value,
      balanceAfter: item.balance_after,
      createdAt: new Date(item.created_at),
      createdBy: item.created_by
    }));
  },

  async create(transaction: Omit<InventoryTransaction, 'id' | 'businessId' | 'createdAt'>): Promise<InventoryTransaction> {
    const businessId = getCurrentBusinessId();
    const { data, error } = await supabase
      .from('inventory_transactions')
      .insert({
        business_id: businessId,
        inventory_item_id: transaction.inventoryItemId,
        ingredient_id: transaction.ingredientId,
        type: transaction.type,
        quantity: transaction.quantity,
        reason: transaction.reason,
        reference_id: transaction.referenceId,
        reference_name: transaction.referenceName,
        notes: transaction.notes,
        unit_cost: transaction.unitCost,
        total_value: transaction.totalValue,
        balance_after: transaction.balanceAfter,
        created_by: transaction.createdBy
      })
      .select()
      .single();
    
    if (error) handleError(error, 'create inventory transaction');
    
    return {
      id: data.id,
      businessId: data.business_id,
      inventoryItemId: data.inventory_item_id,
      ingredientId: data.ingredient_id,
      type: data.type,
      quantity: data.quantity,
      reason: data.reason,
      referenceId: data.reference_id,
      referenceName: data.reference_name,
      notes: data.notes,
      unitCost: data.unit_cost,
      totalValue: data.total_value,
      balanceAfter: data.balance_after,
      createdAt: new Date(data.created_at),
      createdBy: data.created_by
    };
  }
};

// ==================== INVENTORY MANAGEMENT ====================

export const inventoryManagementService = {
  // Process stock movement and create transaction record
  async updateStock(
    inventoryItemId: string,
    quantity: number,
    type: 'in' | 'out' | 'adjustment',
    reason: InventoryTransaction['reason'],
    referenceId?: string,
    referenceName?: string,
    notes?: string,
    unitCost?: number
  ): Promise<InventoryItem> {
    const businessId = getCurrentBusinessId();
    
    try {
      // Start a transaction to ensure data consistency
      const { data: currentItem, error: fetchError } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('id', inventoryItemId)
        .eq('business_id', businessId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Calculate new balance
      const currentStock = currentItem.current_stock;
      let newBalance = currentStock;
      
      if (type === 'in') {
        newBalance = currentStock + Math.abs(quantity);
      } else if (type === 'out') {
        newBalance = currentStock - Math.abs(quantity);
        if (newBalance < 0) {
          throw new Error(`Insufficient stock. Current: ${currentStock}, Requested: ${Math.abs(quantity)}`);
        }
      } else if (type === 'adjustment') {
        newBalance = quantity; // For adjustments, quantity is the new total
      }
      
      // Update inventory item
      const { data: updatedItem, error: updateError } = await supabase
        .from('inventory_items')
        .update({
          current_stock: newBalance,
          last_restocked: type === 'in' ? new Date().toISOString() : currentItem.last_restocked
        })
        .eq('id', inventoryItemId)
        .eq('business_id', businessId)
        .select()
        .single();
      
      if (updateError) throw updateError;
      
      // Create transaction record (optional - skip if table doesn't exist)
      // NOTE: inventory_transactions table is not yet implemented
      // Uncomment when table is created in database
      // try {
      //   const transactionQuantity = type === 'adjustment' ? (newBalance - currentStock) :
      //                               type === 'out' ? -Math.abs(quantity) : Math.abs(quantity);
      //
      //   await inventoryTransactionService.create({
      //     inventoryItemId,
      //     type,
      //     quantity: transactionQuantity,
      //     reason,
      //     referenceId,
      //     referenceName,
      //     notes,
      //     unitCost: unitCost || currentItem.cost_per_unit,
      //     totalValue: (unitCost || currentItem.cost_per_unit) * Math.abs(transactionQuantity),
      //     balanceAfter: newBalance
      //   });
      // } catch (transactionError) {
      //   console.warn('Inventory transaction logging failed (table may not exist):', transactionError);
      //   // Continue execution - transaction logging is optional
      // }
      
      return {
        id: updatedItem.id,
        businessId: updatedItem.business_id,
        name: updatedItem.name,
        category: updatedItem.category,
        currentStock: updatedItem.current_stock,
        unit: updatedItem.unit,
        minThreshold: updatedItem.min_threshold,
        costPerUnit: updatedItem.cost_per_unit,
        supplier: updatedItem.supplier || '',
        lastRestocked: new Date(updatedItem.last_restocked),
        reservedQuantity: updatedItem.reserved_quantity || 0,
        lastMovementDate: new Date()
      };
      
    } catch (error) {
      handleError(error, 'update inventory stock');
      throw error;
    }
  },

  // Validate if there's enough inventory for an order
  async validateOrderInventory(orderItems: { menuItemId: string; quantity: number }[]): Promise<InventoryValidationResult> {
    const businessId = getCurrentBusinessId();
    
    try {
      // Get all menu items with their ingredients
      const menuItemIds = orderItems.map(item => item.menuItemId);
      const { data: menuItems, error: menuError } = await supabase
        .from('menu_items')
        .select(`
          id,
          name,
          menu_item_ingredients (
            ingredient_id,
            quantity,
            unit,
            ingredients!inner (
              name,
              unit
            )
          )
        `)
        .in('id', menuItemIds)
        .eq('business_id', businessId);
      
      if (menuError) throw menuError;
      
      // Calculate total required ingredients
      const requiredIngredients: Record<string, { quantity: number; name: string; unit: string }> = {};
      
      for (const orderItem of orderItems) {
        const menuItem = menuItems?.find(m => m.id === orderItem.menuItemId);
        if (!menuItem || !menuItem.menu_item_ingredients) continue;
        
        for (const ingredient of menuItem.menu_item_ingredients) {
          const key = ingredient.ingredient_id;
          if (!requiredIngredients[key]) {
            requiredIngredients[key] = {
              quantity: 0,
              name: (ingredient.ingredients as any)?.name || 'Unknown',
              unit: (ingredient.ingredients as any)?.unit || ingredient.unit || ''
            };
          }
          requiredIngredients[key].quantity += ingredient.quantity * orderItem.quantity;
        }
      }
      
      // Get current inventory for required ingredients
      const ingredientIds = Object.keys(requiredIngredients);
      
      // Get all inventory items and match by name (fallback for missing ingredient_id column)
      const { data: inventoryItems, error: inventoryError } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('business_id', businessId);
      
      // Also get ingredient names for matching
      const { data: ingredients, error: ingredientsError } = await supabase
        .from('ingredients')
        .select('id, name')
        .in('id', ingredientIds)
        .eq('business_id', businessId);
      
      if (inventoryError) throw inventoryError;
      if (ingredientsError) throw ingredientsError;
      
      const insufficientItems: InventoryValidationResult['insufficientItems'] = [];
      const warnings: InventoryValidationResult['warnings'] = [];
      
      for (const ingredientId of ingredientIds) {
        const required = requiredIngredients[ingredientId];
        const ingredient = ingredients?.find(ing => ing.id === ingredientId);
        
        // Try to find inventory item by name matching
        let inventoryItem = inventoryItems?.find(item => 
          (ingredient && item.name.toLowerCase().trim() === ingredient.name.toLowerCase().trim())
        );
        
        if (!inventoryItem) {
          insufficientItems.push({
            ingredientId,
            ingredientName: required.name,
            required: required.quantity,
            available: 0,
            shortfall: required.quantity,
            unit: required.unit
          });
          continue;
        }
        
        const available = inventoryItem.current_stock - (inventoryItem.reserved_quantity || 0);
        
        if (available < required.quantity) {
          insufficientItems.push({
            ingredientId,
            ingredientName: inventoryItem.name,
            required: required.quantity,
            available,
            shortfall: required.quantity - available,
            unit: inventoryItem.unit
          });
        } else if (available - required.quantity <= inventoryItem.min_threshold) {
          warnings.push({
            ingredientId,
            ingredientName: inventoryItem.name,
            currentStock: inventoryItem.current_stock,
            minThreshold: inventoryItem.min_threshold,
            unit: inventoryItem.unit
          });
        }
      }
      
      return {
        isValid: insufficientItems.length === 0,
        insufficientItems,
        warnings
      };
      
    } catch (error) {
      handleError(error, 'validate order inventory');
      return {
        isValid: false,
        insufficientItems: [],
        warnings: []
      };
    }
  },

  // Process supplier order delivery
  async processSupplierDelivery(supplierOrderId: string): Promise<void> {
    const businessId = getCurrentBusinessId();
    
    try {
      // Get supplier order with items
      const { data: supplierOrder, error: orderError } = await supabase
        .from('supplier_orders')
        .select(`
          *,
          items:supplier_order_items(*)
        `)
        .eq('id', supplierOrderId)
        .eq('business_id', businessId)
        .single();
      
      if (orderError) throw orderError;
      if (supplierOrder.status === 'delivered') {
        throw new Error('Supplier order is already marked as delivered');
      }
      
      // Process each item in the order
      for (const item of supplierOrder.items || []) {
        // Find or create inventory item for this ingredient
        // First try to find by ingredient_id, then fallback to name matching
        let { data: inventoryItems, error: findError } = await supabase
          .from('inventory_items')
          .select('*')
          .eq('business_id', businessId);
        
        if (findError) throw findError;
        
        // Get ingredient info for name matching
        const { data: ingredient, error: ingredientError } = await supabase
          .from('ingredients')
          .select('*')
          .eq('id', item.ingredient_id)
          .eq('business_id', businessId)
          .single();
        
        if (ingredientError) throw ingredientError;

        // Find inventory item by name matching
        let inventoryItem = inventoryItems?.find(invItem =>
          invItem.name.toLowerCase().trim() === ingredient.name.toLowerCase().trim()
        );

        // If inventory item doesn't exist, create it
        if (!inventoryItem) {
          const { data: ingredient, error: ingredientError } = await supabase
            .from('ingredients')
            .select('*')
            .eq('id', item.ingredient_id)
            .eq('business_id', businessId)
            .single();

          if (ingredientError) throw ingredientError;

          const { data: newInventoryItem, error: createError } = await supabase
            .from('inventory_items')
            .insert({
              business_id: businessId,
              name: ingredient.name,
              category: ingredient.category,
              current_stock: 0,
              unit: ingredient.unit,
              min_threshold: 5,
              cost_per_unit: ingredient.cost_per_unit,
              supplier: ingredient.supplier,
              last_restocked: new Date().toISOString()
            })
            .select()
            .single();

          if (createError) throw createError;
          inventoryItem = newInventoryItem;
        }

        // Calculate actual quantity to add to inventory
        // If ordering by package, multiply by units per package
        const actualQuantity = ingredient.order_by_package && ingredient.units_per_package && ingredient.units_per_package > 1
          ? item.quantity * ingredient.units_per_package
          : item.quantity;

        // Calculate cost per unit (not per package)
        const costPerUnit = ingredient.order_by_package && ingredient.units_per_package && ingredient.units_per_package > 1
          ? item.unit_price / ingredient.units_per_package
          : item.unit_price;

        // Update inventory stock
        await this.updateStock(
          inventoryItem.id,
          actualQuantity,
          'in',
          'supplier_delivery',
          supplierOrderId,
          `Supplier Order #${supplierOrder.order_number}`,
          `Delivery from ${supplierOrder.supplier?.name || 'supplier'}`,
          costPerUnit
        );
      }
      
      // Mark supplier order as delivered
      await supabase
        .from('supplier_orders')
        .update({
          status: 'delivered',
          actual_delivery_date: new Date().toISOString()
        })
        .eq('id', supplierOrderId)
        .eq('business_id', businessId);
      
    } catch (error) {
      handleError(error, 'process supplier delivery');
      throw error;
    }
  },

  // Process order sale (deduct from inventory)
  async processOrderSale(orderId: string): Promise<void> {
    const businessId = getCurrentBusinessId();
    
    try {
      // Get order with items and their menu items
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(
            *,
            menu_item:menu_items(
              id,
              name,
              menu_item_ingredients (
                ingredient_id,
                quantity,
                unit
              )
            )
          )
        `)
        .eq('id', orderId)
        .eq('business_id', businessId)
        .single();
      
      if (orderError) throw orderError;
      
      // Validate inventory availability first
      const orderItems = order.items?.map((item: any) => ({
        menuItemId: item.menu_item_id,
        quantity: item.quantity
      })) || [];
      
      const validation = await this.validateOrderInventory(orderItems);
      if (!validation.isValid) {
        throw new Error(`Insufficient inventory: ${validation.insufficientItems.map(item => 
          `${item.ingredientName} (need ${item.required} ${item.unit}, have ${item.available} ${item.unit})`
        ).join(', ')}`);
      }
      
      // Process each order item
      for (const orderItem of order.items || []) {
        const menuItem = orderItem.menu_item;
        if (!menuItem || !menuItem.menu_item_ingredients) continue;
        
        // Deduct ingredients for this menu item
        for (const ingredient of menuItem.menu_item_ingredients) {
          // Get all inventory items and match by name (fallback for missing ingredient_id column)
          let { data: inventoryItems, error: findError } = await supabase
            .from('inventory_items')
            .select('*')
            .eq('business_id', businessId);
          
          if (findError) {
            console.warn(`Failed to fetch inventory items for ingredient ${ingredient.ingredient_id}:`, findError);
            continue;
          }
          
          // Get ingredient info for name matching
          const { data: ingredientInfo, error: ingredientError } = await supabase
            .from('ingredients')
            .select('*')
            .eq('id', ingredient.ingredient_id)
            .eq('business_id', businessId)
            .single();
          
          if (ingredientError) {
            console.warn(`Failed to fetch ingredient info for ${ingredient.ingredient_id}:`, ingredientError);
            continue;
          }
          
          // Find inventory item by name matching
          let inventoryItem = inventoryItems?.find(item => 
            (ingredientInfo && item.name.toLowerCase().trim() === ingredientInfo.name.toLowerCase().trim())
          );
          
          if (!inventoryItem) {
            console.warn(`Inventory item not found for ingredient ${ingredient.ingredient_id} (${ingredientInfo?.name || 'unknown'})`);
            continue;
          }
          
          const totalQuantityNeeded = ingredient.quantity * orderItem.quantity;
          
          await this.updateStock(
            inventoryItem.id,
            totalQuantityNeeded,
            'out',
            'order_sale',
            orderId,
            `Order #${order.order_number || orderId}`,
            `Sale: ${orderItem.quantity}x ${menuItem.name}`
          );
        }
      }
      
    } catch (error) {
      handleError(error, 'process order sale');
      throw error;
    }
  },

  // Get low stock alerts
  async getLowStockAlerts(): Promise<InventoryAlert[]> {
    const businessId = getCurrentBusinessId();
    
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('business_id', businessId)
        .or('current_stock.lte.min_threshold,current_stock.eq.0');
      
      if (error) throw error;
      
      return (data || []).map(item => ({
        id: `alert-${item.id}`,
        businessId: item.business_id,
        inventoryItemId: item.id,
        ingredientId: item.ingredient_id,
        ingredientName: item.name,
        currentStock: item.current_stock,
        minThreshold: item.min_threshold,
        unit: item.unit,
        alertType: item.current_stock === 0 ? 'out_of_stock' : 'low_stock',
        severity: item.current_stock === 0 ? 'critical' : 'warning',
        isResolved: false,
        createdAt: new Date()
      }));
      
    } catch (error) {
      handleError(error, 'get low stock alerts');
      return [];
    }
  }
};

// ==================== SUPPLIERS ====================

export const suppliersService = {
  async getAll(): Promise<Supplier[]> {
    const businessId = getCurrentBusinessId();
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('business_id', businessId)
      .order('name', { ascending: true });
    
    if (error) handleError(error, 'fetch suppliers');
    
    return (data || []).map(supplier => ({
      id: supplier.id,
      businessId: supplier.business_id,
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
      deliveryMethods: supplier.delivery_methods || [],
      notes: supplier.notes || '',
      isActive: supplier.is_active,
      createdAt: new Date(supplier.created_at),
      updatedAt: new Date(supplier.updated_at)
    }));
  },

  async getById(id: string): Promise<Supplier> {
    const businessId = getCurrentBusinessId();
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .eq('business_id', businessId)
      .single();
    
    if (error) handleError(error, 'fetch supplier');
    
    return {
      id: data.id,
      businessId: data.business_id,
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
      deliveryMethods: data.delivery_methods || [],
      notes: data.notes || '',
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  },

  async create(supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt' | 'businessId'>): Promise<Supplier> {
    const businessId = getCurrentBusinessId();
    const { data, error } = await supabase
      .from('suppliers')
      .insert({
        business_id: businessId,
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
        delivery_methods: supplier.deliveryMethods,
        notes: supplier.notes,
        is_active: supplier.isActive
      })
      .select()
      .single();
    
    if (error) handleError(error, 'create supplier');
    
    return {
      id: data.id,
      businessId: data.business_id,
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
      deliveryMethods: data.delivery_methods || [],
      notes: data.notes || '',
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  },

  async update(id: string, supplier: Partial<Supplier>): Promise<Supplier> {
    const businessId = getCurrentBusinessId();
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
    if (supplier.deliveryMethods !== undefined) updateData.delivery_methods = supplier.deliveryMethods;
    if (supplier.notes !== undefined) updateData.notes = supplier.notes;
    if (supplier.isActive !== undefined) updateData.is_active = supplier.isActive;
    
    const { data, error } = await supabase
      .from('suppliers')
      .update(updateData)
      .eq('id', id)
      .eq('business_id', businessId)
      .select()
      .single();
    
    if (error) handleError(error, 'update supplier');
    
    return {
      id: data.id,
      businessId: data.business_id,
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
      deliveryMethods: data.delivery_methods || [],
      notes: data.notes || '',
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  },

  async delete(id: string): Promise<void> {
    const businessId = getCurrentBusinessId();
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id)
      .eq('business_id', businessId);
    
    if (error) handleError(error, 'delete supplier');
  },

  // Get low stock items for suppliers with auto-order enabled
  async getLowStockItemsForAutoOrder(): Promise<InventoryItem[]> {
    const businessId = getCurrentBusinessId();
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('business_id', businessId);
    
    if (error) handleError(error, 'fetch inventory items for auto order');
    
    // Filter client-side for now (could be optimized with a database function)
    const lowStockItems = (data || []).filter(item => item.current_stock <= item.min_threshold);
    
    return lowStockItems.map(item => ({
      id: item.id,
      businessId: item.business_id,
      name: item.name,
      category: item.category,
      currentStock: item.current_stock,
      unit: item.unit,
      minThreshold: item.min_threshold,
      costPerUnit: item.cost_per_unit,
      supplier: item.supplier || '',
      lastRestocked: new Date(item.last_restocked),
      reservedQuantity: item.reserved_quantity || 0,
      ingredientId: item.ingredient_id,
      lastMovementDate: item.last_movement_date ? new Date(item.last_movement_date) : undefined
    }));
  },

  // Enhanced auto-order suggestions based on consumption patterns
  async getSmartAutoOrderSuggestions(): Promise<{
    item: InventoryItem;
    avgDailyConsumption: number;
    daysUntilStockOut: number;
    suggestedOrderQuantity: number;
    urgency: 'low' | 'medium' | 'high' | 'critical';
  }[]> {
    const businessId = getCurrentBusinessId();
    
    try {
      // Get all inventory items
      const { data: inventoryItems, error: inventoryError } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('business_id', businessId);
      
      if (inventoryError) throw inventoryError;
      
      // Get consumption data from the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: transactions, error: transactionError } = await supabase
        .from('inventory_transactions')
        .select('*')
        .eq('business_id', businessId)
        .eq('reason', 'order_sale')
        .gte('created_at', thirtyDaysAgo.toISOString());
      
      if (transactionError) throw transactionError;
      
      const suggestions = [];
      
      for (const item of inventoryItems || []) {
        // Calculate consumption for this item
        const itemTransactions = (transactions || []).filter(t => t.inventory_item_id === item.id);
        const totalConsumed = itemTransactions.reduce((sum, t) => sum + Math.abs(t.quantity), 0);
        const avgDailyConsumption = totalConsumed / 30; // Average per day over 30 days
        
        // Calculate days until stock out
        const availableStock = item.current_stock - (item.reserved_quantity || 0);
        const daysUntilStockOut = avgDailyConsumption > 0 ? availableStock / avgDailyConsumption : 999;
        
        // Determine if we need to reorder
        const shouldReorder = availableStock <= item.min_threshold || daysUntilStockOut <= 7;
        
        if (shouldReorder) {
          // Calculate suggested order quantity
          // Order enough for 14 days + safety stock
          const targetDaysStock = 14;
          const safetyStock = Math.max(item.min_threshold, avgDailyConsumption * 3);
          const suggestedOrderQuantity = Math.max(
            avgDailyConsumption * targetDaysStock + safetyStock - availableStock,
            item.min_threshold
          );
          
          // Determine urgency
          let urgency: 'low' | 'medium' | 'high' | 'critical' = 'low';
          if (availableStock <= 0) {
            urgency = 'critical';
          } else if (daysUntilStockOut <= 2) {
            urgency = 'high';
          } else if (daysUntilStockOut <= 5) {
            urgency = 'medium';
          }
          
          suggestions.push({
            item: {
              id: item.id,
              businessId: item.business_id,
              name: item.name,
              category: item.category,
              currentStock: item.current_stock,
              unit: item.unit,
              minThreshold: item.min_threshold,
              costPerUnit: item.cost_per_unit,
              supplier: item.supplier || '',
              lastRestocked: new Date(item.last_restocked),
              reservedQuantity: item.reserved_quantity || 0,
              ingredientId: item.ingredient_id,
              lastMovementDate: item.last_movement_date ? new Date(item.last_movement_date) : undefined
            },
            avgDailyConsumption,
            daysUntilStockOut: Math.round(daysUntilStockOut),
            suggestedOrderQuantity: Math.ceil(suggestedOrderQuantity),
            urgency
          });
        }
      }
      
      // Sort by urgency (critical first, then by days until stock out)
      suggestions.sort((a, b) => {
        const urgencyOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
          return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
        }
        return a.daysUntilStockOut - b.daysUntilStockOut;
      });
      
      return suggestions;
      
    } catch (error) {
      handleError(error, 'get smart auto order suggestions');
      return [];
    }
  }
};

// ==================== TRANSACTIONS ====================

export const transactionsService = {
  async getAll(): Promise<Transaction[]> {
    const businessId = getCurrentBusinessId();
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('business_id', businessId)
      .order('date', { ascending: false });
    
    if (error) handleError(error, 'fetch transactions');
    
    return (data || []).map(txn => ({
      id: txn.id,
      businessId: txn.business_id,
      date: new Date(txn.date),
      type: txn.type as 'revenue' | 'expense',
      category: txn.category,
      amount: txn.amount,
      description: txn.description,
      location: txn.location,
      paymentMethod: txn.payment_method
    }));
  },

  async getById(id: string): Promise<Transaction> {
    const businessId = getCurrentBusinessId();
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .eq('business_id', businessId)
      .single();
    
    if (error) handleError(error, 'fetch transaction');
    
    return {
      id: data.id,
      businessId: data.business_id,
      date: new Date(data.date),
      type: data.type as 'revenue' | 'expense',
      category: data.category,
      amount: data.amount,
      description: data.description,
      location: data.location,
      paymentMethod: data.payment_method
    };
  },

  async create(transaction: Omit<Transaction, 'id' | 'businessId'>): Promise<Transaction> {
    const businessId = getCurrentBusinessId();
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        business_id: businessId,
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
      businessId: data.business_id,
      date: new Date(data.date),
      type: data.type,
      category: data.category,
      amount: data.amount,
      description: data.description,
      location: data.location,
      paymentMethod: data.payment_method
    };
  },

  async update(id: string, transaction: Partial<Transaction>): Promise<Transaction> {
    const businessId = getCurrentBusinessId();
    const updateData: any = {};
    if (transaction.date !== undefined) updateData.date = transaction.date.toISOString().split('T')[0];
    if (transaction.type !== undefined) updateData.type = transaction.type;
    if (transaction.category !== undefined) updateData.category = transaction.category;
    if (transaction.amount !== undefined) updateData.amount = transaction.amount;
    if (transaction.description !== undefined) updateData.description = transaction.description;
    if (transaction.location !== undefined) updateData.location = transaction.location;
    if (transaction.paymentMethod !== undefined) updateData.payment_method = transaction.paymentMethod;
    
    const { data, error } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', id)
      .eq('business_id', businessId)
      .select()
      .single();
    
    if (error) handleError(error, 'update transaction');
    
    return {
      id: data.id,
      businessId: data.business_id,
      date: new Date(data.date),
      type: data.type as 'revenue' | 'expense',
      category: data.category,
      amount: data.amount,
      description: data.description,
      location: data.location,
      paymentMethod: data.payment_method
    };
  },

  async delete(id: string): Promise<void> {
    const businessId = getCurrentBusinessId();
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('business_id', businessId);
    
    if (error) handleError(error, 'delete transaction');
  }
};

// ==================== SUPPLIER ORDERS ====================

export const supplierOrdersService = {
  async getAll(): Promise<SupplierOrder[]> {
    const businessId = getCurrentBusinessId();
    const { data, error } = await supabase
      .from('supplier_orders')
      .select(`
        *,
        supplier_order_items (
          id,
          ingredient_id,
          quantity,
          unit_price,
          total_price,
          notes,
          ingredients (
            name,
            unit,
            cost_per_unit
          )
        ),
        suppliers (
          id,
          name,
          contact_person,
          email,
          phone,
          delivery_days,
          minimum_order_amount,
          lead_time
        )
      `)
      .eq('business_id', businessId)
      .order('order_date', { ascending: false });
    
    if (error) handleError(error, 'fetch supplier orders');
    
    return (data || []).map(order => ({
      id: order.id,
      businessId: order.business_id,
      orderNumber: order.order_number,
      supplierId: order.supplier_id,
      supplier: order.suppliers ? {
        id: order.suppliers.id,
        businessId: order.business_id,
        name: order.suppliers.name,
        contactPerson: order.suppliers.contact_person,
        email: order.suppliers.email,
        phone: order.suppliers.phone,
        address: '',
        deliveryDays: order.suppliers.delivery_days || [],
        orderSubmissionDays: [],
        minimumOrderAmount: order.suppliers.minimum_order_amount,
        leadTime: order.suppliers.lead_time,
        autoOrderEnabled: false,
        paymentTerms: '',
        deliveryMethods: order.suppliers.delivery_methods || [],
        notes: '',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      } : undefined,
      items: order.supplier_order_items.map((item: any) => ({
        id: item.id,
        ingredientId: item.ingredient_id,
        ingredient: item.ingredients ? {
          name: item.ingredients.name,
          unit: item.ingredients.unit,
          costPerUnit: item.ingredients.cost_per_unit
        } : undefined,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        totalPrice: item.total_price,
        notes: item.notes
      })),
      totalAmount: order.total_amount,
      status: order.status,
      priority: order.priority,
      orderDate: new Date(order.order_date),
      expectedDeliveryDate: order.expected_delivery_date ? new Date(order.expected_delivery_date) : undefined,
      actualDeliveryDate: order.actual_delivery_date ? new Date(order.actual_delivery_date) : undefined,
      submittedDate: order.submitted_date ? new Date(order.submitted_date) : undefined,
      notes: order.notes,
      autoGenerated: order.auto_generated,
      createdAt: new Date(order.created_at),
      updatedAt: new Date(order.updated_at)
    }));
  },

  async getById(id: string): Promise<SupplierOrder> {
    const businessId = getCurrentBusinessId();
    const { data, error } = await supabase
      .from('supplier_orders')
      .select(`
        *,
        supplier_order_items (
          id,
          ingredient_id,
          quantity,
          unit_price,
          total_price,
          notes,
          ingredients (
            name,
            unit,
            cost_per_unit
          )
        ),
        suppliers (
          id,
          name,
          contact_person,
          email,
          phone,
          delivery_days,
          minimum_order_amount,
          lead_time
        )
      `)
      .eq('id', id)
      .eq('business_id', businessId)
      .single();
    
    if (error) handleError(error, 'fetch supplier order');
    
    return {
      id: data.id,
      businessId: data.business_id,
      orderNumber: data.order_number,
      supplierId: data.supplier_id,
      supplier: data.suppliers ? {
        id: data.suppliers.id,
        businessId: data.business_id,
        name: data.suppliers.name,
        contactPerson: data.suppliers.contact_person,
        email: data.suppliers.email,
        phone: data.suppliers.phone,
        address: '',
        deliveryDays: data.suppliers.delivery_days || [],
        orderSubmissionDays: [],
        minimumOrderAmount: data.suppliers.minimum_order_amount,
        leadTime: data.suppliers.lead_time,
        autoOrderEnabled: false,
        paymentTerms: '',
        deliveryMethods: data.suppliers.delivery_methods || [],
        notes: '',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      } : undefined,
      items: data.supplier_order_items.map((item: any) => ({
        id: item.id,
        ingredientId: item.ingredient_id,
        ingredient: item.ingredients ? {
          name: item.ingredients.name,
          unit: item.ingredients.unit,
          costPerUnit: item.ingredients.cost_per_unit
        } : undefined,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        totalPrice: item.total_price,
        notes: item.notes
      })),
      totalAmount: data.total_amount,
      status: data.status,
      priority: data.priority,
      orderDate: new Date(data.order_date),
      expectedDeliveryDate: data.expected_delivery_date ? new Date(data.expected_delivery_date) : undefined,
      actualDeliveryDate: data.actual_delivery_date ? new Date(data.actual_delivery_date) : undefined,
      submittedDate: data.submitted_date ? new Date(data.submitted_date) : undefined,
      notes: data.notes,
      autoGenerated: data.auto_generated,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  },

  async create(supplierOrder: Omit<SupplierOrder, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt' | 'businessId'>): Promise<SupplierOrder> {
    const businessId = getCurrentBusinessId();
    // Generate order number
    const orderNumber = `SO-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    
    // Calculate expected delivery date based on supplier lead time
    const expectedDeliveryDate = new Date(supplierOrder.orderDate);
    if (supplierOrder.supplier?.leadTime) {
      expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + supplierOrder.supplier.leadTime);
    }
    
    const orderData = {
      business_id: businessId,
      order_number: orderNumber,
      supplier_id: supplierOrder.supplierId,
      total_amount: supplierOrder.totalAmount,
      status: supplierOrder.status,
      priority: supplierOrder.priority,
      order_date: supplierOrder.orderDate.toISOString(),
      expected_delivery_date: expectedDeliveryDate.toISOString(),
      notes: supplierOrder.notes,
      auto_generated: supplierOrder.autoGenerated
    };

    const { data, error } = await supabase
      .from('supplier_orders')
      .insert(orderData)
      .select()
      .single();
    
    if (error) handleError(error, 'create supplier order');

    // Insert order items
    if (supplierOrder.items && supplierOrder.items.length > 0) {
      const orderItems = supplierOrder.items.map(item => ({
        supplier_order_id: data.id,
        ingredient_id: item.ingredientId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.totalPrice,
        notes: item.notes
      }));

      const { error: itemsError } = await supabase
        .from('supplier_order_items')
        .insert(orderItems);
      
      if (itemsError) handleError(itemsError, 'create supplier order items');
    }

    return this.getById(data.id);
  },

  async update(id: string, supplierOrder: Partial<SupplierOrder>): Promise<SupplierOrder> {
    const businessId = getCurrentBusinessId();
    const updateData: any = {};
    if (supplierOrder.status !== undefined) updateData.status = supplierOrder.status;
    if (supplierOrder.priority !== undefined) updateData.priority = supplierOrder.priority;
    if (supplierOrder.orderDate !== undefined) updateData.order_date = supplierOrder.orderDate.toISOString();
    if (supplierOrder.expectedDeliveryDate !== undefined) updateData.expected_delivery_date = supplierOrder.expectedDeliveryDate.toISOString();
    if (supplierOrder.actualDeliveryDate !== undefined) updateData.actual_delivery_date = supplierOrder.actualDeliveryDate.toISOString();
    if (supplierOrder.submittedDate !== undefined) updateData.submitted_date = supplierOrder.submittedDate.toISOString();
    if (supplierOrder.notes !== undefined) updateData.notes = supplierOrder.notes;
    
    const { error } = await supabase
      .from('supplier_orders')
      .update(updateData)
      .eq('id', id)
      .eq('business_id', businessId);
    
    if (error) handleError(error, 'update supplier order');
    
    // Update items if provided
    if (supplierOrder.items !== undefined) {
      // Delete existing items
      const { error: deleteError } = await supabase
        .from('supplier_order_items')
        .delete()
        .eq('supplier_order_id', id);
      
      if (deleteError) handleError(deleteError, 'delete old supplier order items');
      
      // Insert new items
      if (supplierOrder.items.length > 0) {
        const orderItems = supplierOrder.items.map(item => ({
          supplier_order_id: id,
          ingredient_id: item.ingredientId,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total_price: item.totalPrice,
          notes: item.notes
        }));
        
        const { error: insertError } = await supabase
          .from('supplier_order_items')
          .insert(orderItems);
        
        if (insertError) handleError(insertError, 'insert new supplier order items');
      }
    }
    
    return this.getById(id);
  },

  async updateStatus(id: string, status: SupplierOrder['status']): Promise<SupplierOrder> {
    const businessId = getCurrentBusinessId();
    const updateData: any = { status };
    
    if (status === 'submitted') {
      updateData.submitted_date = new Date().toISOString();
    } else if (status === 'delivered') {
      updateData.actual_delivery_date = new Date().toISOString();
      
      // Process delivery and update inventory
      try {
        await inventoryManagementService.processSupplierDelivery(id);
      } catch (inventoryError) {
        console.error('Failed to update inventory for supplier delivery:', inventoryError);
        // Still allow the status update but log the inventory error
        // In a production environment, you might want to handle this differently
      }
    }

    const { error } = await supabase
      .from('supplier_orders')
      .update(updateData)
      .eq('id', id)
      .eq('business_id', businessId);
    
    if (error) handleError(error, 'update supplier order status');
    
    return this.getById(id);
  },

  // Mark order as delivered and update inventory
  async markAsDelivered(id: string): Promise<SupplierOrder> {
    return this.updateStatus(id, 'delivered');
  },

  async delete(id: string): Promise<void> {
    const businessId = getCurrentBusinessId();
    const { error } = await supabase
      .from('supplier_orders')
      .delete()
      .eq('id', id)
      .eq('business_id', businessId);
    
    if (error) handleError(error, 'delete supplier order');
  },

  // Generate auto orders based on low stock items
  async generateAutoOrders(): Promise<SupplierOrder[]> {
    const lowStockItems = await suppliersService.getLowStockItemsForAutoOrder();
    const suppliers = await suppliersService.getAll();
    const autoOrderSuppliers = suppliers.filter(s => s.autoOrderEnabled && s.isActive);
    
    const createdOrders: SupplierOrder[] = [];
    
    for (const supplier of autoOrderSuppliers) {
      const supplierItems = lowStockItems.filter(item => item.supplier === supplier.name);
      
      if (supplierItems.length > 0) {
        // Calculate total order amount
        const orderItems: SupplierOrderItem[] = supplierItems.map(item => ({
          ingredientId: item.id,
          quantity: Math.max(item.minThreshold * 2, 10), // Order enough to restock
          unitPrice: item.costPerUnit,
          totalPrice: item.costPerUnit * Math.max(item.minThreshold * 2, 10)
        }));
        
        const totalAmount = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
        
        // Only create order if it meets minimum order amount
        if (totalAmount >= supplier.minimumOrderAmount) {
          const newOrder = await this.create({
            supplierId: supplier.id,
            items: orderItems,
            totalAmount,
            status: 'draft',
            priority: 'medium',
            orderDate: new Date(),
            autoGenerated: true,
            notes: `Auto-generated order for low stock items (${supplierItems.map(i => i.name).join(', ')})`
          });
          
          createdOrders.push(newOrder);
        }
      }
    }
    
    return createdOrders;
  },

  // Get orders that need attention (overdue, etc.)
  async getOrdersNeedingAttention(): Promise<SupplierOrder[]> {
    const orders = await this.getAll();
    const now = new Date();
    
    return orders.filter(order => {
      // Orders that are overdue for delivery
      if (order.expectedDeliveryDate && order.expectedDeliveryDate < now && order.status !== 'delivered') {
        return true;
      }
      
      // Orders that have been in 'submitted' status for too long
      if (order.status === 'submitted' && order.submittedDate) {
        const daysSinceSubmitted = (now.getTime() - order.submittedDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceSubmitted > 7) { // More than a week
          return true;
        }
      }
      
      return false;
    });
  }
};

// ==================== REAL-TIME SUBSCRIPTIONS ====================

export const subscriptions = {
  ingredients: (callback: (payload: any) => void) => {
    const businessId = getCurrentBusinessId();
    return supabase
      .channel('ingredients_changes')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ingredients',
          filter: `business_id=eq.${businessId}`
        },
        callback
      )
      .subscribe();
  },

  // Alias for ingredients subscription with updated terminology
  products: (callback: (payload: any) => void) => {
    const businessId = getCurrentBusinessId();
    return supabase
      .channel('products_changes')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ingredients',
          filter: `business_id=eq.${businessId}`
        },
        callback
      )
      .subscribe();
  },

  menuItems: (callback: (payload: any) => void) => {
    const businessId = getCurrentBusinessId();
    return supabase
      .channel('menu_items_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'menu_items',
          filter: `business_id=eq.${businessId}`
        }, 
        callback
      )
      .subscribe();
  },

  transactions: (callback: (payload: any) => void) => {
    const businessId = getCurrentBusinessId();
    return supabase
      .channel('transactions_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'transactions',
          filter: `business_id=eq.${businessId}`
        }, 
        callback
      )
      .subscribe();
  },

  inventory: (callback: (payload: any) => void) => {
    const businessId = getCurrentBusinessId();
    return supabase
      .channel('inventory_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'inventory_items',
          filter: `business_id=eq.${businessId}`
        }, 
        callback
      )
      .subscribe();
  },

  suppliers: (callback: (payload: any) => void) => {
    const businessId = getCurrentBusinessId();
    return supabase
      .channel('suppliers_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'suppliers',
          filter: `business_id=eq.${businessId}`
        }, 
        callback
      )
      .subscribe();
  },

  expenses: (callback: (payload: any) => void) => {
    const businessId = getCurrentBusinessId();
    return supabase
      .channel('expenses_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'expenses',
          filter: `business_id=eq.${businessId}`
        }, 
        callback
      )
      .subscribe();
  },

  financialGoals: (callback: (payload: any) => void) => {
    const businessId = getCurrentBusinessId();
    return supabase
      .channel('financial_goals_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'financial_goals',
          filter: `business_id=eq.${businessId}`
        }, 
        callback
      )
      .subscribe();
  },

  employees: (callback: (payload: any) => void) => {
    const businessId = getCurrentBusinessId();
    return supabase
      .channel('employees_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'employees',
          filter: `business_id=eq.${businessId}`
        }, 
        callback
      )
      .subscribe();
  },

  shifts: (callback: (payload: any) => void) => {
    const businessId = getCurrentBusinessId();
    return supabase
      .channel('shifts_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'shifts',
          filter: `business_id=eq.${businessId}`
        }, 
        callback
      )
      .subscribe();
  },

  orders: (callback: (payload: any) => void) => {
    const businessId = getCurrentBusinessId();
    return supabase
      .channel('orders_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'orders',
          filter: `business_id=eq.${businessId}`
        }, 
        callback
      )
      .subscribe();
  },

  supplierOrders: (callback: (payload: any) => void) => {
    const businessId = getCurrentBusinessId();
    return supabase
      .channel('supplier_orders_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'supplier_orders',
          filter: `business_id=eq.${businessId}`
        }, 
        callback
      )
      .subscribe();
  }
};

// Financial Management Services
export const expensesService = {
  async getAll(): Promise<Expense[]> {
    const businessId = getCurrentBusinessId();
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });
    
    if (error) handleError(error, 'fetch expenses');
    
    return (data || []).map(expense => ({
      id: expense.id,
      businessId: expense.business_id,
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

  async getById(id: string): Promise<Expense> {
    const businessId = getCurrentBusinessId();
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', id)
      .eq('business_id', businessId)
      .single();
    
    if (error) handleError(error, 'fetch expense');
    
    return {
      id: data.id,
      businessId: data.business_id,
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

  async create(expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'businessId'>): Promise<Expense> {
    const businessId = getCurrentBusinessId();
    const { data, error } = await supabase
      .from('expenses')
      .insert({
        business_id: businessId,
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
      businessId: data.business_id,
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
    const businessId = getCurrentBusinessId();
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
      .eq('business_id', businessId)
      .select()
      .single();
    
    if (error) handleError(error, 'update expense');
    
    return {
      id: data.id,
      businessId: data.business_id,
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
    const businessId = getCurrentBusinessId();
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
      .eq('business_id', businessId);
    
    if (error) handleError(error, 'delete expense');
  }
};

export const expenseCategoriesService = {
  async getAll(): Promise<ExpenseCategory[]> {
    const businessId = getCurrentBusinessId();
    const { data, error } = await supabase
      .from('expense_categories')
      .select('*')
      .eq('business_id', businessId)
      .eq('is_active', true)
      .order('name', { ascending: true });
    
    if (error) handleError(error, 'fetch expense categories');
    
    return (data || []).map(category => ({
      id: category.id,
      businessId: category.business_id,
      name: category.name,
      type: category.type,
      isActive: category.is_active
    }));
  },

  async getById(id: string): Promise<ExpenseCategory> {
    const businessId = getCurrentBusinessId();
    const { data, error } = await supabase
      .from('expense_categories')
      .select('*')
      .eq('id', id)
      .eq('business_id', businessId)
      .single();
    
    if (error) handleError(error, 'fetch expense category');
    
    return {
      id: data.id,
      businessId: data.business_id,
      name: data.name,
      type: data.type,
      isActive: data.is_active
    };
  },

  async create(category: Omit<ExpenseCategory, 'id' | 'businessId'>): Promise<ExpenseCategory> {
    const businessId = getCurrentBusinessId();
    const { data, error } = await supabase
      .from('expense_categories')
      .insert({
        business_id: businessId,
        name: category.name,
        type: category.type,
        is_active: category.isActive
      })
      .select()
      .single();
    
    if (error) handleError(error, 'create expense category');
    
    return {
      id: data.id,
      businessId: data.business_id,
      name: data.name,
      type: data.type,
      isActive: data.is_active
    };
  },

  async update(id: string, category: Partial<ExpenseCategory>): Promise<ExpenseCategory> {
    const businessId = getCurrentBusinessId();
    const updateData: any = {};
    if (category.name !== undefined) updateData.name = category.name;
    if (category.type !== undefined) updateData.type = category.type;
    if (category.isActive !== undefined) updateData.is_active = category.isActive;
    
    const { data, error } = await supabase
      .from('expense_categories')
      .update(updateData)
      .eq('id', id)
      .eq('business_id', businessId)
      .select()
      .single();
    
    if (error) handleError(error, 'update expense category');
    
    return {
      id: data.id,
      businessId: data.business_id,
      name: data.name,
      type: data.type,
      isActive: data.is_active
    };
  },

  async delete(id: string): Promise<void> {
    const businessId = getCurrentBusinessId();
    const { error } = await supabase
      .from('expense_categories')
      .delete()
      .eq('id', id)
      .eq('business_id', businessId);
    
    if (error) handleError(error, 'delete expense category');
  }
};

export const financialGoalsService = {
  async getAll(): Promise<FinancialGoal[]> {
    const businessId = getCurrentBusinessId();
    const { data, error } = await supabase
      .from('financial_goals')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });
    
    if (error) handleError(error, 'fetch financial goals');
    
    return (data || []).map(goal => ({
      id: goal.id,
      businessId: goal.business_id,
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

  async getById(id: string): Promise<FinancialGoal> {
    const businessId = getCurrentBusinessId();
    const { data, error } = await supabase
      .from('financial_goals')
      .select('*')
      .eq('id', id)
      .eq('business_id', businessId)
      .single();
    
    if (error) handleError(error, 'fetch financial goal');
    
    return {
      id: data.id,
      businessId: data.business_id,
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

  async create(goal: Omit<FinancialGoal, 'id' | 'createdAt' | 'updatedAt' | 'businessId'>): Promise<FinancialGoal> {
    const businessId = getCurrentBusinessId();
    const { data, error } = await supabase
      .from('financial_goals')
      .insert({
        business_id: businessId,
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
      businessId: data.business_id,
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
    const businessId = getCurrentBusinessId();
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
      .eq('business_id', businessId)
      .select()
      .single();
    
    if (error) handleError(error, 'update financial goal');
    
    return {
      id: data.id,
      businessId: data.business_id,
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
    const businessId = getCurrentBusinessId();
    const { error } = await supabase
      .from('financial_goals')
      .delete()
      .eq('id', id)
      .eq('business_id', businessId);
    
    if (error) handleError(error, 'delete financial goal');
  }
};

export const financialProjectionsService = {
  async getAll(): Promise<FinancialProjection[]> {
    const businessId = getCurrentBusinessId();
    const { data, error } = await supabase
      .from('financial_projections')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });
    
    if (error) handleError(error, 'fetch financial projections');
    
    return (data || []).map(projection => ({
      id: projection.id,
      businessId: projection.business_id,
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

  async getById(id: string): Promise<FinancialProjection> {
    const businessId = getCurrentBusinessId();
    const { data, error } = await supabase
      .from('financial_projections')
      .select('*')
      .eq('id', id)
      .eq('business_id', businessId)
      .single();
    
    if (error) handleError(error, 'fetch financial projection');
    
    return {
      id: data.id,
      businessId: data.business_id,
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
  },

  async create(projection: Omit<FinancialProjection, 'id' | 'createdAt' | 'updatedAt' | 'businessId'>): Promise<FinancialProjection> {
    const businessId = getCurrentBusinessId();
    const { data, error } = await supabase
      .from('financial_projections')
      .insert({
        business_id: businessId,
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
      businessId: data.business_id,
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
  },

  async update(id: string, projection: Partial<FinancialProjection>): Promise<FinancialProjection> {
    const businessId = getCurrentBusinessId();
    const updateData: any = {};
    if (projection.name !== undefined) updateData.name = projection.name;
    if (projection.projectionPeriod !== undefined) updateData.projection_period = projection.projectionPeriod;
    if (projection.projectedRevenue !== undefined) updateData.projected_revenue = projection.projectedRevenue;
    if (projection.projectedExpenses !== undefined) updateData.projected_expenses = projection.projectedExpenses;
    if (projection.projectedProfit !== undefined) updateData.projected_profit = projection.projectedProfit;
    if (projection.averageOrderValue !== undefined) updateData.average_order_value = projection.averageOrderValue;
    if (projection.ordersPerDay !== undefined) updateData.orders_per_day = projection.ordersPerDay;
    if (projection.workingDaysPerMonth !== undefined) updateData.working_days_per_month = projection.workingDaysPerMonth;
    if (projection.profitMarginPercentage !== undefined) updateData.profit_margin_percentage = projection.profitMarginPercentage;
    if (projection.breakEvenPoint !== undefined) updateData.break_even_point = projection.breakEvenPoint;
    
    const { data, error } = await supabase
      .from('financial_projections')
      .update(updateData)
      .eq('id', id)
      .eq('business_id', businessId)
      .select()
      .single();
    
    if (error) handleError(error, 'update financial projection');
    
    return {
      id: data.id,
      businessId: data.business_id,
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
  },

  async delete(id: string): Promise<void> {
    const businessId = getCurrentBusinessId();
    const { error } = await supabase
      .from('financial_projections')
      .delete()
      .eq('id', id)
      .eq('business_id', businessId);
    
    if (error) handleError(error, 'delete financial projection');
  }
};

// Employee Management Services
export const employeesService = {
  async getAll(): Promise<Employee[]> {
    const businessId = getCurrentBusinessId();
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('business_id', businessId)
      .order('first_name', { ascending: true });
    
    if (error) handleError(error, 'fetch employees');
    
    return (data || []).map(employee => ({
      id: employee.id,
      businessId: employee.business_id,
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

  async getById(id: string): Promise<Employee> {
    const businessId = getCurrentBusinessId();
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .eq('business_id', businessId)
      .single();
    
    if (error) handleError(error, 'fetch employee');
    
    return {
      id: data.id,
      businessId: data.business_id,
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

  async create(employee: Omit<Employee, 'id' | 'businessId'>): Promise<Employee> {
    const businessId = getCurrentBusinessId();
    const { data, error } = await supabase
      .from('employees')
      .insert({
        business_id: businessId,
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
      businessId: data.business_id,
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
    const businessId = getCurrentBusinessId();
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
      .eq('business_id', businessId)
      .select()
      .single();
    
    if (error) handleError(error, 'update employee');
    
    return {
      id: data.id,
      businessId: data.business_id,
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
    const businessId = getCurrentBusinessId();
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id)
      .eq('business_id', businessId);
    
    if (error) handleError(error, 'delete employee');
  }
};

export const shiftsService = {
  async getAll(): Promise<Shift[]> {
    const businessId = getCurrentBusinessId();
    const { data, error } = await supabase
      .from('shifts')
      .select(`
        *,
        employees!inner (
          business_id
        )
      `)
      .eq('employees.business_id', businessId)
      .order('date', { ascending: false });
    
    if (error) handleError(error, 'fetch shifts');
    
    return (data || []).map(shift => ({
      id: shift.id,
      businessId: shift.employees.business_id,
      employeeId: shift.employee_id,
      date: new Date(shift.date),
      startTime: shift.start_time,
      endTime: shift.end_time,
      hoursWorked: shift.hours_worked,
      role: shift.role,
      location: shift.location
    }));
  },

  async getById(id: string): Promise<Shift> {
    const businessId = getCurrentBusinessId();
    const { data, error } = await supabase
      .from('shifts')
      .select(`
        *,
        employees!inner (
          business_id
        )
      `)
      .eq('id', id)
      .eq('employees.business_id', businessId)
      .single();
    
    if (error) handleError(error, 'fetch shift');
    
    return {
      id: data.id,
      businessId: data.employees.business_id,
      employeeId: data.employee_id,
      date: new Date(data.date),
      startTime: data.start_time,
      endTime: data.end_time,
      hoursWorked: data.hours_worked,
      role: data.role,
      location: data.location
    };
  },

  async create(shift: Omit<Shift, 'id' | 'businessId'>): Promise<Shift> {
    const businessId = getCurrentBusinessId();
    
    // Verify employee belongs to current business
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('business_id')
      .eq('id', shift.employeeId)
      .eq('business_id', businessId)
      .single();
    
    if (employeeError || !employee) {
      throw new Error('Employee not found or does not belong to current business');
    }
    
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
      businessId: businessId,
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
    const businessId = getCurrentBusinessId();
    
    // If updating employee, verify they belong to current business
    if (shift.employeeId) {
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('business_id')
        .eq('id', shift.employeeId)
        .eq('business_id', businessId)
        .single();
      
      if (employeeError || !employee) {
        throw new Error('Employee not found or does not belong to current business');
      }
    }
    
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
      businessId: businessId,
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
    const businessId = getCurrentBusinessId();
    
    // Verify shift belongs to current business through employee
    const { data: shift, error: verifyError } = await supabase
      .from('shifts')
      .select(`
        id,
        employees!inner (
          business_id
        )
      `)
      .eq('id', id)
      .eq('employees.business_id', businessId)
      .single();
    
    if (verifyError || !shift) {
      throw new Error('Shift not found or does not belong to current business');
    }
    
    const { error } = await supabase
      .from('shifts')
      .delete()
      .eq('id', id);
    
    if (error) handleError(error, 'delete shift');
  }
};

// ==================== CUSTOMERS ====================

export const customersService = {
  async getAll(): Promise<Customer[]> {
    const businessId = getCurrentBusinessId();
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('business_id', businessId)
      .order('first_name', { ascending: true });
    
    if (error) handleError(error, 'fetch customers');
    
    return (data || []).map(customer => ({
      id: customer.id,
      businessId: customer.business_id,
      firstName: customer.first_name,
      lastName: customer.last_name,
      email: customer.email,
      phone: customer.phone,
      loyaltyPoints: customer.loyalty_points,
      totalOrders: customer.total_orders,
      totalSpent: customer.total_spent,
      lastVisit: customer.last_visit ? new Date(customer.last_visit) : undefined
    }));
  },

  async getById(id: string): Promise<Customer> {
    const businessId = getCurrentBusinessId();
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .eq('business_id', businessId)
      .single();
    
    if (error) handleError(error, 'fetch customer');
    
    return {
      id: data.id,
      businessId: data.business_id,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      phone: data.phone,
      loyaltyPoints: data.loyalty_points,
      totalOrders: data.total_orders,
      totalSpent: data.total_spent,
      lastVisit: data.last_visit ? new Date(data.last_visit) : undefined
    };
  },

  async create(customer: Omit<Customer, 'id' | 'businessId'>): Promise<Customer> {
    const businessId = getCurrentBusinessId();
    const { data, error } = await supabase
      .from('customers')
      .insert({
        business_id: businessId,
        first_name: customer.firstName,
        last_name: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        loyalty_points: customer.loyaltyPoints || 0,
        total_orders: customer.totalOrders || 0,
        total_spent: customer.totalSpent || 0
      })
      .select()
      .single();
    
    if (error) handleError(error, 'create customer');
    
    return {
      id: data.id,
      businessId: data.business_id,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      phone: data.phone,
      loyaltyPoints: data.loyalty_points,
      totalOrders: data.total_orders,
      totalSpent: data.total_spent
    };
  },

  async update(id: string, customer: Partial<Customer>): Promise<Customer> {
    const businessId = getCurrentBusinessId();
    const updateData: any = {};
    if (customer.firstName !== undefined) updateData.first_name = customer.firstName;
    if (customer.lastName !== undefined) updateData.last_name = customer.lastName;
    if (customer.email !== undefined) updateData.email = customer.email;
    if (customer.phone !== undefined) updateData.phone = customer.phone;
    if (customer.loyaltyPoints !== undefined) updateData.loyalty_points = customer.loyaltyPoints;
    if (customer.totalOrders !== undefined) updateData.total_orders = customer.totalOrders;
    if (customer.totalSpent !== undefined) updateData.total_spent = customer.totalSpent;
    if (customer.lastVisit !== undefined) updateData.last_visit = customer.lastVisit.toISOString();
    
    const { data, error } = await supabase
      .from('customers')
      .update(updateData)
      .eq('id', id)
      .eq('business_id', businessId)
      .select()
      .single();
    
    if (error) handleError(error, 'update customer');
    
    return {
      id: data.id,
      businessId: data.business_id,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      phone: data.phone,
      loyaltyPoints: data.loyalty_points,
      totalOrders: data.total_orders,
      totalSpent: data.total_spent,
      lastVisit: data.last_visit ? new Date(data.last_visit) : undefined
    };
  },

  async delete(id: string): Promise<void> {
    const businessId = getCurrentBusinessId();
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id)
      .eq('business_id', businessId);
    
    if (error) handleError(error, 'delete customer');
  }
};

// ==================== ORDERS ====================

export const ordersService = {
  async getAll(): Promise<Order[]> {
    const businessId = getCurrentBusinessId();
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          menu_item_id,
          quantity,
          unit_price,
          total_price,
          special_instructions,
          menu_items (
            name,
            description,
            price
          )
        ),
        customers (
          id,
          first_name,
          last_name,
          email,
          phone,
          loyalty_points,
          total_orders,
          total_spent
        )
      `)
      .eq('business_id', businessId)
      .order('order_time', { ascending: false });
    
    if (error) handleError(error, 'fetch orders');
    
    return (data || []).map(order => ({
      id: order.id,
      businessId: order.business_id,
      orderNumber: order.order_number,
      customerId: order.customer_id,
      customer: order.customers ? {
        id: order.customers.id,
        businessId: order.business_id,
        firstName: order.customers.first_name,
        lastName: order.customers.last_name,
        email: order.customers.email,
        phone: order.customers.phone,
        loyaltyPoints: order.customers.loyalty_points,
        totalOrders: order.customers.total_orders,
        totalSpent: order.customers.total_spent
      } : undefined,
      items: order.order_items.map((item: any) => ({
        id: item.id,
        menuItemId: item.menu_item_id,
        menuItem: item.menu_items ? {
          name: item.menu_items.name,
          description: item.menu_items.description,
          price: item.menu_items.price
        } : undefined,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        totalPrice: item.total_price,
        specialInstructions: item.special_instructions
      })),
      total: order.total,
      subtotal: order.subtotal,
      taxAmount: order.tax_amount,
      tipAmount: order.tip_amount,
      discountAmount: order.discount_amount,
      status: order.status,
      orderTime: new Date(order.order_time),
      completedTime: order.completed_time ? new Date(order.completed_time) : undefined,
      location: order.location,
      paymentMethod: order.payment_method,
      paymentStatus: order.payment_status,
      specialInstructions: order.special_instructions,
      externalOrderId: order.external_order_id,
      externalSource: order.external_source,
      prepTimeMinutes: order.prep_time_minutes,
      employeeId: order.employee_id
    }));
  },

  async getById(id: string): Promise<Order> {
    const businessId = getCurrentBusinessId();
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          menu_item_id,
          quantity,
          unit_price,
          total_price,
          special_instructions,
          menu_items (
            name,
            description,
            price
          )
        ),
        customers (
          id,
          first_name,
          last_name,
          email,
          phone,
          loyalty_points,
          total_orders,
          total_spent
        )
      `)
      .eq('id', id)
      .eq('business_id', businessId)
      .single();
    
    if (error) handleError(error, 'fetch order');
    
    return {
      id: data.id,
      businessId: data.business_id,
      orderNumber: data.order_number,
      customerId: data.customer_id,
      customer: data.customers ? {
        id: data.customers.id,
        businessId: data.business_id,
        firstName: data.customers.first_name,
        lastName: data.customers.last_name,
        email: data.customers.email,
        phone: data.customers.phone
      } : undefined,
      items: data.order_items.map((item: any) => ({
        id: item.id,
        menuItemId: item.menu_item_id,
        menuItem: item.menu_items ? {
          name: item.menu_items.name,
          description: item.menu_items.description,
          price: item.menu_items.price
        } : undefined,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        totalPrice: item.total_price,
        specialInstructions: item.special_instructions
      })),
      total: data.total,
      subtotal: data.subtotal,
      taxAmount: data.tax_amount,
      tipAmount: data.tip_amount,
      discountAmount: data.discount_amount,
      status: data.status,
      orderTime: new Date(data.order_time),
      completedTime: data.completed_time ? new Date(data.completed_time) : undefined,
      location: data.location,
      paymentMethod: data.payment_method,
      paymentStatus: data.payment_status,
      specialInstructions: data.special_instructions,
      externalOrderId: data.external_order_id,
      externalSource: data.external_source,
      prepTimeMinutes: data.prep_time_minutes,
      employeeId: data.employee_id
    };
  },

  // Validate inventory before creating order
  async validateInventoryForOrder(orderItems: { menuItemId: string; quantity: number }[]): Promise<InventoryValidationResult> {
    return inventoryManagementService.validateOrderInventory(orderItems);
  },

  async bulkCreate(orders: (Omit<Order, 'id' | 'businessId'> & { orderNumber: string })[]): Promise<Order[]> {
    const businessId = getCurrentBusinessId();

    // Prepare all orders and order items for bulk insert
    const timestamp = Date.now();
    const ordersData = orders.map((order, index) => ({
      business_id: businessId,
      order_number: order.orderNumber,
      customer_id: order.customerId,
      total: order.total,
      subtotal: order.subtotal,
      tax_amount: order.taxAmount || 0,
      tip_amount: order.tipAmount || 0,
      discount_amount: order.discountAmount || 0,
      status: order.status,
      order_time: order.orderTime.toISOString(),
      completed_time: order.completedTime?.toISOString(),
      location: order.location,
      payment_method: order.paymentMethod,
      payment_status: order.paymentStatus || 'completed',
      special_instructions: order.specialInstructions,
      external_order_id: order.externalOrderId,
      external_source: order.externalSource || 'manual',
      employee_id: order.employeeId
    }));

    // Insert all orders in one call
    const { data: insertedOrders, error: ordersError } = await supabase
      .from('orders')
      .insert(ordersData)
      .select();

    if (ordersError) handleError(ordersError, 'bulk create orders');
    if (!insertedOrders) throw new Error('No orders returned after insert');

    // Now insert all order items
    const allOrderItems: any[] = [];
    insertedOrders.forEach((insertedOrder, orderIndex) => {
      const orderItems = orders[orderIndex].items;
      orderItems.forEach(item => {
        allOrderItems.push({
          order_id: insertedOrder.id,
          menu_item_id: item.menuItemId,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total_price: item.totalPrice,
          special_instructions: item.specialInstructions
        });
      });
    });

    // Insert all order items in one call
    if (allOrderItems.length > 0) {
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(allOrderItems);

      if (itemsError) handleError(itemsError, 'bulk create order items');
    }

    // Fetch complete order data with items
    const { data: completeOrders, error: fetchError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          menu_item_id,
          quantity,
          unit_price,
          total_price,
          special_instructions,
          menu_items (
            name,
            description,
            price
          )
        ),
        customers (
          id,
          business_id,
          first_name,
          last_name,
          email,
          phone,
          loyalty_points,
          total_orders,
          total_spent
        )
      `)
      .in('id', insertedOrders.map(o => o.id));

    if (fetchError) handleError(fetchError, 'fetch bulk created orders');
    if (!completeOrders) throw new Error('No orders returned after fetch');

    // Map orders to Order type (same logic as getAll)
    return completeOrders.map(order => ({
      id: order.id,
      businessId: order.business_id,
      orderNumber: order.order_number,
      customerId: order.customer_id,
      customer: order.customers ? {
        id: order.customers.id,
        businessId: order.business_id,
        firstName: order.customers.first_name,
        lastName: order.customers.last_name,
        email: order.customers.email,
        phone: order.customers.phone,
        loyaltyPoints: order.customers.loyalty_points,
        totalOrders: order.customers.total_orders,
        totalSpent: order.customers.total_spent
      } : undefined,
      items: order.order_items.map((item: any) => ({
        id: item.id,
        menuItemId: item.menu_item_id,
        menuItem: item.menu_items ? {
          name: item.menu_items.name,
          description: item.menu_items.description,
          price: item.menu_items.price
        } : undefined,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        totalPrice: item.total_price,
        specialInstructions: item.special_instructions
      })),
      total: order.total,
      subtotal: order.subtotal,
      taxAmount: order.tax_amount,
      tipAmount: order.tip_amount,
      discountAmount: order.discount_amount,
      status: order.status,
      orderTime: new Date(order.order_time),
      completedTime: order.completed_time ? new Date(order.completed_time) : undefined,
      location: order.location,
      paymentMethod: order.payment_method,
      paymentStatus: order.payment_status,
      specialInstructions: order.special_instructions,
      externalOrderId: order.external_order_id,
      externalSource: order.external_source,
      prepTimeMinutes: order.prep_time_minutes,
      employeeId: order.employee_id
    }));
  },

  async create(order: Omit<Order, 'id' | 'orderNumber' | 'businessId'>): Promise<Order> {
    const businessId = getCurrentBusinessId();
    
    // Skip inventory validation for imported historical orders
    const isImportedOrder = order.externalSource && 
      (order.externalSource.includes('import') || 
       order.externalSource.includes('payment_provider') ||
       order.externalSource.includes('external'));
    
    // Validate inventory availability before creating the order (except for imported orders)
    if (order.items && order.items.length > 0 && !isImportedOrder) {
      try {
        const orderItems = order.items.map(item => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity
        }));
        
        const validation = await this.validateInventoryForOrder(orderItems);
        if (!validation.isValid) {
          console.warn(`Inventory validation failed: ${validation.insufficientItems.map(item => 
            `${item.ingredientName} (need ${item.required} ${item.unit}, have ${item.available} ${item.unit})`
          ).join(', ')}`);
          // For now, log the warning but allow the order to proceed
          // In production, you might want to throw the error or prompt the user
        }
      } catch (validationError) {
        console.warn('Inventory validation error (proceeding with order):', validationError);
        // Continue with order creation even if validation fails
      }
    }
    
    // Generate order number (or use provided one for bulk imports)
    let orderNumber: string;
    if ((order as any).orderNumber) {
      // Use provided order number (for bulk imports)
      orderNumber = (order as any).orderNumber;
    } else {
      // Generate order number via RPC
      try {
        const { data: orderNumberData, error: orderNumberError } = await supabase
          .rpc('generate_order_number');

        if (orderNumberError) {
          console.warn('Failed to generate order number via RPC, using fallback:', orderNumberError);
          // Fallback: generate a unique order number with random suffix
          orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        } else {
          orderNumber = orderNumberData;
        }
      } catch (error) {
        console.warn('Error calling generate_order_number RPC, using fallback:', error);
        // Fallback: generate a unique order number with random suffix
        orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }
    }
    
    const orderData = {
      business_id: businessId,
      order_number: orderNumber,
      customer_id: order.customerId,
      total: order.total,
      subtotal: order.subtotal,
      tax_amount: order.taxAmount || 0,
      tip_amount: order.tipAmount || 0,
      discount_amount: order.discountAmount || 0,
      status: order.status,
      order_time: order.orderTime.toISOString(),
      location: order.location,
      payment_method: order.paymentMethod,
      payment_status: order.paymentStatus || 'completed',
      special_instructions: order.specialInstructions,
      external_order_id: order.externalOrderId,
      external_source: order.externalSource || 'manual',
      employee_id: order.employeeId
    };

    const { data, error } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();
    
    if (error) handleError(error, 'create order');

    // Insert order items
    if (order.items && order.items.length > 0) {
      const orderItems = order.items.map(item => ({
        order_id: data.id,
        menu_item_id: item.menuItemId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.totalPrice,
        special_instructions: item.specialInstructions
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);
      
      if (itemsError) handleError(itemsError, 'create order items');
    }

    // If payment is completed or order is completed, deduct from inventory (except for imported orders)
    if (!isImportedOrder && 
        ((order.paymentStatus === 'completed' && order.status === 'completed') || 
         (order.status === 'completed'))) {
      try {
        await inventoryManagementService.processOrderSale(data.id);
      } catch (inventoryError) {
        console.error('Failed to update inventory for order sale:', inventoryError);
        // Log the error but don't fail the order creation
      }
    }

    return this.getById(data.id);
  },

  async update(id: string, order: Partial<Order>): Promise<Order> {
    const businessId = getCurrentBusinessId();
    const updateData: any = {};
    if (order.customerId !== undefined) updateData.customer_id = order.customerId;
    if (order.total !== undefined) updateData.total = order.total;
    if (order.subtotal !== undefined) updateData.subtotal = order.subtotal;
    if (order.taxAmount !== undefined) updateData.tax_amount = order.taxAmount;
    if (order.tipAmount !== undefined) updateData.tip_amount = order.tipAmount;
    if (order.discountAmount !== undefined) updateData.discount_amount = order.discountAmount;
    if (order.status !== undefined) updateData.status = order.status;
    if (order.orderTime !== undefined) updateData.order_time = order.orderTime.toISOString();
    if (order.completedTime !== undefined) updateData.completed_time = order.completedTime.toISOString();
    if (order.location !== undefined) updateData.location = order.location;
    if (order.paymentMethod !== undefined) updateData.payment_method = order.paymentMethod;
    if (order.paymentStatus !== undefined) updateData.payment_status = order.paymentStatus;
    if (order.specialInstructions !== undefined) updateData.special_instructions = order.specialInstructions;
    if (order.prepTimeMinutes !== undefined) updateData.prep_time_minutes = order.prepTimeMinutes;
    if (order.employeeId !== undefined) updateData.employee_id = order.employeeId;
    
    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .eq('business_id', businessId);
    
    if (error) handleError(error, 'update order');
    
    // Update items if provided
    if (order.items !== undefined) {
      // Delete existing items
      const { error: deleteError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', id);
      
      if (deleteError) handleError(deleteError, 'delete old order items');
      
      // Insert new items
      if (order.items.length > 0) {
        const orderItems = order.items.map(item => ({
          order_id: id,
          menu_item_id: item.menuItemId,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total_price: item.totalPrice,
          special_instructions: item.specialInstructions
        }));
        
        const { error: insertError } = await supabase
          .from('order_items')
          .insert(orderItems);
        
        if (insertError) handleError(insertError, 'insert new order items');
      }
    }
    
    return this.getById(id);
  },

  async updateStatus(id: string, status: Order['status'], employeeId?: string): Promise<Order> {
    const businessId = getCurrentBusinessId();
    const updateData: any = { 
      status,
      updated_at: new Date().toISOString()
    };
    
    if (status === 'completed') {
      updateData.completed_time = new Date().toISOString();
      
      // Check if this is an imported order before processing inventory
      const { data: orderData, error: fetchError } = await supabase
        .from('orders')
        .select('external_source')
        .eq('id', id)
        .eq('business_id', businessId)
        .single();
      
      const isImportedOrder = orderData?.external_source && 
        (orderData.external_source.includes('import') || 
         orderData.external_source.includes('payment_provider') ||
         orderData.external_source.includes('external'));
      
      // Process order sale and deduct from inventory (except for imported orders)
      if (!fetchError && !isImportedOrder) {
        try {
          await inventoryManagementService.processOrderSale(id);
        } catch (inventoryError) {
          console.error('Failed to update inventory for order completion:', inventoryError);
          // Log the error but don't fail the status update
          // In production, you might want to handle this differently
        }
      }
    }
    
    if (employeeId) {
      updateData.employee_id = employeeId;
    }

    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .eq('business_id', businessId);
    
    if (error) handleError(error, 'update order status');
    
    return this.getById(id);
  },

  // Mark order as completed and process inventory deduction
  async completeOrder(id: string, employeeId?: string): Promise<Order> {
    return this.updateStatus(id, 'completed', employeeId);
  },

  // Get low stock alerts for orders dashboard
  async getLowStockAlerts(): Promise<InventoryAlert[]> {
    return inventoryManagementService.getLowStockAlerts();
  },

  async delete(id: string): Promise<void> {
    const businessId = getCurrentBusinessId();
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id)
      .eq('business_id', businessId);
    
    if (error) handleError(error, 'delete order');
  },

  // Import orders from external systems (like defrayal machine)
  async importFromExternal(externalOrders: any[]): Promise<Order[]> {
    const createdOrders = [];
    
    for (const externalOrder of externalOrders) {
      try {
        const order = await this.create({
          customerId: undefined, // External orders might not have customer info
          items: externalOrder.items?.map((item: any) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
            specialInstructions: item.specialInstructions
          })) || [],
          total: externalOrder.total,
          subtotal: externalOrder.subtotal || externalOrder.total,
          taxAmount: externalOrder.taxAmount || 0,
          tipAmount: externalOrder.tipAmount || 0,
          status: externalOrder.status || 'completed',
          orderTime: new Date(externalOrder.orderTime || Date.now()),
          location: externalOrder.location || 'Main Location',
          paymentMethod: externalOrder.paymentMethod || 'card',
          paymentStatus: 'completed',
          externalOrderId: externalOrder.externalId,
          externalSource: externalOrder.source || 'defrayal'
        });
        
        createdOrders.push(order);
      } catch (error) {
        console.error('Failed to import external order:', externalOrder, error);
      }
    }
    
    return createdOrders;
  }
};

// ==================== PRODUCT MAPPINGS ====================

export const productMappingsService = {
  async getAll(sourceType: string = 'payment_provider'): Promise<ProductMapping[]> {
    const businessId = getCurrentBusinessId();
    const { data, error } = await supabase
      .from('product_mappings')
      .select('*')
      .eq('business_id', businessId)
      .eq('source_type', sourceType)
      .order('last_used_at', { ascending: false });

    if (error) handleError(error, 'fetch product mappings');

    return (data || []).map(mapping => ({
      id: mapping.id,
      businessId: mapping.business_id,
      originalName: mapping.original_name,
      sourceType: mapping.source_type,
      menuItemId: mapping.menu_item_id,
      confidence: mapping.confidence,
      isManual: mapping.is_manual,
      createdAt: new Date(mapping.created_at),
      updatedAt: new Date(mapping.updated_at),
      lastUsedAt: new Date(mapping.last_used_at)
    }));
  },

  async getByOriginalName(originalName: string, sourceType: string = 'payment_provider'): Promise<ProductMapping | null> {
    const businessId = getCurrentBusinessId();
    const { data, error } = await supabase
      .from('product_mappings')
      .select('*')
      .eq('business_id', businessId)
      .eq('original_name', originalName)
      .eq('source_type', sourceType)
      .maybeSingle();

    if (error) handleError(error, 'fetch product mapping');
    if (!data) return null;

    return {
      id: data.id,
      businessId: data.business_id,
      originalName: data.original_name,
      sourceType: data.source_type,
      menuItemId: data.menu_item_id,
      confidence: data.confidence,
      isManual: data.is_manual,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      lastUsedAt: new Date(data.last_used_at)
    };
  },

  async create(mapping: Omit<ProductMapping, 'id' | 'businessId' | 'createdAt' | 'updatedAt' | 'lastUsedAt'>): Promise<ProductMapping> {
    const businessId = getCurrentBusinessId();
    const { data, error } = await supabase
      .from('product_mappings')
      .insert({
        business_id: businessId,
        original_name: mapping.originalName,
        source_type: mapping.sourceType,
        menu_item_id: mapping.menuItemId,
        confidence: mapping.confidence,
        is_manual: mapping.isManual
      })
      .select()
      .single();

    if (error) handleError(error, 'create product mapping');

    return {
      id: data.id,
      businessId: data.business_id,
      originalName: data.original_name,
      sourceType: data.source_type,
      menuItemId: data.menu_item_id,
      confidence: data.confidence,
      isManual: data.is_manual,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      lastUsedAt: new Date(data.last_used_at)
    };
  },

  async upsert(mapping: Omit<ProductMapping, 'id' | 'businessId' | 'createdAt' | 'updatedAt' | 'lastUsedAt'>): Promise<ProductMapping> {
    const businessId = getCurrentBusinessId();
    const { data, error } = await supabase
      .from('product_mappings')
      .upsert({
        business_id: businessId,
        original_name: mapping.originalName,
        source_type: mapping.sourceType,
        menu_item_id: mapping.menuItemId,
        confidence: mapping.confidence,
        is_manual: mapping.isManual,
        last_used_at: new Date().toISOString()
      }, {
        onConflict: 'business_id,original_name,source_type'
      })
      .select()
      .single();

    if (error) handleError(error, 'upsert product mapping');

    return {
      id: data.id,
      businessId: data.business_id,
      originalName: data.original_name,
      sourceType: data.source_type,
      menuItemId: data.menu_item_id,
      confidence: data.confidence,
      isManual: data.is_manual,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      lastUsedAt: new Date(data.last_used_at)
    };
  },

  async update(id: string, updates: Partial<Omit<ProductMapping, 'id' | 'businessId' | 'createdAt' | 'updatedAt'>>): Promise<ProductMapping> {
    const businessId = getCurrentBusinessId();
    const updateData: any = {};

    if (updates.menuItemId !== undefined) updateData.menu_item_id = updates.menuItemId;
    if (updates.confidence !== undefined) updateData.confidence = updates.confidence;
    if (updates.isManual !== undefined) updateData.is_manual = updates.isManual;
    if (updates.lastUsedAt !== undefined) updateData.last_used_at = updates.lastUsedAt.toISOString();

    const { data, error } = await supabase
      .from('product_mappings')
      .update(updateData)
      .eq('id', id)
      .eq('business_id', businessId)
      .select()
      .single();

    if (error) handleError(error, 'update product mapping');

    return {
      id: data.id,
      businessId: data.business_id,
      originalName: data.original_name,
      sourceType: data.source_type,
      menuItemId: data.menu_item_id,
      confidence: data.confidence,
      isManual: data.is_manual,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      lastUsedAt: new Date(data.last_used_at)
    };
  },

  async delete(id: string): Promise<void> {
    const businessId = getCurrentBusinessId();
    const { error } = await supabase
      .from('product_mappings')
      .delete()
      .eq('id', id)
      .eq('business_id', businessId);

    if (error) handleError(error, 'delete product mapping');
  },

  async updateLastUsedAt(id: string): Promise<void> {
    const businessId = getCurrentBusinessId();
    const { error } = await supabase
      .from('product_mappings')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', id)
      .eq('business_id', businessId);

    if (error) handleError(error, 'update product mapping last used');
  }
};

// ==================== DAILY SALES ====================

export const dailySalesService = {
  async getByDate(date: Date): Promise<any> {
    const businessId = getCurrentBusinessId();
    const { data, error } = await supabase
      .from('daily_sales_summary')
      .select('*')
      .eq('business_id', businessId)
      .eq('date', date.toISOString().split('T')[0])
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      handleError(error, 'fetch daily sales');
    }

    return data;
  },

  async getDateRange(startDate: Date, endDate: Date): Promise<any[]> {
    const businessId = getCurrentBusinessId();
    const { data, error } = await supabase
      .from('daily_sales_summary')
      .select('*')
      .eq('business_id', businessId)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (error) handleError(error, 'fetch daily sales range');

    return data || [];
  }
};