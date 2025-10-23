import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: {
    default: "Fa Battle - Ai giỏi hơn sinh viên Y",
    template: "%s | Fa Battle",
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
    title: 'Fa Battle - Thi VSTEP khó, có Streak lo',
    description: 'Nền tảng luyện thi tiếng Anh VSTEP với đầy đủ các kỹ năng: Listening, Reading, Writing, Speaking. Học miễn phí, luyện thi hiệu quả.',
    siteName: 'LUYỆN THI VSTEP',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Fa Battle - Thi VSTEP khó, có Streak lo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fa Battle - Thi VSTEP khó, có Streak lo',
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
      <AuthProvider>
        {children}
      </AuthProvider>
      </body>
      </html>
  );
}