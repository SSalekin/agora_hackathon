import type { Metadata } from 'next';
import '../globals.css';

export const metadata: Metadata = {
  title: 'NestFind | Sign In',
  description: 'Sign in to your NestFind account',
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
