import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Development Coach | Gap Analysis & Learning Path",
  description: "Personalized AI-powered development coaching with gap analysis and learning roadmaps",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
