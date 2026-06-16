"use client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";
import { injectBrandColors } from "../../context/ThemeContext";
import { getPublicInstitutions } from "../../services/institutions";
import { toast } from "react-hot-toast";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import InstitutionSelect from "../../components/common/InstitutionSelect";
import api from "../../services/api";

export default function CompleteProfilePage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuthContext();

  const [institutions, setInstitutions] = useState([]);
  const [loadingInstitutions, setLoadingInstitutions] = useState(true);
  const [selected, setSelected] = useState("");
  const [selectError, setSelectError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.institution || user?.profile?.institucion) {
      navigate("/dashboard", { replace: true });
      return;
    }
    const fetch = async () => {
      try {
        const data = await getPublicInstitutions();
        setInstitutions(Array.isArray(data) ? data : data.results ?? []);
      } catch {
        toast.error("Error al cargar instituciones");
      } finally {
        setLoadingInstitutions(false);
      }
    };
    fetch();
  }, [user, navigate]);

  const handleSave = async () => {
    if (!selected) {
      toast.error("Selecciona una institucion");
      return;
    }
    setSaving(true);
    try {
      const res = await api.patch("/api/users/profile/update/", {
        institucion_id: selected,
      });

      const responseData = res.data?.user || res.data

      const nuevaInstitucion =
        responseData.institution ??
        responseData.profile?.institucion ??
        responseData.institucion ??
        null

      const updatedUser = {
        ...user,
        institution: nuevaInstitucion,
        profile: {
          ...(user.profile || {}),
          institucion: nuevaInstitucion,
        },
      }

      localStorage.setItem("user", JSON.stringify(updatedUser))
      setUser(updatedUser)
      injectBrandColors(nuevaInstitucion)

      toast.success("Institucion asignada correctamente")
      navigate("/dashboard", { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.detail || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 p-8 shadow-xl">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Completa tu perfil
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Selecciona la institucion educativa a la que perteneces
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Institucion educativa
            </label>
            <InstitutionSelect
              value={selected}
              onChange={(id) => {
                setSelected(id)
                setSelectError(null)
              }}
              institutions={institutions}
              loading={loadingInstitutions}
              disabled={saving}
              error={selectError}
              placeholder="Busca tu colegio..."
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving || loadingInstitutions || !selected}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-600/20 transition-all hover:bg-orange-700 hover:shadow-xl hover:shadow-orange-600/25 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]"
          >
            {saving ? (
              <>
                <LoadingSpinner size="sm" />
                Guardando...
              </>
            ) : (
              "Guardar y Continuar"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
