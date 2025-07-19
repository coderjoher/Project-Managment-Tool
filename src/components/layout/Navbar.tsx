import { 
  Search, 
  Plus, 
  Bell, 
  ChevronDown,
  Menu,
  User,
  LogOut,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SimpleThemeToggle } from "@/components/theme/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/components/auth/AuthProvider";
import { useNavigate } from "react-router-dom";

interface NavbarProps {
  className?: string;
  onMenuClick?: () => void;
  userProfile: {
    id: string;
    name: string | null;
    email: string;
    role: 'MANAGER' | 'FREELANCER';
  } | null;
}

export function Navbar({ className, onMenuClick, userProfile }: NavbarProps) {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 bg-background border-b border-border h-16 flex items-center px-4 md:px-6 z-50 ${className}`}>
      {/* Left Section */}
      <div className="flex items-center gap-2 md:gap-4 flex-1">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden p-2"
          onClick={onMenuClick}
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-semibold text-sm">P</span>
          </div>
          <span className="font-semibold text-text-primary hidden sm:block">ProjectFlow</span>
        </div>

        {/* Search */}
        <div className="relative hidden md:block flex-1 max-w-96 ml-8">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input 
            placeholder="Search projects, offers, messages..." 
            className="pl-10 bg-muted/50 border-border w-full"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-1 md:gap-3">
        {/* Mobile Search Button */}
        <Button variant="ghost" size="sm" className="md:hidden p-2">
          <Search className="w-5 h-5" />
        </Button>

        {/* New Project Button */}
        <Button 
          className="bg-primary hover:bg-primary-hover text-primary-foreground gap-2"
          onClick={() => navigate('/projects')}
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Project</span>
        </Button>

        {/* Theme Toggle */}
        <SimpleThemeToggle />

        {/* Notifications */}
        <Button variant="ghost" size="sm" className="h-10 w-10 p-0 relative">
          <Bell className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
            3
          </span>
        </Button>

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="nav-button gap-2">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-gray-600">
                  {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : userProfile?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium">
                  {userProfile?.name || 'User'}
                </p>
                <p className="text-xs text-text-muted">
                  {userProfile?.role === 'FREELANCER' ? 'Freelancer' : 'Manager'}
                </p>
              </div>
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-3 py-2">
              <p className="text-sm font-medium">
                {userProfile?.name || 'User'}
              </p>
              <p className="text-xs text-text-muted">
                {userProfile?.email}
              </p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/dashboard')}>
              <User className="w-4 h-4 mr-2" />
              Dashboard
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/projects')}>
              <Plus className="w-4 h-4 mr-2" />
              Projects
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
