"use client";

import React, { useState, useEffect, Suspense } from "react";
import Popover from "./Popover";
import { useSearchParams } from "next/navigation";
import useUserSession from "@/hooks/useSession";
import { aprobadores, solicitantes } from "@/hooks/rolesPermitidos";

const BajaForzado = () => {
  const [formData, setFormData] = useState({
    solicitanteRetiro: "",
    aprobadorRetiro: "",
    tipoGrupoB: "",
    observaciones: "",
    tagConcat: "",
  });

  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [popover, setPopover] = useState({ show: false, message: "", type: "success" as "success" | "error" });
  const [aprobadoresList, setAprobadoresList] = useState<{ id: string; nombre: string; apePaterno: string; apeMaterno: string }[]>([]);
  const [solicitantesList, setSolicitantesList] = useState<{ id: string; nombre: string; apePaterno: string; apeMaterno: string }[]>([]);
  const [tiposGrupo, setTiposGrupo] = useState<{ id: string; descripcion: string }[]>([]);
  const [loading, setLoading] = useState(false); // New loading state
  const { user } = useUserSession();
  const [isModified, setIsModified] = useState(false);

  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        setLoading(true); // Set loading to true while fetching users
        const response = await fetch("/api/usuarios");
        const data = await response.json();

        const filteredSolicitantes = data.values.filter((usuario: any) =>
          solicitantes.some((roleId) => Object.keys(usuario.roles).includes(roleId.toString()))
        );

        const filteredAprobadores = data.values.filter((usuario: any) =>
          aprobadores.some((roleId) => Object.keys(usuario.roles).includes(roleId.toString()))
        );

        setSolicitantesList(filteredSolicitantes);
        setAprobadoresList(filteredAprobadores);
      } catch (error) {
        console.error("Error al obtener usuarios:", error);
      } finally {
        setLoading(false); // Reset loading state
      }
    };

    const fetchTiposGrupo = async () => {
      try {
        setLoading(true); // Set loading to true while fetching groups
        const response = await fetch("/api/maestras/grupo");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setTiposGrupo(data.values || []);
      } catch (error) {
        console.error("Error fetching tipos de grupo:", error);
      } finally {
        setLoading(false); // Reset loading state
      }
    };

    fetchUsuarios();
    fetchTiposGrupo();
  }, []);

  useEffect(() => {
    if (user && user.id && !formData.solicitanteRetiro) {
      setFormData((prevData) => ({
        ...prevData,
        solicitanteRetiro: String(user.id),
      }));
    }
  }, [user, formData.solicitanteRetiro]);

  useEffect(() => {
    const fetchSolicitud = async () => {
      if (id) {
        try {
          setLoading(true); // Set loading to true while fetching solicitud
          const response = await fetch(`/api/solicitudes/retiro/${id}`);
          const { data } = await response.json();
          if (data) {
            setFormData({
              solicitanteRetiro: data.solicitante || "",
              aprobadorRetiro: data.aprobador || "",
              tipoGrupoB: data.grupo || "",
              observaciones: data.observaciones || "",
              tagConcat: data.tagConcat || "",
            });
          }
        } catch (error) {
          console.error("Error al obtener la solicitud:", error);
        } finally {
          setLoading(false); // Reset loading state
        }
      }
      setIsModified(false);
    };
    fetchSolicitud();
  }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    setErrors({
      ...errors,
      [name]: false,
    });
    setIsModified(true);
  };

  const validateForm = () => {
    const newErrors: Record<string, boolean> = {};
    Object.keys(formData).forEach((key) => {
      if (key !== "observaciones" && !formData[key as keyof typeof formData]) {
        newErrors[key] = true;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isFormValid = () => {
    return Object.keys(formData).every((key) => key === "observaciones" || formData[key as keyof typeof formData]) && isModified;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const confirmed = window.confirm("¿Está seguro de que desea generar el Retiro?");
      if (confirmed) {
        try {
          setLoading(true); // Set loading to true during form submission
          const response = await fetch("/api/solicitudes/retiro", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ ...formData, id, usuario: user?.id }),
          });
          if (response.ok) {
            setPopover({ show: true, message: "Retiro solicitado exitosamente.", type: "success" });
            setTimeout(() => {
              window.location.href = "/dashboard/consultas";
            }, 3000);
          } else {
            throw new Error("Error al generar el retiro.");
          }
        } catch (error) {
          setPopover({ show: true, message: (error as Error).message, type: "error" });
        } finally {
          setLoading(false); // Reset loading state
        }
      }
    }
  };

  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-md relative">
        {/* Loading Spinner */}
        {loading && (
          <div className="absolute inset-0 bg-gray-100 bg-opacity-50 flex items-center justify-center z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid"></div>
          </div>
        )}
        <Popover message={popover.message} type={popover.type} show={popover.show} />
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Solicitud de Retiro / {id} / {formData.tagConcat}</h1>
        <form onSubmit={handleSubmit}>
          {/* Solicitante Retiro */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Solicitante Retiro *</label>
            <select
              name="solicitanteRetiro"
              value={formData.solicitanteRetiro}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 ${errors.solicitanteRetiro ? "border-red-500" : "border-gray-300"}`}
              disabled={loading} // Disable during loading
            >
              <option disabled value="">Seleccione un usuario</option>
              {solicitantesList
                .slice()
                .sort((a, b) => a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }))
                .map((usuario) => (
                  <option key={usuario.id} value={usuario.id}>
                    {usuario.nombre + " " + usuario.apePaterno + " " + usuario.apeMaterno}
                  </option>
                ))}
            </select>
            {errors.solicitanteRetiro && <span className="text-red-500 text-sm mt-1">Este campo es requerido.</span>}
          </div>

          {/* Aprobador Retiro */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Aprobador Retiro *</label>
            <select
              name="aprobadorRetiro"
              value={formData.aprobadorRetiro}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 ${errors.aprobadorRetiro ? "border-red-500" : "border-gray-300"}`}
              disabled={loading} // Disable during loading
            >
              <option disabled value="">Seleccione un usuario</option>
              {aprobadoresList
                .slice()
                .sort((a, b) => a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }))
                .map((aprobador) => (
                  <option key={aprobador.id} value={aprobador.id}>
                    {aprobador.nombre + " " + aprobador.apePaterno + " " + aprobador.apeMaterno}
                  </option>
                ))}
            </select>
            {errors.aprobadorRetiro && <span className="text-red-500 text-sm mt-1">Este campo es requerido.</span>}
          </div>

          {/* Grupo */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Grupo de ejecución *</label>
            <select
              name="tipoGrupoB"
              value={formData.tipoGrupoB}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 ${errors.tipoGrupoB ? "border-red-500" : "border-gray-300"}`}
              disabled={loading} // Disable during loading
              required
            >
              <option disabled value="">Seleccione Grupo</option>
              {tiposGrupo.length > 0 ? (
                tiposGrupo.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.descripcion}
                  </option>
                ))
              ) : (
                <option value="" disabled>
                  No hay grupos disponibles
                </option>
              )}
            </select>
            {errors.tipoGrupoB && <span className="text-red-500 text-sm mt-1">Este campo es requerido.</span>}
          </div>

          {/* Observaciones */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 ${errors.observaciones ? "border-red-500" : "border-gray-300"}`}
              rows={4}
              placeholder="Escriba sus observaciones aquí..."
              maxLength={1999}
              disabled={loading} // Disable during loading
            />
            <div className="text-right text-xs text-gray-500 mt-1">
              {formData.observaciones.length}/{1999} caracteres
            </div>
            {errors.observaciones && <span className="text-red-500 text-sm mt-1">Este campo es requerido.</span>}
          </div>

          {/* Botón de Enviar */}
          <button
            type="submit"
            className={`w-full px-4 py-2 font-semibold rounded ${isFormValid() && !loading ? "bg-blue-500 text-white hover:bg-blue-600" : "bg-gray-500 text-white cursor-not-allowed"}`}
            disabled={!isFormValid() || loading} // Disable button during loading
          >
            {loading ? "Enviando..." : "Enviar"}
          </button>
        </form>
      </div>
    </Suspense>
  );
};

export default BajaForzado;