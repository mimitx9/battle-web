import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Luyện thi VSTEP Writing - Kỹ năng viết luận',
  description: 'Luyện thi VSTEP Writing với chủ đề thực tế, gợi ý chi tiết. Phát triển kỹ năng viết tiếng Anh chuyên nghiệp.',
  keywords: ['VSTEP writing', 'luyện viết VSTEP', 'thi writing VSTEP', 'kỹ năng viết tiếng Anh'],
  openGraph: {
    title: 'Luyện thi VSTEP Writing - Kỹ năng viết luận',
    description: 'Luyện thi VSTEP Writing với chủ đề thực tế, gợi ý chi tiết.',
    type: 'website',
  },
}

export default function WritingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
