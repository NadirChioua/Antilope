import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Send, Settings, Clock, MessageCircle, TestTube, Phone } from 'lucide-react';
import { schedulerService } from '@/services/schedulerService';
import { whatsappService } from '@/services/whatsappService';
import { dailyReportService } from '@/services/dailyReportService';
import { testWhatsAppIntegration } from '@/utils/testWhatsApp';
import { useLanguage } from '@/contexts/LanguageContext';
import toast from 'react-hot-toast';

const WhatsAppReportConfig: React.FC = () => {
  const { t } = useLanguage();
  const [config, setConfig] = useState(schedulerService.getConfig());
  const [status, setStatus] = useState(schedulerService.getStatus());
  const [isLoading, setIsLoading] = useState(false);
  const [reportHistory, setReportHistory] = useState(schedulerService.getReportHistory());

  useEffect(() => {
    // Load configuration on component mount
    schedulerService.loadConfig();
    setConfig(schedulerService.getConfig());
    setStatus(schedulerService.getStatus());
    setReportHistory(schedulerService.getReportHistory());

    // Update status every minute
    const interval = setInterval(() => {
      setStatus(schedulerService.getStatus());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleStartScheduler = () => {
    schedulerService.start();
    setStatus(schedulerService.getStatus());
    toast.success('📅 Planificateur automatique démarré!');
  };

  const handleStopScheduler = () => {
    schedulerService.stop();
    setStatus(schedulerService.getStatus());
    toast.success('⏹️ Planificateur automatique arrêté!');
  };

  const handleSendTestReport = async () => {
    setIsLoading(true);
    try {
      const success = await schedulerService.sendTestReport();
      if (success) {
        toast.success('🧪 Rapport de test envoyé avec succès!');
        setReportHistory(schedulerService.getReportHistory());
      } else {
        toast.error('❌ Échec de l\'envoi du rapport de test');
      }
    } catch (error) {
      console.error('Error sending test report:', error);
      toast.error('❌ Erreur lors de l\'envoi du rapport de test');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestIntegration = async () => {
    setIsLoading(true);
    try {
      toast.loading('🧪 Test de l\'intégration WhatsApp en cours...');
      const result = await testWhatsAppIntegration();
      
      if (result.success) {
        toast.success('✅ Test d\'intégration réussi! Vérifiez votre WhatsApp.');
      } else {
        toast.error(`❌ Test d\'intégration échoué: ${result.error}`);
      }
    } catch (error) {
      console.error('Error testing integration:', error);
      toast.error('❌ Erreur lors du test d\'intégration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfigUpdate = (field: string, value: any) => {
    const newConfig = { ...config, [field]: value };
    setConfig(newConfig);
    schedulerService.updateConfig({ [field]: value });
    toast.success('⚙️ Configuration mise à jour!');
  };

  const handleTimeChange = (time: string) => {
    try {
      schedulerService.setSendTime(time);
      setConfig(schedulerService.getConfig());
      toast.success(`⏰ Heure d'envoi mise à jour: ${time}`);
    } catch (error) {
      toast.error('❌ Format d\'heure invalide');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <MessageCircle className="w-6 h-6 text-green-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            Configuration WhatsApp - Rapports Automatiques
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${status.isRunning ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="font-medium">
                {status.isRunning ? 'Actif' : 'Inactif'}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Statut du planificateur
            </p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="font-medium">{config.sendTime}</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Heure d'envoi quotidien
            </p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <TestTube className="w-4 h-4 text-purple-600" />
              <span className="font-medium">
                {config.testMode ? 'Test' : 'Production'}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Mode actuel
            </p>
          </div>
        </div>
      </div>

      {/* Configuration */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Configuration
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Phone Numbers */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-1" />
                Numéro du Patron
              </label>
              <input
                type="tel"
                value={config.bossPhoneNumber}
                onChange={(e) => handleConfigUpdate('bossPhoneNumber', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+212 650-888884"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <TestTube className="w-4 h-4 inline mr-1" />
                Numéro de Test
              </label>
              <input
                type="tel"
                value={config.testPhoneNumber}
                onChange={(e) => handleConfigUpdate('testPhoneNumber', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+212 772-156819"
              />
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Heure d'envoi quotidien
              </label>
              <input
                type="time"
                value={config.sendTime}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Prochain envoi: {status.nextSendTime}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(e) => handleConfigUpdate('enabled', e.target.checked)}
                  className="mr-2"
                />
                Rapports automatiques activés
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.testMode}
                  onChange={(e) => handleConfigUpdate('testMode', e.target.checked)}
                  className="mr-2"
                />
                Mode test
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Contrôles
        </h3>
        
        <div className="flex flex-wrap gap-3">
          {!status.isRunning ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStartScheduler}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Play className="w-4 h-4" />
              Démarrer le Planificateur
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStopScheduler}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              <Pause className="w-4 h-4" />
              Arrêter le Planificateur
            </motion.button>
          )}
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSendTestReport}
            disabled={isLoading}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {isLoading ? 'Envoi...' : 'Envoyer Rapport Test'}
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleTestIntegration}
            disabled={isLoading}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            <TestTube className="w-4 h-4" />
            {isLoading ? 'Test...' : 'Test Intégration'}
          </motion.button>
        </div>
      </div>

      {/* Report History */}
      {reportHistory.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Historique des Envois
          </h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date/Heure
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Numéro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenus
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mode
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportHistory.slice(-10).reverse().map((log, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(log.timestamp).toLocaleString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.phoneNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.revenue?.toFixed(2)} MAD
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        log.testMode 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {log.testMode ? 'Test' : 'Production'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppReportConfig;