import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Professional SEO Metadata
  title: {
    default: "Attabay CodeEaty | Best Tools for Productivity",
    template: "%s | Attabay CodeEaty",
  },
  description: "Welcome to Your Brand Name. We provide professional tools to help you streamline your work and boost productivity.",
  keywords: ["productivity tools", "online tools", "pos system", "business tools"],
  openGraph: {
    title: "Your Brand Name",
    description: "The best productivity tools for your daily tasks.",
    url: "https://yourdomain.com",
    siteName: "Your Brand Name",
    locale: "en_US",
    type: "website",
  },
  alternates: {
    canonical: "https://yourdomain.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}