import { Inter } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
    title: 'Aetlier Admin',
    description: 'Admin panel for Aetlier',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <head>
                {/* Enable View Transitions API for smoother page transitions */}
                <meta name="view-transition" content="same-origin" />
            </head>
            <body className={inter.className}>
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    );
}
