import React, { useState } from "react";

interface ModalAprobacionRechazoProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  onObserve?: () => void;
  requestType?: string; // "RETIRO PENDIENTE" o "FORZADO PENDIENTE"
}

const ModalAprobacionRechazo: React.FC<ModalAprobacionRechazoProps> = ({ 
  isOpen, 
  onClose, 
  onApprove, 
  onReject, 
  onObserve,
  requestType = "FORZADO PENDIENTE" 
}) => {
  const [isRejecting, setIsRejecting] = useState(false);

  if (!isOpen) return null;

  const isRetiroPendiente = requestType === "RETIRO PENDIENTE";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">
            {isRetiroPendiente 
              ? "¿Desea observar o aprobar la solicitud?" 
              : "¿Desea aprobar o rechazar la solicitud?"}
          </h2>
          <div className="flex justify-end gap-4">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cancelar
            </button>
            {isRetiroPendiente && onObserve && (
              <button
                onClick={async () => {
                  try {
                    await onObserve(); // Llama a la nueva API /api/solicitudes/retiro/observar-aprobacion
                  } finally {
                    onClose();
                  }
                }}
                className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
              >
                Observar
              </button>
            )}
            {!isRetiroPendiente && (
              <button
                onClick={async () => {
                  setIsRejecting(true);
                  try {
                    await onReject();
                  } finally {
                    setIsRejecting(false);
                    onClose();
                  }
                }}
                disabled={isRejecting}
                className={`px-4 py-2 ${
                  isRejecting ? "bg-gray-500 cursor-not-allowed" : "bg-red-500 hover:bg-red-600"
                } text-white rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2`}
              >
                Rechazar
              </button>
            )}
            <button
              onClick={() => {
                onApprove();
                onClose();
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Aprobar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalAprobacionRechazo;