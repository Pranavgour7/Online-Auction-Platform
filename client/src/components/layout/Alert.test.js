import React from 'react';
import { render, screen } from '@testing-library/react';
import Alert from './Alert';

describe('Alert Component Unit Tests', () => {
  test('returns null when no alert is provided', () => {
    const { container } = render(<Alert alert={null} />);
    expect(container.firstChild).toBeNull();
  });

  test('renders success alert message correctly', () => {
    const alertData = { msg: 'Auction created successfully!', type: 'success' };
    render(<Alert alert={alertData} />);
    
    const alertElement = screen.getByRole('alert');
    expect(alertElement).toBeInTheDocument();
    expect(alertElement).toHaveClass('alert-success');
    expect(screen.getByText('Auction created successfully!')).toBeInTheDocument();
  });

  test('renders danger alert message correctly', () => {
    const alertData = { msg: 'Invalid login credentials', type: 'danger' };
    render(<Alert alert={alertData} />);
    
    const alertElement = screen.getByRole('alert');
    expect(alertElement).toBeInTheDocument();
    expect(alertElement).toHaveClass('alert-danger');
    expect(screen.getByText('Invalid login credentials')).toBeInTheDocument();
  });
});

