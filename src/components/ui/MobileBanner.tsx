'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isMobileDevice } from '@/lib/deviceUtils';

const MobileBanner: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Chỉ redirect nếu đang ở trang chủ và phát hiện thiết bị mobile
    if (isMobileDevice() && pathname === '/') {
      router.push('/mobile');
    }
  }, [router, pathname]);

  // Không hiển thị banner nữa, chỉ tự động redirect
  return null;
};

export default MobileBanner;

