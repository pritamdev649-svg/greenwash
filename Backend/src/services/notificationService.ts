/**
 * Notification Service
 * Handles automated messaging via WhatsApp/SMS
 */
export const notificationService = {
  /**
   * Generates a WhatsApp API link for manual sending (Fallback)
   */
  getWhatsAppLink(mobile: string, message: string) {
    const cleanedMobile = mobile.replace(/\D/g, '');
    const phone = cleanedMobile.startsWith('91') ? cleanedMobile : '91' + cleanedMobile;
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${phone}?text=${encodedMessage}`;
  },

  /**
   * Automated Message Sender via Meta WhatsApp Cloud API
   * Requirement: WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID in env.
   */
  async sendAutomatedWhatsApp(mobile: string, message: string, mediaUrl?: string) {
    const accessToken = import.meta.env?.VITE_WHATSAPP_TOKEN;
    const phoneNumberId = import.meta.env?.VITE_WHATSAPP_PHONE_ID;
    
    // Fallback: Clean phone number
    const cleanedMobile = mobile.replace(/\D/g, '');
    const to = cleanedMobile.startsWith('91') ? cleanedMobile : '91' + cleanedMobile;
    
    // For local development or missing keys, log only
    if (!accessToken || accessToken === 'PASTE_ACCESS_TOKEN_HERE') {
      console.warn("WhatsApp API Credentials NOT FOUND in .env. Falling back to simulation mode.");
      console.log(`[SIMULATED WhatsApp to ${to}]: ${message} ${mediaUrl ? `(Media: ${mediaUrl})` : ''}`);
      return { success: true, simulated: true };
    }

    try {
      const url = `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`;
      
      let data: any = {
        messaging_product: 'whatsapp',
        to: to,
      };

      if (mediaUrl) {
        // Send as document with text as caption
        data.type = 'document';
        data.document = {
          link: mediaUrl,
          caption: message,
          filename: 'Receipt.pdf'
        };
      } else {
        // Plain text message
        data.type = 'text';
        data.text = { body: message };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log("WhatsApp message sent successfully via API.");
        return { success: true, result };
      } else {
        console.error("WhatsApp API Error:", result);
        return { success: false, error: result };
      }
    } catch (error) {
      console.error('Network error during WhatsApp automation:', error);
      return { success: false, error };
    }
  }
};
