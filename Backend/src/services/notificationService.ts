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
  async sendAutomatedWhatsApp(mobile: string, message: string) {
    // 1. Get credentials from Vite env
    const accessToken = import.meta.env?.VITE_WHATSAPP_TOKEN;
    const phoneNumberId = import.meta.env?.VITE_WHATSAPP_PHONE_ID;
    
    // Default backup number if needed for identification
    const sourceNumber = "9451034909"; 

    console.log(`[Notification Service] Attempting automated WhatsApp via ${sourceNumber} to ${mobile}`);

    if (!accessToken || !phoneNumberId) {
      console.warn("WhatsApp API Credentials NOT FOUND in .env. Falling back to simulation mode.");
      console.log(`Simulated Message: "${message}"`);
      return { success: false, error: 'Credentials Missing', status: 'simulated' };
    }

    try {
      const cleanedMobile = mobile.replace(/\D/g, '');
      const fullMobile = cleanedMobile.startsWith('91') ? cleanedMobile : '91' + cleanedMobile;

      const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: fullMobile,
          type: 'text',
          text: { body: message }
        })
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
