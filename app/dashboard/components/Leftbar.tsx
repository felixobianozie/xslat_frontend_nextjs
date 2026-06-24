"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart2,
  Users,
  GraduationCap,
  LayoutGrid,
  BookOpen,
  DollarSign,
  Globe,
  Settings,
  ClipboardList,
  HelpCircle,
  X,
  LayoutDashboard,
} from "lucide-react";
import { useLeftbar } from "../context/Leftbarprovider";

// Shape of a single nav entry. `activeWhenStartsWith` is optional and lets an
// item declare extra path prefixes that should also mark it as active --
// useful when a detail page lives at a URL that doesn't share the listing's
// prefix (e.g. /dashboard/arm/[id] should still light up "Class Arms").
type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  activeWhenStartsWith?: string[];
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart2 },
  { label: "Staff", href: "/dashboard/staff", icon: Users },
  { label: "Students", href: "/dashboard/students", icon: GraduationCap },
  {
    label: "Class Arms",
    href: "/dashboard/arms",
    icon: LayoutGrid,
    // Keep the Class Arms tab highlighted on individual arm detail pages
    // (which live at /dashboard/arm/[id]) without changing the link target.
    activeWhenStartsWith: ["/dashboard/arm"],
  },
  {
    label: "Broadsheet",
    href: "/dashboard/broadsheet/arms",
    icon: BookOpen,
    activeWhenStartsWith: ["/dashboard/broadsheet/arm"],
  },
  { label: "Fees", href: "/coming-soon", icon: DollarSign },
];

const bottomNavItems: NavItem[] = [
  { label: "Community", href: "/coming-soon", icon: Globe },
  {
    label: "Configurations",
    href: "/coming-soon",
    icon: Settings,
  },
  {
    label: "Activity History",
    href: "/coming-soon",
    icon: ClipboardList,
  },
  { label: "Help", href: "/coming-soon", icon: HelpCircle },
];

export default function Leftbar() {
  const pathname = usePathname();
  const { isOpen, close } = useLeftbar();

  const NavLink = ({ item }: { item: NavItem }) => {
    // An item is active if the path is an exact match for its href, or if the
    // path matches one of its declared prefixes. The `${prefix}/` check
    // enforces a segment boundary so "/dashboard/arms-foo" would not be
    // mistakenly treated as a child of "/dashboard/arm".
    const isActive =
      pathname === item.href ||
      (item.activeWhenStartsWith?.some(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
      ) ??
        false);

    const Icon = item.icon;
    return (
      <Link
        href={item.href}
        onClick={close}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-r-xl text-sm font-medium transition-all duration-200 group bg-indigo-50
          ${
            isActive
              ? "bg-violet-500 text-white shadow-md shadow-violet-200"
              : "text-slate-500 hover:bg-violet-50 hover:text-violet-700"
          }`}
      >
        <Icon
          size={18}
          className={`shrink-0 transition-transform duration-200 group-hover:scale-110 ${
            isActive
              ? "text-white"
              : "text-slate-400 group-hover:text-violet-600"
          }`}
        />
        {item.label}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden"
          onClick={close}
        />
      )}

      {/* Leftbar */}
      <aside
        className={`fixed top-0 left-0 h-full w-48 z-40 flex flex-col
          transform transition-transform duration-300 ease-in-out gap-2
          ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:z-auto`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 border border-indigo-300 bg-white">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center shadow-md shadow-violet-200">
              <GraduationCap size={16} className="text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-800">
              EMS
            </span>
          </Link>
          <button
            onClick={close}
            className="cursor-pointer lg:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
          >
            <X size={18} />
          </button>
        </div>

        {/* Main nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto border border-indigo-300 rounded-r-xl bg-white">
          {navItems.map((item, index) => (
            <NavLink key={item.href + index} item={item} />
          ))}
        </nav>

        {/* Bottom nav */}
        <div className="px-3 py-4 border border-indigo-300 space-y-1 bg-white">
          {bottomNavItems.map((item, index) => (
            <NavLink key={item.href + index} item={item} />
          ))}
        </div>
      </aside>
    </>
  );
}
