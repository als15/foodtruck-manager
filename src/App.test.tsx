import React from 'react';
import { render, screen } from '@testing-library/react';
import Dashboard from './pages/Dashboard';

test('renders dashboard component', () => {
  render(<Dashboard />);
  const dashboardElement = screen.getByText(/Dashboard/i);
  expect(dashboardElement).toBeInTheDocument();
});
