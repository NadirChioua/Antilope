import React from 'react';
import POSInterface from '@/components/POSInterface';

const POS: React.FC = () => {
  const handleSaleComplete = (saleData: any) => {
    // Handle sale completion if needed
    console.log('Sale completed:', saleData);
  };

  return <POSInterface onSaleComplete={handleSaleComplete} />;
};

export default POS;
