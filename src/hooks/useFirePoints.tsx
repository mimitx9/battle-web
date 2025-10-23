'use client';

import { useState, useEffect, useCallback } from 'react';
import { getFirePointsData, saveFirePointsData, resetFirePoints as resetFirePointsUtil } from '@/lib/firePointsUtils';

interface FirePointsData {
  points: number;
  lastUpdateTime: number;
  lastActiveTime: number;
}

const POINTS_PER_MINUTE = 10;
const ONE_DAY_MS = 24 * 60 * 60 * 1000; // 24 giờ tính bằng milliseconds

export const useFirePoints = () => {
  const [firePoints, setFirePoints] = useState<number>(0);
  const [isOnline, setIsOnline] = useState<boolean>(true);


  // Tính toán đốm lửa dựa trên thời gian
  const calculateFirePoints = useCallback((data: FirePointsData): number => {
    const now = Date.now();
    const timeSinceLastUpdate = now - data.lastUpdateTime;
    const timeSinceLastActive = now - data.lastActiveTime;

    // Nếu user không hoạt động quá 1 ngày, reset về 0
    if (timeSinceLastActive > ONE_DAY_MS) {
      return 0;
    }

    // Tính số phút đã trôi qua kể từ lần cập nhật cuối
    const minutesPassed = Math.floor(timeSinceLastUpdate / (60 * 1000));
    
    // Cộng thêm đốm lửa cho mỗi phút
    const additionalPoints = minutesPassed * POINTS_PER_MINUTE;
    
    console.log('🔥 calculateFirePoints:', {
      timeSinceLastUpdate,
      minutesPassed,
      additionalPoints,
      currentPoints: data.points,
      result: Math.max(0, data.points + additionalPoints)
    });
    
    return Math.max(0, data.points + additionalPoints);
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
        lastActiveTime: now
      };
      saveFirePointsData(newData);
      setFirePoints(0);
      console.log('🔥 Created new data:', newData);
      return;
    }

    // Kiểm tra nếu user không hoạt động quá 1 ngày
    const timeSinceLastActive = now - data.lastActiveTime;
    if (timeSinceLastActive > ONE_DAY_MS) {
      const resetData: FirePointsData = {
        points: 0,
        lastUpdateTime: now,
        lastActiveTime: now
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
    const updatedData: FirePointsData = {
      points: newPoints,
      lastUpdateTime: now,
      lastActiveTime: now
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

  // Khởi tạo đốm lửa khi component mount
  useEffect(() => {
    updateFirePoints();
  }, [updateFirePoints]);

  // Thiết lập timer để cập nhật đốm lửa mỗi phút
  useEffect(() => {
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
  }, [isOnline, updateFirePoints]);

  // Theo dõi trạng thái online/offline
  useEffect(() => {
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
  }, [updateFirePoints]);

  // Theo dõi các sự kiện tương tác của user để cập nhật lastActiveTime
  useEffect(() => {
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
  }, [updateLastActiveTime]);

  // Theo dõi sự kiện beforeunload để lưu dữ liệu cuối cùng
  useEffect(() => {
    const handleBeforeUnload = () => {
      updateLastActiveTime();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [updateLastActiveTime]);

  return {
    firePoints,
    isOnline,
    updateFirePoints,
    resetFirePoints,
    updateLastActiveTime
  };
};
