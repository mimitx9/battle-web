import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import LayoutContent from "@/components/layout/LayoutContent";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import AnalyticsDemo from "@/components/analytics/AnalyticsDemo";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: {
    default: "FA Streak - Thi VSTEP khó, có Streak lo",
    template: "%s | LUYỆN THI VSTEP"
  },
  description: "Nền tảng luyện thi tiếng Anh VSTEP với đầy đủ các kỹ năng: Listening, Reading, Writing, Speaking. Học miễn phí, luyện thi hiệu quả, tỷ lệ đậu cao 95%.",
  keywords: ["luyện thi VSTEP", "tiếng Anh VSTEP", "thi VSTEP online", "luyện thi tiếng Anh", "VSTEP listening", "VSTEP reading", "VSTEP writing", "VSTEP speaking"],
  authors: [{ name: "LUYỆN THI VSTEP Team" }],
  creator: "LUYỆN THI VSTEP",
  publisher: "LUYỆN THI VSTEP",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://vstep.fastreak.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    url: '/',
    title: 'FA Streak - Thi VSTEP khó, có Streak lo',
    description: 'Nền tảng luyện thi tiếng Anh VSTEP với đầy đủ các kỹ năng: Listening, Reading, Writing, Speaking. Học miễn phí, luyện thi hiệu quả.',
    siteName: 'LUYỆN THI VSTEP',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'FA Streak - Thi VSTEP khó, có Streak lo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FA Streak - Thi VSTEP khó, có Streak lo',
    description: 'Nền tảng luyện thi tiếng Anh VSTEP với đầy đủ các kỹ năng: Listening, Reading, Writing, Speaking.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({
                                     children,
                                   }: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html lang="vi">
      <body className={`${inter.className} antialiased`}>
      {/* Cookiebot Consent Banner */}
      <Script
        id="Cookiebot"
        src="https://consent.cookiebot.com/uc.js"
        data-cbid="727dcede-a329-49ee-98ec-9c5ab438d951"
        strategy="afterInteractive"
      />
      
      {/* Google Analytics 4 */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-B7BEXMV3E5"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-B7BEXMV3E5');
        `}
      </Script>
      <AuthProvider>
        <GoogleAnalytics />
        <LayoutContent>{children}</LayoutContent>
        <AnalyticsDemo />
      </AuthProvider>
      </body>
      </html>
  );
}