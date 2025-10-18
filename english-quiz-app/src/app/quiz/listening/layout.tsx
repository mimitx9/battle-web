import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Luyện thi VSTEP Listening - Kỹ năng nghe hiểu',
  description: 'Luyện thi VSTEP Listening với audio chất lượng cao, đa dạng chủ đề. Cải thiện kỹ năng nghe hiểu tiếng Anh hiệu quả.',
  keywords: ['VSTEP listening', 'luyện nghe VSTEP', 'thi listening VSTEP', 'kỹ năng nghe tiếng Anh'],
  openGraph: {
    title: 'Luyện thi VSTEP Listening - Kỹ năng nghe hiểu',
    description: 'Luyện thi VSTEP Listening với audio chất lượng cao, đa dạng chủ đề.',
    type: 'website',
  },
}

export default function ListeningLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
