import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://develop--frankiflow.netlify.app"),
  title: "FrankiFlow — Next.js Design Preview",
  description: "Design preview for FrankiFlow Gebäudereinigung & Objektbetreuung in Frankfurt.",
  robots: {
    index: false,
    follow: false
  },
  icons: {
    icon: "https://frankiflow.de/assets/frankiflow-logo.png"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
