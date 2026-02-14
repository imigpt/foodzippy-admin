import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AdminSidebar } from './AdminSidebar';
import { NotificationBell } from './NotificationBell';

export function AdminLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen w-full bg-muted/30">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        {/* Top Header with Notification Bell */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="flex items-center justify-end px-6 py-3">
            <NotificationBell />
          </div>
        </div>
        
        {/* Page Content */}
        <Outlet />
      </main>
    </div>
  );
}
