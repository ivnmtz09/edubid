"use client"

import { Fragment } from "react"
import { Menu, Transition } from "@headlessui/react"
import {
  Bars3Icon,
  BellIcon,
  ChevronDownIcon,
  CurrencyEuroIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  AcademicCapIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline"
import { Link } from "react-router-dom"
import { useAuthContext } from "../../context/AuthContext"
import { formatCoins } from "../../utils/helpers"
import { USER_ROLES } from "../../utils/constants"
import { useTotalBalance } from "../../hooks/useWallet"
import NotificationsDropdown from '../notifications/NotificationsDropdown'

const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuthContext()
  const { data: totalBalance, isLoading: balanceLoading } = useTotalBalance()
  const isStudent = user?.role === USER_ROLES.STUDENT
  const isTeacher = user?.role === USER_ROLES.TEACHER
  const isAdmin = user?.role === USER_ROLES.ADMIN

  const userNavigation = [
    { name: "Tu Perfil", href: "/profile", icon: UserIcon },
    ...(isAdmin ? [{ name: "Admin Django", href: "http://localhost:8000/admin/", icon: Cog6ToothIcon, external: true }] : []),
    { name: "Cerrar Sesión", href: "#", icon: ArrowRightOnRectangleIcon, onClick: logout },
  ]

  return (
    <div className="sticky top-0 z-30 flex h-16 sm:h-20 items-center justify-between bg-white/80 backdrop-blur-xl border-b border-gray-200/60 px-3 sm:px-4 lg:px-6 xl:px-8">
      {/* Mobile menu button */}
      <button 
        type="button" 
        className="lg:hidden p-1.5 sm:p-2 rounded-lg sm:rounded-xl hover:bg-gray-100 transition-all duration-200 text-gray-600 hover:text-gray-900 flex-shrink-0"
        onClick={onMenuClick}
      >
        <Bars3Icon className="h-5 w-5 sm:h-6 sm:w-6" />
      </button>

      <div className="flex flex-1 items-center justify-end gap-x-2 sm:gap-x-3 lg:gap-x-4">
        {/* Role Badge - Oculto en móviles pequeños, visible desde sm */}
        <div className="hidden sm:flex items-center gap-x-1.5 sm:gap-x-2 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-blue-50 to-blue-100 rounded-full border border-blue-200">
          <AcademicCapIcon className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
          <span className="text-xs sm:text-sm font-medium text-blue-700 capitalize truncate max-w-[80px] sm:max-w-none">
            {user?.role}
          </span>
        </div>

        {/* Saldo del estudiante - MOSTRAR SUMA TOTAL */}
        {isStudent && !balanceLoading && (
          <div className="flex items-center gap-x-1.5 sm:gap-x-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full shadow-lg shadow-orange-500/25">
            <CurrencyEuroIcon className="h-3 w-3 sm:h-4 sm:w-4 xl:h-5 xl:w-5 text-white" />
            <span className="text-xs sm:text-sm xl:text-base font-bold text-white whitespace-nowrap">
              {formatCoins(totalBalance || 0)} EC
            </span>
          </div>
        )}

        {/* Notifications */}
        <div className="flex-shrink-0">
          <NotificationsDropdown />
        </div>

        {/* Profile dropdown */}
        <Menu as="div" className="relative flex-shrink-0">
          <Menu.Button className="flex items-center p-1.5 sm:p-2 rounded-lg sm:rounded-xl hover:bg-gray-100 transition-all duration-200 group">
            <div className="flex items-center gap-x-2 sm:gap-x-3">
              {/* Avatar - Tamaños responsivos */}
              <div className="h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold shadow-md text-sm sm:text-base">
                {user?.first_name?.charAt(0)}
                {user?.last_name?.charAt(0)}
              </div>
              
              {/* User info - Oculto en móviles, visible desde lg */}
              <div className="hidden lg:block text-left min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate max-w-[120px] xl:max-w-[140px]">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-gray-500 capitalize truncate">
                  {user?.role}
                </p>
              </div>

              {/* Chevron - Siempre visible */}
              <ChevronDownIcon className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 group-hover:text-gray-600 transition-colors duration-200 flex-shrink-0" />
            </div>
          </Menu.Button>
          
          <Transition
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 scale-95 translate-y-2"
            enterTo="opacity-100 scale-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 scale-100 translate-y-0"
            leaveTo="opacity-0 scale-95 translate-y-2"
          >
            <Menu.Items className="absolute right-0 mt-2 w-56 sm:w-64 origin-top-right rounded-xl sm:rounded-2xl bg-white/95 backdrop-blur-xl shadow-xl ring-1 ring-gray-200/80 focus:outline-none overflow-hidden z-50">
              {/* User Info */}
              <div className="p-3 sm:p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100/50">
                <div className="flex items-center gap-x-3">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm sm:text-base flex-shrink-0">
                    {user?.first_name?.charAt(0)}
                    {user?.last_name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {user?.first_name} {user?.last_name}
                    </p>
                    <p className="text-xs text-gray-500 capitalize truncate">{user?.role}</p>
                    {isStudent && !balanceLoading && (
                      <div className="flex items-center gap-x-1 mt-1">
                        <CurrencyEuroIcon className="h-3 w-3 text-orange-500 flex-shrink-0" />
                        <span className="text-xs font-medium text-orange-600 truncate">
                          {formatCoins(totalBalance || 0)} EC
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Navigation Items */}
              <div className="p-1 sm:p-2">
                {userNavigation.map((item) => {
                  const isExternal = item.external || item.href.startsWith('http')
                  const content = (
                    <div className={`flex items-center px-2 sm:px-3 py-2.5 sm:py-3 text-sm font-medium rounded-lg sm:rounded-xl transition-all duration-200 ${
                      item.onClick 
                        ? 'text-red-600 hover:bg-red-50 hover:text-red-700' 
                        : 'text-gray-700 hover:bg-gray-50 hover:text-orange-600'
                    }`}>
                      <item.icon className={`mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${
                        item.onClick ? 'text-red-500' : 'text-gray-400'
                      }`} />
                      <span className="truncate flex-1">{item.name}</span>
                      {isExternal && (
                        <ArrowTopRightOnSquareIcon className="ml-2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                      )}
                    </div>
                  )

                  return (
                    <Menu.Item key={item.name}>
                      {({ active }) => (
                        isExternal ? (
                          <a
                            href={item.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block"
                          >
                            {content}
                          </a>
                        ) : item.onClick ? (
                          <button
                            onClick={item.onClick}
                            className="block w-full text-left"
                          >
                            {content}
                          </button>
                        ) : (
                          <Link to={item.href} className="block">
                            {content}
                          </Link>
                        )
                      )}
                    </Menu.Item>
                  )
                })}
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>
    </div>
  )
}

export default Header