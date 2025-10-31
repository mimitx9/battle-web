'use client';

import { useState, useEffect, useCallback } from 'react';
import { getFirePointsData, saveFirePointsData, resetFirePoints as resetFirePointsUtil } from '@/lib/firePointsUtils';

interface FirePointsData {
  points: number;
  lastUpdateTime: number;
  lastActiveTime: number;
  // Thời điểm bắt đầu của ngày hiện tại (ms). Dùng để reset theo ngày
  dayStartTime?: number;
}

const POINTS_PER_MINUTE = 10;
const MAX_DAILY_FIRE_POINTS = 180;
const ONE_DAY_MS = 24 * 60 * 60 * 1000; // 24 giờ tính bằng milliseconds

const getStartOfTodayMs = (): number => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.getTime();
};

export const useFirePoints = () => {
  const [firePoints, setFirePoints] = useState<number>(0);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isClient, setIsClient] = useState<boolean>(false);


  // Tính toán đốm lửa dựa trên thời gian, có giới hạn/ngày
  const calculateFirePoints = useCallback((data: FirePointsData): number => {
    const now = Date.now();
    const timeSinceLastUpdate = now - data.lastUpdateTime;
    const timeSinceLastActive = now - data.lastActiveTime;
    const todayStart = getStartOfTodayMs();
    const dataDayStart = data.dayStartTime ?? todayStart;

    // Nếu đã sang ngày mới so với mốc dayStart, reset về 0
    if (now >= dataDayStart + ONE_DAY_MS) {
      return 0;
    }

    // Nếu user không hoạt động quá 1 ngày, reset về 0
    if (timeSinceLastActive > ONE_DAY_MS) {
      return 0;
    }

    // Tính số phút đã trôi qua kể từ lần cập nhật cuối
    const minutesPassed = Math.floor(timeSinceLastUpdate / (60 * 1000));
    
    // Cộng thêm đốm lửa cho mỗi phút
    const additionalPoints = minutesPassed * POINTS_PER_MINUTE;
    const unclamped = Math.max(0, data.points + additionalPoints);
    const clamped = Math.min(unclamped, MAX_DAILY_FIRE_POINTS);
    
    console.log('🔥 calculateFirePoints:', {
      timeSinceLastUpdate,
      minutesPassed,
      additionalPoints,
      currentPoints: data.points,
      result: clamped
    });
    
    return clamped;
  }, []);

  // Cập nhật đốm lửa
  const updateFirePoints = useCallback(() => {
    const data = getFirePointsData();
    const now = Date.now();

    console.log('🔥 updateFirePoints called:', { data, now });

    if (!data) {
      // Tạo dữ liệu mới nếu chưa có
      const newData: FirePointsData = {
        points: 0,
        lastUpdateTime: now,
        lastActiveTime: now,
        dayStartTime: getStartOfTodayMs()
      };
      saveFirePointsData(newData);
      setFirePoints(0);
      console.log('🔥 Created new data:', newData);
      return;
    }

    // Migration dữ liệu cũ không có dayStartTime
    const dayStartTime = data.dayStartTime ?? getStartOfTodayMs();

    // Nếu lastUpdateTime thuộc ngày trước hôm nay, reset theo ngày
    const startOfToday = getStartOfTodayMs();
    if (data.lastUpdateTime < startOfToday) {
      const resetData: FirePointsData = {
        points: 0,
        lastUpdateTime: now,
        lastActiveTime: now,
        dayStartTime: startOfToday
      };
      saveFirePointsData(resetData);
      setFirePoints(0);
      console.log('🔥 Daily reset due to new day');
      return;
    }

    // Kiểm tra nếu user không hoạt động quá 1 ngày
    const timeSinceLastActive = now - data.lastActiveTime;
    if (timeSinceLastActive > ONE_DAY_MS) {
      const resetData: FirePointsData = {
        points: 0,
        lastUpdateTime: now,
        lastActiveTime: now,
        dayStartTime
      };
      saveFirePointsData(resetData);
      setFirePoints(0);
      console.log('🔥 Reset due to inactivity:', timeSinceLastActive);
      return;
    }

    // Tính toán đốm lửa mới
    const newPoints = calculateFirePoints(data);
    
    console.log('🔥 Calculating points:', {
      oldPoints: data.points,
      timeSinceLastUpdate: now - data.lastUpdateTime,
      minutesPassed: Math.floor((now - data.lastUpdateTime) / (60 * 1000)),
      newPoints
    });
    
    // Cập nhật dữ liệu
    // Giới hạn theo ngày
    if (newPoints >= MAX_DAILY_FIRE_POINTS) {
      // Khi đạt trần, cố định ở 180 cho tới khi sang ngày mới
      const cappedData: FirePointsData = {
        points: MAX_DAILY_FIRE_POINTS,
        lastUpdateTime: now,
        lastActiveTime: now,
        dayStartTime
      };
      saveFirePointsData(cappedData);
      setFirePoints(MAX_DAILY_FIRE_POINTS);
      console.log('🔥 Reached daily cap:', MAX_DAILY_FIRE_POINTS);
      return;
    }

    const updatedData: FirePointsData = {
      points: newPoints,
      lastUpdateTime: now,
      lastActiveTime: now,
      dayStartTime
    };
    
    saveFirePointsData(updatedData);
    setFirePoints(newPoints);
    console.log('🔥 Updated fire points:', newPoints);
  }, [calculateFirePoints]);

  // Cập nhật thời gian hoạt động cuối (khi user tương tác)
  const updateLastActiveTime = useCallback(() => {
    const data = getFirePointsData();
    if (data) {
      const updatedData: FirePointsData = {
        ...data,
        lastActiveTime: Date.now()
      };
      saveFirePointsData(updatedData);
    }
  }, []);

  // Reset đốm lửa về 0 (khi clear cache hoặc logout)
  const resetFirePoints = useCallback(() => {
    resetFirePointsUtil();
    setFirePoints(0);
  }, []);

  // Đảm bảo chỉ chạy trên client để tránh hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Khởi tạo đốm lửa khi component mount (chỉ trên client)
  useEffect(() => {
    if (isClient) {
      updateFirePoints();
    }
  }, [isClient, updateFirePoints]);

  // Thiết lập timer để cập nhật đốm lửa mỗi phút (chỉ trên client)
  useEffect(() => {
    if (!isClient) return;
    
    console.log('🔥 Setting up timer, isOnline:', isOnline);
    
    const interval = setInterval(() => {
      console.log('🔥 Timer tick, isOnline:', isOnline);
      if (isOnline) {
        updateFirePoints();
      }
    }, 60 * 1000); // Mỗi phút

    return () => {
      console.log('🔥 Clearing timer');
      clearInterval(interval);
    };
  }, [isClient, isOnline, updateFirePoints]);

  // Theo dõi trạng thái online/offline (chỉ trên client)
  useEffect(() => {
    if (!isClient) return;
    
    const handleOnline = () => {
      setIsOnline(true);
      updateFirePoints(); // Cập nhật ngay khi online
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Kiểm tra trạng thái ban đầu
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isClient, updateFirePoints]);

  // Theo dõi các sự kiện tương tác của user để cập nhật lastActiveTime (chỉ trên client)
  useEffect(() => {
    if (!isClient) return;
    
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleUserActivity = () => {
      updateLastActiveTime();
    };

    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity, true);
      });
    };
  }, [isClient, updateLastActiveTime]);

  // Theo dõi sự kiện beforeunload để lưu dữ liệu cuối cùng (chỉ trên client)
  useEffect(() => {
    if (!isClient) return;
    
    const handleBeforeUnload = () => {
      updateLastActiveTime();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isClient, updateLastActiveTime]);

  return {
    firePoints,
    isOnline,
    updateFirePoints,
    resetFirePoints,
    updateLastActiveTime
  };
};
