import React, { useEffect, useState } from "react";
import { solicitantes } from "@/hooks/rolesPermitidos";
import useUserSession from "@/hooks/useSession";
import Help from "./Help";

interface EditStepTwoProps {
	interlockSeguridad: string;
	setInterlockSeguridad: React.Dispatch<React.SetStateAction<string>>;
	responsable: string;
	setResponsable: React.Dispatch<React.SetStateAction<string>>;
	riesgo: string;
	setRiesgo: React.Dispatch<React.SetStateAction<string>>;
	probabilidad: string;
	setProbabilidad: React.Dispatch<React.SetStateAction<string>>;
	impacto: string;
	setImpacto: React.Dispatch<React.SetStateAction<string>>;
	solicitante: string;
	setSolicitante: React.Dispatch<React.SetStateAction<string>>;
	nivelRiesgo: string;
	setNivelRiesgo: React.Dispatch<React.SetStateAction<string>>;
	tagPrefijo: string;
	tagCentro: string;
	tagSufijo: string;
}

interface Option {
	id: string;
	descripcion: string;
}

interface ResponsablesOptions {
	id: string;
	nombre: string;
}

const EditStepTwo: React.FC<EditStepTwoProps> = ({
	interlockSeguridad,
	setInterlockSeguridad,
	responsable,
	setResponsable,
	riesgo,
	setRiesgo,
	probabilidad,
	setProbabilidad,
	impacto,
	setImpacto,
	solicitante,
	setSolicitante,
	nivelRiesgo,
	setNivelRiesgo,
	tagPrefijo,
	tagCentro,
	tagSufijo,
}) => {
	const { user } = useUserSession();
	const [responsables, setResponsables] = useState<ResponsablesOptions[]>([]);
	const [riesgos, setRiesgos] = useState<Option[]>([]);
	const [probabilidades, setProbabilidades] = useState<Option[]>([]);
	const [impactos, setImpactos] = useState<Option[]>([]);
	const [usuarios, setUsuarios] = useState<
		{
			id: string;
			nombre: string;
			apePaterno: string;
			apeMaterno?: string;
			roles?: Record<string, any>;
		}[]
	>([]);
	const [camposBloqueados, setCamposBloqueados] = useState(false);
	const [loadingResponsables, setLoadingResponsables] = useState(true);
	const [loadingUsuarios, setLoadingUsuarios] = useState(true);
	const [matrizDataLoaded, setMatrizDataLoaded] = useState(false);

	// Establecer solicitante por defecto al usuario logueado si no hay valor
	useEffect(() => {
		if (user && user.id && !solicitante) {
			console.log("Estableciendo solicitante por defecto al usuario logueado:", user.id);
			setSolicitante(String(user.id));
		}
	}, [user, solicitante, setSolicitante]);

	// Cargar datos maestros (responsables, riesgos, probabilidades, impactos)
	useEffect(() => {
		const fetchData = async (url: string, setState: React.Dispatch<React.SetStateAction<Option[]>>) => {
			try {
				const response = await fetch(url);
				const data = await response.json();
				setState(data.values || []);
			} catch (error) {
				console.error(`Error fetching data from ${url}:`, error);
				setState([]);
			}
		};

		const fetchResponsableData = async (url: string, setState: React.Dispatch<React.SetStateAction<ResponsablesOptions[]>>) => {
			try {
				const response = await fetch(url);
				const data = await response.json();
				console.log("Datos de responsables:", data);
				setState(data.values || []);
			} catch (error) {
				console.error(`Error fetching data from ${url}:`, error);
				setState([]);
			}
		};

		const loadData = async () => {
			setLoadingResponsables(true);
			await Promise.all([
				fetchResponsableData("/api/maestras/responsable", setResponsables),
				fetchData("/api/maestras/riesgo-a", setRiesgos),
				fetchData("/api/maestras/probabilidad", setProbabilidades),
				fetchData("/api/maestras/impacto", setImpactos),
			]);
			setLoadingResponsables(false);
		};

		loadData();
	}, []);

	// Log para depurar el estado de responsables
	useEffect(() => {
		console.log("Estado responsables actualizado:", responsables);
	}, [responsables]);

	// Cargar y filtrar usuarios
	useEffect(() => {
		const fetchUsuarios = async () => {
			setLoadingUsuarios(true);
			try {
				const response = await fetch("/api/usuarios");
				const data = await response.json();
				console.log("Datos de usuarios desde /api/usuarios:", data);

				const filteredUsuarios = data.values.filter((usuario: any) => solicitantes.some((roleId) => Object.keys(usuario.roles || {}).includes(roleId.toString())));

				if (user && user.id) {
					const usuarioLogueado = {
						id: user.id,
						nombre: user.name,
						apePaterno: "",
						apeMaterno: "",
					};
					if (!filteredUsuarios.some((u: any) => u.id === usuarioLogueado.id)) {
						filteredUsuarios.push(usuarioLogueado);
					}
				}

				setUsuarios(filteredUsuarios);
				console.log("Usuarios filtrados (detalle):", filteredUsuarios);
			} catch (error) {
				console.error("Error al obtener usuarios:", error);
				setUsuarios([]);
			} finally {
				setLoadingUsuarios(false);
			}
		};
		fetchUsuarios();
	}, [user]);

	// Cargar matriz de riesgo
	useEffect(() => {
		const fetchMatrizRiesgoData = async () => {
			try {
				const response = await fetch("/api/maestras/tags-matriz-riesgo");
				const result = await response.json();

				let found = false;
				for (const row of result.values) {
					if (row.prefijoId === parseInt(tagPrefijo) && row.centroId === parseInt(tagCentro) && row.sufijo === tagSufijo) {
						console.log("Regla de matriz encontrada. Aplicando probabilidad, impacto, interlock y riesgo...");
						setProbabilidad(String(row.probabilidadId));
						setImpacto(String(row.impactoId));
						setInterlockSeguridad(row.interlock === 1 ? "SÍ" : "NO");
						setRiesgo(String(row.riesgoAId || ""));
						setCamposBloqueados(true);
						found = true;
						break;
					}
				}
				if (!found) {
					console.log(`No se encontraron reglas para: tagPrefijo=${tagPrefijo}, tagCentro=${tagCentro}, tagSufijo=${tagSufijo}`);
					setCamposBloqueados(false);
				}
				setMatrizDataLoaded(true);
			} catch (error) {
				console.error("Error fetching matriz riesgo data:", error);
			}
		};

		fetchMatrizRiesgoData();
	}, [tagPrefijo, tagCentro, tagSufijo, setProbabilidad, setImpacto, setInterlockSeguridad, setRiesgo]);

	// Fetch Nivel de Riesgo dinámicamente desde la API
	useEffect(() => {
		const fetchNivelRiesgo = async () => {
			if (probabilidad && impacto) {
				try {
					const response = await fetch("/api/maestras/matriz-riesgo");
					const result = await response.json();

					if (result.success && result.values) {
						const matchingRow = result.values.find((row: any) => String(row.probabilidad_id) === String(probabilidad) && String(row.impacto_id) === String(impacto));

						if (matchingRow) {
							setNivelRiesgo(matchingRow.riesgo_descripcion || "DESCONOCIDO");
						} else {
							setNivelRiesgo("DESCONOCIDO");
						}
					} else {
						setNivelRiesgo("DESCONOCIDO");
					}
				} catch (error) {
					console.error("Error fetching nivel de riesgo:", error);
					setNivelRiesgo("DESCONOCIDO");
				}
			} else {
				setNivelRiesgo("");
			}
		};

		fetchNivelRiesgo();
	}, [probabilidad, impacto, setNivelRiesgo]);

	// Cargar datos de la solicitud existente (solo si no se han cargado datos de matriz)
	useEffect(() => {
		const fetchSolicitudData = async () => {
			const urlParams = new URLSearchParams(window.location.search);
			const id = urlParams.get("id");
			if (id && !matrizDataLoaded) {
				try {
					const response = await fetch(`/api/solicitudes/forzado/${id}`);
					const result = await response.json();

					if (result.success && result.data.length > 0) {
						const solicitud = result.data[0];
						setInterlockSeguridad(solicitud.interlockSeguridad === 0 ? "NO" : "SÍ");
						setResponsable(String(solicitud.responsable));
						setRiesgo(String(solicitud.riesgo));
						setProbabilidad(String(solicitud.probabilidad));
						setImpacto(String(solicitud.impacto));
						setSolicitante(String(solicitud.solicitante));
					} else {
						console.error("No se encontraron datos para la solicitud.");
					}
				} catch (error) {
					console.error("Error fetching solicitud data:", error);
				}
			}
		};
		fetchSolicitudData();
	}, [setInterlockSeguridad, setResponsable, setRiesgo, setProbabilidad, setImpacto, setSolicitante, matrizDataLoaded]);

	return (
		<form className="space-y-6">
			<div>
				<h2 className="text-center font-semibold text-2xl mb-2">Editar Responsable y Riesgo</h2>
				<label className="block text-sm font-medium text-gray-600 mb-2">¿Es Interlock de Seguridad? *</label>
				<select
					value={interlockSeguridad}
					onChange={(e) => setInterlockSeguridad(e.target.value)}
					className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${camposBloqueados ? "bg-gray-200" : ""}`}
					required
					disabled={camposBloqueados}
				>
					<option disabled value="">
						Seleccione un valor
					</option>
					<option value="SÍ">SÍ</option>
					<option value="NO">NO</option>
				</select>
			</div>

			<div>
				<label className="block text-sm font-medium text-gray-600 mb-2">Responsable *</label>
				{loadingResponsables ? (
					<p>Cargando responsables...</p>
				) : (
					<select
						value={responsable}
						onChange={(e) => setResponsable(e.target.value)}
						className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
						required
					>
						<option disabled value="">
							Seleccione Gerencia Responsable del Forzado
						</option>
						{responsables.length > 0 ? (
							responsables.map((option) => (
								<option key={option.id} value={option.id}>
									{option.nombre}
								</option>
							))
						) : (
							<option value="" disabled>
								No hay responsables disponibles
							</option>
						)}
					</select>
				)}
			</div>

			<div>
				<label className="block text-sm font-medium text-gray-600 mb-2">Riesgo a *</label>
				<select
					value={riesgo}
					onChange={(e) => setRiesgo(e.target.value)}
					className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${camposBloqueados ? "bg-gray-200" : ""}`}
					required
					disabled={camposBloqueados}
				>
					<option disabled value="">
						Seleccione Riesgo al que puede afectar el Forzado
					</option>
					{riesgos.map((option) => (
						<option key={option.id} value={option.id}>
							{option.descripcion}
						</option>
					))}
				</select>
			</div>

			<div>
				<div className="flex justify-between">
					<label className="block text-sm font-medium text-gray-600 mb-2">Probabilidad *</label>
					<Help imagePath={"/images/MGFSN Matriz de Riegos.png"} description={"Matriz de riesgo"} />
				</div>
				<select
					value={probabilidad}
					onChange={(e) => setProbabilidad(e.target.value)}
					className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${camposBloqueados ? "bg-gray-200" : ""}`}
					required
					disabled={camposBloqueados}
				>
					<option disabled value="">
						Seleccione la probabilidad de ocurrencia
					</option>
					{probabilidades.map((option) => (
						<option key={option.id} value={option.id}>
							{option.descripcion}
						</option>
					))}
				</select>
			</div>

			<div>
				<label className="block text-sm font-medium text-gray-600 mb-2">Impacto *</label>
				<select
					value={impacto}
					onChange={(e) => setImpacto(e.target.value)}
					className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${camposBloqueados ? "bg-gray-200" : ""}`}
					required
					disabled={camposBloqueados}
				>
					<option disabled value="">
						Seleccione Impacto de la Consecuencia
					</option>
					{impactos.map((option) => (
						<option key={option.id} value={option.id}>
							{option.descripcion}
						</option>
					))}
				</select>
			</div>

			{nivelRiesgo && (
				<div>
					<label className="block text-sm font-medium text-gray-600 mb-2">Nivel de Riesgo *</label>
					<p
						className={`px-4 py-2 rounded-lg font-bold ${
							nivelRiesgo === "BAJO" ? "bg-green-600 text-gray-200" : nivelRiesgo === "MODERADO" ? "bg-[#FBBC04] text-white" : nivelRiesgo === "ALTO" ? "bg-red-500 text-white" : ""
						}`}
					>
						{nivelRiesgo}
					</p>
				</div>
			)}

			<div>
				<label className="block text-sm font-medium text-gray-600 mb-2">Solicitante *</label>
				{loadingUsuarios ? (
					<p>Cargando usuarios...</p>
				) : (
					<select
						value={solicitante}
						onChange={(e) => {
							console.log("Nuevo valor seleccionado para solicitante:", e.target.value);
							setSolicitante(e.target.value);
						}}
						className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
						required
					>
						<option disabled value="">
							Seleccione Solicitante del Forzado
						</option>
						{usuarios.length > 0 ? (
							usuarios
								.sort((a, b) => {
									const nombreCompletoA = `${a.nombre} ${a.apePaterno} ${a.apeMaterno || ""}`;
									const nombreCompletoB = `${b.nombre} ${b.apePaterno} ${b.apeMaterno || ""}`;
									return nombreCompletoA.localeCompare(nombreCompletoB);
								})
								.map((usuario) => (
									<option key={usuario.id} value={usuario.id}>
										{usuario.nombre} {usuario.apePaterno} {usuario.apeMaterno || ""}
									</option>
								))
						) : (
							<option value="" disabled>
								No hay usuarios disponibles
							</option>
						)}
					</select>
				)}
			</div>
		</form>
	);
};

export default EditStepTwo;
