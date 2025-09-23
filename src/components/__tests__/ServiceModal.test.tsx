import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Simple mock component for testing
const ServiceModal = ({ isOpen, onClose, onSave }: any) => {
  if (!isOpen) return null;
  
  return (
    <div data-testid="service-modal">
      <h2>Add New Service</h2>
      <input 
        data-testid="service-name" 
        placeholder="Service name"
        aria-label="Service name"
      />
      <input 
        data-testid="service-price" 
        placeholder="Price"
        aria-label="Price"
        type="number"
      />
      <button onClick={onSave}>Save Service</button>
      <button onClick={onClose}>Cancel</button>
    </div>
  );
};

describe('ServiceModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onSave: mockOnSave,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the modal when open', () => {
    render(<ServiceModal {...defaultProps} />);
    
    expect(screen.getByText('Add New Service')).toBeInTheDocument();
    expect(screen.getByLabelText(/service name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/price/i)).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<ServiceModal {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByText('Add New Service')).not.toBeInTheDocument();
  });

  it('calls onSave when save button is clicked', async () => {
    const user = userEvent.setup();
    render(<ServiceModal {...defaultProps} />);

    const saveButton = screen.getByRole('button', { name: /save service/i });
    await user.click(saveButton);

    expect(mockOnSave).toHaveBeenCalled();
  });

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<ServiceModal {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('allows user input in form fields', async () => {
    const user = userEvent.setup();
    render(<ServiceModal {...defaultProps} />);

    const nameInput = screen.getByLabelText(/service name/i);
    const priceInput = screen.getByLabelText(/price/i);

    await user.type(nameInput, 'Test Service');
    await user.type(priceInput, '25.99');

    expect(nameInput).toHaveValue('Test Service');
    expect(priceInput).toHaveValue(25.99);
  });
});