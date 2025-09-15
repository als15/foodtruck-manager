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
  ExpenseCategory,
  FinancialGoal,
  FinancialProjection,
  Order,
  OrderItem,
  SupplierOrder,
  SupplierOrderItem
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

// ==================== SUPPLIER ORDERS ====================

export const supplierOrdersService = {
  async getAll(): Promise<SupplierOrder[]> {
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
      .order('order_date', { ascending: false });
    
    if (error) handleError(error, 'fetch supplier orders');
    
    return (data || []).map(order => ({
      id: order.id,
      orderNumber: order.order_number,
      supplierId: order.supplier_id,
      supplier: order.suppliers ? {
        id: order.suppliers.id,
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
      .single();
    
    if (error) handleError(error, 'fetch supplier order');
    
    return {
      id: data.id,
      orderNumber: data.order_number,
      supplierId: data.supplier_id,
      supplier: data.suppliers ? {
        id: data.suppliers.id,
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

  async create(supplierOrder: Omit<SupplierOrder, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>): Promise<SupplierOrder> {
    // Generate order number
    const orderNumber = `SO-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    
    // Calculate expected delivery date based on supplier lead time
    const expectedDeliveryDate = new Date(supplierOrder.orderDate);
    if (supplierOrder.supplier?.leadTime) {
      expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + supplierOrder.supplier.leadTime);
    }
    
    const orderData = {
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
    const updateData: any = {};
    if (supplierOrder.status !== undefined) updateData.status = supplierOrder.status;
    if (supplierOrder.priority !== undefined) updateData.priority = supplierOrder.priority;
    if (supplierOrder.expectedDeliveryDate !== undefined) updateData.expected_delivery_date = supplierOrder.expectedDeliveryDate.toISOString();
    if (supplierOrder.actualDeliveryDate !== undefined) updateData.actual_delivery_date = supplierOrder.actualDeliveryDate.toISOString();
    if (supplierOrder.submittedDate !== undefined) updateData.submitted_date = supplierOrder.submittedDate.toISOString();
    if (supplierOrder.notes !== undefined) updateData.notes = supplierOrder.notes;
    
    const { error } = await supabase
      .from('supplier_orders')
      .update(updateData)
      .eq('id', id);
    
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
    const updateData: any = { status };
    
    if (status === 'submitted') {
      updateData.submitted_date = new Date().toISOString();
    } else if (status === 'delivered') {
      updateData.actual_delivery_date = new Date().toISOString();
    }

    const { error } = await supabase
      .from('supplier_orders')
      .update(updateData)
      .eq('id', id);
    
    if (error) handleError(error, 'update supplier order status');
    
    return this.getById(id);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('supplier_orders')
      .delete()
      .eq('id', id);
    
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
  },

  orders: (callback: (payload: any) => void) => {
    return supabase
      .channel('orders_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'orders' }, 
        callback
      )
      .subscribe();
  },

  supplierOrders: (callback: (payload: any) => void) => {
    return supabase
      .channel('supplier_orders_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'supplier_orders' }, 
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

export const expenseCategoriesService = {
  async getAll(): Promise<ExpenseCategory[]> {
    const { data, error } = await supabase
      .from('expense_categories')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });
    
    if (error) handleError(error, 'fetch expense categories');
    
    return (data || []).map(category => ({
      id: category.id,
      name: category.name,
      type: category.type,
      isActive: category.is_active
    }));
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

// ==================== CUSTOMERS ====================

export const customersService = {
  async getAll(): Promise<Customer[]> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('first_name', { ascending: true });
    
    if (error) handleError(error, 'fetch customers');
    
    return (data || []).map(customer => ({
      id: customer.id,
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

  async create(customer: Omit<Customer, 'id'>): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .insert({
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
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      phone: data.phone,
      loyaltyPoints: data.loyalty_points,
      totalOrders: data.total_orders,
      totalSpent: data.total_spent
    };
  }
};

// ==================== ORDERS ====================

export const ordersService = {
  async getAll(): Promise<Order[]> {
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
      .order('order_time', { ascending: false });
    
    if (error) handleError(error, 'fetch orders');
    
    return (data || []).map(order => ({
      id: order.id,
      orderNumber: order.order_number,
      customerId: order.customer_id,
      customer: order.customers ? {
        id: order.customers.id,
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
      .single();
    
    if (error) handleError(error, 'fetch order');
    
    return {
      id: data.id,
      orderNumber: data.order_number,
      customerId: data.customer_id,
      customer: data.customers ? {
        id: data.customers.id,
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

  async create(order: Omit<Order, 'id' | 'orderNumber'>): Promise<Order> {
    // Generate order number
    const { data: orderNumberData, error: orderNumberError } = await supabase
      .rpc('generate_order_number');
    
    if (orderNumberError) handleError(orderNumberError, 'generate order number');
    
    const orderData = {
      order_number: orderNumberData,
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

    return this.getById(data.id);
  },

  async updateStatus(id: string, status: Order['status'], employeeId?: string): Promise<Order> {
    const updateData: any = { 
      status,
      updated_at: new Date().toISOString()
    };
    
    if (status === 'completed') {
      updateData.completed_time = new Date().toISOString();
    }
    
    if (employeeId) {
      updateData.employee_id = employeeId;
    }

    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id);
    
    if (error) handleError(error, 'update order status');
    
    return this.getById(id);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id);
    
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

// ==================== DAILY SALES ====================

export const dailySalesService = {
  async getByDate(date: Date): Promise<any> {
    const { data, error } = await supabase
      .from('daily_sales_summary')
      .select('*')
      .eq('date', date.toISOString().split('T')[0])
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      handleError(error, 'fetch daily sales');
    }
    
    return data;
  },

  async getDateRange(startDate: Date, endDate: Date): Promise<any[]> {
    const { data, error } = await supabase
      .from('daily_sales_summary')
      .select('*')
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: true });
    
    if (error) handleError(error, 'fetch daily sales range');
    
    return data || [];
  }
};