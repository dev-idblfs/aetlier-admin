/**
 * Redux Provider Component
 */

'use client';

import { Provider } from 'react-redux';
import { store } from '@/redux/store';
import { HeroUIProvider } from '@heroui/react';
import { Toaster } from 'react-hot-toast';

export default function Providers({ children }) {
    return (
        <Provider store={store}>
            <HeroUIProvider>
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
        </Provider>
    );
}
