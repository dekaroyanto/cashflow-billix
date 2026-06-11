import "./globals.css";

export const metadata = {
  title: "CashFlow Billix - Kelola Keuangan",
  description: "Aplikasi cashflow untuk Billix",
  manifest: "/manifest.json",
  themeColor: "#3B82F6",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  icons: {
    icon: [
      { url: "/icons/192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/180.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: [{ url: "/icons/100.png", sizes: "96x96", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CashFlow Billix",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-180x180.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="CashFlow Billix" />
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
