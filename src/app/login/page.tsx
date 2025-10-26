'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import LayoutContent from '@/components/layout/LayoutContent';
import HomeLoginForm from '@/components/ui/HomeLoginForm';

const LoginPage: React.FC = () => {
  const router = useRouter();

  const handleLoginSuccess = () => {
    // Redirect to home page after successful login
    router.push('/');
  };

  return (
    <LayoutContent>
      <div className="min-h-screen">
        <HomeLoginForm onSuccess={handleLoginSuccess} />
      </div>
    </LayoutContent>
  );
};

export default LoginPage;
