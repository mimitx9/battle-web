'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';
import StructuredData from '@/components/seo/StructuredData';

const HomePage: React.FC = () => {
  const { user } = useAuth();

  const organizationStructuredData = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "name": "LUYỆN THI VSTEP",
    "description": "Nền tảng luyện thi tiếng Anh VSTEP với đầy đủ các kỹ năng: Listening, Reading, Writing, Speaking",
    "url": process.env.NEXT_PUBLIC_SITE_URL || "https://vstep.fastreak.com",
    "logo": `${process.env.NEXT_PUBLIC_SITE_URL || "https://vstep.fastreak.com"}/logo.png`,
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "availableLanguage": "Vietnamese"
    },
    "sameAs": [
      "https://www.facebook.com/luyenthivstep",
      "https://www.youtube.com/luyenthivstep"
    ],
    "offers": {
      "@type": "Offer",
      "name": "Luyện thi VSTEP miễn phí",
      "description": "Khóa học luyện thi VSTEP hoàn toàn miễn phí",
      "price": "0",
      "priceCurrency": "VND"
    }
  };

  const courseStructuredData = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": "Luyện thi VSTEP",
    "description": "Khóa học luyện thi tiếng Anh VSTEP toàn diện",
    "provider": {
      "@type": "Organization",
      "name": "LUYỆN THI VSTEP"
    },
    "courseMode": "online",
    "educationalLevel": "intermediate",
    "teaches": [
      "Listening skills",
      "Reading comprehension", 
      "Writing skills",
      "Speaking skills"
    ],
    "inLanguage": "vi"
  };

  return (
    <>
      <StructuredData data={organizationStructuredData} />
      <StructuredData data={courseStructuredData} />
      <div className="bg-white min-h-screen">
        {/* Hero */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-36 pb-16 sm:pb-20">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-medium text-black">Luyện thi tiếng Anh đầu ra cấp tốc</h1>
            <p className="mt-4 text-black/60 text-sm sm:text-base">Thi thử tiếng Anh đầu ra VSTEP B1, B2... dễ dàng cùng FA Streak</p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/subscription">
                <button className="h-12 sm:h-14 px-10 rounded-full text-gray-600 text-sm sm:text-base border border-gray-200 bg-white">Nâng Pro</button>
              </Link>
              <Link href="/quiz-validation">
                <button className="h-12 sm:h-14 px-10 rounded-full text-white text-sm sm:text-base font-semibold tracking-wide shadow-lg shadow-gray-200" style={{ backgroundColor: '#FFBA08' }}>THI THỬ FREE</button>
              </Link>
            </div>
            {/* Student success section */}
            <div className="mt-8 flex items-center justify-center gap-2">
              <div className="flex -space-x-1">
                {/* Avatar 1 - Nền xanh dương với chữ D */}
                <div className="w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center text-white text-[10px] font-semibold border-2 border-white">
                  Q
                </div>
                {/* Avatar 2 - Nền đỏ với chữ Q */}
                <div className="w-5 h-5 rounded-full bg-orange-400 flex items-center justify-center text-white text-[10px] font-semibold border-2 border-white">
                  S
                </div>
                {/* Avatar 3 - Nền tím với chữ A */}
                <div className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center text-white text-[10px] font-semibold border-2 border-white">
                  C
                </div>
                {/* Avatar 4 - Nền hồng với chữ V */}
                <div className="w-5 h-5 rounded-full bg-pink-500 flex items-center justify-center text-white text-[10px] font-semibold border-2 border-white">
                  H
                </div>
              </div>
              <p className="text-gray-600 text-xs">
                +25.000 sinh viên Y đã thi đậu
              </p>
            </div>
          </div>

          {/* Preview cards */}
          <div className="mt-12 sm:mt-16 flex justify-center">
            <div className="rounded-3xl border border-gray-200 sm:p-12 max-w-5xl">
              <video 
                src="/logos/intro.mp4" 
                autoPlay 
                loop 
                muted 
                playsInline
                className="w-full h-auto rounded-2xl"
              />
            </div>
          </div>

          {/* Logos */}
          <div className="mt-14 sm:mt-16">
            <p className="text-center text-black/60 text-sm sm:text-base">Tổng hợp các đề mới nhất đến từ các trường</p>
            <div className="mt-10 flex flex-wrap justify-center items-center gap-8 sm:gap-12">
              {['/logos/logo1.svg','/logos/logo2.svg','/logos/logo3.svg','/logos/logo4.svg','/logos/logo5.svg','/logos/logo6.svg'].map((src, i) => (
                <img key={i} src={src} alt={`logo-${i+1}`} className="h-16 sm:h-24 w-auto object-contain" />
              ))}
            </div>
          </div>
        </div>

        {/* Feature highlight section */}
        <div className="max-w-6xl mx-auto mt-14 px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl sm:text-3xl font-semibold">Luyện cấp tốc, mất gốc cũng thi đậu</h2>
          <p className="text-center text-black/60 text-sm sm:text-base mt-3">Đạt điểm cao với phương pháp luyện thi hiệu quả</p>

          <div className="mt-12 rounded-3xl overflow-hidden">
            <div className="bg-black text-white">
              <div className="grid grid-cols-1 md:grid-cols-4 items-start gap-6 md:gap-10">
                <div className="md:col-span-1 ml-10 mt-36">
                  <div className="flex flex-col items-start gap-3">
                    <img src="/logos/key.png" alt="key" className="h-14" />
                    <div className="text-xl sm:text-xl font-semibold">Học cấp tốc</div>
                  </div>
                  <p className="mt-4 text-white/70 text-sm sm:text-sm">Thi thử trực tiếp, chữa đề trực tiếp, lên trình trực tiếp, tiết kiệm thời gian học tối đa</p>
                </div>
                <div className="md:col-span-3 mt-28 relative w-full bg-white overflow-hidden rounded-tl-3xl rounded-br-3xl">
                  <img src="/logos/homeimage.png" alt="dashboard" className="w-full h-auto object-cover object-center" />
                  <div className="absolute bottom-0 right-0 w-20 h-20 bg-white rounded-tl-full"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Mini feature cards */}
          <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6 mt-8">
            {[
              {t:'Đề thi mới nhất', d:'Tổng hợp đề thi mới nhất của 30 trường được cập nhật theo kỳ thi VSTEP toàn quốc'},
              {t:'Thi thử như thật', d:'Mô phỏng phòng thi thực tế nhất, giúp bạn có trải nghiệm đánh giá tốt & tự tin trước khi thi'},
              {t:'Chữa bài siêu xịn', d:'AI và đội ngũ giảng viên FA Streak sẽ giải đáp chữa bài 24/7, nhằm giúp bạn lên kết quả cao nhất'},
            ].map(({t,d}) => (
              <div key={t} className="rounded-3xl bg-gray-100 p-10">
                <div className="font-medium">{t}</div>
                <p className="text-black/60 text-sm mt-2">{d}</p>
              </div>
            ))}
          </div>

          {/* Student Feedback Section */}
          <div className="mt-16 sm:mt-20 mb-16 rounded-3xl p-8 lg:p-12" style={{ backgroundColor: '#FFBA08' }}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-center">
              {/* Left side - Blue background with title */}
              <div className="text-center lg:text-left">
                <div className="text-white  h-96 flex flex-col justify-center">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold leading-tight">
                    +25.000 sinh viên đã thi đậu và đánh giá
                  </h2>
                  <p className="text-white/90 text-sm sm:text-base mt-4">
                    Thi thử là cách tốt nhất để tự tin trước khi thi. Đừng phí tiền vào khóa học chống trượt đắt tiền vô ích
                  </p>
                </div>
              </div>

              {/* Column 2 - Slide feedback 1 */}
              <div className="relative hover-pause">
                <div className="h-96 overflow-hidden rounded-2xl">
                  <div className="animate-scroll-up-very-slow space-y-4">
                    {/* Feedback cards - duplicated for seamless loop */}
                    {[
                      {
                        name: "Phạm Kim Oanh",
                        avatar: "/logos/avatar/Pham_Thi_Kim_Oanh.png",
                        content: "Nhờ Streak mà em đậu chứng chỉ C1 đó, cảm ơn FA Streak.",
                        likes: 174,
                        rating: 5
                      },
                      {
                        name: "Lê Anh Thư",
                        avatar: "/logos/avatar/Le_Anh_Thu.png",
                        content: "Em mua gói 3 tháng và được cô Huệ bày cho nhiều cách học hay lắm, đã thế còn chữa đề và hỗ trợ nhiệt tình 24/7, cảm ơn FA Streak đã cứu vớt chúng em tiếng Anh đầu ra",
                        likes: 365,
                        rating: 5
                      },
                      {
                        name: "Hoàng Thu Hiền",
                        avatar: "/logos/avatar/Ho_Thi_Chinh.png",
                        content: "Cách học của Streak rất hiệu quả, em đã đạt được B2 trong 1 tuần, đã thế còn được bày cho trick lỏ đọc hiểu và viết được bài reading siêu dài, cảm ơn FA Streak.",
                        likes: 298,
                        rating: 5
                      }
                    ].map((feedback, index) => (
                      <div key={index} className="bg-white p-4 rounded-2xl flex items-start gap-3 shadow-sm">
                        <img 
                          src={feedback.avatar} 
                          alt={feedback.name}
                          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-sm text-gray-900">{feedback.name}</h4>
                            <div className="flex items-center gap-1">
                              <span className="text-yellow-400">★</span>
                              <span className="text-sm font-medium text-gray-700">{feedback.rating}</span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 mb-3 leading-relaxed">{feedback.content}</p>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <span className="text-blue-500">👍</span>
                              <span className="text-sm text-gray-600">{feedback.likes}</span>
                            </div>
                            <div className="flex -space-x-1">
                              {(() => {
                                const avatars = [
                                  "/logos/avatar/Pham_Thi_Kim_Oanh.png",
                                  "/logos/avatar/Le_Anh_Thu.png", 
                                  "/logos/avatar/Ho_Thi_Chinh.png",
                                  "/logos/avatar/Ly_Ly.png",
                                  "/logos/avatar/Dinh_Trong_Nghia.png",
                                  "/logos/avatar/Luong_Phuong_An.png",
                                  "/logos/avatar/Do_Dinh_Vu.png",
                                  "/logos/avatar/Do_Thi_Thu_Ha.png",
                                  "/logos/avatar/Hoang_Tuan_Linh.png",
                                  "/logos/avatar/Luu_Xuan_Truong.png",
                                  "/logos/avatar/Ngoc_Nga.png",
                                  "/logos/avatar/Pham_Tra_My.png",
                                  "/logos/avatar/Phuong_Uyen.png",
                                  "/logos/avatar/Quang_Vinh.png"
                                ];
                                const shuffled = avatars.sort(() => 0.5 - Math.random());
                                return shuffled.slice(0, 3).map((avatar, i) => (
                                  <img 
                                    key={i} 
                                    src={avatar} 
                                    alt={`user-${i}`}
                                    className="w-5 h-5 rounded-full object-cover border-2 border-white"
                                  />
                                ));
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {/* Duplicate for seamless loop */}
                    {[
                      {
                        name: "Phạm Kim Oanh",
                        avatar: "/logos/avatar/Pham_Thi_Kim_Oanh.png",
                        content: "Nhờ Streak mà em đậu chứng chỉ C1 lận đó, cảm ơn FA Streak.",
                        likes: 174,
                        rating: 5
                      },
                      {
                        name: "Lê Anh Thư",
                        avatar: "/logos/avatar/Le_Anh_Thu.png",
                        content: "Gói Pro của Streak chất như nước cất, đáng đồng tiền bát gạo, cô Huệ hỗ trợ nhiệt tình lắm, cảm ơn sốp nhìuuu",
                        likes: 365,
                        rating: 5
                      },
                      {
                        name: "Hoàng Thu Hiền",
                        avatar: "/logos/avatar/Ho_Thi_Chinh.png",
                        content: "Cách học của Streak rất hiệu quả, em đã đạt được B2 trong 1 đêm, đã có thể đọc hiểu và viết được bài writing nhoay nhoáy, cảm ơn FA Streak.",
                        likes: 298,
                        rating: 5
                      }
                    ].map((feedback, index) => (
                      <div key={`duplicate-1-${index}`} className="bg-white p-4 rounded-2xl flex items-start gap-3 shadow-sm">
                        <img 
                          src={feedback.avatar} 
                          alt={feedback.name}
                          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-sm text-gray-900">{feedback.name}</h4>
                            <div className="flex items-center gap-1">
                              <span className="text-yellow-400">★</span>
                              <span className="text-sm font-medium text-gray-700">{feedback.rating}</span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 mb-3 leading-relaxed">{feedback.content}</p>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <span className="text-blue-500">👍</span>
                              <span className="text-sm text-gray-600">{feedback.likes}</span>
                            </div>
                            <div className="flex -space-x-1">
                              {(() => {
                                const avatars = [
                                  "/logos/avatar/Pham_Thi_Kim_Oanh.png",
                                  "/logos/avatar/Le_Anh_Thu.png", 
                                  "/logos/avatar/Ho_Thi_Chinh.png",
                                  "/logos/avatar/Ly_Ly.png",
                                  "/logos/avatar/Dinh_Trong_Nghia.png",
                                  "/logos/avatar/Luong_Phuong_An.png",
                                  "/logos/avatar/Do_Dinh_Vu.png",
                                  "/logos/avatar/Do_Thi_Thu_Ha.png",
                                  "/logos/avatar/Hoang_Tuan_Linh.png",
                                  "/logos/avatar/Luu_Xuan_Truong.png",
                                  "/logos/avatar/Ngoc_Nga.png",
                                  "/logos/avatar/Pham_Tra_My.png",
                                  "/logos/avatar/Phuong_Uyen.png",
                                  "/logos/avatar/Quang_Vinh.png"
                                ];
                                const shuffled = avatars.sort(() => 0.5 - Math.random());
                                return shuffled.slice(0, 3).map((avatar, i) => (
                                  <img 
                                    key={i} 
                                    src={avatar} 
                                    alt={`user-${i}`}
                                    className="w-5 h-5 rounded-full object-cover border-2 border-white"
                                  />
                                ));
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Column 3 - Slide feedback 2 */}
              <div className="relative hover-pause">
                <div className="h-96 overflow-hidden rounded-2xl">
                  <div className="animate-scroll-up-very-slow-delayed space-y-4">
                    {/* Feedback cards - duplicated for seamless loop */}
                    {[
                      {
                        name: "Lý Thu Hương",
                        avatar: "/logos/avatar/Ly_Ly.png",
                        content: "FA Streak giúp một người mất gốc như tôi đạt được B2 trong 1 tháng, đã có thể đọc hiểu và viết được bài luận đề cập, cảm ơn FA Streak.",
                        likes: 156,
                        rating: 5
                      },
                      {
                        name: "Đinh Trọng Nghĩa",
                        avatar: "/logos/avatar/Dinh_Trong_Nghia.png",
                        content: "Hú, em trúng tủ rồi ad ơi, em được B2 lận. Há há.",
                        likes: 203,
                        rating: 5
                      },
                      {
                        name: "Lương Phương An",
                        avatar: "/logos/avatar/Luong_Phuong_An.png",
                        content: "Đã đạt được mục tiêu B2 nhờ FA Streak. Cảm ơn team đã tạo ra nền tảng học tập tuyệt vời và hỗ trợ nhiệt tình.",
                        likes: 187,
                        rating: 5
                      }
                    ].map((feedback, index) => (
                      <div key={index} className="bg-white p-4 rounded-2xl flex items-start gap-3 shadow-sm">
                        <img 
                          src={feedback.avatar} 
                          alt={feedback.name}
                          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-sm text-gray-900">{feedback.name}</h4>
                            <div className="flex items-center gap-1">
                              <span className="text-yellow-400">★</span>
                              <span className="text-sm font-medium text-gray-700">{feedback.rating}</span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 mb-3 leading-relaxed">{feedback.content}</p>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <span className="text-blue-500">👍</span>
                              <span className="text-sm text-gray-600">{feedback.likes}</span>
                            </div>
                            <div className="flex -space-x-1">
                              {(() => {
                                const avatars = [
                                  "/logos/avatar/Pham_Thi_Kim_Oanh.png",
                                  "/logos/avatar/Le_Anh_Thu.png", 
                                  "/logos/avatar/Ho_Thi_Chinh.png",
                                  "/logos/avatar/Ly_Ly.png",
                                  "/logos/avatar/Dinh_Trong_Nghia.png",
                                  "/logos/avatar/Luong_Phuong_An.png",
                                  "/logos/avatar/Do_Dinh_Vu.png",
                                  "/logos/avatar/Do_Thi_Thu_Ha.png",
                                  "/logos/avatar/Hoang_Tuan_Linh.png",
                                  "/logos/avatar/Luu_Xuan_Truong.png",
                                  "/logos/avatar/Ngoc_Nga.png",
                                  "/logos/avatar/Pham_Tra_My.png",
                                  "/logos/avatar/Phuong_Uyen.png",
                                  "/logos/avatar/Quang_Vinh.png"
                                ];
                                const shuffled = avatars.sort(() => 0.5 - Math.random());
                                return shuffled.slice(0, 3).map((avatar, i) => (
                                  <img 
                                    key={i} 
                                    src={avatar} 
                                    alt={`user-${i}`}
                                    className="w-5 h-5 rounded-full object-cover border-2 border-white"
                                  />
                                ));
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {/* Duplicate for seamless loop */}
                    {[
                      {
                        name: "Lý Thu Hương",
                        avatar: "/logos/avatar/Ly_Ly.png",
                        content: "FA Streak giúp một người mất gốc như tôi đạt được B2 trong 1 tháng, đã có thể đọc hiểu và viết được bài luận đề cập, cảm ơn FA Streak.",
                        likes: 156,
                        rating: 5
                      },
                      {
                        name: "Đinh Trọng Nghĩa",
                        avatar: "/logos/avatar/Dinh_Trong_Nghia.png",
                        content: "Hú, em trúng tủ rồi ad ơi, em được B2 lận. Há há.",
                        likes: 203,
                        rating: 5
                      },
                      {
                        name: "Lương Phương An",
                        avatar: "/logos/avatar/Luong_Phuong_An.png",
                        content: "Đã đạt được mục tiêu B2 nhờ FA Streak. Cảm ơn team đã tạo ra nền tảng học tập tuyệt vời và hỗ trợ nhiệt tình.",
                        likes: 187,
                        rating: 5
                      }
                    ].map((feedback, index) => (
                      <div key={`duplicate-2-${index}`} className="bg-white p-4 rounded-2xl flex items-start gap-3 shadow-sm">
                        <img 
                          src={feedback.avatar} 
                          alt={feedback.name}
                          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-sm text-gray-900">{feedback.name}</h4>
                            <div className="flex items-center gap-1">
                              <span className="text-yellow-400">★</span>
                              <span className="text-sm font-medium text-gray-700">{feedback.rating}</span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 mb-3 leading-relaxed">{feedback.content}</p>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <span className="text-blue-500">👍</span>
                              <span className="text-sm text-gray-600">{feedback.likes}</span>
                            </div>
                            <div className="flex -space-x-1">
                              {(() => {
                                const avatars = [
                                  "/logos/avatar/Pham_Thi_Kim_Oanh.png",
                                  "/logos/avatar/Le_Anh_Thu.png", 
                                  "/logos/avatar/Ho_Thi_Chinh.png",
                                  "/logos/avatar/Ly_Ly.png",
                                  "/logos/avatar/Dinh_Trong_Nghia.png",
                                  "/logos/avatar/Luong_Phuong_An.png",
                                  "/logos/avatar/Do_Dinh_Vu.png",
                                  "/logos/avatar/Do_Thi_Thu_Ha.png",
                                  "/logos/avatar/Hoang_Tuan_Linh.png",
                                  "/logos/avatar/Luu_Xuan_Truong.png",
                                  "/logos/avatar/Ngoc_Nga.png",
                                  "/logos/avatar/Pham_Tra_My.png",
                                  "/logos/avatar/Phuong_Uyen.png",
                                  "/logos/avatar/Quang_Vinh.png"
                                ];
                                const shuffled = avatars.sort(() => 0.5 - Math.random());
                                return shuffled.slice(0, 3).map((avatar, i) => (
                                  <img 
                                    key={i} 
                                    src={avatar} 
                                    alt={`user-${i}`}
                                    className="w-5 h-5 rounded-full object-cover border-2 border-white"
                                  />
                                ));
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA bottom */}
          <div className="mt-16 sm:mt-20 mb-20 rounded-3xl border border-gray-200 p-8 sm:p-12 text-center">
            <h3 className="text-xl sm:text-2xl font-semibold">Thi thử miễn phí ngay hôm nay</h3>
            <p className="text-black/60 text-sm sm:text-base mt-2">Thi VSTEP khó, có FA Streak lo</p>
            <div className="mt-6">
              <Link href="/quiz-validation">
                <button className="h-12 sm:h-14 px-12 rounded-full text-white text-sm sm:text-base font-semibold tracking-wide" style={{ backgroundColor: '#FFBA08' }}>THI THỬ</button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HomePage;