'use client';

import React from 'react';
import { FaTestInfo } from '@/types';
import Button from '@/components/ui/Button';

interface PlanInfoCardProps {
  faTestInfo?: FaTestInfo;
  onUpgrade?: () => void;
}

const PlanInfoCard: React.FC<PlanInfoCardProps> = ({ faTestInfo, onUpgrade }) => {
  if (!faTestInfo) {
    return null;
  }

  const formatExpireTime = (expireTime: number) => {
    const date = new Date(expireTime * 1000);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPlanDisplayName = (plan: string) => {
    switch (plan) {
      case 'FREE':
        return 'Gói Miễn Phí';
      case 'MONTHLY':
        return 'Gói Tháng';
      case 'YEARLY':
        return 'Gói Năm';
      case 'LIFETIME':
        return 'Gói Trọn Đời';
      default:
        return plan;
    }
  };

  const getPlanColor = (plan: string, isPaid: boolean) => {
    if (!isPaid || plan === 'FREE') {
      return {
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        text: 'text-gray-700',
        badge: 'bg-gray-100 text-gray-800'
      };
    }
    
    switch (plan) {
      case 'MONTHLY':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-700',
          badge: 'bg-blue-100 text-blue-800'
        };
      case 'YEARLY':
        return {
          bg: 'bg-purple-50',
          border: 'border-purple-200',
          text: 'text-purple-700',
          badge: 'bg-purple-100 text-purple-800'
        };
      case 'LIFETIME':
        return {
          bg: 'bg-gradient-to-r from-yellow-50 to-orange-50',
          border: 'border-yellow-300',
          text: 'text-orange-800',
          badge: 'bg-gradient-to-r from-yellow-200 to-orange-200 text-orange-900'
        };
      default:
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-700',
          badge: 'bg-green-100 text-green-800'
        };
    }
  };

  const colors = getPlanColor(faTestInfo.plan, faTestInfo.isPaid);
  const isExpired = faTestInfo.plan !== 'LIFETIME' && faTestInfo.expireTime < Date.now() / 1000;

  return (
    <div className={`rounded-lg border-2 ${colors.border} ${colors.bg} p-4 mb-4`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${colors.badge}`}>
            {getPlanDisplayName(faTestInfo.plan)}
          </div>
          {faTestInfo.isPaid && (
            <div className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
              ✓ Đã thanh toán
            </div>
          )}
        </div>
        {!faTestInfo.isPaid && onUpgrade && (
          <Button 
            size="sm" 
            onClick={onUpgrade}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Nâng cấp
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className={`text-sm font-medium ${colors.text}`}>
            Trạng thái:
          </span>
          <span className={`text-sm font-medium ${
            isExpired ? 'text-red-600' : 'text-green-600'
          }`}>
            {isExpired ? '⚠️ Đã hết hạn' : '✅ Còn hiệu lực'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className={`text-sm font-medium ${colors.text}`}>
            Hết hạn:
          </span>
          <span className={`text-sm font-medium ${
            faTestInfo.plan === 'LIFETIME' 
              ? 'text-green-600 font-bold' 
              : isExpired ? 'text-red-600' : colors.text
          }`}>
            {faTestInfo.plan === 'LIFETIME' ? 'Không bao giờ hết hạn' : formatExpireTime(faTestInfo.expireTime)}
          </span>
        </div>

        {faTestInfo.isPaid && (
          <div className="flex items-center justify-between">
            <span className={`text-sm font-medium ${colors.text}`}>
              Quyền lợi:
            </span>
            <span className="text-sm font-medium text-green-600">
              {faTestInfo.plan === 'LIFETIME' 
                ? 'Không giới hạn lượt thi - Trọn đời' 
                : 'Không giới hạn lượt thi'
              }
            </span>
          </div>
        )}

        {!faTestInfo.isPaid && (
          <div className="flex items-center justify-between">
            <span className={`text-sm font-medium ${colors.text}`}>
              Quyền lợi:
            </span>
            <span className="text-sm font-medium text-orange-600">
              Giới hạn lượt thi miễn phí
            </span>
          </div>
        )}
      </div>

      {isExpired && faTestInfo.isPaid && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <span className="text-red-600 text-sm font-medium">
              ⚠️ Gói của bạn đã hết hạn. Vui lòng gia hạn để tiếp tục sử dụng dịch vụ.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanInfoCard;
