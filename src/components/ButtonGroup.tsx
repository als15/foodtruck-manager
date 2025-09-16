import React from 'react';
import { Stack, StackProps } from '@mui/material';

interface RTLButtonGroupProps extends StackProps {
  children: React.ReactNode;
}

/**
 * RTL-aware button group component that handles spacing properly
 * Uses Stack with proper inline spacing instead of gap
 */
export const RTLButtonGroup: React.FC<RTLButtonGroupProps> = ({ 
  children, 
  direction = 'row',
  spacing = 2,
  ...props 
}) => {
  return (
    <Stack
      direction={direction}
      spacing={spacing}
      {...props}
    >
      {children}
    </Stack>
  );
};

export default RTLButtonGroup;