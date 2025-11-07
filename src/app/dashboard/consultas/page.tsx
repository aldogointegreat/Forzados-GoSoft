
"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { useRouter } from "next/navigation";
import { Search, Calendar, X } from "lucide-react";
import Popover from "@/components/Popover";
import { FaEye, FaEdit, FaPlay, FaCheck, FaArrowDown } from "react-icons/fa";
import useUserSession from "@/hooks/useSession";
import Modals from "@/components/Modals";
import ModalAprobacionRechazo from "@/components/ModalAprobacionRechazo";
import ModalCambioPassword from "@/components/ModalCambioPassword";
import Select from "react-select";
import { solicitantes, aprobadores, ejecutores, administradores } from "@/hooks/rolesPermitidos";

type Status =
  | "RECHAZADO-FORZADO"
  | "PENDIENTE-FORZADO"
  | "APROBADO-FORZADO"
  | "EJECUTADO-FORZADO"
  | "RECHAZADO"
  | "PENDIENTE-RETIRO"
  | "APROBADO-RETIRO"
  | "EJECUTADO-RETIRO"
  | "FINALIZADO";

export interface Row {
  id: number;
  nombre: string;
  area: string;
  solicitante: string;
  estado: Status;
  fecha: string;
  fechaModificacion: string;
  fechaCreacion: string;
  fechaCierre?: string;
  tipo: string;
  aprobador: string;
  ejecutor: string;
  subareaCodigo: string;
  grupoNombre: string;
  tagCentroCodigo: string;
  tagsufijo: string;
  tagConcat: string;
  disciplinaDescripcion: string;
  turnoDescripcion: string;
  interlockdesc: string;
  responsableNombre: string;
  riesgoaDescripcion: string;
  probabilidadDescripcion: string;
  impactoDescripcion: string;
  riesgoDescripcion: string;
  solicitanteAId: number;
  aprobadorAId: number;
  ejecutorAId: number;
  solicitanteBId: number;
  aprobadorBId: number;
  ejecutorBId: number;
  interlock: number;
  observadoEjecucion: boolean;
  Grupo_A: number | undefined; // Actualizado para reflejar solo undefined como posibilidad
  [key: string]: string | number | boolean | undefined | null;
}

const Page: React.FC = () => {
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>();
  const [selectedSolicitante, setSelectedSolicitante] = useState("");
  const [selectedEstado, setSelectedEstado] = useState<Status | "">("");
  const [selectedEtapa, setSelectedEtapa] = useState<"" | "NO INICIADO" | "ABIERTO" | "CERRADO">("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<Row | null>(null);
  const [selectedArea, setSelectedArea] = useState<string | "">("");
  const [selectedTipo, setSelectedTipo] = useState<string | "">("");
  const [selectedAprobador, setSelectedAprobador] = useState<string | "">("");
  const [selectedEjecutor, setSelectedEjecutor] = useState<string | "">("");
  const [selectedGrupo, setSelectedGrupo] = useState<string | null>("");
  const [selectedsubareaCodigo, setSelectedsubareaCodigo] = useState<string | null>("");
  const [selectedTagCentro, setSelectedTagCentro] = useState<string | null>("");
  const [selectedTagSufijo, setSelectedTagSufijo] = useState<string | null>("");
  const [selectedTagConcat, setSelectedTagConcat] = useState<string | null>("");
  const [selectedDisciplina, setSelectedDisciplina] = useState<string | null>("");
  const [selectedTurno, setSelectedTurno] = useState<string | null>("");
  const [selectedInterlock, setSelectedInterlock] = useState<string | null>("");
  const [selectedResponsable, setSelectedResponsable] = useState<string | null>("");
  const [selectedRiesgoA, setSelectedRiesgoA] = useState<string | null>("");
  const [selectedProbabilidad, setSelectedProbabilidad] = useState<string | null>("");
  const [selectedImpacto, setSelectedImpacto] = useState<string | null>("");
  const [selectedNivelRiesgo, setSelectedNivelRiesgo] = useState<string | null>("");

  const [rows, setRows] = useState<Row[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [popoverMessage, setPopoverMessage] = useState("");
  const [popoverType, setPopoverType] = useState<"success" | "error">("success");
  const [showPopover, setShowPopover] = useState(false);
  const [isExecuteModalOpen, setIsExecuteModalOpen] = useState(false);
  const [executeDate, setExecuteDate] = useState("");
  const [selectedExecuteRow, setSelectedExecuteRow] = useState<Row | null>(null);
  const [executeFiles, setExecuteFiles] = useState<File[]>([null, null, null]);
  const [, setDragActive] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedEndDate, setSelectedEndDate] = useState<string | "">("");
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [selectedApprovalRow, setSelectedApprovalRow] = useState<Row | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const [isObserveModalOpen, setIsObserveModalOpen] = useState(false);
  const [observationText, setObservationText] = useState("");

  const router = useRouter();
  const { user, shouldShowPasswordModal } = useUserSession();
  const usuariosEjecutores = ejecutores;
  const usuariosSolicitantes = solicitantes;
  const usuariosAprobadores = aprobadores;
  const usuariosAdministradores = administradores;

  // Fetch user data if not available on mount
  /*   useEffect(() => {
    if (!user) {
      fetchUserFromServer("1").then((success) => {
        if (!success) console.error("Failed to fetch user data on page load");
      });
    }
  }, [user, fetchUserFromServer]); */

  const uniqueAreas = Array.from(new Set(rows.map((row) => row.area)));
  const uniqueSolicitantes = Array.from(new Set(rows.map((row) => row.solicitante)));
  const uniqueEstados = Array.from(new Set(rows.map((row) => row.estado)));
  const uniqueEtapas = Array.from(new Set(rows.map((row) => row.etapa)));
  const uniqueAprobadores = Array.from(new Set(rows.map((row) => row.aprobador)));
  const uniqueGrupos = useMemo(() => Array.from(new Set(rows.map((row) => row.grupoNombre || "Sin Grupo"))), [rows]);
  const uniquesubareaCodigo = Array.from(new Set(rows.map((row) => row.subareaCodigo)));
  const uniqueTagCentro = Array.from(new Set(rows.map((row) => row.tagCentroCodigo || "Sin Centro")));
  const uniqueTagSufijo = Array.from(new Set(rows.map((row) => row.tagsufijo || "Sin Sufijo")));
  const uniqueTagConcat = Array.from(new Set(rows.map((row) => row.tagConcat || "Sin Tag")));
  const uniqueDisciplina = Array.from(new Set(rows.map((row) => row.disciplinaDescripcion || "Sin Disciplina")));
  const uniqueTurno = Array.from(new Set(rows.map((row) => row.turnoDescripcion || "Sin Turno")));
  const uniqueInterlock = Array.from(new Set(rows.map((row) => row.interlockdesc || "Sin Interlock")));
  const uniqueResponsable = Array.from(new Set(rows.map((row) => row.responsableNombre || "Sin Responsable")));
  const uniqueRiesgoA = Array.from(new Set(rows.map((row) => row.riesgoaDescripcion || "Sin Riesgo")));
  const uniqueProbabilidad = Array.from(new Set(rows.map((row) => row.probabilidadDescripcion || "Sin Probabilidad")));
  const uniqueImpacto = Array.from(new Set(rows.map((row) => row.impactoDescripcion || "Sin Impacto")));
  const uniqueNivelRiesgo = Array.from(new Set(rows.map((row) => row.riesgoDescripcion || "Sin Nivel")));

  const columns = [
    { key: "rowNumber", label: "N°", width: "w-16" },
    { key: "acciones", label: "Acciones", width: "w-32" },
    { key: "id", label: "ID", width: "w-16" },
    { key: "fecha", label: "Fecha Creación", filterable: false, width: "w-36", minWidth: "min-w-42" },
    { key: "fechaCierre", label: "Fecha Cierre", filterable: false, width: "w-36", minWidth: "min-w-42" },
    { key: "etapa", label: "Etapa", filterable: true, options: uniqueEtapas, width: "w-24", minWidth: "min-w-[128px]" },
    { key: "estado", label: "Estado", filterable: true, options: uniqueEstados, width: "w-36" },
    { key: "observadoEjecucion", label: "Reiniciado", width: "w-28" },
    { key: "subareaCodigo", label: "Tag prefijo", filterable: true, options: uniquesubareaCodigo, width: "w-36", minWidth: "min-w-[128px]" },
    { key: "tagCentroCodigo", label: "Tag centro", filterable: true, options: uniqueTagCentro, width: "w-36", minWidth: "min-w-[128px]" },
    { key: "tagsufijo", label: "Tag sufijo", filterable: true, options: uniqueTagSufijo, width: "w-36", minWidth: "min-w-[128px]" },
    { key: "tagConcat", label: "Tag concatenado", filterable: true, options: uniqueTagConcat, width: "w-40", minWidth: "min-w-[156px]" },
    { key: "nombre", label: "Descripción", width: "w-36", minWidth: "min-w-[528px]" },
    { key: "disciplinaDescripcion", label: "Disciplina", filterable: true, options: uniqueDisciplina, width: "w-36" },
    { key: "turnoDescripcion", label: "Turno", filterable: true, options: uniqueTurno, width: "w-28" },
    { key: "interlockdesc", label: "Interlock de seguridad", filterable: true, options: uniqueInterlock, width: "w-28", minWidth: "min-w-[256px]" },
    { key: "responsableNombre", label: "Responsable", filterable: true, options: uniqueResponsable, width: "w-40" },
    { key: "riesgoaDescripcion", label: "Riesgo a", filterable: true, options: uniqueRiesgoA, width: "w-32" },
    { key: "probabilidadDescripcion", label: "Probabilidad", filterable: true, options: uniqueProbabilidad, width: "w-32" },
    { key: "impactoDescripcion", label: "Impacto", filterable: true, options: uniqueImpacto, width: "w-32", minWidth: "min-w-[180px]" },
    { key: "riesgoDescripcion", label: "Nivel de Riesgo", filterable: true, options: uniqueNivelRiesgo, width: "w-50", minWidth: "min-w-[154px]" },
    { key: "area", label: "Área", filterable: true, options: uniqueAreas, width: "w-36", minWidth: "min-w-[180px]" },
    { key: "solicitante", label: "Solicitante", filterable: true, options: uniqueSolicitantes, width: "w-40", minWidth: "min-w-[180px]" },
    { key: "aprobador", label: "Aprobador", filterable: true, options: uniqueAprobadores, width: "w-40", minWidth: "min-w-[180px]" },
    { key: "grupoNombre", label: "Grupo de ejecución", filterable: true, options: uniqueGrupos, width: "w-36", minWidth: "min-w-[180px]" },
  ];

  const formatDate = (dateString?: string | null): string => {
    if (!dateString) return "N/A";
    const [datePart, timePart] = dateString.split("T");
    if (!datePart || !timePart) return "N/A";
    const [year, month, day] = datePart.split("-");
    const [hour, minute] = timePart.split(":");
    return `${day}/${month}/${year.slice(2)} ${hour}:${minute}`;
  };

const fetchData = useCallback(async () => {
  setIsLoading(true);
  setError(null);
  try {
    const response = await fetch("/api/solicitudes/forzado");
    const result = await response.json();
    console.log("API response structure:", result.data);
    if (result.success) {
      const uniqueData = result.data.reduce((acc: Row[], row: Row) => {
        if (!acc.some((item) => item.id === row.id)) {
          acc.push({
            ...row,
            fecha: formatDate(row.fechaCreacion),
            fechaCierre: row.fechaCierre ? formatDate(row.fechaCierre) : "Sin Fecha",
            tipo: row.estado.includes("FORZADO") ? "forzado" : "retiro",
            grupoNombre: row.grupoNombre || "Sin Grupo",
            subareaCodigo: row.subareaCodigo || "Sin Sub Area",
            tagCentroCodigo: row.tagCentroCodigo || "Sin Centro",
            tagsufijo: row.tagsufijo || "Sin Sufijo",
            tagConcat: row.tagConcat || "Sin Tag",
            disciplinaDescripcion: row.disciplinaDescripcion || "Sin Disciplina",
            turnoDescripcion: row.turnoDescripcion || "Sin Turno",
            interlockdesc: row.interlockdesc || "Sin Interlock",
            responsableNombre: row.responsableNombre || "Sin Responsable",
            riesgoaDescripcion: row.riesgoaDescripcion || "Sin Riesgo",
            probabilidadDescripcion: row.probabilidadDescripcion || "Sin Probabilidad",
            impactoDescripcion: row.impactoDescripcion || "Sin Impacto",
            riesgoDescripcion: row.riesgoDescripcion || "Sin Nivel",
            etapa: computeEtapa(row.estado as Status),
            Grupo_A: row.Grupo_A, // Cambiado a Grupo_A para coincidir con la API
          });
        }
        return acc;
      }, []);

      const formattedData = uniqueData.sort(
        (a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()
      );

      setRows(formattedData);
      console.log("Loaded data with Grupo_A:", formattedData.map(row => ({ id: row.id, Grupo_A: row.Grupo_A })));
    } else {
      setError(result.message);
    }
  } catch (err) {
    setError("Error al cargar los datos. Por favor, intente nuevamente.");
    console.error(err);
  } finally {
    setIsLoading(false);
  }
}, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const [rejectReasons, setRejectReasons] = useState<{ id: number; descripcion: string; tipo: string }[]>([]);

  useEffect(() => {
    const fetchRejectReasons = async () => {
      try {
        const response = await fetch("/api/maestras/motivo-rechazo");
        const result = await response.json();
        if (result.success) {
          setRejectReasons(result.values);
        } else {
          setError(result.message);
        }
      } catch {
        setError("Error al cargar los motivos de rechazo. Por favor, intente nuevamente.");
      }
    };

    fetchRejectReasons();
  }, []);

  const validateRol = (array: number[]) => {
    return user && Object.keys(user?.roles || {}).some((element) => array.includes(Number(element)));
  };

  useEffect(() => {
    const checkPasswordModal = async () => {
      console.log(`[CONSULTAS-PAGE] 🔍 useEffect ejecutado para verificar modal`);
      console.log(`[CONSULTAS-PAGE] 👤 Usuario:`, { 
        name: user?.name, 
        id: user?.id, 
        flagNuevoIngreso: user?.flagNuevoIngreso 
      });
      
      if (user && user.flagNuevoIngreso === "1") {
        console.log(`[CONSULTAS-PAGE] ✅ Usuario tiene flag nuevo ingreso, verificando si mostrar modal...`);
        const shouldShow = await shouldShowPasswordModal();
        console.log(`[CONSULTAS-PAGE] 🎯 Resultado: ${shouldShow ? 'MOSTRAR' : 'NO MOSTRAR'} modal`);
        setIsPasswordModalOpen(shouldShow);
      } else {
        console.log(`[CONSULTAS-PAGE] ❌ No verificar modal: ${!user ? 'No hay usuario' : 'Flag no es "1"'}`);
        setIsPasswordModalOpen(false);
      }
    };
    
    checkPasswordModal();
  }, [user, shouldShowPasswordModal]);

  const filteredRows = useMemo(() => {
    console.log("Filtrando con selectedTipo:", selectedTipo);
    return rows.filter((row) => {
      const rowDate = new Date(row.fechaCreacion);
      row.observadoEjecucion = !!row.observadoEjecucion;

      const isWithinDateRange = (!selectedRange?.from || rowDate >= selectedRange.from) &&
                               (!selectedRange?.to || rowDate <= new Date(selectedRange.to.getTime() + 86400000));
      const matchesSolicitante = selectedSolicitante ?
                                row.solicitante.toLowerCase().includes(selectedSolicitante.toLowerCase()) : true;
      const matchesEstado = selectedEstado ? row.estado === selectedEstado : true;
      const matchesEtapa = selectedEtapa ? row.etapa === selectedEtapa : true;
      const matchesArea = selectedArea ? row.area === selectedArea : true;
      const matchesTipo = selectedTipo ?
                         row.tipo.toLowerCase() === selectedTipo.toLowerCase() : true;
      const matchesAprobador = selectedAprobador ?
                              row.aprobador.toLowerCase().includes(selectedAprobador.toLowerCase()) : true;
      const matchesEjecutor = selectedEjecutor ?
                             row.ejecutor.toLowerCase().includes(selectedEjecutor.toLowerCase()) : true;
      const matchesGrupo = selectedGrupo ?
                          (row.grupoNombre || "Sin Grupo").toLowerCase() === selectedGrupo.toLowerCase() : true;
      const matchesSubarea = selectedsubareaCodigo ?
                            (row.subareaCodigo || "Sin Sub Area").toLowerCase() === selectedsubareaCodigo.toLowerCase() : true;
      const matchesTagCentro = selectedTagCentro ?
                            (row.tagCentroCodigo || "Sin Centro").toLowerCase() === selectedTagCentro.toLowerCase() : true;
      const matchesTagSufijo = selectedTagSufijo ?
                            (row.tagsufijo || "Sin Sufijo").toLowerCase() === selectedTagSufijo.toLowerCase() : true;
      const matchesTagConcat = selectedTagConcat ?
                            (row.tagConcat || "Sin Tag").toLowerCase() === selectedTagConcat.toLowerCase() : true;
      const matchesDisciplina = selectedDisciplina ?
                            (row.disciplinaDescripcion || "Sin Disciplina").toLowerCase() === selectedDisciplina.toLowerCase() : true;
      const matchesTurno = selectedTurno ?
                        (row.turnoDescripcion || "Sin Turno").toLowerCase() === selectedTurno.toLowerCase() : true;
      const matchesInterlock = selectedInterlock ?
                            (row.interlockdesc || "Sin Interlock").toLowerCase() === selectedInterlock.toLowerCase() : true;
      const matchesResponsable = selectedResponsable ?
                              (row.responsableNombre || "Sin Responsable").toLowerCase() === selectedResponsable.toLowerCase() : true;
      const matchesRiesgoA = selectedRiesgoA ?
                          (row.riesgoaDescripcion || "Sin Riesgo").toLowerCase() === selectedRiesgoA.toLowerCase() : true;
      const matchesProbabilidad = selectedProbabilidad ?
                               (row.probabilidadDescripcion || "Sin Probabilidad").toLowerCase() === selectedProbabilidad.toLowerCase() : true;
      const matchesImpacto = selectedImpacto ?
                          (row.impactoDescripcion || "Sin Impacto").toLowerCase() === selectedImpacto.toLowerCase() : true;
      const matchesNivelRiesgo = selectedNivelRiesgo ?
                              (row.riesgoDescripcion || "Sin Nivel").toLowerCase() === selectedNivelRiesgo.toLowerCase() : true;
      console.log("groupId:", user.groupId, "row.grupo_A:", row.grupo_A);
      console.log("Row tipo:", row.tipo, "Matches tipo:", matchesTipo);
      console.log("Estado:", row.estado, "Grupo_A:", row.grupo_A, "User GroupId:", user.groupId, "Roles:", user.roles);
      return isWithinDateRange && matchesSolicitante && matchesEstado && matchesEtapa &&
             matchesArea && matchesTipo && matchesAprobador && matchesEjecutor &&
             matchesGrupo && matchesSubarea && matchesTagCentro && matchesTagSufijo && matchesTagConcat && matchesDisciplina && matchesTurno && matchesInterlock &&
             matchesResponsable && matchesRiesgoA && matchesProbabilidad && matchesImpacto &&
             matchesNivelRiesgo;
    });
  }, [rows, selectedRange, selectedSolicitante, selectedEstado, selectedEtapa, selectedArea,
    selectedTipo, selectedAprobador, selectedEjecutor, selectedGrupo,
    selectedsubareaCodigo, selectedTagCentro, selectedTagSufijo,
    selectedTagConcat, selectedDisciplina, selectedTurno, selectedInterlock,
    selectedResponsable, selectedRiesgoA, selectedProbabilidad, selectedImpacto,
    selectedNivelRiesgo]);

  const sortedRows = useMemo(() => {
    if (!sortConfig) return filteredRows;
    return [...filteredRows].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredRows, sortConfig]);

  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return sortedRows.slice(startIndex, endIndex);
  }, [sortedRows, currentPage]);

  const totalPages = Math.ceil(sortedRows.length / rowsPerPage);

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const handleView = (id: number) => {
    const row = rows.find((row) => row.id === id);
    if (row) {
      setSelectedRow(row);
      setIsModalOpen(true);
    }
  };

  const closeModalBaja = () => {
    setIsModalOpen(false);
    setSelectedRow(null);
    fetchData();
    setShowPopover(true);
    setTimeout(() => setShowPopover(false), 3000);
  };

  const handleEdit = (id: number, estado: Status) => {
    if (estado === "PENDIENTE-RETIRO") {
      router.push(`/dashboard/solicitud-retiro?id=${id}`);
    } else {
      router.push(`/dashboard/solicitud-forzado?id=${id}`);
    }
  };

  const handleDelete = (id: number) => {
    router.push(`/dashboard/solicitud-retiro?id=${id}`);
  };

  const handleClearFilters = () => {
    setSelectedRange(undefined);
    setSelectedSolicitante("");
    setSelectedEstado("");
    setSelectedEtapa("");
    setSelectedArea("");
    setSelectedEndDate("");
    setSelectedAprobador("");
    setSelectedEjecutor("");
    setSelectedTipo("");
    setSelectedGrupo("");
    setSelectedsubareaCodigo("");
    setSelectedTagCentro("");
    setSelectedTagSufijo("");
    setSelectedTagConcat("");
    setSelectedDisciplina("");
    setSelectedTurno("");
    setSelectedInterlock("");
    setSelectedResponsable("");
    setSelectedRiesgoA("");
    setSelectedProbabilidad("");
    setSelectedImpacto("");
    setSelectedNivelRiesgo("");
    setSortConfig(null);
    setCurrentPage(1);
  };

  const areFiltersApplied = useMemo(() => {
    return selectedRange || selectedSolicitante || selectedEstado || selectedEtapa || selectedArea ||
           selectedEndDate || selectedAprobador || selectedEjecutor || selectedTipo ||
           selectedGrupo || selectedsubareaCodigo || selectedTagCentro ||
           selectedTagSufijo || selectedTagConcat || selectedDisciplina ||
           selectedTurno || selectedInterlock || selectedResponsable ||
           selectedRiesgoA || selectedProbabilidad || selectedImpacto ||
           selectedNivelRiesgo || sortConfig;
  }, [selectedRange, selectedSolicitante, selectedEstado, selectedEtapa, selectedArea,
    selectedEndDate, selectedAprobador, selectedEjecutor, selectedTipo,
    selectedGrupo, selectedsubareaCodigo, selectedTagCentro,
    selectedTagSufijo, selectedTagConcat, selectedDisciplina,
    selectedTurno, selectedInterlock, selectedResponsable,
    selectedRiesgoA, selectedProbabilidad, selectedImpacto,
    selectedNivelRiesgo, sortConfig]);

  const getStatusClass = (estado: string) => {
    if (estado.includes("PENDIENTE")) return "bg-[#FBBC04] text-white";
    if (estado.includes("APROBADO")) return "bg-[#6099F6] text-white";
    if (estado.includes("EJECUTADO")) return "bg-[#EA4335] text-white font-bold";
    if (estado.includes("FINALIZADO")) return "bg-[#4CA154] text-white font-bold";
    if (estado.includes("RECHAZADO")) return "bg-[#F28E86] text-white";
    return "";
  };

  const handleApprove = async (id: number, tipo: string) => {
    if (confirm("¿Está seguro de aprobar?")) {
      try {
        const response = await fetch(`/api/solicitudes/${tipo.toLowerCase()}/aprobar`, {
          method: "POST",
          body: JSON.stringify({ id, usuario: user?.id }),
        });
        if (response.ok) {
          setPopoverMessage("Aprobación exitosa");
          setPopoverType("success");
          fetchData();
          closeModal();
        } else {
          setPopoverMessage("Error al aprobar");
          setPopoverType("error");
        }
      } catch {
        setPopoverMessage("Error al aprobar");
        setPopoverType("error");
      } finally {
        setShowPopover(true);
        setTimeout(() => setShowPopover(false), 3000);
      }
    }
  };
const handleExecute = async (id: number) => {
  const row = rows.find((row) => row.id === id);
  if (row && user) {
    console.log("Row Grupo_A:", row.grupo_A, "User groupId:", user.groupId);
    if (
      (validateRol(usuariosEjecutores) && user.groupId && Array.isArray(user.groupId) ? user.groupId.includes(row.grupo_A) : user.groupId === row.grupo_A) 
  
    ) {
      console.log("Debug - handleExecute:", {
        rowId: row.id,
        rowGrupo_A: row.grupo_A,
        userGroupId: user.groupId,
        isExecutor: validateRol(usuariosEjecutores),
        isAdmin: validateRol(usuariosAdministradores),
      });
      openExecuteModal(row);
    } else {
      console.log("Usuario no autorizado para ejecutar esta acción");
      setPopoverMessage("No tienes permiso para ejecutar esta acción");
      setPopoverType("error");
      setShowPopover(true);
      setTimeout(() => setShowPopover(false), 3000);
    }
  }
};
  const openExecuteModal = (row: Row) => {
    setSelectedExecuteRow(row);
    setIsExecuteModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsExecuteModalOpen(false);
    setSelectedRow(null);
  };

  const closeExecuteModal = () => {
    setIsExecuteModalOpen(false);
    setSelectedExecuteRow(null);
    setExecuteDate("");
    fetchData();
    setShowPopover(true);
    setTimeout(() => setShowPopover(false), 3000);
  };

  const handleExecuteConfirm = async (tipo: string, tipoForzado: string) => {
    if (!executeDate || !tipoForzado) {
      setPopoverMessage("Por favor, ingrese la fecha y el tipo de forzado");
      setPopoverType("error");
      setShowPopover(true);
      setTimeout(() => setShowPopover(false), 3000);
      return;
    }
    if (confirm("¿Está seguro de ejecutar?")) {
      try {
        const formData = new FormData();
        formData.append("id", selectedExecuteRow?.id.toString() || "");
        formData.append("fechaEjecucion", executeDate);
        formData.append("usuario", user?.id.toString() || "");
        formData.append("tipoForzado", tipoForzado);
        executeFiles.forEach((file, index) => {
          if (file) formData.append(`file${index + 1}`, file);
        });

        const response = await fetch(`/api/solicitudes/${tipo.toLowerCase()}/ejecutar`, {
          method: "POST",
          body: formData,
        });
        if (response.ok) {
          setPopoverMessage("Ejecución exitosa");
          setPopoverType("success");
          fetchData();
          closeExecuteModal();
          setExecuteFiles([null, null, null]);
        } else {
          setPopoverMessage("Error al ejecutar");
          setPopoverType("error");
        }
      } catch {
        setPopoverMessage("Error al ejecutar");
        setPopoverType("error");
      } finally {
        setShowPopover(true);
        setTimeout(() => setShowPopover(false), 3000);
      }
    }
  };

  const openRejectModal = () => {
    if (selectedApprovalRow) setSelectedRow(selectedApprovalRow);
    setIsRejectModalOpen(true);
    setIsApprovalModalOpen(false);
  };

  const closeRejectModal = () => {
    setIsRejectModalOpen(false);
    setRejectReason("");
    fetchData();
    setShowPopover(true);
    setTimeout(() => setShowPopover(false), 3000);
  };

  const handleRejectConfirm = async (id: number, tipo: string) => {
    if (!rejectReason) {
      setPopoverMessage("Por favor, ingrese el motivo del rechazo");
      setPopoverType("error");
      setShowPopover(true);
      setTimeout(() => setShowPopover(false), 3000);
      return;
    }
    if (confirm("¿Está seguro de rechazar?")) {
      try {
        const response = await fetch(`/api/solicitudes/${tipo.toLowerCase()}/rechazar`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, motivoRechazo: rejectReason, usuario: user?.id }),
        });
        if (response.ok) {
          setPopoverMessage("Rechazo exitoso");
          setPopoverType("success");
          closeRejectModal();
          closeModal();
          fetchData();
        } else {
          setPopoverMessage("Error al rechazar");
          setPopoverType("error");
        }
      } catch {
        setPopoverMessage("Error al rechazar");
        setPopoverType("error");
      } finally {
        setShowPopover(true);
        setTimeout(() => setShowPopover(false), 3000);
      }
    }
  };

  const handleReject = async (id: number, tipo: string) => {
    if (confirm("¿Está seguro de rechazar?")) {
      try {
        const response = await fetch(`/api/solicitudes/${tipo.toLowerCase()}/rechazar`, {
          method: "POST",
          body: JSON.stringify({ id, usuario: user?.id }),
        });
        if (response.ok) {
          setPopoverMessage("Rechazo exitoso");
          setPopoverType("success");
          fetchData();
          closeModal();
        } else {
          setPopoverMessage("Error al rechazar");
          setPopoverType("error");
        }
      } catch {
        setPopoverMessage("Error al rechazar");
        setPopoverType("error");
      } finally {
        setShowPopover(true);
        setTimeout(() => setShowPopover(false), 3000);
      }
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragover");
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = [...executeFiles];
    const file = e.dataTransfer.files?.[0];
    if (file && ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/jpeg", "image/png"].includes(file.type)) {
      files[index] = file;
      setExecuteFiles(files);
    } else {
      alert("Solo se permiten archivos PDF, DOCX, JPG o PNG.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const files = [...executeFiles];
    const file = e.target.files?.[0];
    if (file && ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/jpeg", "image/png"].includes(file.type)) {
      files[index] = file;
      setExecuteFiles(files);
    } else {
      alert("Solo se permiten archivos PDF, DOCX, JPG o PNG.");
    }
  };

  const handleOpenApprovalModal = (row: Row) => {
    setSelectedApprovalRow(row);
    setIsApprovalModalOpen(true);
  };

  const handlePasswordChangeSuccess = () => {
    setPopoverMessage("Cambio de contraseña exitoso");
    setPopoverType("success");
    setShowPopover(true);
    setTimeout(() => setShowPopover(false), 3000);
    setIsPasswordModalOpen(false);
  };

  const handleObserveConfirm = async () => {
    if (!observationText.trim()) {
      setPopoverMessage("Por favor, ingrese una observación");
      setPopoverType("error");
      setShowPopover(true);
      setTimeout(() => setShowPopover(false), 3000);
      return;
    }
    if (confirm("¿Está seguro de enviar la observación?")) {
      try {
        const response = await fetch("/api/solicitudes/retiro/observar-aprobacion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: selectedApprovalRow?.id,
            observarAprobacionretiro: observationText,
            usuario: user?.id,
          }),
        });
        const result = await response.json();
        if (result.success) {
          setPopoverMessage("Observación enviada exitosamente");
          setPopoverType("success");
          fetchData();
          setIsObserveModalOpen(false);
        } else {
          setPopoverMessage("Error al enviar la observación");
          setPopoverType("error");
        }
      } catch {
        setPopoverMessage("Error al enviar la observación");
        setPopoverType("error");
      } finally {
        setShowPopover(true);
        setTimeout(() => setShowPopover(false), 3000);
      }
    }
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case "PENDIENTE-FORZADO": return "FORZADO PENDIENTE";
      case "APROBADO-FORZADO": return "FORZADO APROBADO";
      case "EJECUTADO-FORZADO": return "FORZADO EJECUTADO";
      case "RECHAZADO-FORZADO": return "FORZADO RECHAZADO";
      case "PENDIENTE-RETIRO": return "RETIRO PENDIENTE";
      case "APROBADO-RETIRO": return "RETIRO APROBADO";
      case "EJECUTADO-RETIRO": return "RETIRO EJECUTADO";
      case "RECHAZADO-RETIRO": return "RETIRO RECHAZADO";
      case "FINALIZADO": return "FINALIZADO";
      default: return status;
    }
  };

  const computeEtapa = (estado: Status): "NO INICIADO" | "ABIERTO" | "CERRADO" => {
    if (estado === "FINALIZADO") return "CERRADO";

    if (
      estado === "EJECUTADO-FORZADO" ||
      estado.startsWith("PENDIENTE-RETIRO") ||
      estado.startsWith("APROBADO-RETIRO") ||
      estado.startsWith("EJECUTADO-RETIRO") ||
      estado.startsWith("RECHAZADO-RETIRO")
    ) {
      return "ABIERTO";
    }

    return "NO INICIADO";
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="p-4 min-h-screen">
      <h1 className="text-3xl font-bold mb-2 text-gray-800">Consultas</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Solicitante</label>
            <div className="relative">
              <input
                type="text"
                value={selectedSolicitante}
                onChange={(e) => setSelectedSolicitante(e.target.value)}
                placeholder="Nombre del solicitante"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Aprobador</label>
            <div className="relative">
              <input
                type="text"
                value={selectedAprobador}
                onChange={(e) => setSelectedAprobador(e.target.value)}
                placeholder="Nombre del aprobador"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div className="w-full md:w-auto">
            <label className="block text-xs font-medium text-gray-700 mb-2">Rango de fechas</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="date"
                  value={selectedRange?.from?.toISOString().split("T")[0] || ""}
                  onChange={(e) => setSelectedRange({ from: new Date(e.target.value), to: selectedRange?.to })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  tabIndex={-1}
                  onKeyDown={(e) => e.preventDefault()}
                />
                <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
              <div className="relative flex-1">
                <input
                  type="date"
                  value={selectedRange?.to?.toISOString().split("T")[0] || ""}
                  onChange={(e) => setSelectedRange({ from: selectedRange?.from, to: new Date(e.target.value) })}
                  disabled={!selectedRange?.from}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  tabIndex={-1}
                  onKeyDown={(e) => e.preventDefault()}
                />
                <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>
          <button
            onClick={handleClearFilters}
            className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              areFiltersApplied ? "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500" : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
            disabled={!areFiltersApplied}
            tabIndex={-1}
            onKeyDown={(e) => e.preventDefault()}
          >
            <X className="w-4 h-4 mr-2 inline-block" />
            Limpiar Filtros
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-6" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      {isLoading ? (
        <div className="text-center py-8 text-gray-600">Cargando datos...</div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden mx-4 my-6">
          <div className="relative overflow-x-auto max-w-full max-h-[calc(130vh-210px)]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      scope="col"
                      className={`px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer ${column.width} min-w-[${column.width.replace('w-', '')}px] whitespace-normal`}
                      onClick={() => column.key !== "rowNumber" && handleSort(column.key)}
                    >
                      <div
                        className="flex items-center cursor-pointer"
                        onClick={() => column.key !== "rowNumber" && handleSort(column.key)}
                      >
                        {column.label}
                        {sortConfig?.key === column.key && column.key !== "rowNumber" && (
                          <span className="ml-2 text-sm">
                            {sortConfig.direction === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>
                      {column.filterable && (
                        <div
                          className="mt-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Select
                            options={column.options?.map((option) => ({
                              value: option,
                              label: option,
                            }))}
                            value={
                              column.key === "area" && selectedArea
                                ? { value: selectedArea, label: selectedArea }
                                : column.key === "solicitante" && selectedSolicitante
                                ? { value: selectedSolicitante, label: selectedSolicitante }
                                : column.key === "estado" && selectedEstado
                                ? { value: selectedEstado, label: selectedEstado }
                                : column.key === "etapa" && selectedEtapa
                                ? { value: selectedEtapa, label: selectedEtapa }
                                : column.key === "tipo" && selectedTipo
                                ? { value: selectedTipo, label: selectedTipo }
                                : column.key === "aprobador" && selectedAprobador
                                ? { value: selectedAprobador, label: selectedAprobador }
                                : column.key === "ejecutor" && selectedEjecutor
                                ? { value: selectedEjecutor, label: selectedEjecutor }
                                : column.key === "grupoNombre" && selectedGrupo
                                ? { value: selectedGrupo, label: selectedGrupo }
                                : column.key === "subareaCodigo" && selectedsubareaCodigo
                                ? { value: selectedsubareaCodigo, label: selectedsubareaCodigo }
                                : column.key === "tagCentroCodigo" && selectedTagCentro
                                ? { value: selectedTagCentro, label: selectedTagCentro }
                                : column.key === "tagsufijo" && selectedTagSufijo
                                ? { value: selectedTagSufijo, label: selectedTagSufijo }
                                : column.key === "tagConcat" && selectedTagConcat
                                ? { value: selectedTagConcat, label: selectedTagConcat }
                                : column.key === "disciplinaDescripcion" && selectedDisciplina
                                ? { value: selectedDisciplina, label: selectedDisciplina }
                                : column.key === "turnoDescripcion" && selectedTurno
                                ? { value: selectedTurno, label: selectedTurno }
                                : column.key === "interlockdesc" && selectedInterlock
                                ? { value: selectedInterlock, label: selectedInterlock }
                                : column.key === "responsableNombre" && selectedResponsable
                                ? { value: selectedResponsable, label: selectedResponsable }
                                : column.key === "riesgoaDescripcion" && selectedRiesgoA
                                ? { value: selectedRiesgoA, label: selectedRiesgoA }
                                : column.key === "probabilidadDescripcion" && selectedProbabilidad
                                ? { value: selectedProbabilidad, label: selectedProbabilidad }
                                : column.key === "impactoDescripcion" && selectedImpacto
                                ? { value: selectedImpacto, label: selectedImpacto }
                                : column.key === "riesgoDescripcion" && selectedNivelRiesgo
                                ? { value: selectedNivelRiesgo, label: selectedNivelRiesgo }
                                : null
                            }
                            placeholder={`Filtrar`}
                            onChange={(selectedOption) => {
                              const value = selectedOption?.value || "";
                              if (column.key === "area") setSelectedArea(value);
                              if (column.key === "solicitante") setSelectedSolicitante(value);
                              if (column.key === "estado") setSelectedEstado(value as Status);
                              if (column.key === "etapa") setSelectedEtapa(value as "NO INICIADO" | "ABIERTO" | "CERRADO" | "");
                              if (column.key === "tipo") setSelectedTipo(value);
                              if (column.key === "aprobador") setSelectedAprobador(value);
                              if (column.key === "ejecutor") setSelectedEjecutor(value);
                              if (column.key === "grupoNombre") setSelectedGrupo(value || null);
                              if (column.key === "subareaCodigo") setSelectedsubareaCodigo(value || null);
                              if (column.key === "tagCentroCodigo") setSelectedTagCentro(value || null);
                              if (column.key === "tagsufijo") setSelectedTagSufijo(value || null);
                              if (column.key === "tagConcat") setSelectedTagConcat(value || null);
                              if (column.key === "disciplinaDescripcion") setSelectedDisciplina(value || null);
                              if (column.key === "turnoDescripcion") setSelectedTurno(value || null);
                              if (column.key === "interlockdesc") setSelectedInterlock(value || null);
                              if (column.key === "responsableNombre") setSelectedResponsable(value || null);
                              if (column.key === "riesgoaDescripcion") setSelectedRiesgoA(value || null);
                              if (column.key === "probabilidadDescripcion") setSelectedProbabilidad(value || null);
                              if (column.key === "impactoDescripcion") setSelectedImpacto(value || null);
                              if (column.key === "riesgoDescripcion") setSelectedNivelRiesgo(value || null);
                              setCurrentPage(1);
                            }}
                            isClearable
                            isSearchable
                            className="w-full text-xs"
                            styles={{
                              control: (provided) => ({
                                ...provided,
                                border: "1px solid #d1d5db",
                                borderRadius: "0.375rem",
                                boxShadow: "none",
                                "&:hover": { borderColor: "#3b82f6" },
                                minHeight: "28px",
                                fontSize: "12px",
                                width: "100%",
                              }),
                              option: (provided, state) => ({
                                ...provided,
                                backgroundColor: state.isSelected ? "#3b82f6" : "white",
                                color: state.isSelected ? "white" : "black",
                                "&:hover": { backgroundColor: "#60a5fa", color: "white" },
                                fontSize: "12px",
                              }),
                              menu: (provided) => ({
                                ...provided,
                                zIndex: 9999,
                                width: "100%",
                              }),
                            }}
                          />
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedRows.length > 0 ? (
                  paginatedRows.map((row, index) => (
                    <tr key={`${row.id}-${index}`} className="hover:bg-gray-50">
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          className={`px-3 py-2 ${column.width} ${column.minWidth} 
                          ${
                            column.key === "nombre" ? "max-w-xs break-words" : "whitespace-nowrap"
                          }`}
                        >
                          {column.key === "rowNumber" ? (
                            <div className="text-xs text-gray-900">
                              {(currentPage - 1) * rowsPerPage + index + 1}
                            </div>
                          ) : column.key === "acciones" ? (
                            <div className="text-right text-sm font-medium">
                              <button
                                onClick={() => handleView(row.id)}
                                className="text-[#c8a064] hover:text-indigo-900 mr-1"
                                title="Ver detalles"
                              >
                                <FaEye />
                              </button>
                              {/* Acción de Aprobación - Solo visible si el usuario es el aprobador designado */}
                              {(row.estado === "PENDIENTE-RETIRO" || row.estado === "PENDIENTE-FORZADO") &&
                                user && (validateRol(usuariosAprobadores)) &&
                                (row.aprobadorAId === user.id) && (
                                  <button
                                    onClick={() => handleOpenApprovalModal(row)}
                                    className="text-blue-500 hover:text-blue-700 mr-1"
                                    title={row.estado === "PENDIENTE-RETIRO" ? "Acciones Retiro" : "Acciones Forzado"}
                                  >
                                    <FaCheck />
                                  </button>
                                )}
                              {/* Acción de Edición - Lógica sin cambios */}
                              {row.estado !== "FINALIZADO" &&
                                (validateRol(usuariosSolicitantes) || validateRol(usuariosAdministradores)) &&
                                row.estado !== "APROBADO-FORZADO" &&
                                !row.estado.includes("APROBADO") &&
                                !row.estado.includes("RECHAZADO") &&
                                !row.estado.includes("EJECUTADO") && (
                                  <button
                                    onClick={() => handleEdit(row.id, row.estado)}
                                    className="text-[#c8a064] hover:text-blue-900 mr-1"
                                    title="Editar"
                                  >
                                    <FaEdit />
                                  </button>
                                )}
                              {/* Acción de Retiro - Lógica sin cambios */}
                              {row.estado !== "FINALIZADO" &&
                                row.estado === "EJECUTADO-FORZADO" &&
                                user &&
                                (validateRol(usuariosSolicitantes) || validateRol(usuariosAdministradores)) && (
                                  <button
                                    onClick={() => handleDelete(row.id)}
                                    className="text-green-600 hover:text-green-900 mr-1"
                                    title="Retirar"
                                  >
                                    <FaArrowDown />
                                  </button>
                                )}
                              {/* Acción de Ejecución - Solo visible si el usuario pertenece al grupoA o es admin */}
                              {row.estado !== "FINALIZADO" &&
                                !row.estado.includes("EJECUTADO") &&
                                !row.estado.includes("RECHAZADO") &&
                                (row.estado.includes("APROBADO") || row.estado === "APROBADO-FORZADO") &&
                                user &&
                                (
                                  (validateRol(usuariosEjecutores) && user.groupId && (Array.isArray(user.groupId) ? user.groupId.includes(row.grupo_A) : user.groupId === row.grupo_A)) 
                                ) && (
                                <button
                                  onClick={() => handleExecute(row.id)}
                                  className="text-[#c8a064] hover:text-blue-900"
                                  title="Ejecutar"
                                >
                                  <FaPlay />
                                </button>
                              )}
                            </div>
                          ) : (
                            <div
                              className={`text-xs text-gray-900 ${
                                column.key === "estado"
                                  ? `${getStatusClass(row.estado)} text-center rounded-full px-2 py-1 inline-block`
                                  : ""
                              }`}
                            >
                              {
                                column.key === "estado"
                                  ? formatStatus(row[column.key] as string)
                                  : column.key === "etapa" ? (
                                    <span
                                      className={
                                        row.etapa === "NO INICIADO"
                                          ? "font-semibold text-blue-500"
                                          : row.etapa === "ABIERTO"
                                          ? "font-semibold text-red-500"
                                          : "font-semibold text-green-600"
                                      }
                                    >
                                      {row.etapa}
                                    </span>
                                  )
                                  : column.key === "observadoEjecucion"
                                  ? row.observadoEjecucion
                                    ? <span className="text-red-600 font-bold">SÍ</span>
                                    : "NO"
                                  : column.key === "grupoNombre"
                                  ? row.grupoNombre
                                  : column.key === "tagCentroCodigo"
                                  ? row.tagCentroCodigo
                                  : column.key === "tagsufijo"
                                  ? row.tagsufijo
                                  : column.key === "tagConcat"
                                  ? row.tagConcat
                                  : column.key === "disciplinaDescripcion"
                                  ? row.disciplinaDescripcion
                                  : column.key === "turnoDescripcion"
                                  ? row.turnoDescripcion
                                  : column.key === "interlockdesc"
                                  ? row.interlockdesc
                                  : column.key === "responsableNombre"
                                  ? row.responsableNombre
                                  : column.key === "riesgoaDescripcion"
                                  ? row.riesgoaDescripcion
                                  : column.key === "probabilidadDescripcion"
                                  ? row.probabilidadDescripcion
                                  : column.key === "impactoDescripcion"
                                  ? row.impactoDescripcion
                                  : column.key === "riesgoDescripcion"
                                  ? row.riesgoDescripcion
                                  : row[column.key]
                              }
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length} className="px-3 py-2 text-center text-xs text-gray-500">
                      No se encontraron registros
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 py-4 border-t border-gray-200">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="w-8 h-8 flex items-center justify-center text-blue-500 disabled:text-gray-300 hover:bg-gray-100 rounded-full"
              >
                ←
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`w-8 h-8 flex items-center justify-center rounded-full ${
                    currentPage === page
                      ? "bg-blue-500 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="w-8 h-8 flex items-center justify-center text-blue-500 disabled:text-gray-300 hover:bg-gray-100 rounded-full"
              >
                →
              </button>
            </div>
          )}
        </div>
      )}
      <Modals
        isModalOpen={isModalOpen}
        selectedRow={selectedRow!}
        closeModal={closeModal}
        openRejectModal={openRejectModal}
        handleApprove={handleApprove}
        closeModalBaja={closeModalBaja}
        handleReject={handleReject}
        handleApproveBaja={handleApprove}
        isExecuteModalOpen={isExecuteModalOpen}
        selectedExecuteRow={selectedExecuteRow as Row}
        executeDate={executeDate}
        setExecuteDate={setExecuteDate}
        handleDrag={handleDrag}
        handleDrop={handleDrop}
        handleFileChange={handleFileChange}
        executeFiles={executeFiles}
        setExecuteFiles={setExecuteFiles}
        closeExecuteModal={closeExecuteModal}
        handleExecuteConfirm={handleExecuteConfirm}
        isRejectModalOpen={isRejectModalOpen}
        rejectReason={rejectReason}
        setRejectReason={setRejectReason}
        rejectReasons={rejectReasons}
        closeRejectModal={closeRejectModal}
        handleRejectConfirm={handleRejectConfirm}
        getStatusClass={getStatusClass}
        formatDate={formatDate}
        setShowPopover={setShowPopover}
        setPopoverMessage={setPopoverMessage}
        setPopoverType={(type: "error" | "success") => setPopoverType(type)}
      />
      <ModalAprobacionRechazo
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        onApprove={() => selectedApprovalRow && handleApprove(selectedApprovalRow.id, selectedApprovalRow.estado.includes("FORZADO") ? "FORZADO" : "RETIRO")}
        onReject={openRejectModal}
        onObserve={selectedApprovalRow?.estado === "PENDIENTE-RETIRO" ? () => { setSelectedApprovalRow(selectedApprovalRow); setObservationText(""); setIsObserveModalOpen(true); } : undefined}
        requestType={selectedApprovalRow?.estado === "PENDIENTE-RETIRO" ? "RETIRO PENDIENTE" : "FORZADO PENDIENTE"}
      />
      <ModalCambioPassword
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSuccess={handlePasswordChangeSuccess}
      />
      {isObserveModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Agregar Observación</h2>
            <textarea
              value={observationText}
              onChange={(e) => setObservationText(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md mb-4"
              rows={4}
              placeholder="Ingrese su observación aquí..."
            />
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setIsObserveModalOpen(false)}
                className="px-4 py-2 bg-gray-300 text-black rounded-md hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                onClick={handleObserveConfirm}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
      <Popover message={popoverMessage} type={popoverType} show={showPopover} className="z-40" />
    </div>
  );
};

export default Page;
