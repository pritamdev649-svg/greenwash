import React from 'react';
import { useNavigate } from 'react-router-dom';
import { OrderEntryForm } from '../components/OrderEntryForm';

const SaleOrder: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <OrderEntryForm 
        onClose={() => navigate('/orders')} 
        onSuccess={() => navigate('/orders')} 
      />
    </div>
  );
};

export default SaleOrder;
