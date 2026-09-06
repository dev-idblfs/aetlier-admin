/**
 * Redux Provider Component
 */

'use client';

import { Provider } from 'react-redux';
import { store } from '@/redux/store';
import { HeroUIProvider } from '@heroui/react';
import { SolarProvider } from '@solar-icons/react/lib/context';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'react-hot-toast';
import { PreferencesProvider } from '@/contexts/PreferencesContext';
import NavigationProgress from './NavigationProgress';
import config from '@/config';

function AppProviders({ children }) {
    return (
        <Provider store={store}>
            <PreferencesProvider>
                <SolarProvider value={{ weight: 'Bold', color: 'currentColor' }}>
                    <HeroUIProvider>
                        <NavigationProgress />
                        {children}
                        <Toaster
                            position="top-right"
                            toastOptions={{
                                duration: 4000,
                                style: {
                                    background: '#fff',
                                    color: '#333',
                                    borderRadius: '12px',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                                },
                            }}
                        />
                    </HeroUIProvider>
                </SolarProvider>
            </PreferencesProvider>
        </Provider>
    );
}

export default function Providers({ children }) {
    if (config.googleClientId) {
        return (
            <GoogleOAuthProvider clientId={config.googleClientId}>
                <AppProviders>{children}</AppProviders>
            </GoogleOAuthProvider>
        );
    }
    return <AppProviders>{children}</AppProviders>;
}
