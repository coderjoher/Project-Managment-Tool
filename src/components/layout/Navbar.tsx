import { 
  Search, 
  Plus, 
  Bell, 
  ChevronDown,
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
  userProfile: {
    id: string;
    name: string | null;
    email: string;
    role: 'MANAGER' | 'FREELANCER';
  } | null;
}

export function Navbar({ className, userProfile }: NavbarProps) {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <nav className={`fixed top-0 left-60 right-0 bg-background border-b border-border h-16 flex items-center px-4 md:px-6 z-40 ${className}`}>
      {/* Left Section */}
      <div className="flex items-center gap-2 md:gap-4 flex-1">
        {/* Workspace Dropdown */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" className="gap-2 text-sm">
            <span>Workspace</span>
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-md ml-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input 
            placeholder="Search tasks, docs, people..." 
            className="pl-10 bg-muted/50 border-border w-full"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-1 md:gap-3">

        {/* Theme Toggle */}
        <SimpleThemeToggle />

        {/* Notifications */}
        <Button variant="ghost" size="sm" className="h-10 w-10 p-0 relative">
          <Bell className="w-4 h-4" />
        </Button>

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="nav-button gap-2">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600">
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
            <DropdownMenuItem onClick={() => navigate('/settings')}>
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
