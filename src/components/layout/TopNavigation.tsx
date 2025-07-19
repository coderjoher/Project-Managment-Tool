import { 
  Search, 
  Plus, 
  Filter, 
  Bell, 
  ChevronDown,
  Grid3X3,
  List,
  Calendar,
  User,
  Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SimpleThemeToggle } from "@/components/theme/ThemeToggle";

interface TopNavigationProps {
  className?: string;
  onMenuClick?: () => void;
  userProfile: {
    id: string;
    name: string | null;
    email: string;
    role: 'MANAGER' | 'FREELANCER';
  } | null;
}

export function TopNavigation({ className, onMenuClick, userProfile }: TopNavigationProps) {
  return (
    <div className={`bg-background border-b border-border h-16 flex items-center px-4 md:px-6 sticky top-0 z-50 ${className}`}>
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

        {/* Workspace Switcher */}
        <Button variant="ghost" className="nav-button gap-2 hidden sm:flex">
          <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-semibold">P</span>
          </div>
          <span className="font-medium">ProjectFlow</span>
          <ChevronDown className="w-4 h-4" />
        </Button>

        {/* Search */}
        <div className="relative hidden md:block flex-1 max-w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input 
            placeholder="Search projects, offers, messages..." 
            className="pl-10 bg-muted/50 border-border w-full"
          />
        </div>

        {/* Filters */}
        <div className="hidden lg:flex items-center gap-2">
          <Button variant="ghost" className="nav-button gap-2">
            <Filter className="w-4 h-4" />
            <span>Active projects</span>
          </Button>
          <Button variant="ghost" className="nav-button gap-2">
            <User className="w-4 h-4" />
            <span>Assignee: Me</span>
          </Button>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-1 md:gap-3">
        {/* Mobile Search Button */}
        <Button variant="ghost" size="sm" className="md:hidden p-2">
          <Search className="w-5 h-5" />
        </Button>

        {/* New Project Button */}
        <Button className="bg-primary hover:bg-primary-hover text-primary-foreground gap-2">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Project</span>
        </Button>

        {/* View Toggle */}
        <div className="hidden md:flex items-center bg-muted rounded-lg p-1">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 bg-background shadow-sm">
            <List className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Calendar className="w-4 h-4" />
          </Button>
        </div>

        {/* Theme Toggle */}
        <SimpleThemeToggle />

        {/* Notifications */}
        <Button variant="ghost" size="sm" className="h-10 w-10 p-0 relative">
          <Bell className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
            3
          </span>
        </Button>

        {/* User Avatar */}
        <Button variant="ghost" className="nav-button gap-2 hidden sm:flex">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-xs font-medium text-gray-600">
              {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : userProfile?.email?.charAt(0).toUpperCase()}
            </span>
          </div>
          <ChevronDown className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
