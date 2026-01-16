/**
 * PreferencesPanel Component - All user preference controls in one place
 */
'use client';

import { usePreferences } from '@/contexts/PreferencesContext';
import { Switch, Card, CardBody, Divider } from '@heroui/react';
import {
    Sun,
    Moon,
    Layout,
    Zap,
    Bell,
    Mail,
    MessageSquare,
    Shield
} from 'lucide-react';

export default function PreferencesPanel() {
    const {
        preferences,
        isLoading,
        toggleDarkMode,
        toggleCompactView,
        toggleAnimations,
        updatePreference
    } = usePreferences();

    const preferenceItems = [
        // Appearance Section
        {
            section: 'Appearance',
            items: [
                {
                    key: 'dark_mode',
                    label: 'Dark Mode',
                    description: preferences.dark_mode ? 'Dark theme enabled' : 'Light theme enabled',
                    icon: preferences.dark_mode ? Moon : Sun,
                    value: preferences.dark_mode,
                    onChange: toggleDarkMode,
                },
                {
                    key: 'compact_view',
                    label: 'Compact View',
                    description: 'Reduce spacing for a denser layout',
                    icon: Layout,
                    value: preferences.compact_view,
                    onChange: toggleCompactView,
                },
                {
                    key: 'show_animations',
                    label: 'Animations',
                    description: 'Enable smooth transitions and animations',
                    icon: Zap,
                    value: preferences.show_animations,
                    onChange: toggleAnimations,
                },
            ],
        },
        // Notifications Section
        {
            section: 'Notifications',
            items: [
                {
                    key: 'email_notifications',
                    label: 'Email Notifications',
                    description: 'Receive notifications via email',
                    icon: Mail,
                    value: preferences.email_notifications,
                    onChange: () => updatePreference('email_notifications', !preferences.email_notifications),
                },
                {
                    key: 'appointment_reminders',
                    label: 'Appointment Reminders',
                    description: 'Get reminders for upcoming appointments',
                    icon: Bell,
                    value: preferences.appointment_reminders,
                    onChange: () => updatePreference('appointment_reminders', !preferences.appointment_reminders),
                },
                {
                    key: 'sms_notifications',
                    label: 'SMS Notifications',
                    description: 'Receive text message notifications',
                    icon: MessageSquare,
                    value: preferences.sms_notifications,
                    onChange: () => updatePreference('sms_notifications', !preferences.sms_notifications),
                },
                {
                    key: 'marketing_emails',
                    label: 'Marketing Emails',
                    description: 'Receive promotional content and updates',
                    icon: Mail,
                    value: preferences.marketing_emails,
                    onChange: () => updatePreference('marketing_emails', !preferences.marketing_emails),
                },
            ],
        },
        // Security Section
        {
            section: 'Security',
            items: [
                {
                    key: 'two_factor_enabled',
                    label: 'Two-Factor Authentication',
                    description: 'Add an extra layer of security',
                    icon: Shield,
                    value: preferences.two_factor_enabled,
                    onChange: () => updatePreference('two_factor_enabled', !preferences.two_factor_enabled),
                },
            ],
        },
    ];

    return (
        <div className="space-y-6">
            {preferenceItems.map(({ section, items }) => (
                <Card key={section} className="bg-card border border-border">
                    <CardBody className="p-6">
                        <h2 className="text-xl font-semibold mb-4 text-foreground">{section}</h2>
                        <div className="space-y-4">
                            {items.map((item, index) => {
                                const Icon = item.icon;
                                return (
                                    <div key={item.key}>
                                        {index > 0 && <Divider className="my-4" />}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3 flex-1">
                                                <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900">
                                                    <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-medium text-foreground">{item.label}</h3>
                                                    <p className="text-sm text-foreground/60">{item.description}</p>
                                                </div>
                                            </div>
                                            <Switch
                                                isSelected={item.value}
                                                onValueChange={item.onChange}
                                                isDisabled={isLoading}
                                                color="primary"
                                                size="lg"
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardBody>
                </Card>
            ))}
        </div>
    );
}
