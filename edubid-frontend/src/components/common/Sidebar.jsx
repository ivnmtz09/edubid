"use client";

import { Fragment } from "react";
import { Link, useLocation } from "react-router-dom";
import { Dialog, Transition } from "@headlessui/react";
import {
  XMarkIcon,
  HomeIcon,
  ClipboardDocumentListIcon,
  UserIcon,
  BookOpenIcon,
  CurrencyEuroIcon,
  ArrowRightCircleIcon,
  WalletIcon,
  ArrowRightOnRectangleIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  AcademicCapIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { useAuthContext } from "../../context/AuthContext";
import { USER_ROLES } from "../../utils/constants";

const Sidebar = ({ isOpen, onClose, collapsed, onToggleCollapse }) => {
  const { user, logout, institution } = useAuthContext();
  const location = useLocation();

  const teacherNavigation = [
    { name: "Panel Docente", href: "/dashboard", icon: HomeIcon },
    { name: "Mis Clases", href: "/classrooms", icon: AcademicCapIcon },
    { name: "Mis Grupos", href: "/groups", icon: UserGroupIcon },
    {
      name: "Mis Actividades",
      href: "/activities",
      icon: ClipboardDocumentListIcon,
    },
    { name: "Subastas", href: "/auctions", icon: CurrencyEuroIcon },
    { name: "Perfil", href: "/profile", icon: UserIcon },
  ];

  const studentNavigation = [
    { name: "Panel Estudiante", href: "/dashboard", icon: HomeIcon },
    { name: "Grupos", href: "/groups", icon: UserGroupIcon },
    {
      name: "Actividades",
      href: "/activities",
      icon: ClipboardDocumentListIcon,
    },
    { name: "Subastas", href: "/auctions", icon: CurrencyEuroIcon },
    { name: "Billetera", href: "/wallet", icon: WalletIcon },
    { name: "Perfil", href: "/profile", icon: UserIcon },
  ];

  const adminNavigation = [
    { name: "Dashboard Admin", href: "/dashboard", icon: HomeIcon },
    {
      name: "Admin Django",
      href: "http://localhost:8000/admin/",
      icon: Cog6ToothIcon,
    },
  ];

  const rectorNavigation = [
    { name: "Panel", href: "/rector-dashboard", icon: HomeIcon },
    { name: "Perfil", href: "/profile", icon: UserIcon },
  ];

  const navigation =
    user?.role === USER_ROLES.TEACHER
      ? teacherNavigation
      : user?.role === USER_ROLES.RECTOR
        ? rectorNavigation
        : user?.role === USER_ROLES.ADMIN || user?.role === USER_ROLES.COORDINATOR
          ? adminNavigation
          : studentNavigation;

  const isCurrentPath = (href) =>
    location.pathname === href || location.pathname.startsWith(href + "/");

  const SidebarContent = () => (
    <div
      className={`flex grow flex-col gap-y-5 overflow-y-auto bg-white dark:bg-gray-900 shadow-sm border-r border-gray-200/50 dark:border-white/5 transition-all duration-300 ease-in-out ${
        collapsed ? "w-20" : "w-72"
      }`}
    >
      {/* Logo */}
      <div className="flex h-20 shrink-0 items-center px-4 border-b border-gray-200/50 dark:border-white/5">
        <div className={`flex items-center ${collapsed ? "justify-center w-full" : "space-x-3"}`}>
          <img
            src="/edubid.png"
            alt="EduBid"
            className="h-10 w-10 flex-shrink-0"
          />
          {!collapsed && (
            <div className="min-w-0">
              <span className="text-2xl font-bold text-orange-600 truncate block leading-tight">
                EduBid
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-2 space-y-1">
        {navigation.map((item) => {
          const current = isCurrentPath(item.href);
          const isExternal = item.href.startsWith("http");

          const classes = `group flex items-center rounded-xl transition-all duration-200 active:scale-[0.96] ${
            collapsed
              ? "justify-center px-0 py-3 mx-auto w-12"
              : "px-3 py-3 text-sm font-medium"
          } ${
            current
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
          }`;

          const iconClasses = `h-5 w-5 flex-shrink-0 ${
            collapsed ? "" : "mr-3"
          } ${
            current
              ? "text-primary-foreground"
              : "text-gray-400 dark:text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white"
          }`;

          return (
            <div key={item.name}>
              {isExternal ? (
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={classes}
                  onClick={onClose}
                  title={collapsed ? item.name : undefined}
                >
                  <item.icon className={iconClasses} />
                  {!collapsed && <span className="truncate">{item.name}</span>}
                  {!collapsed && (
                    <ArrowRightCircleIcon className="ml-auto h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                  )}
                </a>
              ) : (
                <Link
                  to={item.href}
                  className={classes}
                  onClick={onClose}
                  title={collapsed ? item.name : undefined}
                >
                  <item.icon className={iconClasses} />
                  {!collapsed && <span className="truncate">{item.name}</span>}
                </Link>
              )}
            </div>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="px-2">
        <button
          onClick={onToggleCollapse}
          className="group flex items-center justify-center w-full py-3 rounded-xl text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-200 active:scale-[0.96]"
          title={collapsed ? "Expandir menú" : "Colapsar menú"}
        >
          {collapsed ? (
            <ChevronRightIcon className="h-5 w-5" />
          ) : (
            <ChevronLeftIcon className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Institution indicator footer */}
      {institution?.nombre && !collapsed && (
        <div className="px-4 py-2 mx-3 mb-1">
          <p className="text-xs text-gray-400 dark:text-gray-500 truncate text-center">
            {institution.nombre}
          </p>
        </div>
      )}

      {/* Logout */}
      <div className="px-2 py-4 border-t border-gray-200/50 dark:border-white/5">
        <button
          onClick={logout}
          className={`group flex items-center rounded-xl transition-all duration-200 active:scale-[0.96] ${
            collapsed
              ? "justify-center mx-auto w-12 py-3"
              : "justify-center w-full px-3 py-3 text-sm font-medium"
          } text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-500/10`}
          title={collapsed ? "Cerrar sesión" : undefined}
        >
          <ArrowRightOnRectangleIcon className={`h-5 w-5 flex-shrink-0 text-gray-400 dark:text-gray-500 group-hover:text-red-500 dark:group-hover:text-red-400 ${
            collapsed ? "" : "mr-2"
          }`} />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile */}
      <Transition.Root show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={onClose}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <SidebarContent />
                <div className="absolute top-4 right-0 -mr-12 pt-2">
                  <button
                    className="ml-1 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 dark:bg-gray-800/10 backdrop-blur-sm border border-gray-200/50 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none transition-all duration-200 active:scale-[0.96]"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Desktop */}
      <div
        className={`hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:flex-col transition-all duration-300 ease-in-out ${
          collapsed ? "lg:w-20" : "lg:w-72"
        }`}
      >
        <SidebarContent />
      </div>
    </>
  );
};

export default Sidebar;
