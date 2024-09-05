import React from "react";
import type { Metadata } from "next";
import { Inter, Syne } from "next/font/google";
import "./globals.css";
import AppWalletProvider from "./components/AppWalletProvider";
import { CanvasWalletProvider } from "./components/CanvasWalletProvider";


import Script from 'next/script';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Custom NFT",
  description: "Dscvr NFT",
};




export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en" >
      <body className=''>
        <AppWalletProvider>
          <CanvasWalletProvider>
              {children}
          </CanvasWalletProvider>
        </AppWalletProvider>
      </body>
    </html>
  );
}


