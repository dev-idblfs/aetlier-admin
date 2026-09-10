/**
 * Settings Page
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import {
    Settings as SettingsIcon,
    Bell,
    Mail,
    Shield,
    Palette,
    Globe,
    Save,
    FileText,
    MessageCircle,
    LayoutDashboard,
    ChevronRight,
} from '@/lib/icons';
import WhatsAppIntegrationsPanel from '@/components/settings/WhatsAppIntegrationsPanel';
import {
    Button,
    Tabs,
    Tab,
    Card as HeroCard,
    CardBody,
    SelectItem,
    Spinner,
} from '@/lib/heroui';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { settingsSchema } from '@/lib/validation';
import { Form, DEFAULT_FORM_OPTIONS } from '@/components/ui/Form';
import { FormInput, FormSelect, FormSwitchRow, FormTextarea } from '@/components/ui/FormFields';
import { ListPageLayout } from '@/components/ui';
import Link from 'next/link';
import {
    useGetInvoiceSettingsQuery,
    useUpdateInvoiceSettingsMutation,
    useUploadInvoiceLogoMutation,
    useGetUserPreferencesQuery,
    useUpdateUserPreferencesMutation,
} from '@/redux/services/api';

export default function SettingsPage() {
    const { user } = useSelector((state) => state.auth);
    const [activeTab, setActiveTab] = useState('general');

    // API hooks
    const { data: invoiceSettings, isLoading: isLoadingInvoice, refetch: refetchInvoice } = useGetInvoiceSettingsQuery();
    const [updateInvoiceSettings, { isLoading: isSavingInvoice }] = useUpdateInvoiceSettingsMutation();
    const [uploadInvoiceLogo, { isLoading: isUploadingLogo }] = useUploadInvoiceLogoMutation();
    const logoInputRef = useRef(null);

    const { data: userPreferences, isLoading: isLoadingPreferences, refetch: refetchPreferences } = useGetUserPreferencesQuery(user?.id, {
        skip: !user?.id,
    });
    const [updateUserPreferences, { isLoading: isSavingPreferences }] = useUpdateUserPreferencesMutation();

    const isLoading = isLoadingInvoice || isLoadingPreferences;
    const isSaving = isSavingInvoice || isSavingPreferences;

    const methods = useForm({
        ...DEFAULT_FORM_OPTIONS,
        resolver: zodResolver(settingsSchema),
        defaultValues: {
            clinicName: '',
            clinicEmail: '',
            clinicPhone: '',
            clinicAddress: '',
            documentTagline: '',
            emailNotifications: true,
            appointmentReminders: true,
            marketingEmails: false,
            smsNotifications: true,
            darkMode: false,
            compactView: false,
            showAnimations: true,
            twoFactorAuth: false,
            sessionTimeout: 30,
            invoicePrefix: 'INV-',
            invoiceStartNumber: 1001,
            defaultPaymentTerms: 'DUE_ON_RECEIPT',
            defaultTaxRate: 0,
            companyGstNumber: '',
            companyPanNumber: '',
            invoiceFooterNotes: '',
            showGstBreakdown: true,
            autoSendInvoice: false,
            bankName: '',
            bankAccountName: '',
            bankAccountNumber: '',
            bankIfsc: '',
            upiId: '',
            paymentUrl: '',
        },
    });

    const { reset, handleSubmit } = methods;

    // Load settings from backend
    useEffect(() => {
        if (invoiceSettings || userPreferences) {
            reset({
                clinicName: invoiceSettings?.business_name || '',
                clinicEmail: invoiceSettings?.business_email || '',
                clinicPhone: invoiceSettings?.business_phone || '',
                clinicAddress: invoiceSettings?.business_address || '',
                documentTagline: invoiceSettings?.document_tagline || 'Transform Your Beauty Journey',

                emailNotifications: userPreferences?.email_notifications ?? true,
                appointmentReminders: userPreferences?.appointment_reminders ?? true,
                marketingEmails: userPreferences?.marketing_emails ?? false,
                smsNotifications: userPreferences?.sms_notifications ?? true,

                darkMode: userPreferences?.dark_mode ?? false,
                compactView: userPreferences?.compact_view ?? false,
                showAnimations: userPreferences?.show_animations ?? true,

                twoFactorAuth: userPreferences?.two_factor_enabled ?? false,
                sessionTimeout: 30, // Not persisted in backend yet, keeping default

                invoicePrefix: invoiceSettings?.invoice_prefix || 'INV-',
                invoiceStartNumber: invoiceSettings?.next_invoice_seq || 1001,
                defaultPaymentTerms: invoiceSettings?.default_payment_terms || 'DUE_ON_RECEIPT',
                defaultTaxRate: invoiceSettings?.default_tax_rate || 0,
                companyGstNumber: invoiceSettings?.business_gstin || '',
                companyPanNumber: invoiceSettings?.business_pan || '',
                invoiceFooterNotes: invoiceSettings?.default_notes || '',
                showGstBreakdown: invoiceSettings?.enable_cgst_sgst ?? true,
                autoSendInvoice: invoiceSettings?.auto_send_on_create ?? false,
                bankName: invoiceSettings?.bank_name || '',
                bankAccountName: invoiceSettings?.bank_account_name || '',
                bankAccountNumber: invoiceSettings?.bank_account_number || '',
                bankIfsc: invoiceSettings?.bank_ifsc || '',
                upiId: invoiceSettings?.upi_id || '',
                paymentUrl: invoiceSettings?.payment_url || '',
            });
        }
    }, [invoiceSettings, userPreferences, reset]);

    const onSubmit = async (data) => {
        try {
            const promises = [];

            // Prepare invoice settings data
            const invoiceData = {
                business_name: data.clinicName,
                business_email: data.clinicEmail,
                business_phone: data.clinicPhone,
                business_address: data.clinicAddress,
                document_tagline: data.documentTagline,
                invoice_prefix: data.invoicePrefix,
                next_invoice_seq: parseInt(data.invoiceStartNumber, 10) || undefined,
                default_tax_rate: parseFloat(data.defaultTaxRate),
                business_gstin: data.companyGstNumber,
                business_pan: data.companyPanNumber,
                default_notes: data.invoiceFooterNotes,
                enable_cgst_sgst: data.showGstBreakdown,
                auto_send_on_create: data.autoSendInvoice,
                default_payment_terms: data.defaultPaymentTerms,
                bank_name: data.bankName,
                bank_account_name: data.bankAccountName,
                bank_account_number: data.bankAccountNumber,
                bank_ifsc: data.bankIfsc,
                upi_id: data.upiId,
                payment_url: data.paymentUrl,
            };

            promises.push(updateInvoiceSettings(invoiceData).unwrap());

            // Prepare user preferences data (RTK expects { userId, preferences })
            if (user?.id) {
                promises.push(
                    updateUserPreferences({
                        userId: user.id,
                        preferences: {
                            email_notifications: data.emailNotifications,
                            appointment_reminders: data.appointmentReminders,
                            marketing_emails: data.marketingEmails,
                            sms_notifications: data.smsNotifications,
                            dark_mode: data.darkMode,
                            compact_view: data.compactView,
                            show_animations: data.showAnimations,
                            two_factor_enabled: data.twoFactorAuth,
                        },
                    }).unwrap()
                );
            }

            await Promise.all(promises);
            await Promise.all([refetchInvoice(), refetchPreferences()]);
            toast.success('Settings saved successfully');
        } catch (error) {
            console.error('Failed to save settings:', error);
            toast.error(error?.data?.detail || 'Failed to save settings');
        }
    };

    const handleLogoUpload = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;

        const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
        const maxSize = 5 * 1024 * 1024;
        if (!allowedTypes.includes(file.type)) {
            toast.error('Use a PNG, JPEG, or WebP logo');
            return;
        }
        if (file.size > maxSize) {
            toast.error('Logo must be 5MB or smaller');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('file', file);
            await uploadInvoiceLogo(formData).unwrap();
            await refetchInvoice();
            toast.success('Clinic logo updated');
        } catch (error) {
            toast.error(error?.data?.detail || 'Failed to upload clinic logo');
        }
    };

    return (
        <ListPageLayout
            title="Settings"
            breadcrumbs={[{ label: 'Settings' }]}
            actions={
                !isLoading && activeTab !== 'integrations' ? (
                    <Button
                        color="primary"
                        size="sm"
                        startContent={<Save className="w-4 h-4" />}
                        onPress={handleSubmit(onSubmit)}
                        isLoading={isSaving}
                        className="w-full sm:w-auto"
                    >
                        Save Changes
                    </Button>
                ) : null
            }
        >
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                    <Spinner size="lg" />
                    <p className="mt-4 text-gray-600">Loading settings...</p>
                </div>
            ) : (
                <Form methods={methods} onSubmit={onSubmit}>
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
                                            <FormInput name="clinicName" label="Clinic Name" />
                                            <FormInput name="clinicEmail" label="Email" type="email" />
                                            <FormInput name="clinicPhone" label="Phone" />
                                            <FormInput name="clinicAddress" label="Address" />
                                            <FormInput
                                                name="documentTagline"
                                                label="Document Tagline"
                                                placeholder="e.g., Transform Your Beauty Journey"
                                                description="Centered below the clinic logo on invoices, prescriptions, and transactional emails"
                                            />
                                        </div>
                                        <div className="mt-5 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                <div className="flex items-center gap-3">
                                                    {invoiceSettings?.logo_url ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img
                                                            src={invoiceSettings.logo_url}
                                                            alt="Clinic logo"
                                                            className="h-12 w-40 rounded bg-white border border-gray-200 object-contain p-2"
                                                        />
                                                    ) : (
                                                        <div className="flex h-12 w-40 items-center rounded border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700">
                                                            Aetlier
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">Clinic logo</p>
                                                        <p className="text-xs text-gray-500">Used on invoices, prescriptions, and transactional emails.</p>
                                                    </div>
                                                </div>
                                                <input
                                                    ref={logoInputRef}
                                                    type="file"
                                                    accept="image/png,image/jpeg,image/webp"
                                                    className="hidden"
                                                    onChange={handleLogoUpload}
                                                />
                                                <Button
                                                    size="sm"
                                                    variant="flat"
                                                    isLoading={isUploadingLogo}
                                                    onPress={() => logoInputRef.current?.click()}
                                                >
                                                    {invoiceSettings?.logo_url ? 'Replace logo' : 'Upload logo'}
                                                </Button>
                                            </div>
                                        </div>
                                    </SettingsCard>

                                    <SettingsCard title="Quick Links">
                                        <Link
                                            href="/settings/mobile-home"
                                            className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-primary-100">
                                                    <LayoutDashboard className="w-5 h-5 text-primary-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">Mobile Home</p>
                                                    <p className="text-sm text-gray-500">Manage mobile app banners and promotions</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-gray-400" />
                                        </Link>
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
                                            <FormSwitchRow
                                                name="emailNotifications"
                                                label="Email Notifications"
                                                description="Receive email notifications for important updates"
                                            />
                                            <FormSwitchRow
                                                name="appointmentReminders"
                                                label="Appointment Reminders"
                                                description="Get reminded about upcoming appointments"
                                            />
                                            <FormSwitchRow
                                                name="marketingEmails"
                                                label="Marketing Emails"
                                                description="Receive promotional and marketing emails"
                                            />
                                        </div>
                                    </SettingsCard>

                                    <SettingsCard title="SMS Notifications">
                                        <FormSwitchRow
                                            name="smsNotifications"
                                            label="SMS Notifications"
                                            description="Preference is saved; SMS delivery is not wired yet (WhatsApp is used for mobile alerts)"
                                        />
                                    </SettingsCard>
                                </motion.div>
                            </Tab>

                            <Tab
                                key="integrations"
                                title={
                                    <div className="flex items-center gap-2">
                                        <MessageCircle className="w-4 h-4" />
                                        <span className="hidden sm:inline">Integrations</span>
                                    </div>
                                }
                            >
                                <WhatsAppIntegrationsPanel />
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
                                            <FormSwitchRow
                                                name="darkMode"
                                                label="Dark Mode"
                                                description="Use dark theme across the admin panel"
                                            />
                                            <FormSwitchRow
                                                name="compactView"
                                                label="Compact View"
                                                description="Show more content with reduced spacing"
                                            />
                                            <FormSwitchRow
                                                name="showAnimations"
                                                label="Animations"
                                                description="Enable smooth animations and transitions"
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
                                            <FormSwitchRow
                                                name="twoFactorAuth"
                                                label="Two-Factor Authentication"
                                                description="Preference is saved for future use; login 2FA is not enforced yet"
                                            />
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-2 sm:gap-4 border-b border-gray-100">
                                                <div>
                                                    <p className="font-medium text-gray-900 text-sm md:text-base">Session Timeout</p>
                                                    <p className="text-xs md:text-sm text-gray-500">
                                                        Not persisted yet — display only
                                                    </p>
                                                </div>
                                                <div className="w-full sm:w-24">
                                                    <FormInput
                                                        name="sessionTimeout"
                                                        type="number"
                                                        size="sm"
                                                        isDisabled
                                                    />
                                                </div>
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
                                            <FormInput
                                                name="invoicePrefix"
                                                label="Invoice Prefix"
                                                placeholder="e.g., INV-, AET-"
                                                description="Prefix for all invoice numbers"
                                            />
                                            <FormInput
                                                name="invoiceStartNumber"
                                                label="Starting Number"
                                                type="number"
                                                description="Next invoice will use this number"
                                            />
                                        </div>
                                    </SettingsCard>

                                    <SettingsCard title="Default Settings">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <FormSelect
                                                name="defaultPaymentTerms"
                                                label="Default Payment Terms"
                                            >
                                                <SelectItem key="DUE_ON_RECEIPT">Due on Receipt</SelectItem>
                                                <SelectItem key="NET_7">Net 7 Days</SelectItem>
                                                <SelectItem key="NET_15">Net 15 Days</SelectItem>
                                                <SelectItem key="NET_30">Net 30 Days</SelectItem>
                                                <SelectItem key="NET_45">Net 45 Days</SelectItem>
                                                <SelectItem key="NET_60">Net 60 Days</SelectItem>
                                            </FormSelect>
                                            <FormInput
                                                name="defaultTaxRate"
                                                label="Default Tax Rate (%)"
                                                type="number"
                                                endContent={<span className="text-gray-500">%</span>}
                                            />
                                        </div>
                                        <FormTextarea
                                            name="invoiceFooterNotes"
                                            label="Invoice Footer Notes"
                                            placeholder="Enter default notes for invoices"
                                            minRows={2}
                                        />
                                    </SettingsCard>

                                    <SettingsCard title="Tax Information">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormInput
                                                name="companyGstNumber"
                                                label="Company GST Number"
                                                placeholder="e.g., 22AAAAA0000A1Z5"
                                            />
                                            <FormInput
                                                name="companyPanNumber"
                                                label="Company PAN Number"
                                                placeholder="e.g., AAAAA0000A"
                                            />
                                        </div>
                                    </SettingsCard>

                                    <SettingsCard title="Invoice Payment Instructions">
                                        <p className="mb-4 text-sm text-gray-500">
                                            These are internal clinic settings. Generated invoices only show a recorded payment method and never expose account, IFSC, UPI, reference, or payment-link details.
                                        </p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormInput
                                                name="bankName"
                                                label="Bank Name"
                                                placeholder="e.g., HDFC Bank"
                                            />
                                            <FormInput
                                                name="bankAccountName"
                                                label="Account Holder Name"
                                                placeholder="e.g., Aetlier Clinical Group"
                                            />
                                            <FormInput
                                                name="bankAccountNumber"
                                                label="Account Number"
                                                type="password"
                                                placeholder="Saved securely; masked on invoices"
                                            />
                                            <FormInput
                                                name="bankIfsc"
                                                label="IFSC / Routing Code"
                                                placeholder="e.g., HDFC0000123"
                                            />
                                            <FormInput
                                                name="upiId"
                                                label="UPI ID"
                                                placeholder="e.g., billing@aetlier"
                                            />
                                            <FormInput
                                                name="paymentUrl"
                                                label="Online Payment URL"
                                                placeholder="https://..."
                                            />
                                        </div>
                                    </SettingsCard>

                                    <SettingsCard title="Invoice Options">
                                        <div className="space-y-1">
                                            <FormSwitchRow
                                                name="showGstBreakdown"
                                                label="Show GST Breakdown"
                                                description="Display CGST and SGST separately on invoices"
                                            />
                                            <FormSwitchRow
                                                name="autoSendInvoice"
                                                label="Auto-send Invoice"
                                                description="Automatically email invoice to customer when created"
                                            />
                                        </div>
                                    </SettingsCard>
                                </motion.div>
                            </Tab>
                        </Tabs>
                    </div>
                </Form>
            )}
        </ListPageLayout>
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
