import { useLocation, Link } from "wouter";
import { User } from "@shared/schema";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/auth";
import { 
  LayoutDashboard, 
  Users, 
  FolderKanban, 
  File, 
  RotateCw, 
  PieChart, 
  Settings, 
  LogOut 
} from "lucide-react";

interface SidebarProps {
  user?: User | null;
  mobile?: boolean;
}

export default function Sidebar({ user, mobile = false }: SidebarProps) {
  const [location] = useLocation();
  
  const handleLogout = () => {
    logout();
  };
  
  const isActive = (path: string) => {
    return location === path;
  };
  
  const sidebarNav = [
    { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard className="mr-3 h-5 w-5" /> },
    { name: "Clients", path: "/clients", icon: <Users className="mr-3 h-5 w-5" /> },
    { name: "Projects", path: "/projects", icon: <FolderKanban className="mr-3 h-5 w-5" /> },
    { name: "Invoices", path: "/invoices", icon: <File className="mr-3 h-5 w-5" /> },
    { name: "Recurring", path: "/recurring", icon: <RotateCw className="mr-3 h-5 w-5" /> },
    { name: "Revenue Sharing", path: "/revenue", icon: <PieChart className="mr-3 h-5 w-5" /> },
    { name: "Settings", path: "/settings", icon: <Settings className="mr-3 h-5 w-5" /> },
  ];
  
  return (
    <div className={cn("flex flex-col w-64 border-r border-gray-200 bg-white", mobile ? "h-full" : "hidden md:flex md:flex-shrink-0")}>
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-primary-600">
          <span className="mr-2">📄</span>SkillyVoice
        </h1>
      </div>
      
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <nav className="mt-5 px-3 space-y-1">
          {sidebarNav.map((item) => (
            <Link key={item.path} href={item.path}>
              <a 
                className={cn(
                  "group flex items-center px-3 py-2 text-sm font-medium rounded-md",
                  isActive(item.path) 
                    ? "bg-gray-100 text-primary-600 border-l-2 border-primary-600" 
                    : "text-gray-600 hover:bg-gray-50"
                )}
              >
                {item.icon}
                {item.name}
              </a>
            </Link>
          ))}
        </nav>
      </div>
      
      <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
        {user && (
          <div className="flex-shrink-0 w-full group block">
            <div className="flex items-center">
              <div className="h-9 w-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{user.name}</p>
                <p className="text-xs font-medium text-gray-500 group-hover:text-gray-700">{user.role}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="h-8 w-8" title="Logout">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
