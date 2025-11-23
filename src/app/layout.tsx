import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/context/AuthContext";
import { GoogleOneTap } from "@/components/auth/GoogleOneTap";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
    title: "Bebilush - Shoqëruesi juaj në mëmësi",
    description: "Aplikacioni modern për nënat shqiptare. Gjeni emrin e bebit, krijoni kujtime të personalizuara dhe më shumë.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="sq" suppressHydrationWarning>
            <body className={`${inter.variable} ${outfit.variable} min-h-screen flex flex-col`}>
                <AuthProvider>
                    <GoogleOneTap />
                    <Header />
                    <main className="flex-1">
                        {children}
                    </main>
                    <Footer />
                </AuthProvider>
            </body>
        </html>
    );
}
