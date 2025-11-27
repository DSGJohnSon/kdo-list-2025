import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Liste Cadeaux 2025",
  description: "Partagez votre liste de cadeaux avec votre famille et vos amis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${manrope.variable} font-sans antialiased`}
        style={{ fontFamily: 'var(--font-manrope)' }}
      >
        {children}
      </body>
    </html>
  );
}
