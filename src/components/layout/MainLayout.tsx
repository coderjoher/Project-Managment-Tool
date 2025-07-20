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

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar userProfile={userProfile} />
      
      {/* Fixed Navbar - positioned to the right of sidebar */}
      <Navbar 
        userProfile={userProfile} 
      />
      
      {/* Main Content - positioned to the right of sidebar and below navbar */}
      <div className="ml-60 pt-16 min-h-screen">
        <main className="">
          {children}
        </main>
      </div>
    </div>
  );
}
