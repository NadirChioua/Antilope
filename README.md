# 🦌 Antilope Centre Beauté - Salon Management System

A modern, professional, and fully responsive web application for beauty salon management, built with React, TypeScript, and Tailwind CSS.

## ✨ **Features**

### 🎯 **Core Functionality**
- **Client Registration & Management** - Add, edit, search, and track client history
- **Smart Point of Sale (POS)** - Streamlined service selection with auto-product mapping
- **Product Inventory Management** - Stock tracking with low-stock alerts
- **Service Management** - Create services with required product mappings
- **Commission System** - Track staff earnings and performance
- **Multi-language Support** - English, Arabic (Darija), and French
- **Role-based Access Control** - Admin and Staff permissions

### 🧠 **Smart Features**
- **Auto-product Mapping** - Services automatically include required products
- **Stock Validation** - Real-time stock availability checking
- **Smart Alerts** - Low stock warnings and notifications
- **Commission Tracking** - Automatic calculation of staff earnings
- **WhatsApp Integration** - Send receipts directly to clients

### 📱 **User Experience**
- **Mobile-First Design** - Fully responsive across all devices
- **Dark Theme** - Professional dark mode with gold accents
- **Smooth Animations** - Framer Motion powered transitions
- **Intuitive Navigation** - Sidebar for desktop, bottom nav for mobile
- **Real-time Updates** - Live data synchronization

## 🚀 **Getting Started**

### **Prerequisites**
- Node.js 18+ 
- npm or yarn
- A Supabase account (free tier is sufficient)

### **Quick Setup**

1. **Clone and Install**
```bash
# Clone the repository
git clone <repository-url>
cd antilope-centre-beaute

# Install dependencies
npm install
```

2. **Supabase Setup**
   - Create a new project at [Supabase](https://supabase.com/)
   - Get your Project URL and Anon Key from Settings → API
   - Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. **Database Setup**
   - In Supabase dashboard, go to SQL Editor
   - Copy and run the contents of `database-schema.sql`
   - This creates all tables, triggers, and sample data

4. **Authentication Setup**
   - In Supabase dashboard, go to Authentication → Users
   - Create users with emails: `admin@antilope.com` and `staff@antilope.com`
   - Set strong passwords for both users

5. **Run the Application**
```bash
npm run dev
```

### **Access the Application**
- **URL**: http://localhost:3000
- **Admin Login**: `admin@antilope.com` / `[your-password]`
- **Staff Login**: `staff@antilope.com` / `[your-password]`

### **Production Deployment**

#### Frontend (Vercel)
1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy

#### Backend (Supabase)
- Your backend is already deployed with Supabase!
- Deploy Edge Functions using: `supabase functions deploy process-sale`

For detailed setup instructions, see [SETUP.md](SETUP.md)

## 🎨 **Design System**

### **Color Palette**
- **Primary**: `#D4AF37` (Gold)
- **Background**: `#000000` (Dark)
- **Surface**: `#1e293b` (Dark Blue)
- **Text**: `#ffffff` (White)
- **Accent**: `#F5F5F5` (Neutral)

### **Typography**
- **Primary Font**: Inter
- **Secondary Font**: Montserrat
- **RTL Support**: Arabic language support

### **Components**
- **Cards**: Rounded corners with subtle shadows
- **Buttons**: Gold primary, dark secondary variants
- **Inputs**: Dark theme with gold focus states
- **Animations**: Smooth transitions and micro-interactions

## 🏗️ **Architecture**

### **Frontend Stack**
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + Custom Components
- **Animations**: Framer Motion
- **State Management**: React Context API
- **Routing**: React Router DOM

### **Project Structure**
```
src/
├── components/          # Reusable UI components
├── contexts/           # Global state management
├── layouts/            # Page layouts (Admin/Staff)
├── pages/              # Application pages
│   ├── admin/         # Admin-only pages
│   └── staff/         # Staff pages
├── types/              # TypeScript interfaces
└── utils/              # Helper functions
```

### **Key Components**
- **AdminLayout** - Full-featured admin interface
- **StaffLayout** - Simplified staff interface
- **Dashboard** - Comprehensive KPIs and analytics
- **POS System** - Smart sales management
- **Client Management** - Customer database
- **Product Inventory** - Stock management

## 🔐 **Authentication & Roles**

### **Admin Access**
- Full access to all features
- Dashboard with comprehensive analytics
- Client, service, and product management
- Staff commission oversight
- System settings and configuration

### **Staff Access**
- Point of Sale (POS) system
- Client history viewing
- Commission tracking
- Limited to essential functions

## 🌐 **Internationalization**

### **Supported Languages**
- **English** - Primary interface
- **Arabic (Darija)** - Moroccan dialect
- **French** - Regional language

### **RTL Support**
- Full right-to-left layout for Arabic
- Proper text direction handling
- Cultural UI adaptations

## 📊 **Dashboard Features**

### **Key Performance Indicators**
- Daily, weekly, and monthly revenue
- Client count and visit statistics
- Service performance metrics
- Staff commission tracking
- Stock level monitoring

### **Smart Analytics**
- Top-performing services
- Staff performance rankings
- Recent sales history
- Low stock alerts
- Revenue trends

## 🛒 **POS System - Streamlined & Elegant**

### **🎯 Step-by-Step Sales Flow**
The new POS system follows a **conversational sales approach** that feels natural and intuitive:

#### **Step 1: Client Selection**
- **Live Search**: Instant client lookup by name or phone
- **Client Cards**: Beautiful client profiles with visit history and spending
- **Quick Add**: [+ Add New Client] button opens elegant modal form
- **Smart Selection**: One-click client selection moves to next step

#### **Step 2: Service Selection**
- **Service Grid**: Clean, card-based service selection
- **Search & Filter**: Find services quickly by name or category
- **Rich Information**: Each service shows price, duration, and product requirements
- **Visual Feedback**: Hover effects and smooth transitions

#### **Step 3: Products Review (Auto-Filled)**
- **Automatic Mapping**: Required products are automatically loaded
- **Stock Status**: Real-time stock availability with color-coded indicators
- **Usage Preview**: See exactly what products will be used
- **Smart Warnings**: Low stock and out-of-stock alerts

#### **Step 4: Sale Confirmation**
- **Complete Summary**: Client, service, products, and total
- **Payment Selection**: Cash or card payment method
- **Final Review**: All details before confirming
- **One-Click Confirm**: Process sale with single button

### **🧠 Smart Features**
- **Auto-Product Mapping**: No manual product selection needed
- **Real-Time Stock Validation**: Prevents overselling
- **Commission Calculation**: Automatic staff earnings tracking
- **WhatsApp Integration**: Send receipts directly to clients
- **Sales History**: Complete transaction tracking

### **📱 Mobile-First Design**
- **Touch-Friendly**: Large buttons and intuitive gestures
- **Responsive Layout**: Works perfectly on all screen sizes
- **Fast Navigation**: Quick access to all functions
- **Clean Interface**: No clutter, just essential information

### **⚡ Performance Features**
- **Instant Search**: Live filtering as you type
- **Smooth Transitions**: Framer Motion powered animations
- **Real-Time Updates**: Live stock and pricing information
- **Offline Capable**: Works even with poor internet connection

## 📱 **Mobile Experience**

### **Responsive Design**
- Mobile-first approach
- Touch-friendly interfaces
- Optimized navigation
- Adaptive layouts
- Performance optimization

### **Mobile Features**
- Bottom navigation bar
- Swipe gestures
- Touch-friendly buttons
- Optimized forms
- Mobile-specific interactions

## 🔧 **Development**

### **Scripts**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### **Environment Variables**
```env
# Required for Supabase integration
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: For Edge Functions (if using custom backend)
VITE_SUPABASE_SERVICE_KEY=your-service-key-here
```

## 🚀 **Deployment**

### **Frontend Deployment (Vercel)**

1. **Build the Application**
```bash
npm run build
```

2. **Deploy to Vercel**
   - Connect your GitHub repository to Vercel
   - Add environment variables in Vercel dashboard:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
   - Deploy automatically on push to main branch

### **Backend Deployment (Supabase)**

Your backend is already deployed with Supabase! To deploy Edge Functions:

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Deploy Edge Functions
supabase functions deploy process-sale
```

### **Production Considerations**
- ✅ Environment variables configured
- ✅ Database connection via Supabase
- ✅ SSL certificate (handled by Vercel/Supabase)
- ✅ Performance optimization (Supabase caching)
- ✅ Row Level Security (RLS) enabled
- ✅ Automatic backups (Supabase)

## 🔮 **Future Enhancements**

### **Planned Features**
- **Barcode Scanner** - Product identification
- **Excel Import/Export** - Data management
- **WhatsApp API Integration** - Automated messaging
- **Advanced Analytics** - Business intelligence
- **Multi-location Support** - Chain management
- **Mobile App** - Native applications

### **Technical Improvements**
- **Real-time Updates** - WebSocket integration
- **Offline Support** - Service worker
- **Advanced Caching** - Performance optimization
- **API Rate Limiting** - Security enhancement
- **Automated Testing** - Quality assurance

## 🤝 **Contributing**

### **Development Guidelines**
1. Follow TypeScript best practices
2. Use Tailwind CSS for styling
3. Implement responsive design
4. Add proper error handling
5. Include loading states
6. Write clean, documented code

### **Code Style**
- **Components**: Functional components with hooks
- **Styling**: Tailwind CSS classes
- **State**: React Context for global state
- **Types**: Comprehensive TypeScript interfaces
- **Performance**: Optimized re-renders

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 **Support**

### **Documentation**
- [User Guide](docs/user-guide.md)
- [API Reference](docs/api-reference.md)
- [Deployment Guide](docs/deployment.md)

### **Contact**
- **Email**: support@antilope-centre.com
- **Phone**: +212 6 XX XX XX XX
- **Address**: Tangier, Morocco

---

**Built with ❤️ for Antilope Centre Beauté**

*Professional salon management made simple and beautiful.*
