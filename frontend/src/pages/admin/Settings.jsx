import React, { useState } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import GeneralSettings from './settings/GeneralSettings';
import DonationSettings from './settings/DonationSettings';
import PaymentGatewaySettings from './settings/PaymentGatewaySettings';
import MobileAppSettings from './settings/MobileAppSettings';
import VerificationSecuritySettings from './settings/VerificationSecuritySettings';
import NotificationTemplateSettings from './settings/NotificationTemplateSettings';
import AuditLogSettings from './settings/AuditLogSettings';

const TABS = [
  { key: 'general', label: 'General' },
  { key: 'donation', label: 'Donation' },
  { key: 'payment', label: 'Payment Gateways' },
  { key: 'mobile', label: 'Mobile App' },
  { key: 'security', label: 'Verification & Security' },
  { key: 'notifications', label: 'Notification Templates' },
  { key: 'audit', label: 'Audit Logs' },
];

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('general');

  // Placeholder: Replace with actual user role from context/auth
  const userRole = 'admin'; // or 'shura'
  const canEdit = userRole === 'admin';

  return (
    <AdminLayout pageTitle="Settings">
      <div className="max-w-4xl mx-auto py-8">
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-8 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.key}
              className={`px-4 py-2 font-medium text-sm focus:outline-none transition-colors duration-150 ${activeTab === tab.key ? 'border-b-2 border-[#1A7F55] text-[#1A7F55] dark:text-[#D4AF37]' : 'text-gray-600 dark:text-gray-400 hover:text-[#1A7F55] dark:hover:text-[#D4AF37]'}`}
              onClick={() => setActiveTab(tab.key)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          {/* Tab content will be rendered here */}
          {activeTab === 'general' && <GeneralSettings canEdit={canEdit} />}
          {activeTab === 'donation' && <DonationSettings canEdit={canEdit} />}
          {activeTab === 'payment' && <PaymentGatewaySettings canEdit={canEdit} />}
          {activeTab === 'mobile' && <MobileAppSettings canEdit={canEdit} />}
          {activeTab === 'security' && <VerificationSecuritySettings canEdit={canEdit} />}
          {activeTab === 'notifications' && <NotificationTemplateSettings canEdit={canEdit} />}
          {activeTab === 'audit' && <AuditLogSettings canEdit={canEdit} />}
        </div>
      </div>
    </AdminLayout>
  );
};

export default SettingsPage; 