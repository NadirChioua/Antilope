import { whatsappService } from '@/services/whatsappService';
import { dailyReportService } from '@/services/dailyReportService';

// Test configuration
const TEST_CONFIG = {
  bossNumber: '+212 650-888884',
  testNumber: '+212 772-156819',
  useTestMode: true
};

export const testWhatsAppIntegration = async () => {
  console.log('🚀 Starting WhatsApp integration test...');
  
  try {
    // Test 1: Connection test
    console.log('📡 Testing WhatsApp connection...');
    const connectionResult = await whatsappService.testConnection();
    console.log('Connection test result:', connectionResult);
    
    // Test 2: Generate sample report
    console.log('📊 Generating sample daily report...');
    const sampleReportStats = await dailyReportService.generateDailyReport();
    const sampleReport = dailyReportService.formatReportMessage(sampleReportStats);
    console.log('Sample report generated:', sampleReport.substring(0, 200) + '...');
    
    // Test 3: Send test message
    console.log('📱 Sending test message...');
    const testMessage = {
      to: TEST_CONFIG.useTestMode ? TEST_CONFIG.testNumber : TEST_CONFIG.bossNumber,
      message: `🧪 TEST MESSAGE\n\nThis is a test of the automated WhatsApp reporting system.\n\nTime: ${new Date().toLocaleString()}\n\n${sampleReport.substring(0, 300)}...`
    };
    
    const sendResult = await whatsappService.sendMessage(testMessage);
    console.log('Message send result:', sendResult);
    
    console.log('✅ WhatsApp integration test completed successfully!');
    return {
      success: true,
      connectionTest: connectionResult,
      reportGenerated: true,
      messageSent: sendResult
    };
    
  } catch (error) {
    console.error('❌ WhatsApp integration test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Manual test function for development
export const runManualTest = () => {
  console.log('🔧 Running manual WhatsApp test...');
  testWhatsAppIntegration().then(result => {
    console.log('Test completed:', result);
  });
};