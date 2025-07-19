import React from 'react';
import Sidebar from '@/components/layout/Sidebar';

interface LayoutProps {
  children: React.ReactNode;
  userProfile: {
    id: string;
    name: string | null;
    email: string;
    role: 'MANAGER' | 'FREELANCER';
  } | null;
}

const Layout: React.FC<LayoutProps> = ({ children, userProfile }) => {
  return (
    <div className="flex min-h-screen">
      <Sidebar userProfile={userProfile} />
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
};

export default Layout;

