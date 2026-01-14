/**
 * Settings Page
 */

'use client';

import { useState, useEffect } from 'react';
import {
    Settings as SettingsIcon,
    Bell,
    Mail,
    Shield,
    Palette,
    Globe,
    Save,
    FileText,
} from 'lucide-react';
import {
    Button,
    Input,
    Switch,
    Tabs,
    Tab,
    Card as HeroCard,
    CardBody,
    Select,
    SelectItem,
    Textarea,
    Spinner,
} from '@heroui/react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { PageHeader } from '@/components/ui';
import {
    useGetInvoiceSettingsQuery,
    useUpdateInvoiceSettingsMutation,
    useGetUserPreferencesQuery,
    useUpdateUserPreferencesMutation,
} from '@/redux/services/api';

export default function SettingsPage() {
    const { user } = useSelector((state) => state.auth);
    const [activeTab, setActiveTab] = useState('general');

    // API hooks
    const { data: invoiceSettings, isLoading: isLoadingInvoice, refetch: refetchInvoice } = useGetInvoiceSettingsQuery();
    const [updateInvoiceSettings, { isLoading: isSavingInvoice }] = useUpdateInvoiceSettingsMutation();

    const { data: userPreferences, isLoading: isLoadingPreferences, refetch: refetchPreferences } = useGetUserPreferencesQuery(user?.id, {
        skip: !user?.id,
    });
    const [updateUserPreferences, { isLoading: isSavingPreferences }] = useUpdateUserPreferencesMutation();

    const isLoading = isLoadingInvoice || isLoadingPreferences;
    const isSaving = isSavingInvoice || isSavingPreferences;

    const [settings, setSettings] = useState({
        // General (mapped to InvoiceSettings)
        clinicName: '',
        clinicEmail: '',
        clinicPhone: '',
        clinicAddress: '',

        // Notifications (local state until UserPreferences backend is ready)
        emailNotifications: true,
        appointmentReminders: true,
        marketingEmails: false,
        smsNotifications: true,

        // Appearance (local state until UserPreferences backend is ready)
        darkMode: false,
        compactView: false,
        showAnimations: true,

        // Security (local state)
        twoFactorAuth: false,
        sessionTimeout: 30,

        // Invoicing (mapped to InvoiceSettings)
        invoicePrefix: '',
        invoiceStartNumber: 1001,
        defaultPaymentTerms: 'DUE_ON_RECEIPT',
        defaultTaxRate: 0,
        companyGstNumber: '',
        companyPanNumber: '',
        invoiceFooterNotes: '',
        showGstBreakdown: true,
        autoSendInvoice: false,
    });

    // Load settings from backend on mount
    useEffect(() => {
        if (invoiceSettings) {
            setSettings(prev => ({
                ...prev,
                // Map backend fields to frontend
                clinicName: invoiceSettings.business_name || '',
                clinicEmail: invoiceSettings.business_email || '',
                clinicPhone: invoiceSettings.business_phone || '',
                clinicAddress: invoiceSettings.business_address || '',
                invoicePrefix: invoiceSettings.invoice_prefix || 'INV-',
                invoiceStartNumber: invoiceSettings.next_invoice_seq || 1001,
                defaultTaxRate: invoiceSettings.default_tax_rate || 0,
                companyGstNumber: invoiceSettings.business_gstin || '',
                companyPanNumber: invoiceSettings.business_pan || '',
                invoiceFooterNotes: invoiceSettings.default_notes || '',
                showGstBreakdown: invoiceSettings.enable_cgst_sgst ?? true,
                autoSendInvoice: invoiceSettings.auto_send_on_create ?? false,
                defaultPaymentTerms: invoiceSettings.default_payment_terms || 'DUE_ON_RECEIPT',
            }));
        }
    }, [invoiceSettings]);

    // Load user preferences from backend
    useEffect(() => {
        if (userPreferences) {
            setSettings(prev => ({
                ...prev,
                emailNotifications: userPreferences.email_notifications ?? true,
                appointmentReminders: userPreferences.appointment_reminders ?? true,
                marketingEmails: userPreferences.marketing_emails ?? false,
                smsNotifications: userPreferences.sms_notifications ?? true,
                darkMode: userPreferences.dark_mode ?? false,
                compactView: userPreferences.compact_view ?? false,
                showAnimations: userPreferences.show_animations ?? true,
                twoFactorAuth: userPreferences.two_factor_enabled ?? false,
            }));
        }
    }, [userPreferences]);

    const handleSettingChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        try {
            const promises = [];

            // Prepare invoice settings data (map frontend to backend fields)
            const invoiceData = {
                business_name: settings.clinicName,
                business_email: settings.clinicEmail,
                business_phone: settings.clinicPhone,
                business_address: settings.clinicAddress,
                invoice_prefix: settings.invoicePrefix,
                default_tax_rate: parseFloat(settings.defaultTaxRate),
                business_gstin: settings.companyGstNumber,
                business_pan: settings.companyPanNumber,
                default_notes: settings.invoiceFooterNotes,
                enable_cgst_sgst: settings.showGstBreakdown,
                auto_send_on_create: settings.autoSendInvoice,
                default_payment_terms: settings.defaultPaymentTerms,
            };

            // Save invoice settings
            promises.push(updateInvoiceSettings(invoiceData).unwrap());

            // Prepare user preferences data
            if (user?.id) {
                const preferencesData = {
                    userId: user.id,
                    email_notifications: settings.emailNotifications,
                    appointment_reminders: settings.appointmentReminders,
                    marketing_emails: settings.marketingEmails,
                    sms_notifications: settings.smsNotifications,
                    dark_mode: settings.darkMode,
                    compact_view: settings.compactView,
                    show_animations: settings.showAnimations,
                    two_factor_enabled: settings.twoFactorAuth,
                };

                // Save user preferences
                promises.push(updateUserPreferences(preferencesData).unwrap());
            }

            // Wait for all saves to complete
            await Promise.all(promises);

            // Refetch to get updated data
            await Promise.all([refetchInvoice(), refetchPreferences()]);

            toast.success('Settings saved successfully');
        } catch (error) {
            console.error('Failed to save settings:', error);
            toast.error(error.data?.detail || 'Failed to save settings');
        }
    };

    return (
        <div className="space-y-4 md:space-y-6">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                    <Spinner size="lg" />
                    <p className="mt-4 text-gray-600">Loading settings...</p>
                </div>
            ) : (
                <>
                    <PageHeader
                        title="Settings"
                        description="Manage your admin preferences"
                        actions={
                            <Button
                                color="primary"
                                startContent={<Save className="w-4 h-4" />}
                                onPress={handleSave}
                                isLoading={isSaving}
                                className="w-full sm:w-auto"
                            >
                                Save Changes
                            </Button>
                        }
                    />

                    <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
                        <Tabs
                            selectedKey={activeTab}
                            onSelectionChange={setActiveTab}
                            variant="underlined"
                            classNames={{
                                tabList: "border-b border-gray-200 gap-0 min-w-max",
                                cursor: "bg-primary-500",
                                tab: "px-3 md:px-4 py-3 text-sm",
                            }}
                        >
                            <Tab
                                key="general"
                                title={
                                    <div className="flex items-center gap-2">
                                        <Globe className="w-4 h-4" />
                                        <span className="hidden sm:inline">General</span>
                                    </div>
                                }
                            >
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="pt-4 md:pt-6 space-y-4 md:space-y-6"
                                >
                                    <SettingsCard title="Clinic Information">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input
                                                label="Clinic Name"
                                                labelPlacement="outside"
                                                value={settings.clinicName}
                                                onChange={(e) => handleSettingChange('clinicName', e.target.value)}
                                            />
                                            <Input
                                                label="Email"
                                                type="email"
                                                labelPlacement="outside"
                                                value={settings.clinicEmail}
                                                onChange={(e) => handleSettingChange('clinicEmail', e.target.value)}
                                            />
                                            <Input
                                                label="Phone"
                                                labelPlacement="outside"
                                                value={settings.clinicPhone}
                                                onChange={(e) => handleSettingChange('clinicPhone', e.target.value)}
                                            />
                                            <Input
                                                label="Address"
                                                labelPlacement="outside"
                                                value={settings.clinicAddress}
                                                onChange={(e) => handleSettingChange('clinicAddress', e.target.value)}
                                            />
                                        </div>
                                    </SettingsCard>
                                </motion.div>
                            </Tab>

                            <Tab
                                key="notifications"
                                title={
                                    <div className="flex items-center gap-2">
                                        <Bell className="w-4 h-4" />
                                        <span className="hidden sm:inline">Notifications</span>
                                    </div>
                                }
                            >
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="pt-4 md:pt-6 space-y-4 md:space-y-6"
                                >
                                    <SettingsCard title="Email Notifications">
                                        <div className="space-y-1">
                                            <SettingToggle
                                                label="Email Notifications"
                                                description="Receive email notifications for important updates"
                                                value={settings.emailNotifications}
                                                onChange={(val) => handleSettingChange('emailNotifications', val)}
                                            />
                                            <SettingToggle
                                                label="Appointment Reminders"
                                                description="Get reminded about upcoming appointments"
                                                value={settings.appointmentReminders}
                                                onChange={(val) => handleSettingChange('appointmentReminders', val)}
                                            />
                                            <SettingToggle
                                                label="Marketing Emails"
                                                description="Receive promotional and marketing emails"
                                                value={settings.marketingEmails}
                                                onChange={(val) => handleSettingChange('marketingEmails', val)}
                                            />
                                        </div>
                                    </SettingsCard>

                                    <SettingsCard title="SMS Notifications">
                                        <SettingToggle
                                            label="SMS Notifications"
                                            description="Receive SMS for appointment confirmations"
                                            value={settings.smsNotifications}
                                            onChange={(val) => handleSettingChange('smsNotifications', val)}
                                        />
                                    </SettingsCard>
                                </motion.div>
                            </Tab>

                            <Tab
                                key="appearance"
                                title={
                                    <div className="flex items-center gap-2">
                                        <Palette className="w-4 h-4" />
                                        <span className="hidden sm:inline">Appearance</span>
                                    </div>
                                }
                            >
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="pt-4 md:pt-6 space-y-4 md:space-y-6"
                                >
                                    <SettingsCard title="Display Settings">
                                        <div className="space-y-1">
                                            <SettingToggle
                                                label="Dark Mode"
                                                description="Use dark theme across the admin panel"
                                                value={settings.darkMode}
                                                onChange={(val) => handleSettingChange('darkMode', val)}
                                            />
                                            <SettingToggle
                                                label="Compact View"
                                                description="Show more content with reduced spacing"
                                                value={settings.compactView}
                                                onChange={(val) => handleSettingChange('compactView', val)}
                                            />
                                            <SettingToggle
                                                label="Animations"
                                                description="Enable smooth animations and transitions"
                                                value={settings.showAnimations}
                                                onChange={(val) => handleSettingChange('showAnimations', val)}
                                            />
                                        </div>
                                    </SettingsCard>
                                </motion.div>
                            </Tab>

                            <Tab
                                key="security"
                                title={
                                    <div className="flex items-center gap-2">
                                        <Shield className="w-4 h-4" />
                                        <span className="hidden sm:inline">Security</span>
                                    </div>
                                }
                            >
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="pt-4 md:pt-6 space-y-4 md:space-y-6"
                                >
                                    <SettingsCard title="Account Security">
                                        <div className="space-y-1">
                                            <SettingToggle
                                                label="Two-Factor Authentication"
                                                description="Add an extra layer of security to your account"
                                                value={settings.twoFactorAuth}
                                                onChange={(val) => handleSettingChange('twoFactorAuth', val)}
                                            />
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-2 sm:gap-4 border-b border-gray-100">
                                                <div>
                                                    <p className="font-medium text-gray-900 text-sm md:text-base">Session Timeout</p>
                                                    <p className="text-xs md:text-sm text-gray-500">Auto-logout after inactivity (minutes)</p>
                                                </div>
                                                <Input
                                                    type="number"
                                                    value={settings.sessionTimeout.toString()}
                                                    onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                                                    className="w-full sm:w-24"
                                                    size="sm"
                                                />
                                            </div>
                                        </div>
                                    </SettingsCard>

                                    <SettingsCard title="Current Session">
                                        <div className="space-y-2">
                                            <p className="text-sm text-gray-600">
                                                Logged in as: <strong className="break-all">{user?.email || 'N/A'}</strong>
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                Role: <strong className="capitalize">{user?.role || 'N/A'}</strong>
                                            </p>
                                            <Button
                                                variant="flat"
                                                color="danger"
                                                size="sm"
                                                className="mt-2 w-full sm:w-auto"
                                            >
                                                Sign out of all devices
                                            </Button>
                                        </div>
                                    </SettingsCard>
                                </motion.div>
                            </Tab>

                            <Tab
                                key="invoicing"
                                title={
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-4 h-4" />
                                        <span className="hidden sm:inline">Invoicing</span>
                                    </div>
                                }
                            >
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="pt-4 md:pt-6 space-y-4 md:space-y-6"
                                >
                                    <SettingsCard title="Invoice Numbering">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input
                                                label="Invoice Prefix"
                                                labelPlacement="outside"
                                                placeholder="e.g., INV-, AET-"
                                                value={settings.invoicePrefix}
                                                onChange={(e) => handleSettingChange('invoicePrefix', e.target.value)}
                                                description="Prefix for all invoice numbers"
                                            />
                                            <Input
                                                label="Starting Number"
                                                type="number"
                                                labelPlacement="outside"
                                                value={settings.invoiceStartNumber.toString()}
                                                onChange={(e) => handleSettingChange('invoiceStartNumber', parseInt(e.target.value))}
                                                description="Next invoice will use this number"
                                            />
                                        </div>
                                    </SettingsCard>

                                    <SettingsCard title="Default Settings">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <Select
                                                label="Default Payment Terms"
                                                labelPlacement="outside"
                                                selectedKeys={[settings.defaultPaymentTerms]}
                                                onSelectionChange={(keys) => handleSettingChange('defaultPaymentTerms', Array.from(keys)[0])}
                                            >
                                                <SelectItem key="DUE_ON_RECEIPT">Due on Receipt</SelectItem>
                                                <SelectItem key="NET_7">Net 7 Days</SelectItem>
                                                <SelectItem key="NET_15">Net 15 Days</SelectItem>
                                                <SelectItem key="NET_30">Net 30 Days</SelectItem>
                                                <SelectItem key="NET_45">Net 45 Days</SelectItem>
                                                <SelectItem key="NET_60">Net 60 Days</SelectItem>
                                            </Select>
                                            <Input
                                                label="Default Tax Rate (%)"
                                                type="number"
                                                labelPlacement="outside"
                                                value={settings.defaultTaxRate.toString()}
                                                onChange={(e) => handleSettingChange('defaultTaxRate', parseFloat(e.target.value))}
                                                endContent={<span className="text-gray-500">%</span>}
                                            />
                                        </div>
                                        <Textarea
                                            label="Invoice Footer Notes"
                                            labelPlacement="outside"
                                            placeholder="Enter default notes for invoices"
                                            value={settings.invoiceFooterNotes}
                                            onChange={(e) => handleSettingChange('invoiceFooterNotes', e.target.value)}
                                            minRows={2}
                                        />
                                    </SettingsCard>

                                    <SettingsCard title="Tax Information">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input
                                                label="Company GST Number"
                                                labelPlacement="outside"
                                                placeholder="e.g., 22AAAAA0000A1Z5"
                                                value={settings.companyGstNumber}
                                                onChange={(e) => handleSettingChange('companyGstNumber', e.target.value)}
                                            />
                                            <Input
                                                label="Company PAN Number"
                                                labelPlacement="outside"
                                                placeholder="e.g., AAAAA0000A"
                                                value={settings.companyPanNumber}
                                                onChange={(e) => handleSettingChange('companyPanNumber', e.target.value)}
                                            />
                                        </div>
                                    </SettingsCard>

                                    <SettingsCard title="Invoice Options">
                                        <div className="space-y-1">
                                            <SettingToggle
                                                label="Show GST Breakdown"
                                                description="Display CGST and SGST separately on invoices"
                                                value={settings.showGstBreakdown}
                                                onChange={(val) => handleSettingChange('showGstBreakdown', val)}
                                            />
                                            <SettingToggle
                                                label="Auto-send Invoice"
                                                description="Automatically email invoice to customer when created"
                                                value={settings.autoSendInvoice}
                                                onChange={(val) => handleSettingChange('autoSendInvoice', val)}
                                            />
                                        </div>
                                    </SettingsCard>
                                </motion.div>
                            </Tab>
                        </Tabs>
                    </div>
                </>
            )}
        </div>
    );
}

// Settings Card Component
function SettingsCard({ title, children }) {
    return (
        <HeroCard>
            <CardBody className="p-4 md:p-6">
                <h3 className="text-base md:text-lg font-semibold mb-4">{title}</h3>
                {children}
            </CardBody>
        </HeroCard>
    );
}

// Settings Toggle Component
function SettingToggle({ label, description, value, onChange }) {
    return (
        <div className="flex items-start sm:items-center justify-between py-3 gap-3 border-b border-gray-100 last:border-0">
            <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 text-sm md:text-base">{label}</p>
                <p className="text-xs md:text-sm text-gray-500">{description}</p>
            </div>
            <Switch
                isSelected={value}
                onValueChange={onChange}
                className="shrink-0"
            />
        </div>
    );
}
