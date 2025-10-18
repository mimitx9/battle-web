'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserCache } from '@/hooks/useUserCache';
import { useClientOnly } from '@/hooks/useClientOnly';
import Button from '@/components/ui/Button';

const CacheDebugPanel: React.FC = () => {
    const { user, refreshUser } = useAuth();
    const { isCacheValid, getCacheAge, clearUserCache } = useUserCache();
    const isClient = useClientOnly();
    
    // State để tránh hydration mismatch
    const [cacheAge, setCacheAge] = useState(0);
    const [isValid, setIsValid] = useState(false);

    // Chỉ chạy trên client để tránh hydration mismatch
    useEffect(() => {
        if (!isClient) return;
        
        updateCacheInfo();
        
        // Update cache info mỗi giây
        const interval = setInterval(updateCacheInfo, 1000);
        return () => clearInterval(interval);
    }, [isClient]);

    const updateCacheInfo = () => {
        if (typeof window !== 'undefined') {
            setCacheAge(getCacheAge());
            setIsValid(isCacheValid());
        }
    };

    const handleRefreshUser = async () => {
        try {
            await refreshUser();
            console.log('✅ User data refreshed');
            updateCacheInfo();
        } catch (error) {
            console.error('❌ Failed to refresh user:', error);
        }
    };

    const handleClearCache = () => {
        clearUserCache();
        console.log('✅ Cache cleared');
        updateCacheInfo();
    };

    return (
        <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">Cache Debug Panel</h3>
            
            {!isClient ? (
                // Placeholder để tránh hydration mismatch
                <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                        <span className="text-gray-600">Cache Status:</span>
                        <span className="font-medium text-gray-400">Loading...</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Cache Age:</span>
                        <span className="font-medium text-gray-400">Loading...</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">User:</span>
                        <span className="font-medium text-gray-400">Loading...</span>
                    </div>
                </div>
            ) : (
                <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                        <span className="text-gray-600">Cache Status:</span>
                        <span className={`font-medium ${isValid ? 'text-green-600' : 'text-red-600'}`}>
                            {isValid ? 'Valid' : 'Expired'}
                        </span>
                    </div>
                    
                    <div className="flex justify-between">
                        <span className="text-gray-600">Cache Age:</span>
                        <span className="font-medium text-gray-800">
                            {Math.round(cacheAge / 1000)}s
                        </span>
                    </div>
                    
                    <div className="flex justify-between">
                        <span className="text-gray-600">User:</span>
                        <span className="font-medium text-gray-800">
                            {user ? user.username || user.userId : 'None'}
                        </span>
                    </div>
                </div>
            )}
            
            <div className="flex gap-2 mt-3">
                <Button 
                    onClick={handleRefreshUser}
                    className="text-xs px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white"
                >
                    Refresh
                </Button>
                <Button 
                    onClick={handleClearCache}
                    className="text-xs px-2 py-1 bg-red-500 hover:bg-red-600 text-white"
                >
                    Clear Cache
                </Button>
            </div>
        </div>
    );
};

export default CacheDebugPanel;
