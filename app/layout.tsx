import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const inter=localFont({src:[{path:'./fonts/inter-400.ttf',weight:'400'},{path:'./fonts/inter-500.ttf',weight:'500'},{path:'./fonts/inter-600.ttf',weight:'600'},{path:'./fonts/inter-700.ttf',weight:'700'}],variable:'--font-inter',display:'swap'});
const fraunces=localFont({src:[{path:'./fonts/fraunces-500.ttf',weight:'500'},{path:'./fonts/fraunces-600.ttf',weight:'600'}],variable:'--font-fraunces',display:'swap'});

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
  themeColor: "#6C3CE9",
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${fraunces.variable}`} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{__html:"try{var t=localStorage.getItem('rf-theme');document.documentElement.classList.toggle('dark',t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches))}catch(e){}"}}/></head>
      <body className="antialiased">{children}</body>
    </html>
  );
}


