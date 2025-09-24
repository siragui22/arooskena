import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "./footer/page";


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
        <Navbar />
       
        {children}
        <Footer />
      </body>
    </html>
  );
}
