/**
 * Utility functions for quiz time management
 */

// Định nghĩa thời gian cho từng section (tính bằng giây)
export const SECTION_TIMES = {
    'Listening': 40 * 60,    // 40 phút
    'Reading': 60 * 60,      // 60 phút  
    'Writing': 60 * 60,      // 60 phút
    'Speaking': 12 * 60      // 12 phút
} as const;

export type SectionType = keyof typeof SECTION_TIMES;

/**
 * Tính toán thời gian còn lại cho section hiện tại dựa trên startedAt
 * @param startedAt - Thời gian bắt đầu quiz (Unix timestamp)
 * @param currentSectionType - Loại section hiện tại
 * @returns Thời gian còn lại (giây)
 */
export const calculateTimeLeft = (startedAt: number, currentSectionType: SectionType): number => {
    const now = Math.floor(Date.now() / 1000);
    const elapsed = now - startedAt;
    
    // Tính thời gian đã trôi qua cho từng section
    let totalElapsed = 0;
    const sections: SectionType[] = ['Listening', 'Reading', 'Writing', 'Speaking'];
    
    for (const section of sections) {
        if (section === currentSectionType) {
            // Đang ở section hiện tại
            const sectionElapsed = Math.min(elapsed - totalElapsed, SECTION_TIMES[section]);
            return Math.max(0, SECTION_TIMES[section] - sectionElapsed);
        }
        totalElapsed += SECTION_TIMES[section];
        if (elapsed <= totalElapsed) {
            // Chưa đến section này
            return SECTION_TIMES[section];
        }
    }
    
    return 0; // Hết thời gian
};

/**
 * Xác định section hiện tại dựa trên thời gian đã trôi qua
 * @param startedAt - Thời gian bắt đầu quiz (Unix timestamp)
 * @returns Section hiện tại hoặc null nếu hết thời gian
 */
export const getCurrentSectionByTime = (startedAt: number): SectionType | null => {
    const now = Math.floor(Date.now() / 1000);
    const elapsed = now - startedAt;
    
    let totalElapsed = 0;
    const sections: SectionType[] = ['Listening', 'Reading', 'Writing', 'Speaking'];
    
    for (const section of sections) {
        totalElapsed += SECTION_TIMES[section];
        if (elapsed < totalElapsed) {
            return section;
        }
    }
    
    return null; // Hết thời gian
};

/**
 * Kiểm tra xem quiz đã hết thời gian chưa
 * @param startedAt - Thời gian bắt đầu quiz (Unix timestamp)
 * @returns true nếu đã hết thời gian
 */
export const isQuizExpired = (startedAt: number): boolean => {
    const now = Math.floor(Date.now() / 1000);
    const elapsed = now - startedAt;
    const totalTime = Object.values(SECTION_TIMES).reduce((sum, time) => sum + time, 0);
    
    return elapsed >= totalTime;
};
