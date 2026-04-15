import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { supabase } from '../../Backend/src/config/supabase';

export const receiptService = {
  /**
   * Generates a PDF from a DOM element, uploads it to Supabase, and returns the public URL.
   */
  async generateAndUploadReceipt(elementId: string, orderNumber: string): Promise<string | null> {
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        console.error("Receipt element not found");
        return null;
      }

      // 1. Generate Canvas
      const canvas = await html2canvas(element, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false
      });

      // 2. Convert to PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      const pdfBlob = pdf.output('blob');

      // 3. Upload to Supabase Storage
      const fileName = `receipt_${orderNumber}_${Date.now()}.pdf`;
      const { error } = await supabase.storage
        .from('receipts')
        .upload(fileName, pdfBlob, {
          contentType: 'application/pdf',
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error("Supabase Storage Upload Error:", error);
        throw error;
      }

      // 4. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(fileName);

      console.log("PDF generated and uploaded successfully:", publicUrl);
      return publicUrl;
    } catch (err) {
      console.error("Critical error in generateAndUploadReceipt:", err);
      // Log specific parts of the error if they exist
      if (err instanceof Error) {
        console.error("Message:", err.message);
      }
      return null;
    }
  }
};
