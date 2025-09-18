import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SupplierOrders from '../SupplierOrders';
import * as supabaseService from '../../services/supabaseService';

// Mock the services
jest.mock('../../services/supabaseService', () => ({
  supplierOrdersService: {
    getAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    updateStatus: jest.fn(),
    generateAutoOrders: jest.fn(),
  },
  suppliersService: {
    getAll: jest.fn(),
  },
  ingredientsService: {
    getAll: jest.fn(),
  },
  subscriptions: {
    supplierOrders: jest.fn(() => ({ unsubscribe: jest.fn() })),
  },
}));

// Mock data
const mockSuppliers = [
  {
    id: 'supplier-1',
    businessId: 'test-business-id',
    name: 'Pizza Supplier Co',
    contactPerson: 'John Doe',
    email: 'john@pizzasupplier.com',
    phone: '123-456-7890',
    address: '123 Pizza St',
    deliveryDays: ['Monday', 'Wednesday'],
    orderSubmissionDays: ['Friday'],
    minimumOrderAmount: 100,
    leadTime: 2,
    autoOrderEnabled: true,
    paymentTerms: 'Net 30',
    deliveryMethods: ['delivery', 'pickup'],
    notes: '',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockIngredients = [
  {
    id: 'ingredient-1',
    name: 'Pizza Dough',
    costPerUnit: 2.50,
    unit: 'lbs',
    supplier: 'Pizza Supplier Co',
    category: 'Base',
    isAvailable: true,
    lastUpdated: new Date(),
  },
  {
    id: 'ingredient-2',
    name: 'Mozzarella Cheese',
    costPerUnit: 4.00,
    unit: 'lbs',
    supplier: 'Pizza Supplier Co',
    category: 'Cheese',
    isAvailable: true,
    lastUpdated: new Date(),
  },
  {
    id: 'ingredient-3',
    name: 'Burger Buns',
    costPerUnit: 1.50,
    unit: 'pack',
    supplier: 'Burger Supplier Inc',
    category: 'Base',
    isAvailable: true,
    lastUpdated: new Date(),
  },
];

describe('SupplierOrders - Add Item Flow', () => {
  beforeEach(() => {
    // Setup mock returns
    (supabaseService.supplierOrdersService.getAll as jest.Mock).mockResolvedValue([]);
    (supabaseService.suppliersService.getAll as jest.Mock).mockResolvedValue(mockSuppliers);
    (supabaseService.ingredientsService.getAll as jest.Mock).mockResolvedValue(mockIngredients);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should maintain ingredient selection when adding new items', async () => {
    const user = userEvent;
    
    render(<SupplierOrders />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('New Order')).toBeInTheDocument();
    });

    // Step 1: Click new order
    const newOrderButton = screen.getByText('New Order');
    await user.click(newOrderButton);

    // Wait for dialog to open
    await waitFor(() => {
      expect(screen.getByText('Create New Supplier Order')).toBeInTheDocument();
    });

    // Step 2: Select supplier
    const supplierInput = screen.getByLabelText('Supplier');
    await user.click(supplierInput);
    
    // Wait for supplier options to appear
    await waitFor(() => {
      expect(screen.getByText('Pizza Supplier Co')).toBeInTheDocument();
    });
    
    const pizzaSupplierOption = screen.getByText('Pizza Supplier Co');
    await user.click(pizzaSupplierOption);

    // Step 3: Click add item
    const addItemButton = screen.getByText('Add Item');
    await user.click(addItemButton);

    // Verify first ingredient dropdown appears
    const ingredientInputs = screen.getAllByLabelText('Ingredient');
    expect(ingredientInputs).toHaveLength(1);

    // Step 4: Select ingredient (Pizza Dough)
    await user.click(ingredientInputs[0]);
    
    await waitFor(() => {
      expect(screen.getByText('Pizza Dough')).toBeInTheDocument();
    });
    
    const pizzaDoughOption = screen.getByText('Pizza Dough');
    await user.click(pizzaDoughOption);

    // Verify Pizza Dough is selected
    await waitFor(() => {
      const selectedIngredient = screen.getByDisplayValue('Pizza Dough');
      expect(selectedIngredient).toBeInTheDocument();
    });

    // Step 5: Click add item again
    await user.click(addItemButton);

    // Step 6: Verify the previous ingredient still displays 'Pizza Dough'
    await waitFor(() => {
      const ingredientInputsAfterAdd = screen.getAllByLabelText('Ingredient');
      expect(ingredientInputsAfterAdd).toHaveLength(2);
      
      // The first ingredient should still show 'Pizza Dough'
      const firstIngredientInput = ingredientInputsAfterAdd[0];
      const pizzaDoughDisplay = screen.getByDisplayValue('Pizza Dough');
      expect(pizzaDoughDisplay).toBeInTheDocument();
    });
  });

  test('should filter ingredients by selected supplier', async () => {
    const user = userEvent;
    
    render(<SupplierOrders />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('New Order')).toBeInTheDocument();
    });

    // Click new order
    const newOrderButton = screen.getByText('New Order');
    await user.click(newOrderButton);

    // Select supplier
    const supplierInput = screen.getByLabelText('Supplier');
    await user.click(supplierInput);
    
    await waitFor(() => {
      expect(screen.getByText('Pizza Supplier Co')).toBeInTheDocument();
    });
    
    const pizzaSupplierOption = screen.getByText('Pizza Supplier Co');
    await user.click(pizzaSupplierOption);

    // Add item
    const addItemButton = screen.getByText('Add Item');
    await user.click(addItemButton);

    // Click ingredient dropdown
    const ingredientInput = screen.getByLabelText('Ingredient');
    await user.click(ingredientInput);

    // Should only show ingredients from Pizza Supplier Co
    await waitFor(() => {
      expect(screen.getByText('Pizza Dough')).toBeInTheDocument();
      expect(screen.getByText('Mozzarella Cheese')).toBeInTheDocument();
      expect(screen.queryByText('Burger Buns')).not.toBeInTheDocument(); // This is from different supplier
    });
  });
});