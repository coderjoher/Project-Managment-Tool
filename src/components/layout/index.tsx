import React from 'react';
import Sidebar from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
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
      <Navbar
        userProfile={userProfile}
        // onMenuClick={() => setSidebarOpen(true)}
      />
      <Sidebar userProfile={userProfile} />
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
};

export default Layout;

