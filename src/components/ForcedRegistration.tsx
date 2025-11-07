"use client";
import StepOne from "@/components/StepOne";
import StepTwo from "@/components/StepTwo";
import StepThree from "@/components/StepThree";
import EditStepOne from "@/components/EditStepOne";
import EditStepTwo from "@/components/EditStepTwo";
import EditStepThree from "@/components/EditStepThree";
import React, { useState, useEffect, Suspense } from "react";
import { FaArrowLeft, FaSpinner } from "react-icons/fa";
import { useRouter, useSearchParams } from "next/navigation";
import Popover from "@/components/Popover";
import useUserSession from "@/hooks/useSession";

const ForcedRegistration: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [grupoId, setGrupoId] = useState<string | null>(null);
  const [turno, setTurno] = useState<string>("");
  const [tagSubfijo, setTagSubfijo] = useState("");
  const [tagPrefijo, setTagPrefijo] = useState("");
  const [tagCentro, setTagCentro] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [disciplina, setDisciplina] = useState("");
  const [circuito, setCircuito] = useState("");
  const [interlockSeguridad, setInterlockSeguridad] = useState("");
  const [responsable, setResponsable] = useState("");
  const [riesgo, setRiesgo] = useState("");
  const [probabilidad, setProbabilidad] = useState("");
  const [impacto, setImpacto] = useState("");
  const [solicitante, setSolicitante] = useState("");
  const [nivelRiesgo, setNivelRiesgo] = useState("");
  const [aprobador, setAprobador] = useState("");
  const [tipoGrupoA, setTipoGrupoA] = useState("");
  const [fechaFinPlanificada, setFechaFinPlanificada] = useState("");
  const [popoverMessage, setPopoverMessage] = useState("");
  const [popoverType, setPopoverType] = useState<"success" | "error">("success");
  const [showPopover, setShowPopover] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  const { user } = useUserSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const steps = [
    { id: 1, title: "Paso 1" },
    { id: 2, title: "Paso 2" },
    { id: 3, title: "Paso 3" },
  ];

  // Cargar datos del usuario para grupoId
  useEffect(() => {
    const fetchUserData = async () => {
      if (user?.id) {
        try {
          const userResponse = await fetch(`/api/usuarios`);
          const userData = await userResponse.json();
          if (userData.success && userData.values) {
            const loggedInUser = userData.values.find((u: any) => u.id === user.id);
            if (loggedInUser && loggedInUser.grupoId) {
              setGrupoId(String(loggedInUser.grupoId));
            } else {
              console.warn("No grupoId found for user:", user.id);
              setGrupoId(null);
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setGrupoId(null);
        }
      }
    };
    fetchUserData();
  }, [user]);

  // Cargar datos de la solicitud existente
  useEffect(() => {
    const fetchSolicitudData = async () => {
      if (id && !dataLoaded) {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/solicitudes/forzado?id=${id}`);
          if (!response.ok) throw new Error(`Error al obtener la solicitud: ${response.status}`);
          const result = await response.json();

          if (result.success && result.data?.length > 0) {
            const solicitud = result.data[0];
            console.log("Datos completos de la solicitud:", solicitud);
            console.log("Valor de solicitud.solicitante:", solicitud.solicitante);
            console.log("Valor de solicitud.solicitanteAid:", solicitud.solicitanteAid);
            console.log("Valor de solicitud.solicitanteNombre:", solicitud.solicitanteNombre);

            // Mapear responsableNombre a un ID si responsable no está presente
            let responsableId = solicitud.responsable || "";
            if (!responsableId && solicitud.responsableNombre) {
              const responsablesResponse = await fetch("/api/maestras/responsable");
              const responsablesData = await responsablesResponse.json();
              const responsables = responsablesData.values || [];
              const matchingResponsable = responsables.find(
                (r: { id: string; nombre: string }) => r.nombre === solicitud.responsableNombre
              );
              if (matchingResponsable) {
                responsableId = matchingResponsable.id;
                console.log("responsableId deducido desde responsableNombre:", responsableId);
              }
            }

            // Mapear solicitanteNombre a un ID si solicitante no es un ID válido
            let solicitanteId = solicitud.solicitante || solicitud.solicitanteAid || "";
            if (!solicitanteId && (solicitud.solicitanteNombre || solicitud.solicitanteApellidoPaterno)) {
              const usuariosResponse = await fetch("/api/usuarios");
              const usuariosData = await usuariosResponse.json();
              const usuarios = usuariosData.values || [];
              const matchingUsuario = usuarios.find(
                (u: { id: string; nombre: string; apePaterno: string; apeMaterno?: string }) => {
                  const fullName = `${u.nombre} ${u.apePaterno} ${u.apeMaterno || ""}`.trim();
                  const solicitudFullName = `${solicitud.solicitanteNombre || ""} ${
                    solicitud.solicitanteApellidoPaterno || ""
                  } ${solicitud.solicitanteApellidoMaterno || ""}`.trim();
                  return fullName === solicitudFullName;
                }
              );
              if (matchingUsuario) {
                solicitanteId = matchingUsuario.id;
                console.log("solicitanteId deducido desde solicitanteNombre:", solicitanteId);
              } else {
                console.warn("No se encontró un usuario que coincida con el nombre:", solicitud.solicitanteNombre);
                solicitanteId = user?.id || "";
              }
            }

            setTagPrefijo(solicitud.tagPrefijo || "");
            setTagCentro(solicitud.tagCentro || "");
            setTagSubfijo(solicitud.tagSufijo || "");
            setDescripcion(solicitud.descripcion || "");
            setDisciplina(solicitud.disciplina || "");
            setTurno(solicitud.turno || "");
            setCircuito(solicitud.circuito || "");
            setInterlockSeguridad(solicitud.interlock === 1 ? "SÍ" : "NO");
            setResponsable(responsableId);
            setRiesgo(String(solicitud.riesgo || ""));
            setProbabilidad(solicitud.probabilidad || "");
            setImpacto(solicitud.impacto || "");
            setSolicitante(solicitanteId || user?.id || "");
            console.log("Valor establecido para solicitante:", solicitanteId || user?.id || "");
            setNivelRiesgo(solicitud.nivelRiesgo || "DESCONOCIDO");
            setAprobador(solicitud.aprobador || "");
            setTipoGrupoA(solicitud.grupoA || "");
            const fecha = solicitud.fechaFinPlanificada ? new Date(solicitud.fechaFinPlanificada) : null;
            const formattedFecha = fecha
              ? `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(
                  fecha.getDate()
                ).padStart(2, "0")}T${String(fecha.getHours()).padStart(2, "0")}:${String(
                  fecha.getMinutes()
                ).padStart(2, "0")}`
              : "";
            console.log("FechaFinPlanificada formateada:", formattedFecha);
            setFechaFinPlanificada(formattedFecha);
            setDataLoaded(true);
          } else {
            setError("No se encontraron datos para la solicitud.");
            setPopoverMessage("No se encontraron datos para la solicitud.");
            setPopoverType("error");
            setShowPopover(true);
          }
        } catch (error: any) {
          console.error("Error al cargar datos de la solicitud:", error);
          setError(`Error al cargar los datos: ${error.message}`);
          setPopoverMessage(`Error al cargar los datos: ${error.message}`);
          setPopoverType("error");
          setShowPopover(true);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchSolicitudData();
  }, [id, user, dataLoaded]);

  // Log para depurar cambios en solicitante
  useEffect(() => {
    console.log("Estado de solicitante actualizado:", solicitante);
  }, [solicitante]);

  const nextStep = () => {
    console.log("Estado actual antes de avanzar:", {
      tagPrefijo,
      tagCentro,
      tagSubfijo,
      descripcion,
      disciplina,
      turno,
      circuito,
      interlockSeguridad,
      responsable,
      riesgo,
      probabilidad,
      impacto,
      solicitante,
      aprobador,
      tipoGrupoA,
      fechaFinPlanificada,
      usuario: user?.id ?? "0",
    });

    if (!isStepValid(currentStep)) {
      let errorMessage = "";
      switch (currentStep) {
        case 1:
          errorMessage =
            "Por favor, complete todos los campos requeridos en el Paso 1 (Tag, Descripción, Disciplina, Circuito, Turno, Tag Subfijo).";
          break;
        case 2:
          errorMessage =
            "Por favor, complete todos los campos requeridos en el Paso 2 (Interlock, Responsable, Riesgo, Probabilidad, Impacto, Solicitante).";
          break;
        case 3:
          errorMessage = "Por favor, seleccione un aprobador y una fecha de ejecución en el Paso 3.";
          break;
      }
      setError(errorMessage);
      setPopoverMessage(errorMessage);
      setPopoverType("error");
      setShowPopover(true);
      return;
    }

    setError(null);
    setShowPopover(false);

    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      if (confirm("¿Está seguro de que desea enviar la solicitud?")) {
        setIsSubmitting(true);
        const method = id ? "PUT" : "POST";
        const body = {
          id: id || undefined,
          circuito,
          tagPrefijo,
          tagCentro,
          tagSufijo: tagSubfijo.toUpperCase(),
          descripcion,
          disciplina,
          turno,
          interlockSeguridad,
          responsable,
          riesgo,
          probabilidad,
          impacto,
          solicitante,
          aprobador,
          grupoA: tipoGrupoA,
          usuario: user?.id ?? "0",
          fechaFinPlanificada,
        };
        console.log("Enviando solicitud con body:", body);
        fetch("/api/solicitudes/forzado", {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
          .then(async (response) => {
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(
                `Error al enviar la solicitud: ${response.status} - ${errorData.message || "Sin mensaje de error"}`
              );
            }
            return response.json();
          })
          .then((data) => {
            console.log("Respuesta de la API:", data);
            if (data.success) {
              setPopoverMessage("Solicitud de forzado enviada exitosamente");
              setPopoverType("success");
              setShowPopover(true);
              setTimeout(() => {
                router.push("/dashboard/consultas");
              }, 2000);
            } else {
              setPopoverMessage(`Error al enviar la solicitud: ${data.message || "Sin mensaje de error"}`);
              setPopoverType("error");
              setShowPopover(true);
            }
          })
          .catch((error) => {
            console.error("Error en fetch:", error);
            setPopoverMessage(`Error al enviar la solicitud: ${error.message}`);
            setPopoverType("error");
            setShowPopover(true);
          })
          .finally(() => setIsSubmitting(false));
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const renderStep = () => {
    if (id) {
      switch (currentStep) {
        case 1:
          return (
            <EditStepOne
              tagPrefijo={tagPrefijo}
              setTagPrefijo={setTagPrefijo}
              tagCentro={tagCentro}
              setTagCentro={setTagCentro}
              tagSubfijo={tagSubfijo}
              setTagSubfijo={setTagSubfijo}
              descripcion={descripcion}
              setDescripcion={setDescripcion}
              disciplina={disciplina}
              setDisciplina={setDisciplina}
              circuito={circuito}
              setCircuito={setCircuito}
              setTurnoVigente={setTurno}
            />
          );
        case 2:
          console.log("Valor de responsable pasado a EditStepTwo:", responsable);
          console.log("Valor de solicitante pasado a EditStepTwo:", solicitante);
          return (
            <EditStepTwo
              interlockSeguridad={interlockSeguridad}
              setInterlockSeguridad={setInterlockSeguridad}
              responsable={responsable}
              setResponsable={setResponsable}
              riesgo={riesgo}
              setRiesgo={setRiesgo}
              probabilidad={probabilidad}
              setProbabilidad={setProbabilidad}
              impacto={impacto}
              setImpacto={setImpacto}
              solicitante={solicitante}
              setSolicitante={setSolicitante}
              nivelRiesgo={nivelRiesgo}
              setNivelRiesgo={setNivelRiesgo}
              tagPrefijo={tagPrefijo}
              tagCentro={tagCentro}
              tagSufijo={tagSubfijo}
            />
          );
        case 3:
          return (
            <EditStepThree
              aprobador={aprobador}
              setAprobador={setAprobador}
              tipoGrupoA={tipoGrupoA}
              setTipoGrupoA={setTipoGrupoA}
              interlockSeguridad={interlockSeguridad}
              nivelRiesgo={nivelRiesgo}
              solicitante={solicitante}
              riesgo={riesgo}
              fechaFinPlanificada={fechaFinPlanificada}
              setFechaFinPlanificada={setFechaFinPlanificada}
              grupoId={grupoId}
              turno={turno}
            />
          );
        default:
          return null;
      }
    } else {
      switch (currentStep) {
        case 1:
          return (
            <StepOne
              tagPrefijo={tagPrefijo}
              setTagPrefijo={setTagPrefijo}
              tagCentro={tagCentro}
              setTagCentro={setTagCentro}
              tagSubfijo={tagSubfijo}
              setTagSubfijo={setTagSubfijo}
              descripcion={descripcion}
              setDescripcion={setDescripcion}
              disciplina={disciplina}
              setDisciplina={setDisciplina}
              circuito={circuito}
              setCircuito={setCircuito}
              setTurnoVigente={setTurno}
            />
          );
        case 2:
          return (
            <StepTwo
              interlockSeguridad={interlockSeguridad}
              setInterlockSeguridad={setInterlockSeguridad}
              responsable={responsable}
              setResponsable={setResponsable}
              riesgo={riesgo}
              setRiesgo={setRiesgo}
              probabilidad={probabilidad}
              setProbabilidad={setProbabilidad}
              impacto={impacto}
              setImpacto={setImpacto}
              solicitante={solicitante}
              setSolicitante={setSolicitante}
              nivelRiesgo={nivelRiesgo}
              setNivelRiesgo={setNivelRiesgo}
              tagPrefijo={tagPrefijo}
              tagCentro={tagCentro}
              tagSufijo={tagSubfijo}
            />
          );
        case 3:
          return (
            <StepThree
              aprobador={aprobador}
              setAprobador={setAprobador}
              tipoGrupoA={tipoGrupoA}
              setTipoGrupoA={setTipoGrupoA}
              interlockSeguridad={interlockSeguridad}
              nivelRiesgo={nivelRiesgo}
              solicitante={solicitante}
              riesgo={riesgo}
              fechaFinPlanificada={fechaFinPlanificada}
              setFechaFinPlanificada={setFechaFinPlanificada}
              grupoId={grupoId}
              turno={turno}
            />
          );
        default:
          return null;
      }
    }
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return tagPrefijo && tagCentro && tagSubfijo && descripcion && disciplina && circuito && turno;
      case 2:
        return interlockSeguridad && responsable && riesgo && probabilidad && impacto && solicitante;
      case 3:
        return aprobador && fechaFinPlanificada && (!id || tipoGrupoA);
      default:
        return false;
    }
  };

  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-xl">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-4">
          {!id ? "Creación solicitud de forzado" : "Modificación de solicitud de forzado"}
        </h1>

        {isLoading ? (
          <div className="text-center text-gray-500">Cargando datos de la solicitud...</div>
        ) : error ? (
          <div className="text-center text-red-600">{error}</div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-8">
              <div className="relative flex-1 flex justify-center items-center">
                <button
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className={`absolute left-[-1px] transform ${
                    currentStep === 1 ? "opacity-0" : "opacity-100"
                  } transition-opacity duration-200`}
                >
                  <FaArrowLeft className="text-blue-500 text-2xl" />
                </button>

                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center justify-center relative">
                    <div
                      className={`flex items-center justify-center w-14 h-14 rounded-full border-4 transition-all duration-300 ${
                        step.id < currentStep
                          ? "bg-blue-600 text-white border-blue-600"
                          : step.id === currentStep
                          ? "bg-blue-500 text-white border-blue-500"
                          : "bg-gray-200 text-gray-400 border-gray-300"
                      }`}
                    >
                      <span>{step.id}</span>
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`w-20 h-1 rounded-full ${step.id < currentStep ? "bg-blue-600" : "bg-gray-300"}`}
                      ></div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>{renderStep()}</div>

            <div className="flex justify-center mt-10 space-x-6">
              <button
                onClick={nextStep}
                disabled={!isStepValid(currentStep) || isSubmitting}
                className={`px-6 py-3 text-white rounded-md flex items-center gap-2 ${
                  !isStepValid(currentStep) || isSubmitting
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    <span>Enviando...</span>
                  </>
                ) : currentStep === steps.length ? (
                  <span>Realizar Solicitud</span>
                ) : (
                  <>
                    Continuar
                    <span className="ml-2 text-lg">→</span>
                  </>
                )}
              </button>
            </div>
            <Popover message={popoverMessage} type={popoverType} show={showPopover} className="z-50" />
          </>
        )}
      </div>
    </Suspense>
  );
};

export const dynamic = "force-dynamic";
export default ForcedRegistration;