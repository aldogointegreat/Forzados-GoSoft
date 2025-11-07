import React, { useEffect } from "react";
import { Row } from "@/app/dashboard/consultas/page";
import useUserSession from "@/hooks/useSession";

interface ModalsProps {
  isModalOpen: boolean;
  selectedRow: Row;
  closeModal: () => void;
  openRejectModal: () => void;
  handleApprove: (id: number, tipo: string) => void;
  closeModalBaja: () => void;
  handleReject: (id: number, tipo: string) => void;
  handleApproveBaja: (id: number, tipo: string) => void;
  isExecuteModalOpen: boolean;
  selectedExecuteRow: Row;
  executeDate: string;
  setExecuteDate: (date: string) => void;
  handleDrag: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDrop: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>, index: number) => void;
  handleExecuteConfirm: (tipo: string, tipoForzado: string, descripcionEjecucion?: string) => void;
  executeFiles: File[];
  setExecuteFiles: (files: File[]) => void;
  closeExecuteModal: () => void;
  isRejectModalOpen: boolean;
  rejectReason: string;
  setRejectReason: (reason: string) => void;
  rejectReasons: { id: number; descripcion: string; tipo: string }[];
  closeRejectModal: () => void;
  handleRejectConfirm: (id: number, tipo: string) => void;
  getStatusClass: (estado: string) => string;
  formatDate: (dateString: string) => string;
  setShowPopover: (show: boolean) => void;
  setPopoverMessage: (message: string) => void;
  setPopoverType: (type: string) => void;
}

interface Option {
  id: string;
  descripcion: string;
}

const Modals: React.FC<ModalsProps> = ({
  isModalOpen,
  selectedRow,
  closeModal,
  isExecuteModalOpen,
  selectedExecuteRow,
  executeDate,
  setExecuteDate,
  handleDrag,
  handleDrop,
  handleFileChange,
  executeFiles,
  closeExecuteModal,
  isRejectModalOpen,
  rejectReason,
  setRejectReason,
  rejectReasons,
  closeRejectModal,
  handleRejectConfirm,
  getStatusClass,
  formatDate,
  setShowPopover,
  setPopoverMessage,
  setPopoverType,
}) => {
  const [dragActive] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isObservationModalOpen, setIsObservationModalOpen] = React.useState(false);
  const [isRejectExecutionModalOpen, setIsRejectExecutionModalOpen] = React.useState(false);
  const [observation, setObservation] = React.useState("");
  const [hasFiles, setHasFiles] = React.useState(false);
  const [descripcionEjecucion, setDescripcionEjecucion] = React.useState("");

  const [fileList, setFileList] = React.useState<Array<any>>([]);
  const [tipoForzados, setTipoForzados] = React.useState<Option[]>([]);
  const [selectedTipoForzado, setSelectedTipoForzado] = React.useState("");

  const [isPreviewModalOpen, setIsPreviewModalOpen] = React.useState(false);
  const [previewFile, setPreviewFile] = React.useState<any | null>(null);

  const { user } = useUserSession();

  const formatStatus = (status: string) => {
    switch (status) {
      case "PENDIENTE-FORZADO":
        return "FORZADO PENDIENTE";
      case "APROBADO-FORZADO":
        return "FORZADO APROBADO";
      case "EJECUTADO-FORZADO":
        return "FORZADO EJECUTADO";
      case "RECHAZADO-FORZADO":
        return "FORZADO RECHAZADO";
      case "PENDIENTE-RETIRO":
        return "Retiro PENDIENTE";
      case "APROBADO-RETIRO":
        return "Retiro APROBADO";
      case "EJECUTADO-RETIRO":
        return "Retiro EJECUTADO";
      case "RECHAZADO-RETIRO":
        return "Retiro RECHAZADO";
      case "FINALIZADO":
        return "FINALIZADO";
      default:
        return status;
    }
  };

  const handleObservationSubmit = async () => {
    if (!observation.trim()) {
      setPopoverMessage("El motivo de observación no puede estar vacío");
      setPopoverType("error");
      setShowPopover(true);
      setTimeout(() => setShowPopover(false), 3000);
      return;
    }

    console.log("Usuario logueado:", user);
    const userId = user?.id?.toString();
    console.log("userId obtenido:", userId);

    if (!userId) {
      setPopoverMessage("No se pudo obtener el ID del usuario logueado");
      setPopoverType("error");
      setShowPopover(true);
      setTimeout(() => setShowPopover(false), 3000);
      return;
    }

    setIsSubmitting(true);
    try {
      const apiEndpoint = selectedExecuteRow?.estado.includes("FORZADO")
        ? "/api/solicitudes/forzado/observar-ejecucion"
        : "/api/solicitudes/retiro/observar-ejecucion";

      const storedToken = localStorage.getItem("token");
      const payload = {
        id: selectedExecuteRow?.id,
        observacionEjecucion: observation.trim(),
        userId,
      };
      console.log("Payload enviado:", payload);
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${storedToken || ""}`,
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();
      console.log("Respuesta del servidor:", responseData);

      if (response.ok) {
        setPopoverMessage("Observación enviada exitosamente");
        setPopoverType("success");
        closeExecuteModal();
        setIsObservationModalOpen(false);
        setObservation("");
      } else {
        setPopoverMessage("Error al enviar la observación: " + (responseData.message || "Desconocido"));
        setPopoverType("error");
      }
    } catch (error) {
      console.error("Error en handleObservationSubmit:", error);
      setPopoverMessage("Error al enviar la observación");
      setPopoverType("error");
    } finally {
      setShowPopover(true);
      setTimeout(() => setShowPopover(false), 3000);
      setIsSubmitting(false);
    }
  };

  const fetchFiles = async () => {
    setIsSubmitting(true);
    try {
      if (selectedRow) {
        const response = await fetch(`/api/archivos/${selectedRow.id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        });
        const data = await response.json();
        console.log("API Response for files:", data); // Depuración
        if (response.ok) {
          setHasFiles(data.length > 0);
          setFileList(data || []);
        } else {
          setHasFiles(false);
          setFileList([]);
        }
      }
    } catch (error) {
      console.error("Error fetching files:", error);
      setHasFiles(false);
      setFileList([]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewFile = (file: any) => {
    setPreviewFile(file);
    setIsPreviewModalOpen(true);
  };

  const handleDownloadFile = (file: any) => {
    const fileURL = `data:application/octet-stream;base64,${file.archivo}`;
    const downloadLink = document.createElement("a");
    downloadLink.href = fileURL;
    downloadLink.download = file.nombreArchivo;
    downloadLink.click();
  };

  useEffect(() => {
    if (isModalOpen && selectedRow) {
      fetchFiles();
    }
  }, [isModalOpen, selectedRow]);

  const getFileExtension = (fileName: string) => {
    return fileName.split(".").pop()?.toLowerCase() || "";
  };

  useEffect(() => {
    if (isExecuteModalOpen && selectedExecuteRow?.estado.includes("FORZADO")) {
      const fetchTipoForzados = async () => {
        try {
          const response = await fetch("/api/maestras/tipo-forzado", {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            },
          });
          const data = await response.json();
          setTipoForzados(data.values);
        } catch (error) {
          console.error("Error fetching tipo forzados:", error);
        }
      };
      fetchTipoForzados();
    }
  }, [isExecuteModalOpen, selectedExecuteRow]);

  const logFormData = (formData: FormData) => {
    const formDataEntries: { [key: string]: any } = {};
    for (const [key, value] of formData.entries()) {
      formDataEntries[key] = value;
    }
    console.log("FormData being sent to API:", formDataEntries);
  };

  const executeAndLog = async (tipo: string, tipoForzado: string, descripcionEjecucion?: string) => {
    const formData = new FormData();
    formData.append("id", selectedExecuteRow.id.toString());
    formData.append("usuario", user?.id?.toString() || "");
    formData.append("fechaEjecucion", executeDate);
    formData.append("descripcionEjecucion", descripcionEjecucion || "");
    if (tipo === "Forzado") {
      formData.append("tipoForzado", tipoForzado);
    }
    executeFiles.forEach((file, index) => {
      if (file) formData.append(`file${index + 1}`, file);
    });

    logFormData(formData);

    const storedToken = localStorage.getItem("token");
    const apiEndpoint = tipo === "Forzado" 
      ? "/api/solicitudes/forzado/ejecutar" 
      : "/api/solicitudes/retiro/ejecutar";
    
    try {
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${storedToken || ""}`,
        },
        body: formData,
      });
      const responseData = await response.json();
      console.log("API Response:", responseData);

      if (response.ok) {
        setPopoverMessage("Ejecución realizada con éxito");
        setPopoverType("success");
        closeExecuteModal();
        setExecuteDate("");
        setSelectedTipoForzado("");
        setDescripcionEjecucion("");
      } else {
        setPopoverMessage(`Error al ejecutar: ${responseData.message || "Desconocido"}`);
        setPopoverType("error");
      }
    } catch (error) {
      console.error("Error calling API:", error);
      setPopoverMessage("Error al conectar con el servidor");
      setPopoverType("error");
    } finally {
      setShowPopover(true);
      setTimeout(() => setShowPopover(false), 3000);
    }
  };

  return (
    <>
      {isModalOpen &&
        !selectedRow.estado.includes("RETIRO") &&
        selectedRow &&
        (selectedRow.estado.includes("FORZADO") ||
          selectedRow.estado.includes("RECHAZADO") ||
          selectedRow.estado.includes("FINALIZADO")) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[70vh] overflow-y-auto">
              <div className="p-4">
                <h2 className="text-xl font-bold mb-3">Detalles de la solicitud de forzado</h2>
                <div className="bg-gray-100 p-3 rounded-lg mb-3 grid grid-cols-2 gap-2 text-sm">
                  <p>
                    <strong>Estado:</strong>{" "}
                    <span className={`p-1 rounded ${getStatusClass(selectedRow.estado)}`}>
                      {formatStatus(selectedRow.estado)}
                    </span>
                  </p>
                  <p>
                    <strong>Área:</strong> {selectedRow.area}
                  </p>
                  <p>
                    <strong>Solicitante:</strong> {selectedRow.solicitante}
                  </p>
                  <p>
                    <strong>Fecha:</strong> {selectedRow.fecha}
                  </p>
                  <p>
                    <strong>Descripción:</strong> {selectedRow.nombre}
                  </p>
                  <p>
                    <strong>Disciplina:</strong> {selectedRow.disciplinaDescripcion}
                  </p>
                  <p>
                    <strong>Fecha Cierre:</strong>{" "}
                    {selectedRow.fechaCierre ? formatDate(selectedRow.fechaCierre) : "N/A"}
                  </p>
                  <p>
                    <strong>Fecha Realización:</strong>{" "}
                    {selectedRow.fechaModificacion ? formatDate(selectedRow.fechaModificacion) : "N/A"}
                  </p>
                  <p>
                    <strong>Gerencia Responsable:</strong> {selectedRow.responsableNombre}
                  </p>
                  <p>
                    <strong>Nivel de Riesgo:</strong> {selectedRow.riesgoDescripcion}
                  </p>
                  <p>
                    <strong>Subárea:</strong> {selectedRow.subareaCodigo}
                  </p>
                  <p>
                    <strong>Tag Centro:</strong> {selectedRow.tagCentroCodigo}
                  </p>
                  <p>
                    <strong>Turno:</strong> {selectedRow.turnoDescripcion}
                  </p>
                </div>

                {hasFiles && fileList.length > 0 && (
                  <div className="mb-3">
                    <h3 className="text-lg font-semibold mb-1">Archivos Adjuntos</h3>
                    {fileList.some(file => file.etapaDocumento === "Retiro") && (
                      <div>
                        <h4 className="text-md font-medium mb-1">Documentos de Retiro</h4>
                        <ul className="space-y-1 list-none">
                          {fileList
                            .filter(file => file.etapaDocumento === "Retiro")
                            .map((file, index) => (
                              <li key={index} className="flex items-center justify-between gap-3 bg-white p-1 rounded shadow-sm">
                                <span className="font-medium break-all max-w-[60%]">
                                  {file.nombreArchivo}
                                </span>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => handleViewFile(file)}
                                    className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs"
                                  >
                                    Ver
                                  </button>
                                  <button
                                    onClick={() => handleDownloadFile(file)}
                                    className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                                  >
                                    Descargar
                                  </button>
                                </div>
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                    {fileList.some(file => file.etapaDocumento === "Forzado") && (
                      <div className="mt-3">
                        <hr className="my-2 border-gray-300" /> {/* Línea divisoria */}
                        <h4 className="text-md font-medium mb-1">Documentos de Forzado</h4>
                        <ul className="space-y-1 list-none">
                          {fileList
                            .filter(file => file.etapaDocumento === "Forzado")
                            .map((file, index) => (
                              <li key={index} className="flex items-center justify-between gap-3 bg-white p-1 rounded shadow-sm">
                                <span className="font-medium break-all max-w-[60%]">
                                  {file.nombreArchivo}
                                </span>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => handleViewFile(file)}
                                    className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs"
                                  >
                                    Ver
                                  </button>
                                  <button
                                    onClick={() => handleDownloadFile(file)}
                                    className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                                  >
                                    Descargar
                                  </button>
                                </div>
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <button
                    onClick={closeModal}
                    className="px-3 py-1 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-sm"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      {isModalOpen && selectedRow && (selectedRow.estado.includes("RETIRO") || selectedRow.estado.includes("FINALIZADO")) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[70vh] overflow-y-auto">
            <div className="p-4">
              <h2 className="text-xl font-bold mb-3">Detalles de la Solicitud de Retiro</h2>
              <div className="bg-gray-100 p-3 rounded-lg mb-3 grid grid-cols-2 gap-2 text-sm">
                <p>
                  <strong>Estado:</strong>{" "}
                  <span className={`p-1 rounded ${getStatusClass(selectedRow.estado)}`}>
                    {formatStatus(selectedRow.estado)}
                  </span>
                </p>
                <p>
                  <strong>Área:</strong> {selectedRow.area}
                </p>
                <p>
                  <strong>Solicitante:</strong> {selectedRow.solicitante}
                </p>
                <p>
                  <strong>Aprobador:</strong> {selectedRow.aprobador}
                </p>
                <p>
                  <strong>Ejecutor:</strong> {selectedRow.ejecutor}
                </p>
                <p>
                  <strong>Fecha:</strong> {selectedRow.fecha}
                </p>
                <p>
                  <strong>Descripción:</strong> {selectedRow.nombre}
                </p>
                <p>
                  <strong>Disciplina:</strong> {selectedRow.disciplinaDescripcion}
                </p>
                <p>
                  <strong>Fecha de Cierre:</strong>{" "}
                  {selectedRow.fechaCierre ? formatDate(selectedRow.fechaCierre) : "N/A"}
                </p>
                <p>
                  <strong>Fecha Realización:</strong>{" "}
                  {selectedRow.fechaModificacion ? formatDate(selectedRow.fechaModificacion) : "N/A"}
                </p>
                <p>
                  <strong>Gerencia Responsable:</strong> {selectedRow.responsableNombre}
                </p>
                <p>
                  <strong>Nivel de Riesgo:</strong> {selectedRow.riesgoDescripcion}
                </p>
                <p>
                  <strong>Subárea:</strong> {selectedRow.subareaCodigo}
                </p>
                <p>
                  <strong>Tag Centro:</strong> {selectedRow.tagCentroCodigo}
                </p>
                <p>
                  <strong>Turno:</strong> {selectedRow.turnoDescripcion}
                </p>
              </div>

              {hasFiles && fileList.length > 0 && (
                <div className="mb-3">
                  <h3 className="text-lg font-semibold mb-1">Archivos Adjuntos</h3>
                  {fileList.some(file => file.etapaDocumento === "Retiro") && (
                    <div>
                      <h4 className="text-md font-medium mb-1">Documentos de Retiro</h4>
                      <ul className="space-y-1 list-none">
                        {fileList
                          .filter(file => file.etapaDocumento === "Retiro")
                          .map((file, index) => (
                            <li key={index} className="flex items-center justify-between gap-3 bg-white p-1 rounded shadow-sm">
                              <span className="font-medium break-all max-w-[60%]">
                                {file.nombreArchivo}
                              </span>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleViewFile(file)}
                                  className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs"
                                >
                                  Ver
                                </button>
                                <button
                                  onClick={() => handleDownloadFile(file)}
                                  className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                                >
                                  Descargar
                                </button>
                              </div>
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                  {fileList.some(file => file.etapaDocumento === "Forzado") && (
                    <div className="mt-3">
                      <hr className="my-2 border-gray-300" /> {/* Línea divisoria */}
                      <h4 className="text-md font-medium mb-1">Documentos de Forzado</h4>
                      <ul className="space-y-1 list-none">
                        {fileList
                          .filter(file => file.etapaDocumento === "Forzado")
                          .map((file, index) => (
                            <li key={index} className="flex items-center justify-between gap-3 bg-white p-1 rounded shadow-sm">
                              <span className="font-medium break-all max-w-[60%]">
                                {file.nombreArchivo}
                              </span>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleViewFile(file)}
                                  className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs"
                                >
                                  Ver
                                </button>
                                <button
                                  onClick={() => handleDownloadFile(file)}
                                  className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                                >
                                  Descargar
                                </button>
                              </div>
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={closeModal}
                  className="px-3 py-1 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-sm"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isExecuteModalOpen && selectedExecuteRow && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {`Ejecutar ${selectedExecuteRow?.estado.includes("FORZADO") ? "Forzado" : "Retiro"}`}
              </h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Ejecución *</label>
                <input
                  type="datetime-local"
                  value={executeDate}
                  onChange={(e) => setExecuteDate(e.target.value)}
                  min={(() => {
                    const now = new Date();
                    const year = now.getFullYear();
                    const month = String(now.getMonth() + 1).padStart(2, "0");
                    const day = String(now.getDate()).padStart(2, "0");
                    const hours = String(now.getHours()).padStart(2, "0");
                    const minutes = String(now.getMinutes()).padStart(2, "0");
                    return `${year}-${month}-${day}T${hours}:${minutes}`;
                  })()}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 border-gray-300"
                />
              </div>

              {selectedExecuteRow?.estado.includes("FORZADO") && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Forzado *</label>
                  <select
                    value={selectedTipoForzado}
                    onChange={(e) => setSelectedTipoForzado(e.target.value)}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 border-gray-300"
                    required
                  >
                    <option value="">Seleccione un tipo de forzado</option>
                    {tipoForzados.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.descripcion}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={descripcionEjecucion}
                  onChange={(e) => setDescripcionEjecucion(e.target.value)}
                  maxLength={2000}
                  rows={10}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 border-gray-300"
                  placeholder="Escriba la descripción de la ejecución aquí..."
                />
                <div className="text-right text-xs text-gray-500 mt-1">
                  {descripcionEjecucion.length}/{1999} caracteres
                </div>
              </div>

              <div style={{ height: "30px" }}></div>
              <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                {[0, 1, 2].map((index) => (
                  <div key={index}>
                    <label
                      htmlFor={`executeFile${index}`}
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Datos Adjuntos {index + 1}
                    </label>
                    <div
                      className={`flex items-center justify-center border-2 ${
                        dragActive ? "border-blue-500" : "border-gray-300"
                      } border-dashed rounded-md p-4 cursor-pointer hover:bg-gray-100 focus-within:ring-2 focus-within:ring-blue-500`}
                      onDragOver={handleDrag}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={(e) => handleDrop(e, index)}
                      onClick={() => document.getElementById(`executeFile${index}`)?.click()}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-gray-500 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                        />
                      </svg>
                      <span className="text-sm text-gray-500">
                        {executeFiles[index] ? executeFiles[index].name : "Arrastre y suelte archivos o haga clic aquí"}
                      </span>
                    </div>
                    <input
                      id={`executeFile${index}`}
                      name={`executeFile${index}`}
                      type="file"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, index)}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => {
                    closeModal();
                    setExecuteDate("");
                    setDescripcionEjecucion("");
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cancelar
                </button>
                {selectedExecuteRow.observadoEjecucion === false && (
                  <button
                    onClick={() => setIsObservationModalOpen(true)}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                  >
                    Observar
                  </button>
                )}
                {selectedExecuteRow.observadoEjecucion === true && (
                  <button
                    onClick={() => setIsRejectExecutionModalOpen(true)}
                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    Rechazar
                  </button>
                )}
                <button
                  onClick={() => {
                    executeAndLog(
                      selectedExecuteRow?.estado.includes("FORZADO") ? "Forzado" : "Retiro",
                      selectedTipoForzado,
                      descripcionEjecucion
                    );
                  }}
                  disabled={
                    !executeDate || 
                    (selectedExecuteRow?.estado.includes("FORZADO") && !selectedTipoForzado)
                  }
                  className={`px-4 py-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    !executeDate || 
                    (selectedExecuteRow?.estado.includes("FORZADO") && !selectedTipoForzado)
                      ? "bg-gray-400 cursor-not-allowed" 
                      : "bg-blue-500 hover:bg-blue-600 focus:ring-blue-500"
                  }`}
                >
                  Ejecutar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isObservationModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Motivo de Observación</h2>
              <textarea
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                maxLength={2000}
                rows={5}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 border-gray-300 mb-4"
                placeholder="Escriba el motivo de observación aquí..."
                disabled={isSubmitting}
              />
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => {
                    setIsObservationModalOpen(false);
                    setObservation("");
                  }}
                  className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    isSubmitting
                      ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                      : "bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500"
                  }`}
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleObservationSubmit}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      ></path>
                    </svg>
                  ) : (
                    "Observar"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isRejectExecutionModalOpen && selectedExecuteRow && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Motivo del Rechazo</h2>
              <select
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 border-gray-300 mb-4"
              >
                <option value="">Seleccione un motivo</option>
                {rejectReasons
                  .filter((reason) => reason.tipo === "A")
                  .map((reason) => (
                    <option key={reason.id} value={reason.id}>
                      {reason.descripcion}
                    </option>
                  ))}
              </select>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => {
                    closeModal();
                    setIsRejectExecutionModalOpen(false);
                  }}
                  disabled={isSubmitting}
                  className={`px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 ${
                    isSubmitting ? "cursor-not-allowed" : ""
                  }`}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    setIsSubmitting(true);
                    if (selectedExecuteRow) handleRejectConfirm(selectedExecuteRow.id, selectedExecuteRow.estado.includes("FORZADO") ? "FORZADO" : "RETIRO");
                    setIsRejectExecutionModalOpen(false);
                    closeModal();
                  }}
                  disabled={!rejectReason || isSubmitting}
                  className={`px-4 py-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    !rejectReason || isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-red-500 hover:bg-red-600 focus:ring-red-500"
                  }`}
                >
                  Confirmar Rechazo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isRejectModalOpen && selectedRow && selectedRow.estado.includes("FORZADO") && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Motivo del Rechazo</h2>
              <select
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 border-gray-300 mb-4"
              >
                <option value="">Seleccione un motivo</option>
                {rejectReasons
                  .filter((reason) => reason.tipo === "A")
                  .map((reason) => (
                    <option key={reason.id} value={reason.id}>
                      {reason.descripcion}
                    </option>
                  ))}
              </select>
              <div className="flex justify-end gap-4">
                <button
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className={`px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 ${
                    isSubmitting ? "cursor-not-allowed" : ""
                  }`}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    setIsSubmitting(true);
                    if (selectedRow) handleRejectConfirm(selectedRow.id, "FORZADO");
                  }}
                  disabled={!rejectReason || isSubmitting}
                  className={`px-4 py-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    !rejectReason || isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-red-500 hover:bg-red-600 focus:ring-red-500"
                  }`}
                >
                  Confirmar Rechazo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isRejectModalOpen && selectedRow && selectedRow.estado.includes("RETIRO") && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Motivo del Rechazo</h2>
              <select
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 border-gray-300 mb-4"
              >
                <option value="">Seleccione un motivo</option>
                {rejectReasons
                  .filter((reason) => reason.tipo === "B")
                  .map((reason) => (
                    <option key={reason.id} value={reason.id}>
                      {reason.descripcion}
                    </option>
                  ))}
              </select>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => {
                    closeRejectModal();
                  }}
                  disabled={isSubmitting}
                  className={`px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 ${
                    isSubmitting ? "cursor-not-allowed" : ""
                  }`}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    setIsSubmitting(true);
                    handleRejectConfirm(selectedRow.id, "RETIRO");
                  }}
                  disabled={!rejectReason || isSubmitting}
                  className={`px-4 py-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    !rejectReason || isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-red-500 hover:bg-red-600 focus:ring-red-500"
                  }`}
                >
                  Confirmar Rechazo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isPreviewModalOpen && previewFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 flex flex-col items-center">
              <h2 className="text-xl font-bold mb-4">Vista Previa</h2>

              {(() => {
                const extension = getFileExtension(previewFile.nombreArchivo);

                if (extension === "pdf") {
                  return (
                    <iframe
                      src={`data:application/pdf;base64,${previewFile.archivo}`}
                      title={previewFile.nombreArchivo}
                      className="w-full"
                      style={{ height: "600px" }}
                    />
                  );
                } else {
                  return (
                    <img
                      src={`data:image/*;base64,${previewFile.archivo}`}
                      alt={previewFile.nombreArchivo}
                      className="max-w-full h-auto mb-4"
                    />
                  );
                }
              })()}

              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 focus:outline-none"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Modals;