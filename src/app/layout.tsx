import type { Metadata } from 'next';
import { Providers } from '@/components/shell/Providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Model Compliance Workbench',
  description: 'Prototype · illustrative data — AI-assisted regulatory compliance for model development (1st line) and model validation (2nd line).',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
