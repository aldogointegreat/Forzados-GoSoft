"use client";
import React, { useEffect, useState } from "react";
import { aprobadores } from "@/hooks/rolesPermitidos";
import { nivelRiesgoDePersonasId, rolAprobadorInterlockId, nombreReglaNivelBajo } from "@/hooks/variablesHardcodeadas";
import { formatDateForm } from "@/helpers/format-date";

interface StepThreeProps {
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
  estado: number;
  id: string;
  nombre: string;
  apePaterno: string;
  apeMaterno: string;
  roles: { [key: string]: boolean };
  nivelRiesgoJ?: { [key: string]: boolean };
  grupoId?: string;
  puestoId?: string;
  aprobadorNivel: string; // Niveles de riesgo permitidos, ej: "BAJO,MODERADO,ALTO"
}

interface PuestoTurno {
  id: number;
  turnos: number[];
  aprobadorNivel: string; // Ejemplo: "BAJO,MODERADO,ALTO"
}

interface PuestoRiesgo {
  puesto_id: number;
  riesgos: string[]; // Ejemplo: ["BAJO", "MODERADO", "ALTO"]
}

const StepThree: React.FC<StepThreeProps> = ({
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
  const [puestosRiesgo, setPuestosRiesgo] = useState<PuestoRiesgo[]>([]);

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
    const fetchPuestosRiesgo = async () => {
      try {
        const response = await fetch("/api/maestras/puesto-riesgo");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.success) {
          const puestosMap = new Map<number, string[]>();
          data.values.forEach((item: any) => {
            if (item.estado === 1) {
              const riesgos = puestosMap.get(item.puesto_id) || [];
              riesgos.push(item.riesgo_descripcion);
              puestosMap.set(item.puesto_id, riesgos);
            }
          });

          const puestos: PuestoRiesgo[] = Array.from(puestosMap.entries()).map(([puesto_id, riesgos]) => ({
            puesto_id,
            riesgos,
          }));

          setPuestosRiesgo(puestos);
        } else {
          setError("Error al cargar datos de puestos y riesgos.");
        }
      } catch (error) {
        console.error("Error fetching puesto-riesgo data:", error);
        setError("Error al cargar datos de puestos y riesgos.");
      }
    };
    fetchPuestosRiesgo();
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
          const puestos: PuestoTurno[] = data.values.map((puesto: any) => {
            const puestoRiesgo = puestosRiesgo.find((pr) => pr.puesto_id === puesto.id);
            return {
              id: puesto.id,
              turnos: puesto.turnos,
              aprobadorNivel: puestoRiesgo ? puestoRiesgo.riesgos.join(",") : "",
            };
          });
          setPuestoTurnos(puestos);
        } else {
          setError("Error al cargar datos de puestos y turnos.");
        }
      } catch (error) {
        console.error("Error fetching puesto-turno data:", error);
        setError("Error al cargar datos de puestos y turnos.");
      }
    };
    if (puestosRiesgo.length > 0) {
      fetchPuestoTurnos();
    }
  }, [puestosRiesgo]);

  useEffect(() => {
    const fetchUsuarios = async () => {
      console.log("Paso 1: Iniciando fetchUsuarios con grupoId:", grupoId);

/*       if (!grupoId) {
        console.log("Paso 2: grupoId no definido, abortando.");
        setAprobadoresList([]);
        setError("No se pudo determinar el grupo del usuario.");
        return;
      }
 */
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

        const usuariosMapeados: User[] = usuariosRaw.map((usuario: any) => ({
          id: usuario.id,
          nombre: usuario.nombre,
          apePaterno: usuario.apePaterno,
          apeMaterno: usuario.apeMaterno,
      
          puestoId: usuario.puestoId?.toString(),
          estado: usuario.estado,
          roles: Object.fromEntries(
            Object.entries(usuario.roles || {}).map(([key, value]) => [
              key,
              typeof value === "string" && value !== "",
            ])
          ),
          aprobadorNivel: "",
        }));

        if (puestoTurnos.length === 0) {
          console.log("Paso 7: No hay datos de puestos y turnos disponibles.");
          setAprobadoresList([]);
          setError("No se pudieron cargar los datos de puestos y turnos.");
          return;
        }

        const usuariosConNivelRiesgo = usuariosMapeados.map((usuario) => {
          const puesto = puestoTurnos.find((pt) => pt.id.toString() === usuario.puestoId);
          const aprobadorNivel = puesto ? puesto.aprobadorNivel : "";
          console.log(
            `Paso 7: Asignando aprobadorNivel a usuario ${usuario.id}, puestoId: ${usuario.puestoId}, aprobadorNivel: ${aprobadorNivel}`
          );
          return {
            ...usuario,
            aprobadorNivel,
          };
        });

        const findUserById = (id: number) => usuariosConNivelRiesgo.find((u) => u.id === id.toString());

        const esInterlock = interlockSeguridad === "SÍ" || Number(riesgo) === nivelRiesgoDePersonasId;

        let filteredAprobadores: User[] = [];

        if (esInterlock) {
          filteredAprobadores = usuariosConNivelRiesgo.filter((usuario) => {
            const tieneRolInterlock = usuario.roles[rolAprobadorInterlockId];
            console.log(
              `Paso 8 (Interlock): Usuario ${usuario.id}, tiene rol APROBADOR INTERLOCK: ${tieneRolInterlock}`
            );
            return !!tieneRolInterlock;
          });

          if (filteredAprobadores.length === 0) {
            console.log("Paso 9: No hay usuarios con rol APROBADOR INTERLOCK.");
            setAprobadoresList([]);
            setError("No hay aprobadores interlock disponibles.");
            return;
          }

          filteredAprobadores = filteredAprobadores.filter((usuario) => {
            const isActive = usuario.estado === 1;
            console.log(`Paso 10 (Interlock): Usuario ${usuario.id}, estado activo: ${isActive}`);
            return isActive;
          });

          if (filteredAprobadores.length === 0) {
            console.log("Paso 11: No hay usuarios APROBADOR INTERLOCK activos.");
            setAprobadoresList([]);
            setError("No hay aprobadores interlock activos.");
            return;
          }

          filteredAprobadores = filteredAprobadores.filter((usuario) => {
            const tieneRolAprobador = aprobadores.some((roleId) => usuario.roles[roleId.toString()]);
            console.log(
              `Paso 12 (Interlock): Usuario ${usuario.id}, tiene rol APROBADOR: ${tieneRolAprobador}`
            );
            return tieneRolAprobador;
          });

          if (filteredAprobadores.length === 0) {
            console.log("Paso 13: No hay usuarios con ambos roles APROBADOR INTERLOCK y APROBADOR activos.");
            setAprobadoresList([]);
            setError("No hay aprobadores interlock con ambos roles activos.");
            return;
          }
        } else {
          filteredAprobadores = usuariosConNivelRiesgo.filter((usuario) => {
            const tieneRolAprobador = aprobadores.some((roleId) => usuario.roles[roleId.toString()]);
            console.log(
              `Paso 8 (No interlock): Usuario ${usuario.id}, tiene rol APROBADOR: ${tieneRolAprobador}`
            );
            return tieneRolAprobador;
          });

          if (filteredAprobadores.length === 0) {
            console.log("Paso 9: No hay usuarios con rol APROBADOR.");
            setAprobadoresList([]);
            setError("No hay aprobadores disponibles.");
            return;
          }

          filteredAprobadores = filteredAprobadores.filter((aprobador) => {
            if (!aprobador.aprobadorNivel) {
              console.log(`Paso 10: Usuario ${aprobador.id} sin nivel aprobador definido, excluido.`);
              return false;
            }
            const nivelesPermitidos = aprobador.aprobadorNivel
              .split(",")
              .map((nivel) => nivel.trim().toUpperCase())
              .filter((nivel) => nivel !== "");
            const nivelRiesgoNormalizado = nivelRiesgo.trim().toUpperCase();
            const nivelValido = nivelesPermitidos.includes(nivelRiesgoNormalizado);
            console.log(
              `Paso 10: Filtrando nivel ${nivelRiesgoNormalizado} - usuario ${aprobador.id}, niveles permitidos: ${nivelesPermitidos}, válido: ${nivelValido}`
            );
            return nivelValido;
          });

          if (filteredAprobadores.length === 0) {
            console.log("Paso 11: No hay usuarios que coincidan con el nivel de riesgo.");
            setAprobadoresList([]);
            setError("No hay aprobadores que cumplan con el nivel de riesgo.");
            return;
          }

          filteredAprobadores = filteredAprobadores.filter((usuario) => {
            const puesto = puestoTurnos.find((pt) => pt.id.toString() === usuario.puestoId);
            if (!puesto) {
              console.log(
                `Paso 12: Usuario ${usuario.id} no tiene un puesto asociado en puesto-turno, excluido.`
              );
              return false;
            }
            const isTurnoAssigned = puesto.turnos.includes(Number(turno));
            console.log(
              `Paso 12: Filtrando por turno - usuario ${usuario.id}, turno actual: ${turno}, turnos del puesto ${puesto.id}: ${puesto.turnos}, coincide: ${isTurnoAssigned}`
            );
            return isTurnoAssigned;
          });

          if (filteredAprobadores.length === 0) {
            console.log("Paso 13: No hay usuarios que coincidan con el turno.");
            setAprobadoresList([]);
            setError("No hay aprobadores que cumplan con el turno.");
            return;
          }



          console.log("Paso 14: Filtrando usuarios activos.");
          console.log("Usuarios antes del filtro:", filteredAprobadores);
          // Filtrar usuarios activos
          console.log("Paso 15: Filtrando usuarios activos.");
          console.log("Usuarios antes del filtro:", filteredAprobadores);
          console.log("Estado de los usuarios:", filteredAprobadores.map((u) => ({ id: u.id, estado: u.estado })));


          filteredAprobadores = filteredAprobadores.filter((usuario) => {
            const isActive = usuario.estado === 1;
            console.log(`Paso 16: Usuario ${usuario.id}, estado activo: ${isActive}`);
            return isActive;
          });

          if (filteredAprobadores.length === 0) {
            console.log("Paso 17: No hay usuarios activos que pasen todos los filtros.");
            setAprobadoresList([]);
            setError("No hay aprobadores activos que cumplan con los criterios.");
            return;
          }
        }

        if (aplicaReglaRiesgoBajo && nivelRiesgo.trim().toUpperCase() === "BAJO" && solicitante) {
          const solicitanteUser = findUserById(Number(solicitante));
          if (solicitanteUser && !filteredAprobadores.some((a) => a.id === solicitanteUser.id)) {
            console.log(`Paso 18: Agregando solicitante como aprobador - usuario ${solicitanteUser.id}`);
            filteredAprobadores = [...filteredAprobadores, solicitanteUser];
          }
        }

        const uniqueAprobadores = Array.from(
          new Map(filteredAprobadores.map((a) => [a.id, a])).values()
        );
        console.log("Paso 19: Aprobadores finales:", uniqueAprobadores);

        setAprobadoresList(uniqueAprobadores);
      } catch (error) {
        console.error("Paso 20: Error al obtener usuarios:", error);
        setError("No se pudieron cargar los aprobadores.");
      }
    };

    fetchUsuarios();
  }, [interlockSeguridad, nivelRiesgo, solicitante, riesgo, aplicaReglaRiesgoBajo, turno, puestoTurnos, grupoId]);

  useEffect(() => {
    const fetchSolicitudData = async () => {
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
            setAprobador(String(solicitud.aprobador) || "");
            setTipoGrupoA(String(solicitud.grupoA) || "");
            const formattedFecha = formatDateForm(solicitud.fechaFinPlanificada || "");
            setFechaFinPlanificada(formattedFecha);
          }
        } catch (error) {
          console.error("Error fetching solicitud data:", error);
          setError("Error al cargar los datos de la solicitud.");
        }
      }
    };
    fetchSolicitudData();
  }, [setAprobador, setTipoGrupoA, setFechaFinPlanificada]);

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

export default StepThree;