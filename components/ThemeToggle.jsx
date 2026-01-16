/**
 * ThemeToggle Component - Allows users to switch between light and dark mode
 */
'use client';

import { usePreferences } from '@/contexts/PreferencesContext';
import { Switch } from '@heroui/react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
    const { preferences, toggleDarkMode, isLoading } = usePreferences();

    return (
        <div className="flex items-center justify-between p-4 bg-card rounded-lg border border-border">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900">
                    {preferences.dark_mode ? (
                        <Moon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    ) : (
                        <Sun className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    )}
                </div>
                <div>
                    <h3 className="font-medium text-foreground">Dark Mode</h3>
                    <p className="text-sm text-foreground/60">
                        {preferences.dark_mode ? 'Dark theme enabled' : 'Light theme enabled'}
                    </p>
                </div>
            </div>
            <Switch
                isSelected={preferences.dark_mode}
                onValueChange={toggleDarkMode}
                isDisabled={isLoading}
                color="primary"
                size="lg"
            />
        </div>
    );
}
