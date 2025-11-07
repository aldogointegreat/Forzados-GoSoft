"use client";
import React, { useEffect, useRef, useState } from "react";
import { aprobadores } from "@/hooks/rolesPermitidos";
import { nivelRiesgoDePersonasId, rolAprobadorInterlockId, nombreReglaNivelBajo } from "@/hooks/variablesHardcodeadas";
import { formatDateForm } from "@/helpers/format-date";
// import { formatDateForm } from "@/helpers/format-date";

// Función para formatear fechas para el input datetime-local
// const formatDateForInput = (dateString: string): string => {
//   const date = new Date(dateString); // Convierte la fecha del backend a un objeto Date
//   if (isNaN(date.getTime())) return ""; // Maneja fechas inválidas

//   // Ajusta la fecha al huso horario local
//   const year = date.getFullYear();
//   const month = String(date.getMonth() + 1).padStart(2, "0");
//   const day = String(date.getDate()).padStart(2, "0");
//   const hours = String(date.getHours()).padStart(2, "0"); // Hora local
//   const minutes = String(date.getMinutes()).padStart(2, "0");

//   return `${year}-${month}-${day}T${hours}:${minutes}`; // Formato para datetime-local
// };

interface EditStepThreeProps {
  aprobador: string;
  setAprobador: React.Dispatch<React.SetStateAction<string>>;
  tipoGrupoA: string;
  setTipoGrupoA: React.Dispatch<React.SetStateAction<string>>;
  interlockSeguridad: string;
  nivelRiesgo: string;
  solicitante: string;
  riesgo: string;
  fechaFinPlanificada: string;
  setFechaFinPlanificada: React.Dispatch<React.SetStateAction<string>>;
  grupoId: string | null;
  turno: string;
}

interface TipoGrupoA {
  id: string;
  descripcion: string;
}

interface User {
  id: string;
  nombre: string;
  apePaterno: string;
  apeMaterno: string;
  roles: { [key: string]: boolean };
  nivelRiesgoJ: { [key: string]: boolean };
  grupoId?: string;
  puestoId?: string;
}

interface PuestoTurno {
  id: number;
  turnos: number[];
}

const EditStepThree: React.FC<EditStepThreeProps> = ({
  aprobador,
  setAprobador,
  tipoGrupoA,
  setTipoGrupoA,
  interlockSeguridad,
  nivelRiesgo,
  solicitante,
  riesgo,
  fechaFinPlanificada,
  setFechaFinPlanificada,
  grupoId,
  turno,
}) => {
  const [tiposGrupoA, setTiposGrupo] = useState<TipoGrupoA[]>([]);
  const [aprobadoresList, setAprobadoresList] = useState<User[]>([]);
  const [aplicaReglaRiesgoBajo, setAplicaReglaRiesgoBajo] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [puestoTurnos, setPuestoTurnos] = useState<PuestoTurno[]>([]);
  const hasLoadedInitial = useRef<boolean>(false);
  const isFirstLoad = useRef(true); // Ref para controlar la inicialización

  console.log(isFirstLoad , "carga inicial")
  useEffect(() => {
    const fetchTiposGrupoA = async () => {
      try {
        const response = await fetch("/api/maestras/grupo");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Datos de tipos de grupo:", data.values);
        setTiposGrupo(data.values || []);
      } catch (error) {
        console.error("Error fetching tipos de grupo:", error);
        setError("Error al cargar los grupos de ejecución.");
      }
    };
    fetchTiposGrupoA();
  }, []);
  
  useEffect(() => {
    const fetchPuestoTurnos = async () => {
      try {
        const response = await fetch("/api/puesto-turno");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.success) {
          const puestos: PuestoTurno[] = data.values.map((puesto: any) => ({
            id: puesto.id,
            turnos: puesto.turnos,
          }));
          setPuestoTurnos(puestos);
        } else {
          setError("Error al cargar datos de puestos y turnos.");
        }
      } catch (error) {
        console.error("Error fetching puesto-turno data:", error);
        setError("Error al cargar datos de puestos y turnos.");
      }
    };
    fetchPuestoTurnos();
  }, []);

  useEffect(() => {
    const fetchUsuarios = async () => {
      console.log("Paso 1: Iniciando fetchUsuarios con grupoId:", grupoId);

      if (!grupoId) {
        console.log("Paso 2: grupoId no definido, abortando.");
        setAprobadoresList([]);
        setError("No se pudo determinar el grupo del usuario.");
        return;
      }

      try {
        console.log("Paso 3: Realizando solicitud a /api/usuarios");
        setError(null);
        const response = await fetch("/api/usuarios");
        if (!response.ok) {
          console.log("Paso 4: Respuesta no OK:", response.status);
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Paso 5: Respuesta de la API /api/usuarios:", data);

        const usuariosRaw = data.values || [];
        console.log("Paso 6: Usuarios crudos (usuariosRaw):", usuariosRaw);

        const usuarios: User[] = usuariosRaw
          .filter((usuario: any) => {
            const grupoIdUser = usuario.grupoId?.toString();
            const isActive = usuario.estado === 1;
            console.log(
              `Paso 7: Filtrando usuario ${usuario.id}, grupoId: ${grupoIdUser}, grupoId esperado: ${grupoId}, coincide: ${grupoIdUser === grupoId}, estado: ${usuario.estado}, activo: ${isActive}`
            );
            return grupoIdUser === grupoId && isActive;
          })
          .map((usuario: any) => ({
            id: usuario.id,
            nombre: usuario.nombre,
            apePaterno: usuario.apePaterno,
            apeMaterno: usuario.apeMaterno,
            grupoId: usuario.grupoId?.toString(),
            puestoId: usuario.puestoId?.toString(),
            roles: Object.fromEntries(
              Object.entries(usuario.roles || {}).map(([key, value]) => [
                key,
                typeof value === "string" && value !== "",
              ])
            ),
            nivelRiesgoJ: {
              "1": usuario.nivelRiesgoJ?.["1"] === "ALTO",
              "2": usuario.nivelRiesgoJ?.["2"] === "MODERADO",
              "3": usuario.nivelRiesgoJ?.["3"] === "BAJO",
            },
          }));

        console.log("Paso 8: Usuarios después de filtrar por grupo y estado:", usuarios);

        if (usuarios.length === 0) {
          console.log("Paso 9: No se encontraron usuarios para este grupo o no hay usuarios activos.");
          setAprobadoresList([]);
          setError("No hay aprobadores disponibles para este grupo o no hay usuarios activos.");
          return;
        }

        const findUserById = (id: number) => usuarios.find((u) => u.id === id.toString());

        let filteredAprobadores = usuarios.filter((usuario) => {
          const tieneRolAprobador = aprobadores.some((roleId) => usuario.roles[roleId.toString()]);
          console.log(
            `Paso 10: Filtrando aprobadores - usuario ${usuario.id}, tiene rol aprobador: ${tieneRolAprobador}`
          );
          return tieneRolAprobador;
        });

        filteredAprobadores = filteredAprobadores.filter((usuario) => {
          const puesto = puestoTurnos.find((pt) => pt.id.toString() === usuario.puestoId);
          if (!puesto) {
            console.log(
              `Paso 11: Usuario ${usuario.id} no tiene un puesto asociado en puesto-turno, excluido.`
            );
            return false;
          }

          const isTurnoAssigned = puesto.turnos.includes(Number(turno));
          console.log(
            `Paso 12: Filtrando por turno - usuario ${usuario.id}, turno actual: ${turno}, turnos del puesto ${puesto.id}: ${puesto.turnos}, coincide: ${isTurnoAssigned}`
          );
          return isTurnoAssigned;
        });

        let flag_regla = 0;

        if (interlockSeguridad === "SÍ" || Number(riesgo) === nivelRiesgoDePersonasId) {
          filteredAprobadores = filteredAprobadores.filter((aprobador) => {
            const tieneRolInterlock = aprobador.roles[rolAprobadorInterlockId];
            console.log(
              `Paso 13: Filtrando por interlock - usuario ${aprobador.id}, tiene rol interlock: ${tieneRolInterlock}`
            );
            return tieneRolInterlock;
          });
          flag_regla = 1;
        }

        if (flag_regla === 0) {
          if (nivelRiesgo === "ALTO") {
            filteredAprobadores = filteredAprobadores.filter((aprobador) => {
              const nivelAlto = aprobador.nivelRiesgoJ["1"];
              console.log(
                `Paso 14: Filtrando nivel ALTO - usuario ${aprobador.id}, nivelRiesgoJ ALTO: ${nivelAlto}`
              );
              return nivelAlto;
            });
          } else if (nivelRiesgo === "MODERADO") {
            filteredAprobadores = filteredAprobadores.filter((aprobador) => {
              const nivelModerado = aprobador.nivelRiesgoJ["2"];
              console.log(
                `Paso 14: Filtrando nivel MODERADO - usuario ${aprobador.id}, nivelRiesgoJ MODERADO: ${nivelModerado}`
              );
              return nivelModerado;
            });
          } else if (nivelRiesgo === "BAJO") {
            filteredAprobadores = filteredAprobadores.filter((aprobador) => {
              const nivelBajo = aprobador.nivelRiesgoJ["3"];
              console.log(
                `Paso 14: Filtrando nivel BAJO - usuario ${aprobador.id}, nivelRiesgoJ BAJO: ${nivelBajo}`
              );
              return nivelBajo;
            });
          }
        }

        if (aplicaReglaRiesgoBajo && nivelRiesgo === "BAJO" && solicitante) {
          const solicitanteUser = findUserById(Number(solicitante));
          if (solicitanteUser && !filteredAprobadores.some((a) => a.id === solicitanteUser.id)) {
            console.log(
              `Paso 15: Agregando solicitante como aprobador - usuario ${solicitanteUser.id}`
            );
            filteredAprobadores = [...filteredAprobadores, solicitanteUser];
          }
        }

        const uniqueAprobadores = Array.from(
          new Map(filteredAprobadores.map((a) => [a.id, a])).values()
        );
        console.log("Paso 16: Aprobadores finales:", uniqueAprobadores);
        setAprobadoresList(uniqueAprobadores);
      } catch (error) {
        console.error("Paso 17: Error al obtener usuarios:", error);
        setError("No se pudieron cargar los aprobadores.");
      }
    };
    fetchUsuarios();
  }, [interlockSeguridad, nivelRiesgo, solicitante, riesgo, aplicaReglaRiesgoBajo, grupoId, turno, puestoTurnos]);

  useEffect(() => {
    const fetchSolicitudData = async () => {
      if (hasLoadedInitial.current) {
        console.log("Datos iniciales ya cargados, omitiendo fetchSolicitudData");
        return;
      }
  
      console.log("Ejecutando fetchSolicitudData por primera vez");
      const urlParams = new URLSearchParams(window.location.search);
      const id = urlParams.get("id");
      if (id) {
        try {
          const response = await fetch(`/api/solicitudes/forzado/${id}`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
        
          const result = await response.json();
          if (result.success && result.data.length > 0) {
            const solicitud = result.data[0];
            console.log("Datos de solicitud cargados:", {
              aprobador: solicitud.aprobador,
              grupoA: solicitud.grupoA,
              fechaFinPlanificada: solicitud.fechaFinPlanificada,
            });
            
            // Solo actualiza los estados si están vacíos
          // Inicializa el estado aprobador solo la primera vez

          // Actualiza los demás estados si están vacíos

            if (!tipoGrupoA && aprobador != null) {
            console.log("si esta pasaando por aqui")
            setAprobador(String(solicitud.aprobador) || ""); // Carga el valor inicial
            // Cambia el ref a false después de la primera ejecución
            }
            if (!aprobador ) setAprobador((prev) => prev || String(solicitud.aprobador) || "");
            if (!tipoGrupoA) setTipoGrupoA(String(solicitud.grupoA) || "");
            if (!fechaFinPlanificada) {
              const formattedFecha = formatDateForm(solicitud.fechaFinPlanificada || "");
              console.log(formattedFecha,"fecha formateada prueba");
              setFechaFinPlanificada(formattedFecha);
            }
          
            hasLoadedInitial.current = true; // Marcar la carga inicial como completa
          }
        } catch (error) {
          console.error("Error fetching solicitud data:", error);
          setError("Error al cargar los datos de la solicitud.");
        }
      }
    };
    fetchSolicitudData();
  }, [aprobador,setAprobador,fechaFinPlanificada,setFechaFinPlanificada ,tipoGrupoA,setTipoGrupoA]);

  useEffect(() => {
    const fetchParametrosGlobales = async () => {
      try {
        const response = await fetch("/api/parametros-globales");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data?.values?.[nombreReglaNivelBajo] !== undefined) {
          setAplicaReglaRiesgoBajo(data.values[nombreReglaNivelBajo]);
        }
      } catch (error) {
        console.error("Error fetching regla de riesgo bajo:", error);
        setError("Error al cargar parámetros globales.");
      }
    };
    fetchParametrosGlobales();
  }, []);

  const handleGrupoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    console.log("Valor seleccionado en Grupo antes de setTipoGrupo:", e.target.value);
    setTipoGrupoA(e.target.value);
    console.log("Valor de tipoGrupo después de setTipoGrupo:", tipoGrupoA);
  };

  return (
    <form className="space-y-6">
      <div>
        <h2 className="text-center font-semibold text-2xl mb-2">Autorización</h2>
        <label className="block text-sm font-medium text-gray-600 mb-2">Aprobador *</label>
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
        <select
          value={aprobador}
          onChange={(e) => setAprobador(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option disabled value="">Seleccione Aprobador del Forzado</option>
          {aprobadoresList
            .sort((a, b) => a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }))
            .map((aprobador) => (
              <option key={aprobador.id} value={aprobador.id}>
                {`${aprobador.nombre} ${aprobador.apePaterno} ${aprobador.apeMaterno}`}
              </option>
            ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-600 mb-2">Grupo de Ejecución *</label>
        <select
          value={tipoGrupoA || ""}
          onChange={handleGrupoChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option disabled value="">Seleccione Grupo</option>
          {tiposGrupoA.length > 0 ? (
            tiposGrupoA.map((group) => (
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
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-600 mb-1">Fecha Fin Planificada *</label>
        
        <input
          type="datetime-local"
          value={fechaFinPlanificada}
          onChange={(e) => setFechaFinPlanificada(e.target.value)}
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
          required
        />
      </div>
    </form>
  );
};

export default EditStepThree;