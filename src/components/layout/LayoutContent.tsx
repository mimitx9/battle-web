'use client';

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import Header from "@/components/layout/Header";
import ClientOnly from "@/components/common/ClientOnly";
import { useUserBag } from "@/hooks/useUserBag";
import { useAuth } from "@/hooks/useAuth";

interface LayoutContentProps {
    children: React.ReactNode;
}

export default function LayoutContent({ children }: LayoutContentProps) {
    const pathname = usePathname();
    const { user, isInitialized } = useAuth();
    const { userBag, fetchUserBag, updateUserBag } = useUserBag();

    // Fetch userBag chỉ khi user đã đăng nhập
    useEffect(() => {
        if (isInitialized && user) {
            fetchUserBag();
        }
    }, [isInitialized, user, fetchUserBag]);

    // Lắng nghe sự kiện cập nhật userBag từ các trang (vd: Shop)
    useEffect(() => {
        const handler = (e: any) => {
            if (e?.detail?.userBag) {
                updateUserBag(e.detail.userBag);
            }
        };
        window.addEventListener('userBag:update', handler as EventListener);
        return () => window.removeEventListener('userBag:update', handler as EventListener);
    }, [updateUserBag]);

    // Không hiển thị Header/Footer cho exam pages, waiting-room và hầu hết quiz pages
    // Ngoại lệ: lịch sử quiz cần hiển thị top bar
    const hideHeaderFooter = pathname?.includes('/exam') || 
        pathname?.includes('/waiting-room') || (
        pathname?.startsWith('/quiz/') && !pathname?.startsWith('/quiz/history')
    );

    if (hideHeaderFooter) {
        return (
            <>
                {children}
            </>
        );
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Header userBag={userBag} />
            <main className="flex-1">
                {children}
            </main>
        </div>
    );
}