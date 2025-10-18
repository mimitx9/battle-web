import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Luyện thi VSTEP Reading - Kỹ năng đọc hiểu',
  description: 'Luyện thi VSTEP Reading với các bài đọc phong phú, câu hỏi đa dạng. Nâng cao kỹ năng đọc hiểu tiếng Anh.',
  keywords: ['VSTEP reading', 'luyện đọc VSTEP', 'thi reading VSTEP', 'kỹ năng đọc tiếng Anh'],
  openGraph: {
    title: 'Luyện thi VSTEP Reading - Kỹ năng đọc hiểu',
    description: 'Luyện thi VSTEP Reading với các bài đọc phong phú, câu hỏi đa dạng.',
    type: 'website',
  },
}

export default function ReadingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
