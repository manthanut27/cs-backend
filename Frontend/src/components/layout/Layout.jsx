import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      {/* Main content - adjusts for sidebar width */}
      <div className="flex-1 ml-[240px] flex flex-col min-h-screen transition-all duration-300">
        <Outlet />
      </div>
    </div>
  );
}
