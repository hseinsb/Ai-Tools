'use client'

import "./globals.css";
import { Inter } from "next/font/google";
import Navbar from "@/components/Navbar";
import Providers from '../components/Providers'

const inter = Inter({ subsets: ["latin"] });

// Metadata needs to be moved to a separate file or handled differently, 
// as it's not compatible with client components
// export const metadata = {
//   title: "AI Tools Directory",
//   description: "Find the best AI tools for your needs",
// };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#FAFCFF] dark:bg-gray-900 min-h-screen`}>
        <Providers>
          <Navbar />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  )
} 