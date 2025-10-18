import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Luyện thi VSTEP Speaking - Kỹ năng nói',
  description: 'Luyện thi VSTEP Speaking với các chủ đề giao tiếp hàng ngày. Cải thiện kỹ năng nói tiếng Anh tự tin.',
  keywords: ['VSTEP speaking', 'luyện nói VSTEP', 'thi speaking VSTEP', 'kỹ năng nói tiếng Anh'],
  openGraph: {
    title: 'Luyện thi VSTEP Speaking - Kỹ năng nói',
    description: 'Luyện thi VSTEP Speaking với các chủ đề giao tiếp hàng ngày.',
    type: 'website',
  },
}

export default function SpeakingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
