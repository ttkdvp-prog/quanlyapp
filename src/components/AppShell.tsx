import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutGrid,
  Users,
  Menu,
  X,
  Grid3X3,
  Bell,
  RefreshCw,
  ChevronDown,
} from "lucide-react";

const NAV = [
  { to: "/", label: "Quản lý App", icon: Grid3X3 },
  { to: "/users", label: "Người dùng", icon: Users },
];

export default function AppShell() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-slate-50 text-slate-900">
      {/* Mobile Drawer Overlay */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl flex flex-col">
            <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                  <LayoutGrid size={18} className="text-white" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm leading-none">Quản Lý App</div>
                </div>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X size={18} />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  onClick={() => setDrawerOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                        : "text-slate-600 hover:bg-slate-100"
                    }`
                  }
                >
                  <item.icon size={18} />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Top navigation bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
          <div className="flex items-center h-14 px-4 gap-3">
            {/* Logo */}
            <div className="flex items-center gap-3 mr-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shrink-0">
                <LayoutGrid size={17} className="text-white" />
              </div>
              <div className="hidden sm:block">
                <div className="font-bold text-slate-900 text-sm leading-none">Quản Lý App</div>
              </div>
            </div>

            {/* Desktop nav tabs */}
            <nav className="hidden md:flex items-center gap-1 bg-slate-100 rounded-xl p-1">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? "bg-white text-blue-700 shadow-sm font-semibold"
                        : "text-slate-600 hover:text-slate-900"
                    }`
                  }
                >
                  <item.icon size={15} />
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {/* Right side actions */}
            <div className="ml-auto flex items-center gap-2">
              {/* Refresh button */}
              <button
                type="button"
                title="Làm mới dữ liệu"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
                onClick={() => window.location.reload()}
              >
                <RefreshCw size={16} />
              </button>

              {/* Notification bell */}
              <button
                type="button"
                title="Thông báo"
                className="hidden sm:flex w-8 h-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors relative"
              >
                <Bell size={16} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>

              {/* User avatar */}
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200 ml-1">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                  A
                </div>
                <div className="hidden lg:block">
                  <div className="text-xs font-semibold text-slate-800 leading-none">Admin</div>
                  <div className="text-xs text-slate-400 mt-0.5">Admin</div>
                </div>
                <ChevronDown size={13} className="hidden lg:block text-slate-400" />
              </div>

              {/* Mobile hamburger */}
              <button
                type="button"
                aria-label="Mở menu"
                className="md:hidden flex w-9 h-9 items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600"
                onClick={() => setDrawerOpen(true)}
              >
                <Menu size={20} />
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <section className="flex-1 overflow-auto @container/main">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
