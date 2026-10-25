import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Cairo } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "NOXwear — أنمي • عالم الشغف • حبر ومعنى • خارج المألوف",
  description: "متجر NOXwear متعدد الأقسام بجودة عالية. هوديات بتصاميم أنمي، عالم الشغف، حبر ومعنى، وخارج المألوف. توصيل فابور لجميع مدن المغرب.",
  keywords: ["ستريت وير", "هوديات", "أنمي", "عالم الشغف", "حبر ومعنى", "خارج المألوف", "متجر إلكتروني", "المغرب", "NOXwear"],
  authors: [{ name: "NOXwear" }],
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
    shortcut: ["/icons/favicon.ico"],
  },
  openGraph: {
    title: "NOXwear",
    description: "هوديات • أنمي • عالم الشغف • حبر ومعنى • خارج المألوف",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${cairo.variable} antialiased bg-background text-foreground min-h-screen flex flex-col`}
        style={{ fontFamily: 'var(--font-cairo), var(--font-geist-sans), sans-serif' }}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
