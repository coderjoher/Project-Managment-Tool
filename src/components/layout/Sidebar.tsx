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
  userProfile?: {
    id: string;
    name: string | null;
    email: string;
    role: 'MANAGER' | 'FREELANCER';
  } | null;
}

const Sidebar: React.FC<SidebarProps> = ({ userProfile }) => {
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
      { path: '/projects', label: userProfile?.role === 'FREELANCER' ? 'Offer Project' : 'Projects', icon: Briefcase },
      { path: '/messages', label: 'Messages', icon: MessageSquare },
      { path: '/finances', label: 'Financials', icon: DollarSign },
    ];
    
    // Add role-specific items
    if (userProfile?.role === 'FREELANCER') {
      // Add Accepted Projects for freelancers at index 2 (after Projects)
      baseItems.splice(2, 0, { path: '/accepted-projects', label: 'Accepted Projects', icon: CheckCircle });
    } else if (userProfile?.role === 'MANAGER' || userProfile?.role === 'SUPERADMIN') {
      // Add My Offers for managers at index 2 (after Projects)
      baseItems.splice(2, 0, { path: '/offers', label: 'My Offers', icon: FileText });
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
    <div className="w-64 bg-card border-r border-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold">ProjectFlow</h1>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-secondary rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-secondary-foreground">
              {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : userProfile?.email?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-medium">User</p>
            <p className="text-sm text-muted-foreground">
              {userProfile?.role === 'FREELANCER' ? 'Freelancer' : 'Manager'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <Button
                key={item.path}
                variant="ghost"
                className={`w-full justify-start ${
                  active 
                    ? 'bg-primary/10 text-primary hover:bg-primary/20' 
                    : 'hover:bg-muted'
                }`}
                onClick={() => navigate(item.path)}
              >
                <Icon className="w-4 h-4 mr-3" />
                {item.label}
              </Button>
            );
          })}
        </div>
      </nav>

      {/* Sign Out */}
      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start text-red-500 hover:bg-red-50 hover:text-red-600"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4 mr-3" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
