'use client';

const FIRE_POINTS_KEY = 'battle_web_fire_points';

interface FirePointsData {
  points: number;
  lastUpdateTime: number;
  lastActiveTime: number;
  dayStartTime?: number;
}

/**
 * Reset đốm lửa về 0 (sử dụng khi logout hoặc clear cache)
 */
export const resetFirePoints = (): void => {
  try {
    localStorage.removeItem(FIRE_POINTS_KEY);
  } catch (error) {
    // Error resetting fire points
  }
};

/**
 * Lấy dữ liệu đốm lửa từ localStorage
 */
export const getFirePointsData = (): FirePointsData | null => {
  try {
    const data = localStorage.getItem(FIRE_POINTS_KEY);
    if (!data) return null;
    return JSON.parse(data);
  } catch (error) {
    console.error('Lỗi khi đọc dữ liệu đốm lửa:', error);
    return null;
  }
};

/**
 * Lưu dữ liệu đốm lửa vào localStorage
 */
export const saveFirePointsData = (data: FirePointsData): void => {
  try {
    localStorage.setItem(FIRE_POINTS_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Lỗi khi lưu dữ liệu đốm lửa:', error);
  }
};
