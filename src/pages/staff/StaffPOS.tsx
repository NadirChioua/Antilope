import React from 'react';
import POSInterface from '@/components/POSInterface';
import toast from 'react-hot-toast';

const StaffPOS: React.FC = () => {
  const handleSaleComplete = (saleData: any) => {
    // Handle sale completion - could save to database, update inventory, etc.
    console.log('Sale completed:', saleData);
    toast.success('Sale recorded successfully!');
  };

  return <POSInterface onSaleComplete={handleSaleComplete} />;
};

export default StaffPOS;
