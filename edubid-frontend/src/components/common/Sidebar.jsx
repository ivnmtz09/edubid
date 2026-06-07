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
} from "@heroicons/react/24/outline";
import { useAuthContext } from "../../context/AuthContext";
import { USER_ROLES } from "../../utils/constants";

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuthContext();
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

  const navigation =
    user?.role === USER_ROLES.TEACHER
      ? teacherNavigation
      : user?.role === USER_ROLES.ADMIN
        ? adminNavigation
        : studentNavigation;

  const isCurrentPath = (href) =>
    location.pathname === href || location.pathname.startsWith(href + "/");

  const SidebarContent = () => (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-background dark:bg-gray-900 border-r border-border">
      {/* Logo */}
      <div className="flex h-20 shrink-0 items-center px-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <img
            src="/edubid.png"
            alt="EduBid"
            className="h-16 w-16 object-contain"
          />
          <div>
            <span className="text-4xl font-bold text-orange-600">EduBid</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {navigation.map((item) => {
          const current = isCurrentPath(item.href);
          const isExternal = item.href.startsWith("http");

          return (
            <div key={item.name}>
              {isExternal ? (
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    current
                      ? "bg-orange-600 text-white shadow-lg shadow-orange-600/25"
                      : "text-foreground/70 hover:bg-card hover:text-primary hover:shadow-md border border-transparent hover:border-primary/20"
                  }`}
                  onClick={onClose}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 ${
                      current
                        ? "text-white"
                        : "text-muted-foreground group-hover:text-primary"
                    }`}
                  />
                  {item.name}
                  <ArrowRightCircleIcon className="ml-auto h-4 w-4 text-muted-foreground" />
                </a>
              ) : (
                <Link
                  to={item.href}
                  className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    current
                      ? "bg-orange-600 text-white shadow-lg shadow-orange-600/25"
                      : "text-foreground/70 hover:bg-card hover:text-primary hover:shadow-md border border-transparent hover:border-primary/20"
                  }`}
                  onClick={onClose}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 ${
                      current
                        ? "text-white"
                        : "text-muted-foreground group-hover:text-primary"
                    }`}
                  />
                  {item.name}
                </Link>
              )}
            </div>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-border">
        <button
          onClick={logout}
          className="group flex items-center justify-center w-full px-3 py-3 text-sm font-medium text-foreground/70 hover:text-red-600 hover:bg-red-500/10 rounded-xl border border-transparent hover:border-red-500/20 transition-all duration-200"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2 text-muted-foreground group-hover:text-red-500" />
          Cerrar sesión
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
                    className="ml-1 flex h-10 w-10 items-center justify-center rounded-full bg-background/10 backdrop-blur-sm border border-border/20 hover:bg-background/20 focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-6 w-6 text-foreground" />
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-72 lg:flex-col">
        <SidebarContent />
      </div>
    </>
  );
};

export default Sidebar;
