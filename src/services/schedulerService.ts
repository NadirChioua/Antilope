import { whatsappService } from './whatsappService';
import { dailyReportService } from './dailyReportService';

interface SchedulerConfig {
  bossPhoneNumber: string;
  testPhoneNumber: string;
  sendTime: string; // Format: "HH:MM" (24-hour format)
  enabled: boolean;
  testMode: boolean;
}

class SchedulerService {
  private config: SchedulerConfig;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  constructor() {
    this.config = {
      bossPhoneNumber: '+212650888884',
      testPhoneNumber: '+212772156819',
      sendTime: '18:00', // 6 PM by default
      enabled: true,
      testMode: import.meta.env.DEV
    };
  }

  // Start the automated scheduler
  start(): void {
    if (this.isRunning) {
      console.log('📅 Scheduler is already running');
      return;
    }

    console.log('🚀 Starting automated daily report scheduler...');
    console.log(`📱 Boss number: ${this.config.bossPhoneNumber}`);
    console.log(`🧪 Test number: ${this.config.testPhoneNumber}`);
    console.log(`⏰ Send time: ${this.config.sendTime}`);
    console.log(`🔧 Test mode: ${this.config.testMode ? 'ON' : 'OFF'}`);

    // Check every minute if it's time to send the report
    this.intervalId = setInterval(() => {
      this.checkAndSendReport();
    }, 60000); // Check every minute

    this.isRunning = true;
    
    // Also check immediately when starting
    this.checkAndSendReport();
  }

  // Stop the scheduler
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('⏹️ Scheduler stopped');
  }

  // Check if it's time to send the report
  private async checkAndSendReport(): Promise<void> {
    if (!this.config.enabled) return;

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // Get HH:MM format
    
    // Check if it's the scheduled time
    if (currentTime === this.config.sendTime) {
      // Check if we already sent today's report
      const today = now.toISOString().split('T')[0];
      const lastSentDate = localStorage.getItem('lastReportSent');
      
      if (lastSentDate !== today) {
        console.log('⏰ Time to send daily report!');
        await this.sendDailyReport();
        localStorage.setItem('lastReportSent', today);
      }
    }
  }

  // Send the daily report
  async sendDailyReport(date?: string): Promise<boolean> {
    try {
      console.log('📊 Generating daily report...');
      
      // Generate the report
      const stats = await dailyReportService.generateDailyReport(date);
      const message = dailyReportService.formatReportMessage(stats);

      // Determine which phone number to use
      const phoneNumber = this.config.testMode 
        ? this.config.testPhoneNumber 
        : this.config.bossPhoneNumber;

      console.log(`📱 Sending report to: ${phoneNumber}`);
      
      // Send the WhatsApp message
      const success = await whatsappService.sendMessage({
        to: phoneNumber,
        text: message
      });

      if (success) {
        console.log('✅ Daily report sent successfully!');
        
        // Log the successful send
        this.logReportSent(phoneNumber, stats.totalRevenue);
        
        return true;
      } else {
        console.error('❌ Failed to send daily report');
        return false;
      }

    } catch (error) {
      console.error('❌ Error sending daily report:', error);
      return false;
    }
  }

  // Manual send for testing
  async sendTestReport(): Promise<boolean> {
    console.log('🧪 Sending test report...');
    return await this.sendDailyReport();
  }

  // Update configuration
  updateConfig(newConfig: Partial<SchedulerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Scheduler configuration updated:', this.config);
    
    // Save to localStorage for persistence
    localStorage.setItem('schedulerConfig', JSON.stringify(this.config));
  }

  // Load configuration from localStorage
  loadConfig(): void {
    const savedConfig = localStorage.getItem('schedulerConfig');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        this.config = { ...this.config, ...parsed };
        console.log('📋 Loaded scheduler configuration from storage');
      } catch (error) {
        console.error('Error loading scheduler config:', error);
      }
    }
  }

  // Get current configuration
  getConfig(): SchedulerConfig {
    return { ...this.config };
  }

  // Get scheduler status
  getStatus(): { isRunning: boolean; config: SchedulerConfig; nextSendTime: string } {
    const now = new Date();
    const [hours, minutes] = this.config.sendTime.split(':').map(Number);
    
    const nextSend = new Date();
    nextSend.setHours(hours, minutes, 0, 0);
    
    // If the time has passed today, set for tomorrow
    if (nextSend <= now) {
      nextSend.setDate(nextSend.getDate() + 1);
    }

    return {
      isRunning: this.isRunning,
      config: this.config,
      nextSendTime: nextSend.toLocaleString('fr-FR')
    };
  }

  // Log successful report sends
  private logReportSent(phoneNumber: string, revenue: number): void {
    const log = {
      timestamp: new Date().toISOString(),
      phoneNumber,
      revenue,
      testMode: this.config.testMode
    };

    const logs = JSON.parse(localStorage.getItem('reportLogs') || '[]');
    logs.push(log);
    
    // Keep only last 30 logs
    if (logs.length > 30) {
      logs.splice(0, logs.length - 30);
    }
    
    localStorage.setItem('reportLogs', JSON.stringify(logs));
  }

  // Get report sending history
  getReportHistory(): any[] {
    return JSON.parse(localStorage.getItem('reportLogs') || '[]');
  }

  // Enable/disable test mode
  setTestMode(enabled: boolean): void {
    this.config.testMode = enabled;
    console.log(`🧪 Test mode ${enabled ? 'enabled' : 'disabled'}`);
    this.updateConfig({ testMode: enabled });
  }

  // Set send time
  setSendTime(time: string): void {
    if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
      throw new Error('Invalid time format. Use HH:MM (24-hour format)');
    }
    
    this.config.sendTime = time;
    console.log(`⏰ Send time updated to: ${time}`);
    this.updateConfig({ sendTime: time });
  }
}

export const schedulerService = new SchedulerService();
export default SchedulerService;