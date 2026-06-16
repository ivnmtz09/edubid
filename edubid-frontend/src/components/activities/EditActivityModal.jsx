import { useState, useEffect } from "react";
import { XMarkIcon, DocumentArrowUpIcon } from "@heroicons/react/24/outline";
import { useUpdateActivity } from "../../hooks/useActivities";
import { useGroups } from "../../hooks/useGroups";
import LoadingSpinner from "../common/LoadingSpinner";

// Regla 18: clases base con pares light/dark explícitos
const inputBase =
  "w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500";

const labelBase =
  "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

export default function EditActivityModal({ activity, onClose }) {
  const updateMutation = useUpdateActivity();
  const { data: groups } = useGroups();

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    tipo: "tarea",
    group: "",
    valor_educoins: 100,
    puntos_experiencia: 10,
    fecha_entrega: "",
    habilitada: true,
  });
  const [archivo, setArchivo] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (activity) {
      setFormData({
        nombre: activity.nombre || "",
        descripcion: activity.descripcion || "",
        tipo: activity.tipo || "tarea",
        group: activity.group || "",
        valor_educoins: activity.valor_educoins || 100,
        puntos_experiencia: activity.puntos_experiencia || 10,
        fecha_entrega: activity.fecha_entrega
          ? new Date(activity.fecha_entrega).toISOString().slice(0, 16)
          : "",
        habilitada:
          activity.habilitada !== undefined ? activity.habilitada : true,
      });
    }
  }, [activity]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        archivo: "El archivo no debe superar 10MB",
      }));
      return;
    }
    setArchivo(file);
    setErrors((prev) => ({ ...prev, archivo: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!formData.nombre.trim()) newErrors.nombre = "El nombre es requerido";
    if (!formData.group) newErrors.group = "El grupo es requerido";
    if (!formData.fecha_entrega)
      newErrors.fecha_entrega = "La fecha de entrega es requerida";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        if (key === "fecha_entrega")
          data.append(key, new Date(formData[key]).toISOString());
        else if (key === "group") data.append(key, parseInt(formData[key]));
        else data.append(key, formData[key]);
      });
      if (archivo) data.append("archivo_adjunto", archivo);

      await updateMutation.mutateAsync({ id: activity.id, data });
      onClose();
    } catch (error) {
      console.error("Error actualizando actividad:", error);
    }
  };

  const minDateString = new Date().toISOString().slice(0, 16);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* FIX: backdrop con bg-black/40 — antes era solo bg-opacity-40 sin color */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        {/* Regla 18: modal siempre opaco con par light/dark */}
        <div
          className="relative bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl shadow-lg border border-purple-200 dark:border-purple-900/30 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header sticky */}
          {/* Regla 18: fondo explícito en el sticky header también */}
          <div className="sticky top-0 bg-white dark:bg-gray-800 flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 z-10">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
              Editar Actividad
            </h3>
            <button
              onClick={onClose}
              // FIX: dark:bg-gray-900 era incorrecto sobre dark:bg-gray-800
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors active:scale-[0.96]"
            >
              <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="p-4 sm:p-6 space-y-4 sm:space-y-6"
          >
            {/* Nombre */}
            <div>
              <label className={labelBase}>
                Nombre de la Actividad <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className={`${inputBase} ${errors.nombre ? "border-red-500 dark:border-red-500" : "border-gray-300 dark:border-gray-600"}`}
                placeholder="Ej: Taller de Álgebra"
              />
              {errors.nombre && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.nombre}
                </p>
              )}
            </div>

            {/* Tipo + Grupo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className={labelBase}>Tipo</label>
                <select
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleChange}
                  className={`${inputBase} border-gray-300 dark:border-gray-600`}
                >
                  <option value="tarea">Tarea</option>
                  <option value="examen">Examen</option>
                  <option value="proyecto">Proyecto</option>
                  <option value="quiz">Quiz</option>
                  <option value="exposicion">Exposición</option>
                </select>
              </div>

              <div>
                <label className={labelBase}>
                  Grupo <span className="text-red-500">*</span>
                </label>
                <select
                  name="group"
                  value={formData.group}
                  onChange={handleChange}
                  className={`${inputBase} ${errors.group ? "border-red-500 dark:border-red-500" : "border-gray-300 dark:border-gray-600"}`}
                >
                  <option value="">Selecciona un grupo</option>
                  {groups?.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.nombre}
                    </option>
                  ))}
                </select>
                {errors.group && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.group}
                  </p>
                )}
              </div>
            </div>

            {/* Descripción */}
            <div>
              <label className={labelBase}>Descripción</label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                rows={3}
                className={`${inputBase} border-gray-300 dark:border-gray-600 resize-none`}
                placeholder="Describe la actividad..."
              />
            </div>

            {/* EduBids + Nota + Fecha */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className={labelBase}>EduBids</label>
                <input
                  type="number"
                  name="valor_educoins"
                  min="0"
                  value={formData.valor_educoins}
                  onChange={handleChange}
                  className={`${inputBase} border-gray-300 dark:border-gray-600`}
                />
              </div>

              <div>
                <label className={labelBase}>Valor Nota</label>
                <input
                  type="number"
                  name="puntos_experiencia"
                  min="0"
                  value={formData.puntos_experiencia}
                  onChange={handleChange}
                  className={`${inputBase} border-gray-300 dark:border-gray-600`}
                />
              </div>

              <div>
                <label className={labelBase}>
                  Fecha Límite <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="fecha_entrega"
                  value={formData.fecha_entrega}
                  onChange={handleChange}
                  min={minDateString}
                  className={`${inputBase} ${errors.fecha_entrega ? "border-red-500 dark:border-red-500" : "border-gray-300 dark:border-gray-600"}`}
                />
                {errors.fecha_entrega && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.fecha_entrega}
                  </p>
                )}
              </div>
            </div>

            {/* Archivo adjunto */}
            <div>
              <label className={labelBase}>Archivo Adjunto</label>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <label className="flex-1 cursor-pointer w-full">
                  <div className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 dark:hover:border-purple-400 transition-colors bg-white dark:bg-gray-700">
                    <DocumentArrowUpIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-2 flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center line-clamp-1">
                      {archivo ? archivo.name : "Seleccionar archivo"}
                    </span>
                  </div>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.jpg,.jpeg,.png"
                  />
                </label>
              </div>
              {errors.archivo && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.archivo}
                </p>
              )}
              {activity.archivo_adjunto && !archivo && (
                <p className="mt-1.5 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Archivo actual:{" "}
                  <a
                    href={activity.archivo_adjunto}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    Ver archivo
                  </a>
                </p>
              )}
            </div>

            {/* Checkbox habilitada */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="habilitada"
                name="habilitada"
                checked={formData.habilitada}
                onChange={handleChange}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
              />
              <label
                htmlFor="habilitada"
                className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
              >
                Actividad habilitada para entregas
              </label>
            </div>

            {/* Acciones */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium text-sm sm:text-base active:scale-[0.96]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="flex-1 bg-purple-600 text-white px-4 py-2.5 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 font-medium text-sm sm:text-base flex items-center justify-center active:scale-[0.96]"
              >
                {updateMutation.isPending ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  "Guardar Cambios"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
