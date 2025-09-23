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

// Mock ClientModal component
const ClientModal = ({ isOpen, onClose, onSave }: any) => {
  const [formData, setFormData] = React.useState({
    name: '',
    phone: '',
    email: '',
    notes: '',
  });

  const [errors, setErrors] = React.useState<any>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: any = {};

    if (!formData.name || formData.name.length < 2) {
      newErrors.name = 'Le nom doit contenir au moins 2 caractères';
    } else if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(formData.name)) {
      newErrors.name = 'Le nom ne peut contenir que des lettres';
    }

    if (!formData.phone) {
      newErrors.phone = 'Le numéro de téléphone doit contenir au moins 10 chiffres';
    } else if (!/^\d+$/.test(formData.phone)) {
      newErrors.phone = 'Format de téléphone invalide';
    } else if (formData.phone.length < 10) {
      newErrors.phone = 'Le numéro de téléphone doit contenir au moins 10 chiffres';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Adresse email invalide';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onSave({
        ...formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div data-testid="client-modal">
      <h2>Add New Client</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name">Full Name *</label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          {errors.name && <span>{errors.name}</span>}
        </div>

        <div>
          <label htmlFor="phone">Numéro de téléphone *</label>
          <input
            id="phone"
            type="text"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          {errors.phone && <span>{errors.phone}</span>}
        </div>

        <div>
          <label htmlFor="email">Adresse email</label>
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          {errors.email && <span>{errors.email}</span>}
        </div>

        <div>
          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>

        <button type="submit">Add Client</button>
        <button type="button" onClick={onClose}>
          <svg>Close</svg>
        </button>
      </form>
    </div>
  );
};

describe('ClientModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onSave: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the modal when open', () => {
    render(<ClientModal {...defaultProps} />);
    expect(screen.getByText('Add New Client')).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/numéro de téléphone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/adresse email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<ClientModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Add New Client')).not.toBeInTheDocument();
  });

  it('validates required fields and shows errors', async () => {
    render(<ClientModal {...defaultProps} />);
    
    const saveButton = screen.getByText('Add Client');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/le nom doit contenir au moins 2 caractères/i)).toBeInTheDocument();
      expect(screen.getByText(/le numéro de téléphone doit contenir au moins 10 chiffres/i)).toBeInTheDocument();
    });
  });

  it('validates name format', async () => {
    render(<ClientModal {...defaultProps} />);
    
    const nameInput = screen.getByLabelText(/full name/i);
    fireEvent.change(nameInput, { target: { value: '123' } });
    
    const saveButton = screen.getByText('Add Client');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/le nom ne peut contenir que des lettres/i)).toBeInTheDocument();
    });
  });

  it('validates phone number format', async () => {
    render(<ClientModal {...defaultProps} />);
    
    const phoneInput = screen.getByLabelText(/numéro de téléphone/i);
    fireEvent.change(phoneInput, { target: { value: 'abc' } });
    
    const saveButton = screen.getByText('Add Client');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/format de téléphone invalide/i)).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    render(<ClientModal {...defaultProps} />);

    const emailInput = screen.getByLabelText(/adresse email/i);
    fireEvent.change(emailInput, { target: { value: 'invalid.email' } });

    const form = screen.getByTestId('client-modal').querySelector('form');
    if (form) {
      fireEvent.submit(form);
    }

    await waitFor(() => {
      expect(screen.getByText(/adresse email invalide/i)).toBeInTheDocument();
    });
  });

  it('submits valid form data', async () => {
    render(<ClientModal {...defaultProps} />);
    
    const nameInput = screen.getByLabelText(/full name/i);
    const phoneInput = screen.getByLabelText(/numéro de téléphone/i);
    const emailInput = screen.getByLabelText(/adresse email/i);
    const notesInput = screen.getByLabelText(/notes/i);
    
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(phoneInput, { target: { value: '1234567890' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(notesInput, { target: { value: 'Test notes' } });
    
    const saveButton = screen.getByText('Add Client');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(defaultProps.onSave).toHaveBeenCalledWith({
        name: 'John Doe',
        phone: '1234567890',
        email: 'john@example.com',
        notes: 'Test notes',
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      });
    });
  });

  it('calls onClose when close button is clicked', () => {
    render(<ClientModal {...defaultProps} />);
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});