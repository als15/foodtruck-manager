import React from 'react';
import { render } from '@testing-library/react';
import SupplierOrders from '../SupplierOrders';

// Mock the services to prevent actual API calls
jest.mock('../../services/supabaseService', () => ({
  supplierOrdersService: {
    getAll: jest.fn().mockResolvedValue([]),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    updateStatus: jest.fn(),
    generateAutoOrders: jest.fn(),
  },
  suppliersService: {
    getAll: jest.fn().mockResolvedValue([]),
  },
  ingredientsService: {
    getAll: jest.fn().mockResolvedValue([]),
  },
  subscriptions: {
    supplierOrders: jest.fn(() => ({ unsubscribe: jest.fn() })),
  },
}));

describe('SupplierOrders Component', () => {
  test('renders without crashing', () => {
    render(<SupplierOrders />);
  });
});