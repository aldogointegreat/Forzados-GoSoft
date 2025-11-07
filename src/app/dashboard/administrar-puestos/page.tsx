"use client";
import Table from "@/components/Table";
import React, { useState, useMemo, useEffect } from "react";
import ModalCreacionPuesto from "@/components/ModalCreacionPuesto";
import Popover from "@/components/Popover";

export interface Role {
  id: number;
  descripcion: string;
}

export interface Turno {
  id: number;
  descripcion: string;
}

export interface Puesto {
  id: number;
  descripcion: string;
  estado: number;
  roles: { [key: string]: Role };
  aprobadorNivel: string;
  turnos: Turno[];
}

const Page = () => {
  const [puestosData, setPuestosData] = useState<Puesto[]>([]);
  const [puestoSearch, setPuestoSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPuesto, setSelectedPuesto] = useState<Puesto | undefined>(undefined);
  const [popoverMessage, setPopoverMessage] = useState("");
  const [popoverType, setPopoverType] = useState<"success" | "error">("success");
  const [showPopover, setShowPopover] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/puestos");
        if (!response.ok) throw new Error("Failed to fetch puestos");
        const result = await response.json();
        if (result.success) {
          // Backend already parses roles as an array, so no need for JSON.parse
          const formattedData = result.values.map((puesto: Puesto) => ({
            ...puesto,
            turnos: puesto.turnos || [], // Ensure turnos is always an array
          }));
          setPuestosData(formattedData);
        } else {
          throw new Error(result.message || "Error fetching data");
        }
      } catch (error) {
        console.error("Error fetching puestos:", error);
        setPopoverMessage("Error al cargar los puestos");
        setPopoverType("error");
        setShowPopover(true);
        setTimeout(() => setShowPopover(false), 3000);
      }
    };
    fetchData();
  }, []);

  const filteredPuestos = useMemo(
    () =>
      puestosData.filter((row) =>
        row.descripcion.toLowerCase().includes(puestoSearch.toLowerCase())
      ),
    [puestoSearch, puestosData]
  );

  const handleSuccess = async () => {
    try {
      const response = await fetch("/api/puestos");
      if (!response.ok) throw new Error("Failed to fetch updated puestos");
      const result = await response.json();
      if (result.success) {
        // Backend already parses roles as an array, so no need for JSON.parse
        const formattedData = result.values.map((puesto: Puesto) => ({
          ...puesto,
          turnos: puesto.turnos || [], // Ensure turnos is always an array
        }));
        setPuestosData(formattedData);
        setPopoverMessage("Puesto guardado correctamente");
        setPopoverType("success");
        setShowPopover(true);
        setTimeout(() => setShowPopover(false), 3000);
      } else {
        throw new Error(result.message || "Error fetching updated data");
      }
    } catch (error) {
      console.error("Error refreshing puestos:", error);
      setPopoverMessage("Error al actualizar los puestos");
      setPopoverType("error");
      setShowPopover(true);
      setTimeout(() => setShowPopover(false), 3000);
    }
  };

  const renderNivelAprobador = (nivelAprobador: string) => {
    if (!nivelAprobador) return <span></span>;
    const niveles = nivelAprobador.split(",");
    return niveles.map((nivel) => {
      let colorClass = "";
      switch (nivel) {
        case "BAJO":
          colorClass = "bg-green-600 text-white";
          break;
        case "MODERADO":
          colorClass = "bg-[#FBBC04] text-white";
          break;
        case "ALTO":
          colorClass = "bg-red-600 text-white";
          break;
        default:
          break;
      }
      return (
        <span
          key={nivel}
          className={`px-2 py-1 rounded-full font-semibold ${colorClass} mr-1`}
        >
          {nivel}
        </span>
      );
    });
  };

  return (
    <div className="space-y-8 p-4">
      <div className="space-y-4">
        <div className="relative flex justify-between items-center">
          <input
            type="text"
            value={puestoSearch}
            onChange={(e) => setPuestoSearch(e.target.value)}
            className="w-1/3 border border-gray-300 rounded-lg shadow-sm py-2 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Buscar puesto..."
          />
          <button
            onClick={() => {
              setIsEditing(false);
              setIsModalOpen(true);
            }}
            className="ml-4 px-4 py-2 bg-green-500 text-white rounded-md"
          >
            Añadir Puesto
          </button>
        </div>
        <Table
          columns={[
            { key: "id", label: "Código" },
            { key: "descripcion", label: "Descripción" },
            { key: "roles", label: "Roles" },
            { key: "turnos", label: "Turnos" },
            { key: "estado", label: "Estado" },
            { key: "aprobadorNivel", label: "Nivel de Aprobador" },
          ]}
          rows={filteredPuestos.map((puesto) => ({
            id: puesto.id,
            descripcion: puesto.descripcion,
            estado: (
              <span
                className={`px-2 py-1 rounded-full ${
                  puesto.estado === 1
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {puesto.estado === 1 ? "Activo" : "Inactivo"}
              </span>
            ),
            turnos: (
              <div className="flex flex-wrap gap-1">
                {puesto.turnos.map((t) => (
                  <span
                    key={t.id}
                    className="px-2 py-1 rounded-full bg-purple-100 text-purple-800"
                  >
                    {t.descripcion}
                  </span>
                ))}
              </div>
            ),
            roles: puesto.roles ? (
              <div className="flex flex-wrap">
                {Object.values(puesto.roles).map((role, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 mr-1 mb-1 rounded-full bg-blue-100 text-blue-800"
                  >
                    {role.descripcion}
                  </span>
                ))}
              </div>
            ) : (
              <span></span>
            ),
            aprobadorNivel: <>{renderNivelAprobador(puesto.aprobadorNivel)}</>,
          }))}
          onEdit={(id) => {
            const puesto = puestosData.find((puesto) => puesto.id === id);
            setSelectedPuesto(puesto || undefined);
            setIsEditing(true);
            setIsModalOpen(true);
          }}
          actions={["edit"]}
        />
      </div>
      <ModalCreacionPuesto
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedPuesto(undefined);
        }}
        isEditing={isEditing}
        puestoData={selectedPuesto}
        onSuccess={handleSuccess}
      />
      <Popover message={popoverMessage} type={popoverType} show={showPopover} />
    </div>
  );
};

export default Page;