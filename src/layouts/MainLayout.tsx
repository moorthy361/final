import { useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

interface MainLayoutProps {
  isConnected: boolean;
  isUsingMock: boolean;
  lastUpdated: Date | null;
  onRefresh: () => void;
  loading: boolean;
}

export default function MainLayout({
  isConnected,
  isUsingMock,
  lastUpdated,
  onRefresh,
  loading,
}: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const openSidebar = useCallback(() => setSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="flex h-screen overflow-hidden bg-navy-950">
      <Sidebar open={sidebarOpen} onClose={closeSidebar} isConnected={isConnected && !isUsingMock} />

      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <Header
          onMenuClick={openSidebar}
          isConnected={isConnected}
          isUsingMock={isUsingMock}
          lastUpdated={lastUpdated}
          onRefresh={onRefresh}
          loading={loading}
        />

        <main className="flex-1 overflow-y-auto" id="main-content">
          <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
