import { ReactNode, useState } from "react";
import  Sidebar  from "./Sidebar";
import { Navbar } from "./Navbar";

interface MainLayoutProps {
  children: ReactNode;
  userProfile: {
    id: string;
    name: string | null;
    email: string;
    role: 'MANAGER' | 'FREELANCER';
  } | null;
}

export function MainLayout({
  children,
  userProfile
}: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Navbar */}
      <Navbar 
        userProfile={userProfile} 
        onMenuClick={() => setSidebarOpen(true)}
      />
      
      <div className="flex pt-16"> {/* Add top padding for fixed navbar */}
        {/* Mobile Overlay */}
        {sidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}
        
        {/* Sidebar (show only on lg and up) */}
        <div className="">
          <Sidebar 
            className={`fixed hidden lg:block left-0 top-16 h-[calc(100vh-4rem)] z-40 transform transition-transform duration-300 lg:transform-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`} 
            onClose={() => setSidebarOpen(false)}
            userProfile={userProfile}
          />
        </div>
        
        {/* Main Content */}
        <div className="flex-1 lg:ml-20 flex flex-col min-w-0">
          {/* Page Content */}
          <main className="">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
