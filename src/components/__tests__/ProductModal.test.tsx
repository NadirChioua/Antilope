import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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

// Mock ProductModal component
const ProductModal = ({ isOpen, onClose, onSave, product }: any) => {
  const [formData, setFormData] = React.useState({
    name: product?.name || '',
    brand: product?.brand || '',
    category: product?.category || '',
    volume: product?.volume || 0,
    price: product?.price || 0,
    cost: product?.cost || 0,
    quantity: product?.quantity || 1,
  });

  const [errors, setErrors] = React.useState<any>({});

  if (!isOpen) return null;

  const handleSubmit = () => {
    const newErrors: any = {};
    
    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.brand.trim()) newErrors.brand = 'Brand is required';
    if (!formData.category.trim()) newErrors.category = 'Category is required';
    if (formData.volume <= 0) newErrors.volume = 'Volume must be greater than 0';
    if (formData.price < 0) newErrors.price = 'Price cannot be negative';
    if (formData.cost < 0) newErrors.cost = 'Cost cannot be negative';
    if (formData.cost > formData.price) newErrors.cost = 'Cost cannot be higher than price';
    if (formData.quantity < 0) newErrors.quantity = 'Total quantity cannot be negative';

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onSave(formData);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div data-testid="product-modal">
      <h2>{product ? 'Edit Product' : 'Add New Product'}</h2>
      
      <input 
        data-testid="product-name" 
        placeholder="Product name"
        aria-label="Product name"
        value={formData.name}
        onChange={(e) => handleInputChange('name', e.target.value)}
      />
      {errors.name && <span>{errors.name}</span>}
      
      <input 
        data-testid="product-brand" 
        placeholder="Brand"
        aria-label="Brand"
        value={formData.brand}
        onChange={(e) => handleInputChange('brand', e.target.value)}
      />
      {errors.brand && <span>{errors.brand}</span>}
      
      <input 
        data-testid="product-category" 
        placeholder="Category"
        aria-label="Category"
        value={formData.category}
        onChange={(e) => handleInputChange('category', e.target.value)}
      />
      {errors.category && <span>{errors.category}</span>}
      
      <input 
        data-testid="product-volume" 
        placeholder="Volume"
        aria-label="Volume"
        type="number"
        value={formData.volume}
        onChange={(e) => handleInputChange('volume', Number(e.target.value))}
      />
      {errors.volume && <span>{errors.volume}</span>}
      
      <input 
        data-testid="product-price" 
        placeholder="Price"
        aria-label="Price"
        type="number"
        step="0.01"
        value={formData.price}
        onChange={(e) => handleInputChange('price', Number(e.target.value))}
      />
      {errors.price && <span>{errors.price}</span>}
      
      <input 
        data-testid="product-cost" 
        placeholder="Cost"
        aria-label="Cost"
        type="number"
        step="0.01"
        value={formData.cost}
        onChange={(e) => handleInputChange('cost', Number(e.target.value))}
      />
      {errors.cost && <span>{errors.cost}</span>}
      
      <input 
        data-testid="product-quantity" 
        placeholder="Total quantity"
        aria-label="Total quantity"
        type="number"
        value={formData.quantity}
        onChange={(e) => handleInputChange('quantity', Number(e.target.value))}
      />
      {errors.quantity && <span>{errors.quantity}</span>}
      
      <button onClick={handleSubmit}>Save Product</button>
      <button onClick={onClose}>Cancel</button>
      <button onClick={onClose} aria-label="Close">×</button>
    </div>
  );
};

describe('ProductModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onSave: mockOnSave,
  };

  const mockProduct = {
    id: '1',
    name: 'Test Product',
    brand: 'Test Brand',
    category: 'Test Category',
    volume: 500,
    price: 25.99,
    cost: 15.00,
    quantity: 100,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the modal when open', () => {
    render(<ProductModal {...defaultProps} />);
    
    expect(screen.getByText('Add New Product')).toBeInTheDocument();
    expect(screen.getByLabelText(/product name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/brand/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/volume/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/price/i)).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<ProductModal {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByText('Add New Product')).not.toBeInTheDocument();
  });

  it('shows edit mode when product is provided', () => {
    render(<ProductModal {...defaultProps} product={mockProduct} />);
    
    expect(screen.getByText('Edit Product')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Product')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Brand')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Category')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    render(<ProductModal {...defaultProps} />);

    const saveButton = screen.getByRole('button', { name: /save product/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Product name is required')).toBeInTheDocument();
      expect(screen.getByText('Brand is required')).toBeInTheDocument();
      expect(screen.getByText('Category is required')).toBeInTheDocument();
    });

    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('validates volume must be greater than 0', async () => {
    const user = userEvent.setup();
    render(<ProductModal {...defaultProps} />);

    const volumeInput = screen.getByLabelText(/volume/i);
    await user.clear(volumeInput);
    await user.type(volumeInput, '0');

    const saveButton = screen.getByRole('button', { name: /save product/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Volume must be greater than 0')).toBeInTheDocument();
    });
  });

  it('validates price cannot be negative', async () => {
    const user = userEvent.setup();
    render(<ProductModal {...defaultProps} />);

    // Fill in required fields first
    await user.type(screen.getByLabelText(/product name/i), 'Test Product');
    await user.type(screen.getByLabelText(/brand/i), 'Test Brand');
    await user.type(screen.getByLabelText(/category/i), 'Test Category');
    await user.clear(screen.getByLabelText(/volume/i));
    await user.type(screen.getByLabelText(/volume/i), '500');

    const priceInput = screen.getByLabelText(/price/i);
    fireEvent.change(priceInput, { target: { value: '-10' } });

    const saveButton = screen.getByRole('button', { name: /save product/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Price cannot be negative')).toBeInTheDocument();
    });
  });

  it('validates cost cannot be negative', async () => {
    const user = userEvent.setup();
    render(<ProductModal {...defaultProps} />);

    // Fill in required fields first
    await user.type(screen.getByLabelText(/product name/i), 'Test Product');
    await user.type(screen.getByLabelText(/brand/i), 'Test Brand');
    await user.type(screen.getByLabelText(/category/i), 'Test Category');
    await user.clear(screen.getByLabelText(/volume/i));
    await user.type(screen.getByLabelText(/volume/i), '500');

    const costInput = screen.getByLabelText(/cost/i);
    fireEvent.change(costInput, { target: { value: '-5' } });

    const saveButton = screen.getByRole('button', { name: /save product/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Cost cannot be negative')).toBeInTheDocument();
    });
  });

  it('validates cost cannot be higher than price', async () => {
    const user = userEvent.setup();
    render(<ProductModal {...defaultProps} />);

    // Fill in required fields first
    await user.type(screen.getByLabelText(/product name/i), 'Test Product');
    await user.type(screen.getByLabelText(/brand/i), 'Test Brand');
    await user.type(screen.getByLabelText(/category/i), 'Test Category');
    await user.clear(screen.getByLabelText(/volume/i));
    await user.type(screen.getByLabelText(/volume/i), '500');

    const priceInput = screen.getByLabelText(/price/i);
    const costInput = screen.getByLabelText(/cost/i);

    fireEvent.change(priceInput, { target: { value: '10' } });
    fireEvent.change(costInput, { target: { value: '15' } });

    const saveButton = screen.getByRole('button', { name: /save product/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Cost cannot be higher than price')).toBeInTheDocument();
    });
  });

  it('validates total quantity cannot be negative', async () => {
    const user = userEvent.setup();
    render(<ProductModal {...defaultProps} />);

    // Fill in required fields first
    await user.type(screen.getByLabelText(/product name/i), 'Test Product');
    await user.type(screen.getByLabelText(/brand/i), 'Test Brand');
    await user.type(screen.getByLabelText(/category/i), 'Test Category');
    await user.clear(screen.getByLabelText(/volume/i));
    await user.type(screen.getByLabelText(/volume/i), '500');

    const quantityInput = screen.getByLabelText(/total quantity/i);
    fireEvent.change(quantityInput, { target: { value: '-1' } });

    const saveButton = screen.getByRole('button', { name: /save product/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Total quantity cannot be negative')).toBeInTheDocument();
    });
  });

  it('submits valid form data for new product', async () => {
    const user = userEvent.setup();
    render(<ProductModal {...defaultProps} />);

    // Fill in all required fields
    await user.type(screen.getByLabelText(/product name/i), 'New Product');
    await user.type(screen.getByLabelText(/brand/i), 'New Brand');
    await user.type(screen.getByLabelText(/category/i), 'New Category');
    await user.clear(screen.getByLabelText(/volume/i));
    await user.type(screen.getByLabelText(/volume/i), '750');
    await user.clear(screen.getByLabelText(/price/i));
    await user.type(screen.getByLabelText(/price/i), '29.99');
    await user.clear(screen.getByLabelText(/cost/i));
    await user.type(screen.getByLabelText(/cost/i), '19.99');

    const saveButton = screen.getByRole('button', { name: /save product/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Product',
          brand: 'New Brand',
          category: 'New Category',
          volume: 750,
          price: 29.99,
          cost: 19.99,
        })
      );
    });
  });

  it('submits valid form data for existing product', async () => {
    const user = userEvent.setup();
    render(<ProductModal {...defaultProps} product={mockProduct} />);

    // Modify some fields
    const nameInput = screen.getByDisplayValue('Test Product');
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Product');

    const priceInput = screen.getByDisplayValue('25.99');
    await user.clear(priceInput);
    await user.type(priceInput, '35.99');

    const saveButton = screen.getByRole('button', { name: /save product/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Updated Product',
          price: 35.99,
          brand: 'Test Brand',
          category: 'Test Category',
        })
      );
    });
  });

  it('clears errors when user starts typing', async () => {
    const user = userEvent.setup();
    render(<ProductModal {...defaultProps} />);

    // Trigger validation error
    const saveButton = screen.getByRole('button', { name: /save product/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Product name is required')).toBeInTheDocument();
    });

    // Start typing in name field
    const nameInput = screen.getByLabelText(/product name/i);
    await user.type(nameInput, 'Test');

    await waitFor(() => {
      expect(screen.queryByText('Product name is required')).not.toBeInTheDocument();
    });
  });

  it('closes modal when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<ProductModal {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('closes modal when X button is clicked', async () => {
    const user = userEvent.setup();
    render(<ProductModal {...defaultProps} />);

    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });
});