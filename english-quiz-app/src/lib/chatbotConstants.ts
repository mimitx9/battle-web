// Shared constants for chatbot components
export const TOOL_TYPES = {
  QUIZ_HISTORY: 'get_quiz_attempt_history',
  QUIZ_DETAIL: 'get_quiz_attempt_detail',
  QUIZ_DETAIL_BY_TYPE: 'get_quiz_attempt_by_type',
  WRITING_DATA: 'get_writing_data',
  SPEAKING_DATA: 'get_speaking_data',
} as const;

export const TOOL_LABELS = {
  [TOOL_TYPES.WRITING_DATA]: 'Chữa bài Writing',
  [TOOL_TYPES.QUIZ_HISTORY]: 'Lịch sử',
  [TOOL_TYPES.QUIZ_DETAIL]: 'Xem đáp án',
  [TOOL_TYPES.QUIZ_DETAIL_BY_TYPE]: 'Xem đáp án theo loại',
  [TOOL_TYPES.SPEAKING_DATA]: 'Chữa bài Speaking',
} as const;

export const STATUS_CONFIG = {
  complete: { text: 'Hoàn thành', color: 'text-green-500' },
  error: { text: 'Lỗi', color: 'text-red-500' },
  pending: { text: 'Đang xử lý...', color: 'text-yellow-500' },
} as const;

// Priority order for tool call display
export const TOOL_DISPLAY_PRIORITY = [
  TOOL_TYPES.QUIZ_DETAIL,
  TOOL_TYPES.QUIZ_DETAIL_BY_TYPE,
  TOOL_TYPES.WRITING_DATA,
  TOOL_TYPES.QUIZ_HISTORY,
  TOOL_TYPES.SPEAKING_DATA,
] as const;
