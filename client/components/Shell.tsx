import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Bell, Box, Building2, CalendarClock, CircleHelp, ClipboardList,
  FileText, LayoutDashboard, Menu, Settings2, Users, Wrench, CreditCard, ChevronDown, Check
} from "lucide-react";
import { useAppState, UserRole } from "@/hooks/useAppState";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ShellProps {
  children: React.ReactNode;
}

export const Shell: React.FC<ShellProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { currentUserRole, setCurrentUserRole, currentSimulatedUser, setCurrentSimulatedUser, employees, complaints, inventory, hasReadPermission, orders, visits } = useAppState();

  const hasUpcomingVisit = React.useMemo(() => {
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    return (visits || []).some(v => {
      if (!v.scheduledAt || v.status !== 'Pending') return false;
      const sched = new Date(v.scheduledAt);
      return sched >= now && sched <= oneHourFromNow;
    });
  }, [visits]);

  const navigation = [
    { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
    { label: "Leads", to: "/", icon: ClipboardList },
    { label: "Orders", to: "/orders", icon: FileText, alert: currentUserRole === "Owner" && orders.some(o => o.quotations.some(q => !q.approved)) },
    { label: "Service Management", to: "/service", icon: Wrench },
    { label: "Complaints", to: "/complaints", icon: CircleHelp, count: complaints.filter(c => c.status !== "Resolved/Closed").length },
    { label: "Inventory", to: "/inventory", icon: Box, alert: inventory.some(p => p.quantity <= p.threshold) },
    { label: "Payment Ledger", to: "/ledger", icon: CreditCard },
    { label: "Visits", to: "/visits", icon: CalendarClock, alert: hasUpcomingVisit },
  ];

  const filteredNavigation = navigation.filter(item => {
    let modKey = item.label;
    if (item.label === "Service Management") modKey = "Service";
    if (item.label === "Payment Ledger") modKey = "Ledger";
    return hasReadPermission(modKey);
  });

  const getProfileDetails = (name: string) => {
    if (name === "Owner") {
      return { name: "Karan Desai", label: "Owner (Full Access)", bg: "bg-teal-100/10", text: "text-teal-400", initials: "KD" };
    }
    const emp = employees.find(e => e.name === name);
    if (emp) {
      const getInitials = (n: string) => n.split(" ").map(w => w[0]).join("").toUpperCase().substring(0, 2);
      return {
        name: emp.name,
        label: emp.role || "Employee",
        bg: emp.tone || "bg-slate-100/10",
        text: "text-slate-200",
        initials: getInitials(emp.name)
      };
    }
    return { name: name, label: "Employee", bg: "bg-slate-100/10", text: "text-slate-200", initials: name.substring(0, 2).toUpperCase() };
  };

  const currentProfile = getProfileDetails(currentSimulatedUser);

  const getPageTitle = () => {
    switch (location.pathname) {
      case "/":
        return "Leads";
      case "/orders":
        return "Orders";
      case "/service":
        return "Service Management";
      case "/complaints":
        return "Complaints";
      case "/inventory":
        return "Inventory";
      case "/ledger":
        return "Payment Ledger";
      case "/masters":
        return "Master Data";
      case "/dashboard":
        return "Dashboard";
      case "/visits":
        return "Visits";
      default:
        return "NexAir Operations";
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f7f9] text-slate-900">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col bg-[#14251f] px-4 py-5 text-white transition-transform lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#b5e36c] text-[#163128]">
            <Wrench size={19} strokeWidth={2.7} />
          </div>
          <div>
            <div className="font-display text-lg font-bold tracking-tight">NexAir</div>
            <div className="text-[10px] font-semibold uppercase tracking-[.16em] text-[#99aea5]">
              Dealer Ops Hub
            </div>
          </div>
        </div>

        <nav className="space-y-1">
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[.15em] text-[#82978e]">
            Workspace
          </p>
          {filteredNavigation.map(({ label, to, icon: Icon, count, alert }) => {
            const isActive = location.pathname === to;
            return (
              <Link
                key={label}
                onClick={() => setMobileOpen(false)}
                to={to}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-[#b5e36c] text-[#163128] shadow-sm font-semibold"
                    : "text-[#c4d0cb] hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon size={18} />
                <span>{label}</span>
                {count !== undefined && count > 0 && (
                  <span className="ml-auto rounded-md bg-[#e7a555] px-1.5 py-0.5 text-[10px] font-bold text-[#3c2308]">
                    {count}
                  </span>
                )}
                {alert && (
                  <span className="ml-auto h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                )}
              </Link>
            );
          })}
        </nav>

        {hasReadPermission("Masters") && (
          <div className="mt-6">
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[.15em] text-[#82978e]">
              Administration
            </p>
            <Link
              to="/masters"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                location.pathname === "/masters"
                  ? "bg-[#b5e36c] text-[#163128] shadow-sm font-semibold"
                  : "text-[#c4d0cb] hover:bg-white/10 hover:text-white"
              }`}
            >
              <Settings2 size={18} />
              <span>Master Data</span>
            </Link>
          </div>
        )}

        {/* User Role Switcher at the bottom */}
        <div className="mt-auto border-t border-white/10 pt-4">
          <p className="px-3 mb-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-[#82978e]">
            Simulated User Role
          </p>
          <DropdownMenu>
            <DropdownMenuTrigger className="w-full text-left outline-none">
              <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/10 transition cursor-pointer">
                <div className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold ${currentProfile.bg} ${currentProfile.text}`}>
                  {currentProfile.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{currentProfile.name}</p>
                  <p className="text-xs text-[#9eb0a8] truncate">{currentProfile.label}</p>
                </div>
                <ChevronDown className="text-[#9eb0a8]" size={15} />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[226px] bg-[#14251f] text-white border-white/10">
              <p className="px-2.5 py-1.5 text-[10px] text-slate-400 font-semibold border-b border-white/10">Select Role to Demo</p>
              {["Owner", "Rakesh Sharma", "Rahul Dave", "Seema Pansar", "Gopal Vaidh"].map((user) => {
                const profile = getProfileDetails(user);
                return (
                  <DropdownMenuItem
                    key={user}
                    onClick={() => setCurrentSimulatedUser(user)}
                    className="flex items-center justify-between px-2.5 py-2 text-sm text-slate-200 focus:bg-white/10 focus:text-white cursor-pointer"
                  >
                    <div className="flex flex-col">
                      <span className="font-semibold">{profile.name}</span>
                      <span className="text-xs text-slate-400">{profile.label}</span>
                    </div>
                    {currentSimulatedUser === user && <Check size={16} className="text-[#b5e36c]" />}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Backdrop for Mobile */}
      {mobileOpen && (
        <button
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <main className="lg:pl-[260px] min-h-screen flex flex-col">
        <header className="sticky top-0 z-20 flex h-[70px] items-center justify-between border-b border-slate-200/80 bg-[#f6f7f9]/90 px-5 backdrop-blur lg:px-9">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white lg:hidden shrink-0"
            >
              <Menu size={18} />
            </button>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span className="hidden sm:inline text-slate-400">Workspace</span>
              <span className="hidden sm:inline text-slate-300">/</span>
              <span className="font-semibold text-slate-805 text-base lg:text-sm text-slate-800">{getPageTitle()}</span>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-3">
            <div className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-600 animate-ping" />
              Mode: <strong className="font-bold">{currentUserRole}</strong>
            </div>
            <button className="relative grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600">
              <Bell size={17} />
              {inventory.some(p => p.quantity <= p.threshold) && (
                <i className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
              )}
            </button>
          </div>
        </header>

        <div className="flex-1">
          {children}
        </div>
      </main>
    </div>
  );
};
