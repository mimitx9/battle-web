'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LayoutContent from '@/components/layout/LayoutContent';
import { useAuth } from '@/hooks/useAuth';
import { useUserRanking } from '@/hooks/useUserRanking';
import { useUserBag } from '@/hooks/useUserBag';

const AccountPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { globalRank, loading: rankingLoading, fetchUserRanking } = useUserRanking();
  const router = useRouter();
  const { userBag, fetchUserBag, loading: bagLoading } = useUserBag();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleContact = () => {
    window.open('https://m.me/appfaquiz?ref=battle', '_blank');
  };

  const handleReportError = () => {
    window.open('https://m.me/appfaquiz?ref=battle', '_blank');
  };

  // Fetch user ranking when component mounts
  useEffect(() => {
    if (user) {
      fetchUserRanking();
      fetchUserBag();
    }
  }, [user, fetchUserRanking, fetchUserBag]);

  if (!user) {
    return (
      <LayoutContent>
        <div className="min-h-screen flex items-center justify-center pt-20" style={{ backgroundColor: '#04002A' }}>
          <div className="max-w-md mx-auto px-4 text-center">
            <h1 className="text-3xl font-bold text-white mb-4">
              Vui lòng đăng nhập
            </h1>
            <Link href="/login" className="text-orange-400 hover:text-orange-300">
              Đăng nhập ngay
            </Link>
          </div>
        </div>
      </LayoutContent>
    );
  }

  return (
    <LayoutContent>
      <div className="min-h-screen pt-20 pb-8" style={{ backgroundColor: '#04002A' }}>
        {/* Main Content */}
        <div className="max-w-3xl mx-auto px-4 pt-20">
          {/* User Profile Card */}
          <div 
            className="bg-white bg-opacity-10 rounded-3xl px-10 py-8 mb-8"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
          >
            <div className="flex items-center justify-between">
              {/* Left side - User Info */}
              <div className="flex-1">
                <h2 className="text-white text-2xl font-bold mb-2">
                  {user.fullName || user.username || 'FA Battle'}
                </h2>
                <p className="text-white text-sm my-2 opacity-30">
                  {user.email || 'user@example.com'}
                </p>
                <p className="text-white text-sm mb-6 opacity-30">
                  {user.university || 'Đại học Y Hà Nội'}
                </p>
                <button
                  onClick={handleLogout}
                  className="text-yellow-400 hover:text-yellow-300 font-medium text-sm"
                >
                  Đăng xuất
                </button>
              </div>

              {/* Right side - Avatar and Level */}
              <div className="flex flex-col items-center relative">
                {/* Avatar with gradient ring */}
                <div className="w-28 h-28 rounded-full bg-white/10 p-2 mb-3 relative">
                  <div className="w-full h-full rounded-full  bg-gradient-to-t from-transparent to-white flex items-center justify-center overflow-hidden">
                    {user.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt={user.fullName || user.username}
                        className="w-full h-full rounded-full object-fill"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                {/* Star icon positioned at bottom center of avatar */}
                {(user?.universityImage) && (
                  <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
                    <img 
                      src={user.universityImage} 
                      alt={user.university || 'University'} 
                      className="w-8 h-8"
                    />
                  </div>
                )}
                </div>
                
                
                {/* Level Info */}
                <div className="flex items-center my-2" />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-4">
            {/* Mua key */}
            <button
              onClick={() => router.push('/shop')}
              className="bg-white bg-opacity-10 rounded-3xl px-8 py-4 flex flex-col items-start space-y-2 hover:bg-opacity-5 duration-500 transition-all"
            >
              <img 
                src="/logos/account/buy-key.png" 
                alt="Mua key" 
                className="w-auto h-20"
              />
              <span className="text-white text-sm font-medium">Mua key</span>
            </button>

            {/* Liên hệ */}
            <button
              onClick={handleContact}
              className="bg-white bg-opacity-10 rounded-3xl px-8 py-4 flex flex-col items-start space-y-2 hover:bg-opacity-5 duration-500 transition-all"
            >
              <img 
                src="/logos/account/messenger.png" 
                alt="Liên hệ" 
                className="w-auto h-20"
              />
              <span className="text-white text-sm font-medium">Liên hệ</span>
            </button>

            {/* Báo lỗi */}
            <button
              onClick={handleReportError}
              className="bg-white bg-opacity-10 rounded-3xl px-8 py-4 flex flex-col items-start space-y-2 hover:bg-opacity-5 duration-500 transition-all"
            >
              <img 
                src="/logos/account/error.png" 
                alt="Báo lỗi" 
                className="w-auto h-20"
              />
              <span className="text-white text-sm font-medium">Báo lỗi</span>
            </button>
          </div>

          {/* User Bag - Help Tools styled like shop */}
          <div className="mt-24">
            <div className="grid grid-cols-3 gap-4 sm:grid-cols-3 md:grid-cols-3">
              {[
                {
                  key: 'battleHint' as const,
                  title: 'GỢI Ý 50/50',
                  quantity: userBag?.battleHint || 0,
                  gradient: 'linear-gradient(to top, #FF8C00, #FFD406)',
                  icon: (
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.9837 39.5107C17.9837 38.625 17.9687 37.7318 17.9912 36.8461C17.9987 36.5684 17.9011 36.4333 17.6609 36.3057C13.7129 34.204 11.116 31.0216 10.2453 26.6081C9.44221 22.5099 10.3654 18.7495 12.9174 15.4394C15.1916 12.4896 18.2089 10.6582 21.9016 10.1478C27.0806 9.43474 31.4339 11.116 34.8039 15.1167C37.2733 18.0439 38.3091 21.4966 37.9338 25.3096C37.5285 29.4979 35.4794 32.7779 32.0944 35.2398C31.5615 35.6302 30.9835 35.9679 30.3981 36.2682C30.0753 36.4333 29.9928 36.6284 29.9928 36.9587C30.0078 38.5875 30.0003 40.2087 30.0003 41.8375C29.9928 44.2619 28.2665 46.0032 25.8496 46.0258C24.6112 46.0333 23.3728 46.0333 22.1343 46.0258C19.71 46.0032 17.9837 44.2619 17.9837 41.8375C17.9762 41.0644 17.9837 40.2913 17.9837 39.5107ZM25.9772 41.9876C25.9772 41.8075 25.9772 41.6498 25.9772 41.4922C25.9772 39.0903 25.9847 36.6885 25.9697 34.2866C25.9697 33.9864 26.0598 33.8288 26.345 33.7462C26.7053 33.6411 27.0505 33.506 27.4033 33.3784C32.0268 31.6971 34.7439 26.9009 33.8057 22.0746C32.7474 16.6479 27.5159 13.1276 22.0743 14.1709C14.5911 15.6121 11.4237 24.6791 16.3775 30.4736C17.7735 32.1024 19.5524 33.1232 21.5789 33.7312C21.9242 33.8363 22.0142 34.0014 22.0067 34.3467C21.9917 36.7335 21.9992 39.1204 21.9992 41.5147C21.9992 41.6724 22.0142 41.83 22.0217 41.9876C23.3577 41.9876 24.6412 41.9876 25.9772 41.9876Z" fill="white"/>
                      <path d="M22.0078 5.95964C22.0078 3.95558 22.0078 1.98905 22.0078 0C23.3363 0 24.6423 0 25.9708 0C25.9708 1.98905 25.9708 3.96309 25.9708 5.95964C24.6573 5.95964 23.3513 5.95964 22.0078 5.95964Z" fill="white"/>
                      <path d="M5.95951 25.978C3.97051 25.978 2.00402 25.978 0 25.978C0 24.6645 0 23.3585 0 22.0225C1.97399 22.0225 3.95549 22.0225 5.95951 22.0225C5.95951 23.3435 5.95951 24.6495 5.95951 25.978Z" fill="white"/>
                      <path d="M47.9999 22.0303C47.9999 23.3513 47.9999 24.6498 47.9999 25.9784C46.0109 25.9784 44.0294 25.9784 42.0254 25.9784C42.0254 24.6648 42.0254 23.3663 42.0254 22.0303C43.9994 22.0303 45.9809 22.0303 47.9999 22.0303Z" fill="white"/>
                      <path d="M5.71973 8.40004C6.59789 7.52186 7.5286 6.59113 8.42177 5.69043C9.79531 7.07151 11.1989 8.46759 12.5874 9.86368C11.6867 10.7569 10.756 11.6726 9.85535 12.5658C8.49683 11.1997 7.10077 9.79613 5.71973 8.40004Z" fill="white"/>
                      <path d="M38.1295 12.6035C37.2063 11.6803 36.2831 10.7721 35.3975 9.88639C36.7935 8.49781 38.1896 7.10172 39.5556 5.74316C40.4338 6.62135 41.3645 7.55207 42.2652 8.45278C40.9141 9.80383 39.5181 11.2074 38.1295 12.6035Z" fill="white"/>
                      <path d="M5.7041 39.526C7.05512 38.1749 8.45118 36.7788 9.82472 35.4053C10.7329 36.3135 11.6636 37.2442 12.5793 38.1599C11.2058 39.5335 9.80971 40.9296 8.44367 42.2956C7.5505 41.3874 6.6273 40.4567 5.7041 39.526Z" fill="white"/>
                      <path d="M38.1589 35.4277C39.5325 36.8013 40.921 38.1974 42.3771 39.646C42.0844 39.9162 41.7617 40.209 41.4539 40.5092C40.891 41.0571 40.3356 41.6201 39.7877 42.1755C39.6451 42.3181 39.54 42.3857 39.3673 42.2055C38.0614 40.8845 36.7404 39.571 35.4269 38.2499C35.4044 38.2274 35.3893 38.1899 35.3818 38.1824C36.3125 37.2592 37.2508 36.3284 38.1589 35.4277Z" fill="white"/>
                    </svg>
                  )
                },
                {
                  key: 'battleSnow' as const,
                  title: 'BẢO TOÀN ĐIỂM',
                  quantity: userBag?.battleSnow || 0,
                  gradient: 'linear-gradient(to top, #0A0158, #644EFD)',
                  icon: (
                    <svg width="40" height="40" viewBox="0 0 43 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M23.0604 42.196C23.0604 43.5446 23.0704 44.7732 23.0604 46.0019C23.0504 47.1106 22.1813 47.9797 21.1125 47.9997C20.0037 48.0196 19.0847 47.1606 19.0648 46.0518C19.0448 44.973 19.0548 43.8842 19.0548 42.8054C19.0548 42.6455 19.0548 42.4857 19.0548 42.196C18.4255 42.6955 17.8861 43.125 17.3466 43.5446C16.8172 43.9641 16.2179 44.1139 15.5686 43.9341C14.7994 43.7244 14.29 43.2149 14.1202 42.4358C13.9404 41.6367 14.1901 40.9474 14.8294 40.428C16.0481 39.4391 17.2567 38.4502 18.4954 37.5012C18.9149 37.1716 19.1047 36.8419 19.0747 36.2925C19.0248 35.5434 19.0847 34.7942 19.0448 34.045C19.0348 33.8652 18.885 33.6155 18.7251 33.5256C17.1668 32.6066 15.5886 31.7176 14.0203 30.7886C13.7706 30.6387 13.6008 30.6188 13.351 30.7686C12.6518 31.1881 11.9526 31.6077 11.2334 31.9873C10.8837 32.1771 10.7439 32.4268 10.694 32.8064C10.4642 34.4046 10.2245 36.0028 9.96476 37.5911C9.77497 38.7498 8.76608 39.479 7.6573 39.2892C6.52854 39.0994 5.8293 38.0706 6.01909 36.8919C6.11898 36.2526 6.1989 35.6133 6.30878 34.8641C6.07903 34.984 5.9192 35.0539 5.77936 35.1338C4.91031 35.6333 4.05125 36.1327 3.18221 36.6322C2.06344 37.2715 0.874746 36.9918 0.285394 35.9729C-0.293969 34.964 0.0956077 33.7853 1.21438 33.136C2.18331 32.5766 3.14226 32.0172 4.11119 31.4578C4.13117 31.4478 4.15115 31.4079 4.21108 31.308C3.54182 31.0383 2.89253 30.7886 2.24325 30.5089C1.33424 30.1193 0.834793 29.2003 1.02458 28.2913C1.29429 27.0227 2.50296 26.3335 3.73161 26.793C5.23995 27.3623 6.73831 27.9517 8.23666 28.551C8.60625 28.7009 8.90592 28.7109 9.25554 28.4911C9.94478 28.0616 10.654 27.662 11.3732 27.2624C11.6129 27.1326 11.6729 26.9828 11.6729 26.7031C11.6529 24.8851 11.6529 23.0771 11.6729 21.2591C11.6729 20.9893 11.6129 20.8295 11.3732 20.6997C10.614 20.2801 9.88484 19.8206 9.11569 19.4211C8.91591 19.3212 8.59626 19.3012 8.38649 19.3811C6.93809 19.9205 5.49967 20.4899 4.06125 21.0593C3.49187 21.289 2.9225 21.4289 2.31317 21.1991C1.53403 20.9094 1.0146 20.1902 0.974639 19.3711C0.944672 18.572 1.43414 17.8028 2.1933 17.4732C2.82261 17.2035 3.45192 16.9638 4.09121 16.7041C4.12118 16.6941 4.14116 16.6641 4.20109 16.6142C4.08122 16.5243 3.99132 16.4443 3.88144 16.3844C2.97244 15.855 2.06344 15.3356 1.15444 14.8161C0.065637 14.1768 -0.303953 13.0081 0.265421 12.0092C0.854773 10.9903 2.05346 10.7106 3.16224 11.3499C4.17113 11.9293 5.18002 12.5087 6.2888 13.148C6.17892 12.3888 6.09901 11.7395 5.99911 11.1002C5.80932 9.92151 6.50856 8.89264 7.63732 8.70285C8.75609 8.51306 9.76498 9.26224 9.95477 10.4509C10.2045 12.0492 10.4542 13.6374 10.684 15.2357C10.7339 15.5753 10.8538 15.815 11.1734 15.9848C11.9226 16.3844 12.6418 16.8439 13.391 17.2335C13.5408 17.3134 13.8105 17.3034 13.9604 17.2235C15.5686 16.3145 17.1668 15.3955 18.7551 14.4565C18.8949 14.3766 19.0248 14.1668 19.0348 14.007C19.0648 13.088 19.0648 12.179 19.0348 11.26C19.0248 11.0802 18.8949 10.8605 18.7451 10.7406C17.4565 9.68177 16.148 8.6629 14.8594 7.60406C14.0702 6.95477 13.8405 5.99583 14.2401 5.14676C14.7695 4.018 16.1779 3.64841 17.2068 4.36762C17.6563 4.68726 18.0659 5.04687 18.5054 5.3865C18.6552 5.50636 18.815 5.61624 19.0548 5.79605C19.0548 4.45752 19.0448 3.23886 19.0548 2.01021C19.0648 1.16114 19.5642 0.431942 20.3134 0.14226C21.602 -0.36718 23.0204 0.55181 23.0504 1.94028C23.0803 3.0191 23.0604 4.1079 23.0604 5.18672C23.0604 5.34654 23.0604 5.51635 23.0604 5.81602C23.6697 5.32656 24.1991 4.91701 24.7185 4.49747C25.238 4.06795 25.8273 3.89813 26.4866 4.05796C27.2657 4.24775 27.7852 4.73721 27.975 5.50636C28.1747 6.30549 27.965 7.00472 27.3257 7.53414C26.107 8.54303 24.8784 9.53194 23.6197 10.5009C23.2002 10.8205 22.9904 11.1502 23.0304 11.6996C23.0903 12.4587 23.0304 13.2279 23.0604 13.997C23.0704 14.1668 23.2202 14.3866 23.36 14.4765C24.9383 15.4055 26.5166 16.3245 28.1148 17.2135C28.2746 17.3034 28.5643 17.3034 28.7241 17.2235C29.4633 16.8339 30.1626 16.3944 30.9017 15.9948C31.2114 15.825 31.3512 15.5953 31.4012 15.2556C31.6309 13.6374 31.8807 12.0292 32.1304 10.421C32.3102 9.27222 33.3191 8.52305 34.4179 8.70285C35.5566 8.88265 36.2659 9.91152 36.0761 11.0902C35.9762 11.7395 35.8863 12.3988 35.7764 13.1679C36.5855 12.7084 37.3047 12.2989 38.0139 11.8893C38.3735 11.6796 38.7231 11.4598 39.0927 11.27C40.0517 10.7606 41.1904 11.0603 41.7598 11.9693C42.3192 12.8583 42.0994 14.0769 41.1904 14.6663C40.2615 15.2756 39.2725 15.805 38.3136 16.3644C38.1738 16.4443 38.0439 16.5342 37.8241 16.6741C38.5633 16.9738 39.2226 17.2235 39.8719 17.5032C40.711 17.8628 41.2204 18.7518 41.0905 19.5909C40.9407 20.5398 40.2415 21.259 39.3025 21.319C38.9529 21.339 38.5733 21.269 38.2337 21.1392C36.7253 20.5798 35.227 19.9705 33.7187 19.4111C33.4889 19.3312 33.1593 19.3611 32.9395 19.471C32.2003 19.8506 31.5011 20.3001 30.7719 20.6997C30.5022 20.8495 30.4223 21.0093 30.4223 21.329C30.4423 23.127 30.4423 24.925 30.4223 26.723C30.4223 26.9927 30.4622 27.1526 30.7119 27.2824C31.4811 27.712 32.2303 28.1814 33.0094 28.591C33.1992 28.6909 33.4989 28.6909 33.6987 28.621C35.257 28.0416 36.7953 27.4223 38.3535 26.8229C39.2326 26.4833 40.1316 26.743 40.691 27.4522C41.2204 28.1315 41.2903 29.0904 40.7609 29.7797C40.5212 30.0993 40.1616 30.359 39.812 30.5389C39.2026 30.8385 38.5633 31.0583 37.8441 31.348C38.0339 31.4778 38.1438 31.5577 38.2637 31.6277C39.2426 32.197 40.2315 32.7464 41.1904 33.3458C41.9496 33.8252 42.1893 34.5744 42.0195 35.4335C41.8597 36.2426 41.3203 36.742 40.5312 36.9518C39.9918 37.0916 39.4823 36.9818 38.9928 36.7021C38.1138 36.1926 37.2348 35.6832 36.3557 35.1837C36.1959 35.0938 36.0361 35.0139 35.7864 34.8841C35.8863 35.6233 35.9762 36.2725 36.0761 36.9118C36.2659 38.1005 35.5666 39.1294 34.4379 39.3092C33.3091 39.499 32.3202 38.7598 32.1204 37.5611C31.8607 35.9829 31.621 34.4046 31.4012 32.8263C31.3413 32.4268 31.1914 32.1671 30.8218 31.9773C30.1126 31.6077 29.4234 31.1981 28.7441 30.7786C28.4944 30.6288 28.3246 30.6487 28.0749 30.7986C26.5166 31.7176 24.9383 32.6266 23.36 33.5156C23.1203 33.6454 23.0304 33.7753 23.0304 34.045C23.0504 34.914 23.0204 35.7731 23.0504 36.6421C23.0604 36.8519 23.1802 37.1216 23.3401 37.2615C24.6187 38.3203 25.9272 39.3492 27.2258 40.398C27.8951 40.9374 28.1647 41.6466 27.965 42.4857C27.6253 43.8642 26.0471 44.4536 24.8684 43.6245C24.299 43.2049 23.7396 42.7255 23.0604 42.196ZM16.6474 23.996C16.6474 24.6953 16.6574 25.3945 16.6474 26.0937C16.6374 26.4334 16.7773 26.6531 17.0669 26.8129C18.2656 27.4922 19.4443 28.2114 20.663 28.8707C20.8628 28.9806 21.2324 28.9906 21.4421 28.8807C22.6508 28.2214 23.8395 27.5122 25.0382 26.8329C25.3479 26.6531 25.4777 26.4234 25.4777 26.0638C25.4677 24.7053 25.4677 23.3368 25.4777 21.9783C25.4777 21.6486 25.3778 21.4089 25.0781 21.2391C23.8695 20.5498 22.6708 19.8306 21.4421 19.1614C21.2524 19.0515 20.9027 19.0515 20.7129 19.1514C19.4743 19.8306 18.2556 20.5398 17.047 21.269C16.8572 21.3789 16.6974 21.6786 16.6874 21.8983C16.6174 22.5976 16.6474 23.2968 16.6474 23.996Z" fill="white"/>
                    </svg>
                  )
                },
                {
                  key: 'battleBlockTop1' as const,
                  title: 'CHẶN TOP 1',
                  quantity: userBag?.battleBlockTop1 || 0,
                  gradient: 'linear-gradient(to top, #25000f,#e320b6)',
                  icon: (
                    <svg width="48" height="48" viewBox="0 0 73 73" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="36.5" cy="36.5" r="31.5" stroke="white" strokeWidth="10"/>
                      <rect x="56.8262" y="10.103" width="10" height="61.6951" transform="rotate(45 56.8262 10.103)" fill="white"/>
                      <path d="M42.2939 47.707C42.9239 47.0773 44.0009 47.5233 44.001 48.4141V53C44.001 54.6568 42.6578 55.9999 41.001 56H36.415C35.5242 56 35.0781 54.9229 35.708 54.293L42.2939 47.707ZM41.001 15C42.6578 15.0001 44.001 16.3432 44.001 18V33.7324C44.0008 35.3891 42.6577 36.7324 41.001 36.7324H37.001C35.3442 36.7324 34.0011 35.3891 34.001 33.7324V27.3418L29.2002 27.3223C26.5337 27.3109 25.2063 24.0867 27.0918 22.2012L34.001 15.292V15H41.001Z" fill="white"/>
                    </svg>
                  )
                },
                {
                  key: 'battleBlockBehind' as const,
                  title: 'CHẶN PHÍA SAU',
                  quantity: userBag?.battleBlockBehind || 0,
                  gradient: 'linear-gradient(to top, rgb(17, 35, 2),rgb(118, 220, 30))',
                  icon: (
                    
                <svg width="48" height="48" viewBox="0 0 73 73" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="36.5" cy="36.5" r="31.5" stroke="white" strokeWidth="10"/>
                </svg>
                  )
                },
              ].map((it, idx) => (
                <div
                  key={it.key}
                  className="rounded-3xl px-8 py-6 text-center relative border-4 mb-16"
                  style={{
                    background: `linear-gradient(to bottom, transparent, rgba(255,255,255,0.05))`,
                    borderColor: '#252145',
                  }}
                >
                  {/* Icon circle */}
                  <div
                    className="-mt-20 mx-auto w-24 h-24 rounded-full flex items-center justify-center z-10"
                    style={{
                      background: it.gradient,
                      boxShadow: '0 0 20px rgba(255,255,255,0.3), inset 0 -5px 15px rgba(255,255,255,0.5)'
                    }}
                  >
                    {it.icon}
                  </div>

                  {/* Title */}
                  <h4 className="text-xl text-white mt-8 mb-2 tracking-wider" style={{ fontFamily: 'Baloo' }}>
                    {it.title}
                  </h4>
                  {/* Quantity */}
                  <p className="text-xl text-white/50" style={{ fontFamily: 'Baloo' }}>
                    {bagLoading ? 'Đang tải...' : `${it.quantity} lượt`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </LayoutContent>
  );
};

export default AccountPage;
