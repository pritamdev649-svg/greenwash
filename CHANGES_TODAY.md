# Green Wash Co - Development Changelog

## Changes Implemented Today (Oct 6, 2026)

### 1. Receipt Actions Separated
- **Replaced** the single "View Receipt" button with two distinct buttons: **Download Receipt** and **Share Receipt**.
- **Location**: Applied to the Customer History modal and the main Orders ledger (`Customers.tsx` and `Orders.tsx`).
- **Styling**: Added relevant icons (`Download` and `Share2` from `lucide-react`) and applied `cursor-pointer` to ensure the mouse turns into a hand when hovering over the buttons.
- **Functionality**: "Share Receipt" now reliably builds the receipt text (with due dates, balances, etc.) and seamlessly launches WhatsApp.

### 2. Smart "Share Payment Link" Feature
- **New Button**: Added a **Share Payment Link** button next to the receipt options.
- **Conditional Visibility**: This button only appears if the order has an outstanding balance (`order.balance_amount > 0`), ensuring fully paid customers aren't asked for payments.
- **WhatsApp Integration**: Includes a pre-drafted WhatsApp message stating the exact pending balance and providing an online payment link.

### 3. Integrated Payment QR Code Modal
- **Enhanced UI**: Upgraded the "Share Payment Link" button so that clicking it now opens a sleek, professional Payment QR Code modal on the screen.
- **Scannable QR**: The modal generates a real-time UPI QR Code containing the exact balance amount, making it effortless for walk-in customers to scan and pay instantly.
- **Convenient Sharing**: Included the "Share Link on WhatsApp" action directly inside the modal for seamless digital sharing.

### 4. Dynamic UPI & Banking Name Synchronization
- **Fixed Discrepancies**: Resolved an issue where the "Download Receipt" QR code and the "Share Payment Link" QR code displayed different banking names when scanned.
- **Dynamic Fetching**: Both modules now actively fetch the logged-in admin's/vendor's specific `upi_id` and `account_holder_name` from `vendor_payment_settings`.
- **Aligned Fallbacks**: If a vendor hasn't set up their payment details yet, both QR codes safely fall back to the master admin account (`9628562024@kotak811` / **SUMIT KUMAR**), ensuring payments are never lost to a generic or unregistered UPI handle like `merchant@upi`.

### 5. WhatsApp PDF Receipt Sharing Restored
- **Fixed Missing PDF**: Restored the logic where clicking "Share Receipt" automatically generates a PDF snapshot of the receipt behind the scenes.
- **WhatsApp Integration**: The generated Supabase public URL of the PDF is seamlessly appended to the pre-drafted WhatsApp message, allowing customers to download a digital copy directly from chat.

### 6. Admin WhatsApp Broadcast Feature
- **New Dashboard Section**: Created a new `AdminBroadcast.tsx` page accessible via "Broadcasting message" in the Admin sidebar.
- **Bulk Messaging UI**: Provides a clean interface showing the total number of valid customers, a message composition area, and a live progress bar.
- **Image Attachment**: Added the ability to upload promotional images or flyers. Images are securely uploaded to Supabase Storage, and the resulting public URL is passed to the Meta API.
- **Meta API Integration**: Wired up the "Broadcast Now" button to `notificationService.sendAutomatedWhatsApp`, which iterates through the customer list to deliver bulk rich-media (image + text) notifications via WhatsApp.
