import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'FA Streak - Thi VSTEP khó, có Streak lo'
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1e40af',
          backgroundImage: 'linear-gradient(135deg, #1e40af 0%, #1d4ed8 100%)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            textAlign: 'center',
            padding: '40px',
          }}
        >
          <h1
            style={{
              fontSize: '72px',
              fontWeight: 'bold',
              marginBottom: '20px',
              lineHeight: '1.1',
            }}
          >
            LUYỆN THI VSTEP
          </h1>
          <p
            style={{
              fontSize: '32px',
              marginBottom: '40px',
              opacity: 0.9,
              maxWidth: '800px',
            }}
          >
            Nền tảng luyện thi tiếng Anh VSTEP hàng đầu Việt Nam
          </p>
          <div
            style={{
              display: 'flex',
              gap: '20px',
              fontSize: '24px',
            }}
          >
            <span>🎧 Listening</span>
            <span>📖 Reading</span>
            <span>✍️ Writing</span>
            <span>🗣️ Speaking</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
