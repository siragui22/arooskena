import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "./footer/page";
import { AuthProvider } from "../contexts/AuthContext";
import { QueryProvider } from "../components/providers/QueryProvider";
import { AuthSyncProvider } from "../components/providers/AuthSyncProvider";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Arooskena - Plateforme de Mariage à Djibouti",
  description: "Trouvez vos prestataires de mariage, planifiez votre événement et gérez votre budget avec Arooskena, la plateforme tout-en-un pour votre mariage à Djibouti.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" data-theme="arooskena">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          <AuthProvider>
            <AuthSyncProvider>
              <Navbar />
              {children}
              <Footer />
            </AuthSyncProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
