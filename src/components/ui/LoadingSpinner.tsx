import React from 'react';
import { motion } from 'framer-motion';
import Logo from '@/components/Logo';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center">
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
          className="mb-6"
        >
          <Logo size="xl" variant="light" />
        </motion.div>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-gray-200 border-t-primary-500 rounded-full mx-auto mb-4"
        />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-gray-800 text-lg font-medium"
        >
          Loading...
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-gray-600 text-sm mt-2"
        >
          Antilope Centre Beauté
        </motion.p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
