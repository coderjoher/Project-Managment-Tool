import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import {
  Users,
  Briefcase,
  MessageSquare,
  DollarSign,
  FileText,
  LogOut,
  BarChart3,
  CheckCircle,
  Tag
} from 'lucide-react';

interface SidebarProps {
  className?: string;
  onClose?: () => void;
  userProfile?: {
    id: string;
    name: string | null;
    email: string;
    role: 'MANAGER' | 'FREELANCER';
  } | null;
}

const Sidebar: React.FC<SidebarProps> = ({ className, onClose, userProfile }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const getNavItems = () => {
    const baseItems = [
      { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
      { path: '/projects', label: userProfile?.role === 'FREELANCER' ? 'Offer Projects' : 'Projects', icon: Briefcase },
      { path: '/messages', label: 'Messages', icon: MessageSquare },
      { path: '/finances', label: 'Financials', icon: DollarSign },
    ];

    // Add role-specific items
    if (userProfile?.role === 'FREELANCER') {
      // Add Accepted Projects for freelancers at index 2 (after Projects)
      baseItems.splice(2, 0, { path: '/accepted-projects', label: 'Accepted Projects', icon: CheckCircle });
    } else if (userProfile?.role === 'MANAGER' || userProfile?.role === 'SUPERADMIN') {
      // Add My Offers for managers at index 2 (after Projects)
      baseItems.splice(2, 0, { path: '/offers', label: 'Offers', icon: FileText });
      // Add Categories for managers at index 3
      baseItems.splice(3, 0, { path: '/categories', label: 'Categories', icon: Tag });
      // Add Freelancers for managers at index 4
      baseItems.splice(4, 0, { path: '/freelancers', label: 'Freelancers', icon: Users });
      baseItems.splice(5, 0, { path: '/superadmin', label: 'Managers', icon: FileText });
    }

    return baseItems;
  };

  const navItems = getNavItems();

  return (
    <div className={`fixed top-0 left-0 w-60 h-full bg-sidebar border-r border-sidebar-border flex flex-col z-50 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-semibold text-sm">P</span>
          </div>
          <span className="font-semibold text-text-primary">DOTIQ PMT</span>
        </div>
      </div>


      {/* Navigation */}
      <div className="flex-1 p-4 space-y-6">
        {/* Main Navigation */}
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <button
                key={item.path}
                className={`sidebar-item w-full text-left ${
                  active
                    ? 'bg-[hsl(var(--hover))] text-foreground font-medium'
                    : 'text-muted-foreground hover:bg-[hsl(var(--hover))] hover:text-foreground'
                  }`}
                onClick={() => navigate(item.path)}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      {/* <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-xs font-medium text-gray-600">
              {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : userProfile?.email?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">
              {userProfile?.name || 'User'}
            </p>
            <p className="text-xs text-text-muted truncate">
              {userProfile?.role === 'FREELANCER' ? 'Freelancer' : 'Manager'}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="sidebar-item w-full text-left text-red-500 hover:bg-red-50 hover:text-red-600"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </Button>
      </div> */}
    </div>
  );
};

export default Sidebar;
