import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import NetworkStatus from "@/components/NetworkStatus";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  manifest: "/manifest.json",
  title: "Artistic Milliners EMS",
  description: "Developed by Sameer Ahmed",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // const additionalClasses = "bg-pk-flag bg-no-repeat bg-cover bg-custom-size-1 bg-center bg-fixed h-screen";
  const combinedClassName = `${inter.className}`;
  return (
    <html lang="en">
      <body className={combinedClassName}>
        <NetworkStatus />
        <Navbar />
        {children}
      </body>
    </html>
  );
}
