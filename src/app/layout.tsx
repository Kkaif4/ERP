"use client";

import { TranslationProvider } from "@/lib/i18n";
import { Toaster } from "sonner";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import "./globals.css";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className="antialiased">
                <TranslationProvider>
                    <Toaster position="top-center" richColors />
                    <LanguageToggle />
                    {children}
                </TranslationProvider>
            </body>
        </html>
    );
}
