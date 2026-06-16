import { useState, useMemo } from "react"
import { PlusIcon, ShoppingBagIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline"
import AuctionCard from "./AuctionCard"
import CreateAuction from "./CreateAuction"
import { useAuthContext } from "../../context/AuthContext"
import { useAuctions, useDeleteAuction, useCloseAuction } from "../../hooks/useAuctions"
import LoadingSpinner from "../common/LoadingSpinner"
import Modal from "../common/Modal"

const AuctionList = () => {
  const { user } = useAuthContext()
  const isTeacher = user?.role === "docente"
  
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingAuction, setEditingAuction] = useState(null)

  const { data: auctions, isLoading, error, refetch } = useAuctions()
  const deleteAuction = useDeleteAuction()
  const closeAuction = useCloseAuction()

  const auctionsArray = Array.isArray(auctions) ? auctions : []

  const stats = useMemo(() => ({
    total_auctions: auctionsArray.length,
    active_auctions: auctionsArray.filter((a) => a.estado === "active").length,
    closed_auctions: auctionsArray.filter((a) => a.estado === "closed").length,
    total_bids: auctionsArray.reduce((sum, a) => sum + (a.total_pujas || 0), 0),
  }), [auctionsArray])

  const handleEdit = (auction) => {
    setEditingAuction(auction)
    setShowCreateModal(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm("Estas seguro de eliminar esta subasta? Se devolveran las edubids bloqueadas a los estudiantes.")) {
      await deleteAuction.mutateAsync(id)
    }
  }

  const handleClose = async (id) => {
    if (window.confirm("Estas seguro de cerrar esta subasta? Esta accion no se puede deshacer.")) {
      await closeAuction.mutateAsync(id)
    }
  }

  const handleCloseModal = () => {
    setShowCreateModal(false)
    setEditingAuction(null)
    refetch()
  }

  const filteredAuctions = auctionsArray.filter((auction) => {
    const matchesSearch = auction.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         auction.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !statusFilter || auction.estado === statusFilter
    return matchesSearch && matchesStatus
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error al cargar las subastas: {error.message}</p>
        <button 
          onClick={() => refetch()} 
          className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all active:scale-[0.96]"
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats Bar */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Subastas Academicas</h1>
            <p className="text-green-600 dark:text-green-400 text-sm sm:text-base">
              {isTeacher ? "Gestiona las subastas de tus grupos" : "Participa en subastas con tus edubids"}
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="text-center">
              <div className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">{stats?.total_auctions || 0}</div>
              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Total</div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400 tabular-nums">{stats?.active_auctions || 0}</div>
              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Activas</div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">{stats?.closed_auctions || 0}</div>
              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Cerradas</div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400 tabular-nums">{stats?.total_bids || 0}</div>
              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Pujas</div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por titulo o descripcion..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          >
            <option value="">Todos los estados</option>
            <option value="active">Activas</option>
            <option value="closed">Cerradas</option>
          </select>
        </div>
        
        {isTeacher && (
          <button 
            onClick={() => setShowCreateModal(true)} 
            className="flex items-center gap-2 bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 transition-all whitespace-nowrap text-sm sm:text-base active:scale-[0.96]"
          >
            <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            Nueva Subasta
          </button>
        )}
      </div>

      {/* Lista de subastas */}
      {filteredAuctions.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredAuctions.map((auction) => (
            <AuctionCard
              key={auction.id}
              auction={auction}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onClose={handleClose}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 sm:py-12 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-2xl">
          <ShoppingBagIcon className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 dark:text-gray-600 mx-auto mb-3 sm:mb-4" />
          <h3 className="text-lg sm:text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            {searchTerm || statusFilter ? "No se encontraron subastas" : "No hay subastas disponibles"}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base max-w-md mx-auto px-4 mb-4">
            {searchTerm || statusFilter 
              ? "Intenta con otros terminos de busqueda o filtros"
              : isTeacher
                ? "Crea tu primera subasta para motivar a tus estudiantes"
                : "No hay subastas disponibles en este momento"}
          </p>
          {(isTeacher && !searchTerm && !statusFilter) && (
            <button 
              onClick={() => setShowCreateModal(true)} 
              className="bg-green-600 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg hover:bg-green-700 transition-all inline-flex items-center gap-2 text-sm sm:text-base active:scale-[0.96]"
            >
              <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              Crear Primera Subasta
            </button>
          )}
        </div>
      )}

      <Modal
        isOpen={showCreateModal}
        onClose={handleCloseModal}
        title={editingAuction ? "Editar Subasta" : "Nueva Subasta"}
        size="lg"
      >
        <CreateAuction 
          auction={editingAuction} 
          onClose={handleCloseModal} 
        />
      </Modal>
    </div>
  )
}

export default AuctionList
