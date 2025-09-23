import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import Logo from '@/components/Logo';
import WhatsAppReportConfig from '@/components/admin/WhatsAppReportConfig';
import { schedulerService } from '@/services/schedulerService';

const WhatsAppReports: React.FC = () => {
  
  useEffect(() => {
    // Auto-start the scheduler when the page loads
    schedulerService.loadConfig();
    schedulerService.start();
    
    return () => {
      // Don't stop the scheduler when leaving the page
      // It should continue running in the background
    };
  }, []);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <Logo size="lg" variant="light" />
          <h1 className="text-3xl font-bold text-gray-800 text-elegant">
            Rapports WhatsApp Automatiques
          </h1>
        </div>
        <p className="text-gray-600 mt-1">
          Configuration et gestion des rapports quotidiens automatiques via WhatsApp
        </p>
      </motion.div>

      <WhatsAppReportConfig />
    </div>
  );
};

export default WhatsAppReports;