import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Registro Financeiro | Gestão Pessoal",
  description: "Cartões, parcelas e planejamento financeiro em um só lugar.",
  applicationName: "Registro Financeiro | Gestão Pessoal",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Registro Financeiro",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}


