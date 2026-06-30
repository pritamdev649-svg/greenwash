import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 py-12 px-4 md:px-8 font-sans">
      <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-sm shadow-sm p-8 md:p-12">
        {/* Document Header */}
        <div className="border-b border-slate-200 pb-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors">
              <ArrowLeft size={16} /> Back to Home
            </Link>
            <span className="text-xs text-slate-400 font-mono uppercase">Legal Document</span>
          </div>
          
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
            GreenWash Privacy Policy
          </h1>
          
          <div className="text-sm text-slate-500 space-y-1">
            <p><strong>Effective Date:</strong> June 30, 2026</p>
            <p><strong>Last Updated:</strong> June 30, 2026</p>
          </div>
        </div>

        {/* Document Body */}
        <div className="space-y-8 text-sm md:text-base leading-relaxed text-slate-700">
          <p>
            This Privacy Policy is prepared by GreenWash (“We”, “Us”, or “Our”). We are committed to protecting the privacy of our customers while using our laundry and dry-cleaning services.
          </p>

          {/* Section 1 */}
          <section>
            <h2 className="text-base md:text-lg font-bold text-slate-900 mb-3 border-b border-slate-100 pb-1">
              1. Types of Information We May Collect
            </h2>
            <p className="mb-2">We may collect:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Name</li>
              <li>Phone number</li>
              <li>Email address</li>
              <li>Pickup and delivery address</li>
              <li>Order and payment information</li>
              <li>Information submitted through contact forms or customer support.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-base md:text-lg font-bold text-slate-900 mb-3 border-b border-slate-100 pb-1">
              2. How We Use Your Information
            </h2>
            <p className="mb-2">We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Process laundry service bookings.</li>
              <li>Schedule pickups and deliveries.</li>
              <li>Provide customer support.</li>
              <li>Send service updates and order notifications.</li>
              <li>Improve our services.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-base md:text-lg font-bold text-slate-900 mb-3 border-b border-slate-100 pb-1">
              3. Disclosure of Information
            </h2>
            <p>
              Your personal information is stored securely and is never sold or rented to third parties. Information may only be shared where required by law or to provide the requested service.
            </p>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-base md:text-lg font-bold text-slate-900 mb-3 border-b border-slate-100 pb-1">
              4. Your Rights
            </h2>
            <p>
              You may request access, correction, or deletion of your personal information by contacting us.
            </p>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-base md:text-lg font-bold text-slate-900 mb-3 border-b border-slate-100 pb-1">
              5. Changes to this Privacy Policy
            </h2>
            <p>
              Any future updates will be posted on this page.
            </p>
          </section>

          {/* Section 6 */}
          <section className="border-t border-slate-200 pt-6">
            <h2 className="text-base md:text-lg font-bold text-slate-900 mb-3">
              6. Contact Information
            </h2>
            <p className="mb-4">
              For any questions regarding this Privacy Policy, please contact us:
            </p>
            <div className="bg-slate-50 border border-slate-100 rounded-sm p-4 text-sm font-mono space-y-2">
              <p>
                <span className="text-slate-400">Phone:</span>{' '}
                <a href="tel:+919451034909" className="text-blue-600 hover:underline">
                  +91 9451034909
                </a>
              </p>
              <p>
                <span className="text-slate-400">Email:</span>{' '}
                <a href="mailto:ask003683@gmail.com" className="text-blue-600 hover:underline">
                  ask003683@gmail.com
                </a>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
