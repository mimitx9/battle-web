'use client';

import { usePathname } from "next/navigation";
import Header from "@/components/layout/Header";
import CacheDebugPanel from "@/components/debug/CacheDebugPanel";
import ClientOnly from "@/components/common/ClientOnly";

interface LayoutContentProps {
    children: React.ReactNode;
}

export default function LayoutContent({ children }: LayoutContentProps) {
    const pathname = usePathname();

    // Không hiển thị Header/Footer cho exam pages, waiting-room và hầu hết quiz pages
    // Ngoại lệ: lịch sử quiz cần hiển thị top bar
    const hideHeaderFooter = pathname?.includes('/exam') || 
        pathname?.includes('/waiting-room') || 
        pathname === '/quiz-validation' || (
        pathname?.startsWith('/quiz/') && !pathname?.startsWith('/quiz/history')
    );

    if (hideHeaderFooter) {
        return (
            <>
                {children}
                {/* Show debug panel in development */}
                {process.env.NODE_ENV === 'development' && (
                    <ClientOnly>
                        <CacheDebugPanel />
                    </ClientOnly>
                )}
            </>
        );
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
                {children}
            </main>
            {/* Show debug panel in development */}
            {process.env.NODE_ENV === 'development' && (
                <ClientOnly>
                    <CacheDebugPanel />
                </ClientOnly>
            )}
        </div>
    );
}