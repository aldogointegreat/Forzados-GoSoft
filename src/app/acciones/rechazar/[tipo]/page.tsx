"use client";

import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Popover from "@/components/Popover";

const RechazarPage = () => {
    const searchParams = useSearchParams();
    const params = useParams(); // Para leer el segmento dinámico de la URL (ej. "retiro" o "forzado")

    const token = searchParams.get("token");
    const id = searchParams.get("id");
    const usuario = searchParams.get("bsx");

    const tipoParamFromPath = params.tipo; // Ej. "retiro" o "forzado"
    console.log("Valor crudo de tipoParam desde el pathname:", tipoParamFromPath);
    
    const tipoParamFromSearch = searchParams.get("tipo");
    console.log("Valor crudo de tipoParam desde searchParams:", tipoParamFromSearch);
    
    // Normalizamos el valor de tipo, priorizando searchParams
    const normalizedTipoFromPath = typeof tipoParamFromPath === "string" ? tipoParamFromPath.toLowerCase() : "";
    const normalizedTipoFromSearch = typeof tipoParamFromSearch === "string" ? tipoParamFromSearch.toLowerCase() : "";
    const normalizedTipo = (normalizedTipoFromPath || normalizedTipoFromSearch || "").trim();
    const tipo = normalizedTipo === "retiro" ? "retiro" : "forzado";
    
    useEffect(() => {
      console.log("Valor final de tipo:", tipo);
    }, [tipo]);

    const [rejectReason, setRejectReason] = useState<number | string>("");
    const [popoverMessage, setPopoverMessage] = useState("");
    const [popoverType, setPopoverType] = useState<"success" | "error">("success");
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(true);
    const [rejectReasons, setRejectReasons] = useState<{ id: number; descripcion: string; tipo: string }[]>([]);
    const [showPopover, setShowPopover] = useState(false);

    // Función para manejar la acción (rechazar para forzado, observar para retiro)
    const handleActionConfirm = async () => {
        const confirmationMessage = tipo === "retiro" ? "¿Está seguro de observar?" : "¿Está seguro de rechazar?";
        
        if (confirm(confirmationMessage)) {
            try {
                const apiPath = tipo === "retiro" 
                    ? "/api/solicitudes/retiro/observar-aprobacion" 
                    : "/api/solicitudes/forzado/rechazar";
                
                console.log("Ruta API seleccionada:", apiPath);
                
                const response = await fetch(apiPath, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id, motivoRechazo: rejectReason, usuario, token }),
                });

                const result = await response.json();
                if (response.ok) {
                    setPopoverMessage(result.message || (tipo === "retiro" ? "Solicitud observada exitosamente" : "Solicitud rechazada exitosamente"));
                    setPopoverType("success");
                    setIsRejectModalOpen(false);
                } else {
                    setPopoverMessage(result.message || (tipo === "retiro" ? "Error al observar la solicitud" : "Error al rechazar la solicitud"));
                    setPopoverType("error");
                }
            } catch {
                setPopoverMessage(tipo === "retiro" ? "Error interno de servidor al observar solicitud" : "Error interno de servidor al rechazar solicitud");
                setPopoverType("error");
            } finally {
                setShowPopover(true);
                setTimeout(() => setShowPopover(false), 3000);
            }
        }
    };

    // Obtener motivos de rechazo
    useEffect(() => {
        const fetchRejectReasons = async () => {
            try {
                const response = await fetch("/api/maestras/motivo-rechazo");
                const result = await response.json();
                if (result.success) {
                    setRejectReasons(result.values);
                } else {
                    setPopoverMessage("Error al obtener motivos de rechazo");
                    setPopoverType("error");
                    setShowPopover(true);
                }
            } catch {
                setPopoverMessage("Error al obtener motivos de rechazo");
                setPopoverType("error");
                setShowPopover(true);
            }
        };

        fetchRejectReasons();
    }, []);

    return (
        <div>
            {isRejectModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                        <div className="p-6">
                            <h2 className="text-2xl font-bold mb-4">Motivo del {tipo === "retiro" ? "Observación" : "Rechazo"} ({tipo})</h2>
                            <select
                                value={rejectReason}
                                onChange={(e) => setRejectReason(Number(e.target.value) || "")}
                                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 border-gray-300 mb-4"
                            >
                                <option value="">Seleccione un motivo</option>
                                {rejectReasons
                                    .filter((reason) => 
                                        tipo === "retiro" ? reason.tipo === "B" : reason.tipo === "A"
                                    )
                                    .map((reason) => (
                                        <option key={reason.id} value={reason.id}>
                                            {reason.descripcion}
                                        </option>
                                    ))}
                            </select>
                            <div className="flex justify-end gap-4">
                                <button
                                    onClick={handleActionConfirm}
                                    disabled={!rejectReason}
                                    className={`px-4 py-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                        !rejectReason 
                                            ? "bg-gray-400 cursor-not-allowed" 
                                            : (tipo === "retiro" ? "bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-500" : "bg-red-500 hover:bg-red-600 focus:ring-red-500")
                                    }`}
                                >
                                    {tipo === "retiro" ? "Confirmar Observación" : "Confirmar Rechazo"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <Popover message={popoverMessage} type={popoverType} show={showPopover} />
        </div>
    );
};

export default RechazarPage;