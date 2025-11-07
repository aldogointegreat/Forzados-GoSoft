"use client";
import Table from "@/components/Table";
import Popover from "@/components/Popover";
import React, { useState, useEffect } from "react";
import useUserSession from "@/hooks/useSession";

interface Option {
  id: number;
  descripcion: string;
}

interface MatrizRiesgo {
  id: number;
  impacto_id: number;
  riesgo_id: number;
  probabilidad_id: number;
  nivel: string;
  estado: number;
  usuario_creacion: string;
  fecha_creacion: string;
  usuario_modificacion: string | null;
  fecha_modificacion: string | null;
  impacto_descripcion: string;
  probabilidad_descripcion: string;
  riesgo_descripcion: string;
}

interface Tolerancia {
  id: number;
  porcentajeTolerancia: number;
  intervalo: number;
}

interface GenericRecord {
  id: number;
  codigo?: string;
  descripcion?: string;
  probabilidad?: string;
  impacto?: string;
  horaInicio?: string;
  horaFin?: string;
}

const Page = () => {
  const categories = [
    { label: "Activo (Tag Centro)", value: "activo", needsCode: true },
    { label: "Área", value: "area", needsCode: false },
    { label: "Circuito", value: "circuito", needsCode: false },
    { label: "Disciplina", value: "disciplina", needsCode: false },
    { label: "Elemento de Riesgo", value: "riesgo-a", needsCode: false },
    { label: "Grupo", value: "grupo", needsCode: false },
    { label: "Impacto", value: "impacto", needsCode: false },
    { label: "Matriz de Riesgo", value: "matriz-riesgo", needsCode: false },
    { label: "Motivo de Rechazo", value: "motivo-rechazo", needsCode: false },
    { label: "Probabilidad", value: "probabilidad", needsCode: false },
    { label: "Proyecto", value: "proyecto", needsCode: false },
    { label: "Responsable", value: "responsable", needsCode: false },
    { label: "Riesgo", value: "riesgo", needsCode: false },
    { label: "Sub Área (Tag Prefijo)", value: "subarea", needsCode: true },
    { label: "Tolerancia", value: "tolerancia", needsCode: false },
    { label: "Tipo de forzado", value: "tipo-forzado", needsCode: false },
    { label: "Turno", value: "turno", needsCode: false },
  ].sort((a, b) => a.label.localeCompare(b.label));

  const [selectedCategory, setSelectedCategory] = useState("");
  const [data, setData] = useState<
    Record<string, (GenericRecord | MatrizRiesgo | Tolerancia)[]>
  >({
    disciplina: [],
    turno: [],
    horario: [],
    responsable: [],
    riesgo: [],
    proyecto: [],
    "tipo-forzado": [],
    impacto: [],
    probabilidad: [],
    area: [],
    subarea: [],
    "matriz-riesgo": [],
    tolerancia: [],
    circuito: [],
    "riesgo-a": [],
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"create" | "edit">("create");
  const [modalEntity, setModalEntity] = useState<"turno" | "horario" | "default">("default");
  const [newRecord, setNewRecord] = useState({
    codigo: "",
    descripcion: "",
    categoria: "",
    probabilidad: "",
    impacto: "",
    id: "",
    impacto_id: "",
    riesgo_id: "",
    probabilidad_id: "",
    nivel: "",
    estado: "1",
    porcentajeTolerancia: "",
    intervalo: "",
    horaInicio: "",
    horaFin: "",
  });
  const [editingRecordId, setEditingRecordId] = useState<number | null>(null);
  const [showPopover, setShowPopover] = useState(false);
  const [popoverMessage, setPopoverMessage] = useState("");
  const [popoverType, setPopoverType] = useState<"success" | "error">("success");
  const { user } = useUserSession();
  const [probabilidades, setProbabilidades] = useState<Option[]>([]);
  const [impactos, setImpactos] = useState<Option[]>([]);
  const [riesgos, setRiesgos] = useState<Option[]>([]);
  const [activeTab, setActiveTab] = useState<"turno" | "horario">("turno");

  const fetchData = async (category: string, entity: "turno" | "horario" | "default" = "default") => {
    try {
      const endpoint = entity === "horario" ? "horario" : category;
      const response = await fetch(`/api/maestras/${endpoint}`);
      const result = await response.json();
      const normalizedData = result.values.map((item: any) => {
        if (category === "matriz-riesgo") {
          return {
            id: item.id,
            impacto_id: item.impacto_id,
            probabilidad_id: item.probabilidad_id,
            riesgo_id: item.riesgo_id,
            nivel: item.nivel || "",
            estado: item.estado,
            usuario_creacion: item.usuario_creacion,
            fecha_creacion: item.fecha_creacion,
            usuario_modificacion: item.usuario_modificacion,
            fecha_modificacion: item.fecha_modificacion,
            impacto_descripcion: item.impacto_descripcion,
            probabilidad_descripcion: item.probabilidad_descripcion,
            riesgo_descripcion: item.riesgo_descripcion,
          } as MatrizRiesgo;
        } else if (category === "tolerancia") {
          return {
            id: item.id,
            porcentajeTolerancia: item.porcentajeTolerancia,
            intervalo: item.intervalo,
          } as Tolerancia;
        } else if (entity === "horario") {
          return {
            id: item.id,
            descripcion: item.descripcion || "",
            horaInicio: item.horaInicio || "",
          } as GenericRecord;
        } else if (entity === "turno") {
          return {
            id: item.id,
            descripcion: item.descripcion || "",
            horaInicio: item.horaInicio || "",
            horaFin: item.horaFin || "",
          } as GenericRecord;
        }
        return {
          id: item.id,
          codigo: item.codigo || item.id.toString(),
          descripcion: item.descripcion || item.nombre || "",
          probabilidad: item.probabilidad || "",
          impacto: item.impacto || "",
        } as GenericRecord;
      });
      setData((prevData) => ({
        ...prevData,
        [entity === "horario" ? "horario" : category]: normalizedData,
      }));
    } catch (error) {
      console.error(`Error fetching data for ${entity === "default" ? category : entity}:`, error);
    }
  };

  const fetchDataForDropdowns = async (
    url: string,
    setState: React.Dispatch<React.SetStateAction<Option[]>>
  ) => {
    try {
      const response = await fetch(url);
      const data = await response.json();
      setState(data.values || []);
    } catch (error) {
      console.error(`Error fetching data from ${url}:`, error);
      setState([]);
    }
  };


  useEffect(() => {
    if (selectedCategory) {
      if (selectedCategory === "turno") {
        fetchData(selectedCategory, "turno");
        fetchData("horario", "horario");
      } else {
        fetchData(selectedCategory, "default");
      }
    }
    if (selectedCategory === "subarea" || selectedCategory === "matriz-riesgo") {
      fetchDataForDropdowns("/api/maestras/probabilidad", setProbabilidades);
      fetchDataForDropdowns("/api/maestras/impacto", setImpactos);
      fetchDataForDropdowns("/api/maestras/riesgo", setRiesgos);
    }
  }, [selectedCategory]);

  const handleCreateOrUpdate = () => {
    if (!newRecord.categoria) {
      alert("Por favor, seleccione una categoría.");
      return;
    }

    if (modalEntity === "horario") {
      if (!newRecord.descripcion || !newRecord.horaInicio) {
        alert("Por favor, complete los campos de descripción y hora de inicio.");
        return;
      }
      if (modalType === "create" && data.horario.length > 0) {
        alert("Solo se permite un registro de horario.");
        return;
      }
    } else if (modalEntity === "turno") {
      if (!newRecord.descripcion) {
        alert("Por favor, ingrese una descripción.");
        return;
      }
    } else if (selectedCategory === "tolerancia") {
      if (!newRecord.porcentajeTolerancia || !newRecord.intervalo) {
        alert("Por favor, complete el porcentaje de tolerancia y el intervalo.");
        return;
      }
      if (
        isNaN(Number(newRecord.porcentajeTolerancia)) ||
        Number(newRecord.porcentajeTolerancia) < 0 ||
        Number(newRecord.porcentajeTolerancia) > 100
      ) {
        alert("El porcentaje de tolerancia debe ser un número entre 0 y 100.");
        return;
      }
      if (modalType === "create" && data.tolerancia.length > 0) {
        alert("Solo se permite un registro de tolerancia.");
        return;
      }
    } else if (selectedCategory === "matriz-riesgo") {
      if (
        !newRecord.impacto_id ||
        !newRecord.riesgo_id ||
        !newRecord.probabilidad_id ||
        !newRecord.nivel
      ) {
        alert("Por favor, complete todos los campos requeridos para Matriz de Riesgo.");
        return;
      }
      if (isNaN(Number(newRecord.nivel))) {
        alert("El campo Nivel debe ser un valor numérico.");
        return;
      }
    } else if (selectedCategoryObject?.needsCode && !newRecord.codigo) {
      alert("Por favor, ingrese un código.");
      return;
    }

    const payload =
      selectedCategory === "matriz-riesgo"
        ? {
            id: newRecord.id ? Number(newRecord.id) : undefined,
            impactoId: Number(newRecord.impacto_id),
            probabilidadId: Number(newRecord.probabilidad_id),
            riesgoId: Number(newRecord.riesgo_id),
            nivel: newRecord.nivel,
            estado: Number(newRecord.estado),
            usuario: user?.id,
          }
        : selectedCategory === "tolerancia"
        ? {
            porcentajeTolerancia: Number(newRecord.porcentajeTolerancia),
            intervalo: Number(newRecord.intervalo),
          }
        : modalEntity === "horario"
        ? {
            descripcion: newRecord.descripcion.toUpperCase(),
            horaInicio: newRecord.horaInicio,
            usuario: user?.id,
          }
        : modalEntity === "turno"
        ? {
            descripcion: newRecord.descripcion.toUpperCase(),
            usuario: user?.id,
          }
        : {
            descripcion: newRecord.descripcion.toUpperCase(),
            ...(selectedCategoryObject?.needsCode && {
              codigo: newRecord.codigo.toUpperCase(),
            }),
            probabilidad: newRecord.probabilidad ? Number(newRecord.probabilidad) : undefined,
            impacto: newRecord.impacto ? Number(newRecord.impacto) : undefined,
            usuario: user?.id,
          };

    const method = modalType === "create" ? "POST" : "PUT";
    const url = `/api/maestras/${modalEntity === "horario" ? "horario" : newRecord.categoria.toLowerCase()}`;
    const body = JSON.stringify({
      ...(modalType === "edit" && editingRecordId !== null ? { id: editingRecordId } : {}),
      ...payload,
    });

    fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          setPopoverMessage(
            `Registro ${modalType === "create" ? "creado" : "actualizado"} exitosamente.`
          );
          setPopoverType("success");
          if (selectedCategory === "turno") {
            fetchData(selectedCategory, "turno");
            fetchData("horario", "horario");
          } else {
            fetchData(newRecord.categoria, "default");
          }
        } else {
          setPopoverMessage(
            `Error al ${modalType === "create" ? "crear" : "actualizar"} el registro: ${
              data.message || ""
            }`
          );
          setPopoverType("error");
        }
        setShowPopover(true);
        setTimeout(() => setShowPopover(false), 2000);
      })
      .catch((error) => {
        console.error("Error:", error);
        setPopoverMessage(
          `Error al ${modalType === "create" ? "crear" : "actualizar"} el registro.`
        );
        setPopoverType("error");
        setShowPopover(true);
        setTimeout(() => setShowPopover(false), 2000);
      });

    setIsModalOpen(false);
    setNewRecord({
      codigo: "",
      descripcion: "",
      categoria: "",
      probabilidad: "",
      impacto: "",
      id: "",
      impacto_id: "",
      riesgo_id: "",
      probabilidad_id: "",
      nivel: "",
      estado: "1",
      porcentajeTolerancia: "",
      intervalo: "",
      horaInicio: "",
      horaFin: "",
    });
    setEditingRecordId(null);
  };

  const handleEdit = (id: number, entity: "turno" | "horario" | "default" = "default") => {
    const dataKey = entity === "horario" ? "horario" : selectedCategory;
    const recordToEdit = data[dataKey]?.find((row) => row.id === id);
    if (recordToEdit) {
      setModalType("edit");
      setModalEntity(entity);
      setIsModalOpen(true);
      setNewRecord({
        codigo: (recordToEdit as GenericRecord).codigo || "",
        descripcion: (recordToEdit as GenericRecord).descripcion || "",
        categoria: selectedCategory,
        probabilidad: (recordToEdit as GenericRecord).probabilidad || "",
        impacto: (recordToEdit as GenericRecord).impacto || "",
        id: (recordToEdit as MatrizRiesgo).id?.toString() || "",
        impacto_id: (recordToEdit as MatrizRiesgo).impacto_id?.toString() || "",
        riesgo_id: (recordToEdit as MatrizRiesgo).riesgo_id?.toString() || "",
        probabilidad_id: (recordToEdit as MatrizRiesgo).probabilidad_id?.toString() || "",
        nivel: (recordToEdit as MatrizRiesgo).nivel || "",
        estado: (recordToEdit as MatrizRiesgo).estado?.toString() || "1",
        porcentajeTolerancia: (recordToEdit as Tolerancia).porcentajeTolerancia?.toString() || "",
        intervalo: (recordToEdit as Tolerancia).intervalo?.toString() || "",
        horaInicio: (recordToEdit as GenericRecord).horaInicio || "",
        horaFin: (recordToEdit as GenericRecord).horaFin || "",
      });
      setEditingRecordId(id);
    }
  };

  const handleDelete = async (id: number, entity: "turno" | "horario" | "default" = "default") => {
    try {
      const endpoint = entity === "horario" ? "horario" : selectedCategory;
      const response = await fetch(`/api/maestras/${endpoint}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, usuario: user?.id }),
      });
      const data = await response.json();
      if (data.success) {
        const dataKey = entity === "horario" ? "horario" : selectedCategory;
        setData((prevData) => ({
          ...prevData,
          [dataKey]: prevData[dataKey].filter((row) => row.id !== id),
        }));
        setPopoverMessage("Registro eliminado exitosamente.");
        setPopoverType("success");
      } else {
        setPopoverMessage("Error al eliminar el registro.");
        setPopoverType("error");
      }
      setShowPopover(true);
      setTimeout(() => setShowPopover(false), 2000);
    } catch (error) {
      console.error("Error deleting record:", error);
      setPopoverMessage("Error al eliminar el registro.");
      setPopoverType("error");
      setShowPopover(true);
      setTimeout(() => setShowPopover(false), 2000);
    }
  };

  const selectedCategoryObject = categories.find(
    (category) => category.value === selectedCategory
  );

  const turnoRows = (data.turno || []).map((row) => {
    const turnoRow = row as GenericRecord;
    return {
      id: turnoRow.id,
      descripcion: turnoRow.descripcion,
      horaInicio: turnoRow.horaInicio || "-",
      horaFin: turnoRow.horaFin || "-",
    };
  });

  const horarioRows = (data.horario || []).map((row) => {
    const horarioRow = row as GenericRecord;
    return {
      id: horarioRow.id,
      descripcion: horarioRow.descripcion || "-",
      horaInicio: horarioRow.horaInicio || "-",
    };
  });

  const tableRows = (data[selectedCategory] || []).map((row) => {
    if (selectedCategory === "matriz-riesgo") {
      const matrizRow = row as MatrizRiesgo;
      return {
        id: matrizRow.id,
        impacto: matrizRow.impacto_descripcion,
        riesgo: matrizRow.riesgo_descripcion,
        probabilidad: matrizRow.probabilidad_descripcion,
        nivel: matrizRow.nivel,
        estado: matrizRow.estado,
      };
    } else if (selectedCategory === "tolerancia") {
      const toleranciaRow = row as Tolerancia;
      return {
        id: toleranciaRow.id,
        porcentajeTolerancia: toleranciaRow.porcentajeTolerancia,
        intervalo: toleranciaRow.intervalo,
      };
    }
    const genericRow = row as GenericRecord;
    return {
      ...genericRow,
      codigo: selectedCategoryObject?.needsCode ? genericRow.codigo : genericRow.id.toString(),
    };
  });

  const isCreateButtonDisabled =
    (selectedCategory === "tolerancia" && data.tolerancia.length > 0) ||
    (selectedCategory === "turno" && activeTab === "horario" && data.horario.length > 0);

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center space-x-4 justify-between">
        <select
          className="p-2 border rounded-lg w-1/3"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">Seleccionar categoría</option>
          {categories.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>

        {selectedCategory && (
          <button
            onClick={() => {
              setModalType("create");
              setModalEntity(selectedCategory === "turno" ? activeTab : "default");
              setIsModalOpen(true);
              setNewRecord({
                codigo: "",
                descripcion: "",
                categoria: selectedCategory,
                probabilidad: "",
                impacto: "",
                id: "",
                impacto_id: "",
                riesgo_id: "",
                probabilidad_id: "",
                nivel: "",
                estado: "1",
                porcentajeTolerancia: "",
                intervalo: "",
                horaInicio: "",
                horaFin: "",
              });
            }}
            className={`px-4 py-2 rounded-lg text-white ${
              isCreateButtonDisabled
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-600"
            }`}
            disabled={isCreateButtonDisabled}
          >
            Crear nuevo {selectedCategory === "turno" ? (activeTab === "turno" ? "turno" : "horario") : "registro"}
          </button>
        )}
      </div>

      {selectedCategory ? (
        selectedCategory === "turno" ? (
          <div>
            <div className="mb-4 flex space-x-4">
              <button
                onClick={() => setActiveTab("turno")}
                className={`px-4 py-2 rounded-lg ${
                  activeTab === "turno"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-800"
                }`}
              >
                Turnos
              </button>
              <button
                onClick={() => setActiveTab("horario")}
                className={`px-4 py-2 rounded-lg ${
                  activeTab === "horario"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-800"
                }`}
              >
                Horarios Laborales
              </button>
            </div>

            {activeTab === "turno" ? (
              <Table
                columns={[
                  { key: "id", label: "ID" },
                  { key: "descripcion", label: "Descripción" },
                  { key: "horaInicio", label: "Hora Inicio" },
                  { key: "horaFin", label: "Hora Fin" },
                ]}
                rows={turnoRows}
                onEdit={(id) => handleEdit(id, "turno")}
                onDelete={(id) => handleDelete(id, "turno")}
                actions={["edit", "delete"]}
              />
            ) : (
              <Table
                columns={[
                  { key: "id", label: "ID" },
                  { key: "descripcion", label: "Descripción" },
                  { key: "horaInicio", label: "Hora Inicio" },
                ]}
                rows={horarioRows}
                onEdit={(id) => handleEdit(id, "horario")}
                onDelete={(id) => handleDelete(id, "horario")}
                actions={["edit", "delete"]}
              />
            )}
          </div>
        ) : (
          <Table
            columns={
              selectedCategory === "matriz-riesgo"
                ? [
                    { key: "id", label: "ID" },
                    { key: "impacto", label: "Impacto" },
                    { key: "probabilidad", label: "Probabilidad" },
                    { key: "riesgo", label: "Riesgo" },
                    { key: "nivel", label: "Nivel" },
                    { key: "estado", label: "Estado" },
                  ]
                : selectedCategory === "tolerancia"
                ? [
                    { key: "id", label: "ID" },
                    { key: "porcentajeTolerancia", label: "Porcentaje de Tolerancia (%)" },
                    { key: "intervalo", label: "Intervalo de Reenvío de Alertas(hrs)" },
                  ]
                : [
                    { key: "id", label: "ID" },
                    ...(selectedCategoryObject?.needsCode ? [{ key: "codigo", label: "Código" }] : []),
                    { key: "descripcion", label: "Descripción" },
                  ]
            }
            rows={tableRows}
            onEdit={(id) => handleEdit(id, "default")}
            onDelete={(id) => handleDelete(id, "default")}
            actions={["edit", "delete"]}
          />
        )
      ) : (
        <p className="text-gray-500">
          Seleccione una categoría para ver sus registros.
        </p>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
            <h2 className="text-lg font-semibold mb-4">
              {modalType === "create" ? "Crear nuevo registro" : "Editar registro"}
            </h2>

            {modalEntity === "horario" ? (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Descripción</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-lg"
                    value={newRecord.descripcion}
                    onChange={(e) =>
                      setNewRecord({ ...newRecord, descripcion: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Hora Inicio</label>
                  <input
                    type="time"
                    className="w-full p-2 border rounded-lg"
                    value={newRecord.horaInicio}
                    onChange={(e) =>
                      setNewRecord({ ...newRecord, horaInicio: e.target.value })
                    }
                    required
                  />
                </div>
              </>
            ) : modalEntity === "turno" ? (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Descripción</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-lg"
                    value={newRecord.descripcion}
                    onChange={(e) =>
                      setNewRecord({ ...newRecord, descripcion: e.target.value })
                    }
                    required
                  />
                </div>
                {modalType === "edit" && (
                  <>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">Hora Inicio</label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded-lg bg-gray-100"
                        value={newRecord.horaInicio || "Se calculará automáticamente"}
                        disabled
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">Hora Fin</label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded-lg bg-gray-100"
                        value={newRecord.horaFin || "Se calculará automáticamente"}
                        disabled
                      />
                    </div>
                  </>
                )}
              </>
            ) : selectedCategory === "matriz-riesgo" ? (
              <>
                {modalType === "edit" && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">ID</label>
                    <input
                      type="number"
                      className="w-full p-2 border rounded-lg"
                      value={newRecord.id}
                      disabled
                    />
                  </div>
                )}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Impacto</label>
                  <select
                    className="w-full p-2 border rounded-lg"
                    value={newRecord.impacto_id}
                    onChange={(e) =>
                      setNewRecord({ ...newRecord, impacto_id: e.target.value })
                    }
                  >
                    <option value="">Seleccionar opción</option>
                    {impactos.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.descripcion}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Probabilidad</label>
                  <select
                    className="w-full p-2 border rounded-lg"
                    value={newRecord.probabilidad_id}
                    onChange={(e) =>
                      setNewRecord({ ...newRecord, probabilidad_id: e.target.value })
                    }
                  >
                    <option value="">Seleccionar opción</option>
                    {probabilidades.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.descripcion}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Riesgo</label>
                  <select
                    className="w-full p-2 border rounded-lg"
                    value={newRecord.riesgo_id}
                    onChange={(e) =>
                      setNewRecord({ ...newRecord, riesgo_id: e.target.value })
                    }
                  >
                    <option value="">Seleccionar opción</option>
                    {riesgos.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.descripcion}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Nivel</label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded-lg"
                    value={newRecord.nivel}
                    onChange={(e) =>
                      setNewRecord({ ...newRecord, nivel: e.target.value })
                    }
                    min="0"
                    required
                  />
                </div>
                {modalType === "edit" && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Estado</label>
                    <input
                      type="number"
                      className="w-full p-2 border rounded-lg"
                      value={newRecord.estado}
                      onChange={(e) =>
                        setNewRecord({ ...newRecord, estado: e.target.value })
                      }
                      min="0"
                      max="1"
                    />
                  </div>
                )}
              </>
            ) : selectedCategory === "tolerancia" ? (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Porcentaje de Tolerancia (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    className="w-full p-2 border rounded-lg"
                    value={newRecord.porcentajeTolerancia}
                    onChange={(e) =>
                      setNewRecord({ ...newRecord, porcentajeTolerancia: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Intervalo (horas)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    className="w-full p-2 border rounded-lg"
                    value={newRecord.intervalo}
                    onChange={(e) =>
                      setNewRecord({ ...newRecord, intervalo: e.target.value })
                    }
                    required
                  />
                </div>
              </>
            ) : (
              <>
                {selectedCategoryObject?.needsCode && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Código</label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded-lg"
                      value={newRecord.codigo}
                      onChange={(e) =>
                        setNewRecord({ ...newRecord, codigo: e.target.value })
                      }
                    />
                  </div>
                )}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Descripción</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-lg"
                    value={newRecord.descripcion}
                    onChange={(e) =>
                      setNewRecord({ ...newRecord, descripcion: e.target.value })
                    }
                  />
                </div>
                {selectedCategory === "subarea" && (
                  <>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">Probabilidad</label>
                      <select
                        className="w-full p-2 border rounded-lg"
                        value={newRecord.probabilidad}
                        onChange={(e) =>
                          setNewRecord({ ...newRecord, probabilidad: e.target.value })
                        }
                      >
                        <option value="">Seleccionar opción</option>
                        {probabilidades.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.descripcion}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">Impacto</label>
                      <select
                        className="w-full p-2 border rounded-lg"
                        value={newRecord.impacto}
                        onChange={(e) =>
                          setNewRecord({ ...newRecord, impacto: e.target.value })
                        }
                      >
                        <option value="">Seleccionar opción</option>
                        {impactos.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.descripcion}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </>
            )}

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateOrUpdate}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
              >
                {modalType === "create" ? "Crear" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPopover && (
        <Popover message={popoverMessage} type={popoverType} show={showPopover} />
      )}
    </div>
  );
};

export default Page;