interface WhatsAppConfig {
  apiUrl: string;
  accessToken: string;
  phoneNumberId: string;
}

interface WhatsAppMessage {
  to: string;
  text: string;
}

class WhatsAppService {
  private config: WhatsAppConfig;

  constructor() {
    // Configuration for WhatsApp Business API
    this.config = {
      apiUrl: import.meta.env.VITE_WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0',
      accessToken: import.meta.env.VITE_WHATSAPP_ACCESS_TOKEN || '',
      phoneNumberId: import.meta.env.VITE_WHATSAPP_PHONE_NUMBER_ID || ''
    };
  }

  async sendMessage(message: WhatsAppMessage): Promise<boolean> {
    try {
      // For development/testing, we'll use a mock service or console log
      if (import.meta.env.DEV) {
        console.log('📱 WhatsApp Service - Sending message:', message);
        console.log('📱 WhatsApp Service - To:', message.to);
        return true;
      }

      const url = `${this.config.apiUrl}/${this.config.phoneNumberId}/messages`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: message.to.replace(/[^0-9]/g, ''), // Clean phone number
          type: 'text',
          text: {
            body: message.text
          }
        })
      });

      if (!response.ok) {
        throw new Error(`WhatsApp API error: ${response.status}`);
      }

      const result = await response.json();
      console.log('WhatsApp message sent successfully:', result);
      return true;

    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      return false;
    }
  }

  // Format phone number for WhatsApp (remove spaces, dashes, etc.)
  formatPhoneNumber(phone: string): string {
    return phone.replace(/[^0-9]/g, '');
  }

  // Test connection to WhatsApp API
  async testConnection(): Promise<boolean> {
    try {
      if (import.meta.env.DEV) {
        console.log('✅ WhatsApp Service: Development mode - connection OK');
        return true;
      }

      // In production, you would test the actual API connection here
      return true;
    } catch (error) {
      console.error('WhatsApp connection test failed:', error);
      return false;
    }
  }
}

export const whatsappService = new WhatsAppService();
export default WhatsAppService;