import { useState, useEffect } from 'react';
import { LayoutDashboard, Users, ClipboardList, LogOut, UserCog, ClipboardCheck, FileEdit, Briefcase, Settings, Store, IndianRupee, Wallet, BadgeDollarSign } from 'lucide-react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

const navItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Vendors Request', url: '/vendor-requests', icon: ClipboardList, showBadge: true },
  { title: 'Published Vendors', url: '/vendors', icon: Users },
  { title: 'Vendor Types', url: '/vendor-types', icon: Store },
  { title: 'Vendor Form Builder', url: '/vendor-form-builder', icon: Settings },
  { title: 'Vendor Onboarding-Ch', url: '/vendor-charges', icon: BadgeDollarSign },
  { title: 'Agents', url: '/agents', icon: UserCog },
  { title: 'Employee Attendance', url: '/employee-attendance', icon: Briefcase },
  { title: 'Payments', url: '/payments', icon: Wallet },
  { title: 'Payment Settings', url: '/payment-settings', icon: IndianRupee },
  { title: 'Edit Requests', url: '/edit-requests', icon: FileEdit, showBadge: true },
];

export function AdminSidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadEditRequestsCount, setUnreadEditRequestsCount] = useState(0);
  const [unreadVendorRequestsCount, setUnreadVendorRequestsCount] = useState(0);

  // Fetch unread edit requests count
  const fetchUnreadCount = async () => {
    try {
      const response = await api.getUnreadEditRequestsCount();
      if (response.success) {
        setUnreadEditRequestsCount(response.count);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  // Fetch unread vendor requests count
  const fetchUnreadVendorRequestsCount = async () => {
    try {
      const response = await api.getUnreadVendorRequestsCount();
      if (response.success) {
        setUnreadVendorRequestsCount(response.count);
      }
    } catch (error) {
      console.error('Failed to fetch unread vendor requests count:', error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    fetchUnreadVendorRequestsCount();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(() => {
      fetchUnreadCount();
      fetchUnreadVendorRequestsCount();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Mark as seen when navigating to edit requests page
  useEffect(() => {
    if (location.pathname === '/edit-requests' && unreadEditRequestsCount > 0) {
      api.markEditRequestsAsSeen().then(() => {
        setUnreadEditRequestsCount(0);
      }).catch(console.error);
    }
    
    // Mark vendor requests as seen when navigating to vendor requests page
    if (location.pathname === '/vendor-requests' && unreadVendorRequestsCount > 0) {
      api.markVendorRequestsAsSeen().then(() => {
        setUnreadVendorRequestsCount(0);
      }).catch(console.error);
    }
  }, [location.pathname, unreadEditRequestsCount, unreadVendorRequestsCount]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <aside className="w-64 min-h-screen bg-[#FF263A] text-white flex flex-col border-r border-[#FF263A]">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex flex-col items-center gap-2">
          <img 
            src="/foodzippy-logo.png" 
            alt="Foodzippy Logo" 
            className="h-40 w-auto object-contain"
          />
          <p className="text-white text-sm font-medium">Admin Panel</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.title}>
              <NavLink
                to={item.url}
                style={({ isActive }) => 
                  isActive ? { backgroundColor: 'white', color: '#1f2937' } : {}
                }
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-white',
                    !isActive && 'hover:bg-white hover:text-gray-900'
                  )
                }
              >
                <item.icon className="w-5 h-5" />
                {item.title}
                {item.showBadge && item.title === 'Edit Requests' && unreadEditRequestsCount > 0 && (
                  <span className="ml-auto bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center">
                    {unreadEditRequestsCount}
                  </span>
                )}
                {item.showBadge && item.title === 'Vendors Request' && unreadVendorRequestsCount > 0 && (
                  <span className="ml-auto bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center">
                    {unreadVendorRequestsCount}
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-sidebar-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium w-full text-white hover:bg-white hover:text-gray-900 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
