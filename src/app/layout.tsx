import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";

import { Suspense } from "react";
import AppSidebar from "@/components/AppSidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import NextTopLoader from 'nextjs-toploader';
import { VerificationBanner } from "@/components/auth/verification-banner";
import { AuthListener } from "@/components/auth/auth-listener";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://superdocs.dev'),
  title: {
    default: "SuperDocs - AI-Powered Documentation",
    template: "%s | SuperDocs"
  },
  description: "Generate beautiful, comprehensive documentation for your codebase in minutes using AI.",
  openGraph: {
    title: "SuperDocs - AI-Powered Documentation",
    description: "Generate beautiful, comprehensive documentation for your codebase in minutes using AI.",
    url: 'https://superdocs.dev',
    siteName: 'SuperDocs',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "SuperDocs - AI-Powered Documentation",
    description: "Generate beautiful, comprehensive documentation for your codebase in minutes using AI.",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${robotoMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <NextTopLoader color="#6366f1" showSpinner={false} />
          <AuthListener />
          <VerificationBanner />
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-white">Loading...</div>}>
            <div className="flex min-h-screen">
              <AppSidebar />
              <div className="flex-1 min-w-0">
                {children}
              </div>
            </div>
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  );
}
