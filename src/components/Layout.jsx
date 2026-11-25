import { NavLink, Outlet } from 'react-router-dom';
import {
  CalendarDays,
  ClipboardCheck,
  Home,
  Radio,
  RefreshCw,
  User,
} from 'lucide-react';
import { useClubApp } from '../hooks/useClubApp';

export function Layout() {
  const { user, liffProfile, registrations, refreshData, isRefreshing } =
    useClubApp();

  const navItems = [
    { to: '/', label: 'หน้าหลัก', icon: Home, end: true },
    { to: '/events', label: 'กิจกรรม', icon: CalendarDays },
    {
      to: '/my-events',
      label: 'งานของฉัน',
      icon: ClipboardCheck,
      badge: registrations.length,
    },
    { to: '/profile', label: 'ข้อมูลส่วนตัว', icon: User },
  ];

  const displayName = user?.nickname || liffProfile?.displayName || 'สมาชิก';

  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100">
      {/* Desktop Top Bar */}
      <header className="sticky top-0 z-40 hidden border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md md:block">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-500/30 bg-red-600/15 text-red-500">
              <Radio className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-tight text-zinc-100">
                  OB LIVESTREAMING
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-red-600/20 px-2 py-0.5 text-[10px] font-bold tracking-wider text-red-400">
                  <span className="animate-live-dot h-1.5 w-1.5 rounded-full bg-red-500" />
                  ON AIR
                </span>
              </div>
              <p className="text-[11px] text-zinc-500">Club Event Console</p>
            </div>
          </div>

          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `relative inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition ${
                      isActive
                        ? 'bg-zinc-800/90 text-white shadow-inner'
                        : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={`h-4 w-4 ${isActive ? 'text-red-500' : ''}`}
                      />
                      <span>{item.label}</span>
                      {item.badge > 0 && (
                        <span className="font-mono-tech rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                          {item.badge}
                        </span>
                      )}
                      {isActive && (
                        <span className="absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-red-500" />
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={refreshData}
              disabled={isRefreshing}
              title="รีเฟรชข้อมูล"
              className="rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-100 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
              />
            </button>
            <div className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 py-1 pl-1.5 pr-3">
              {liffProfile?.pictureUrl ? (
                <img
                  src={liffProfile.pictureUrl}
                  alt={displayName}
                  className="h-6 w-6 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-300">
                  {displayName.slice(0, 1)}
                </div>
              )}
              <span className="text-xs font-medium text-zinc-200">
                {displayName}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Top Header */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-zinc-800/80 bg-zinc-950/90 px-4 backdrop-blur-md md:hidden">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/30 bg-red-600/15 text-red-500">
            <Radio className="h-4 w-4" />
          </div>
          <span className="text-sm font-bold tracking-tight text-zinc-100">
            OB LIVESTREAMING
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-red-600/20 px-2 py-0.5 text-[10px] font-bold text-red-400">
            <span className="animate-live-dot h-1.5 w-1.5 rounded-full bg-red-500" />
            LIVE
          </span>
        </div>

        <button
          type="button"
          onClick={refreshData}
          disabled={isRefreshing}
          aria-label="รีเฟรชข้อมูล"
          className="rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 active:scale-95 disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
          />
        </button>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-5 sm:px-6 md:pb-12 md:pt-8">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        aria-label="เมนูหลัก"
        className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-zinc-800/90 bg-zinc-950/95 backdrop-blur-lg md:hidden"
      >
        <div className="grid grid-cols-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `relative flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition ${
                    isActive ? 'text-red-400' : 'text-zinc-500 hover:text-zinc-300'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute top-0 h-0.5 w-10 rounded-full bg-red-500" />
                    )}
                    <div className="relative">
                      <Icon className="h-5 w-5" />
                      {item.badge > 0 && (
                        <span className="font-mono-tech absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
