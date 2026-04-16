"use client"

import { Fragment } from "react"
import { Link, useLocation } from "react-router-dom"
import { Dialog, Transition } from "@headlessui/react"
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
} from "@heroicons/react/24/outline"
import { useAuthContext } from "../../context/AuthContext"
import { USER_ROLES } from "../../utils/constants"

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuthContext()
  const location = useLocation()

  const teacherNavigation = [
    { name: "Panel Docente", href: "/dashboard", icon: HomeIcon },
    { name: "Mis Clases", href: "/classrooms", icon: AcademicCapIcon },
    { name: "Mis Grupos", href:"/groups", icon: UserGroupIcon},
    { name: "Mis Actividades", href: "/activities", icon: ClipboardDocumentListIcon },
    { name: "Subastas", href: "/auctions", icon: CurrencyEuroIcon },
    { name: "Perfil", href: "/profile", icon: UserIcon },
  ]

  const studentNavigation = [
    { name: "Panel Estudiante", href: "/dashboard", icon: HomeIcon },
    { name: "Grupos", href:"/groups", icon: UserGroupIcon},
    { name: "Actividades", href: "/activities", icon: ClipboardDocumentListIcon },
    { name: "Subastas", href: "/auctions", icon: CurrencyEuroIcon },
    { name: "Billetera", href: "/wallet", icon: WalletIcon },
    { name: "Perfil", href: "/profile", icon: UserIcon },
  ]

  const adminNavigation = [
    { name: "Dashboard Admin", href: "/dashboard", icon: HomeIcon },
    { name: "Admin Django", href: "https://educoin-production.up.railway.app/admin/", icon: Cog6ToothIcon },
  ]

  const navigation =
    user?.role === USER_ROLES.TEACHER
      ? teacherNavigation
      : user?.role === USER_ROLES.ADMIN
      ? adminNavigation
      : studentNavigation

  const isCurrentPath = (href) =>
    location.pathname === href || location.pathname.startsWith(href + "/")

  const SidebarContent = () => (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gradient-to-b from-white to-gray-50/80 border-r border-gray-100">
      {/* Logo */}
      <div className="flex h-20 shrink-0 items-center px-6 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-100 flex items-center justify-center shadow-lg overflow-hidden">
              <img 
                src="/assets/coins/coin.png" 
                alt="Educoin" 
                className="h-8 w-8 object-contain"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center">
              <BookOpenIcon className="h-3 w-3 text-white" />
            </div>
          </div>
          <div>
            <span className="text-xl font-bold text-orange-600">Educoin</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {navigation.map((item) => {
          const current = isCurrentPath(item.href)
          const isExternal = item.href.startsWith('http')
          
          return (
            <div key={item.name}>
              {isExternal ? (
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    current
                      ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25"
                      : "text-gray-700 hover:bg-white hover:text-orange-600 hover:shadow-md border border-transparent hover:border-orange-100"
                  }`}
                  onClick={onClose}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 ${
                      current
                        ? "text-white"
                        : "text-gray-400 group-hover:text-orange-500"
                    }`}
                  />
                  {item.name}
                  <ArrowRightCircleIcon className="ml-auto h-4 w-4 text-gray-400" />
                </a>
              ) : (
                <Link
                  to={item.href}
                  className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    current
                      ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25"
                      : "text-gray-700 hover:bg-white hover:text-orange-600 hover:shadow-md border border-transparent hover:border-orange-100"
                  }`}
                  onClick={onClose}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 ${
                      current
                        ? "text-white"
                        : "text-gray-400 group-hover:text-orange-500"
                    }`}
                  />
                  {item.name}
                </Link>
              )}
            </div>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-gray-100">
        <button
          onClick={logout}
          className="group flex items-center justify-center w-full px-3 py-3 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-100 transition-all duration-200"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2 text-gray-400 group-hover:text-red-500" />
          Cerrar sesión
        </button>
      </div>
    </div>
  )

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
                    className="ml-1 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white transition-all duration-200"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-6 w-6 text-white" />
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
  )
}

export default Sidebar