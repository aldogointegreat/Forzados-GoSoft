import React, { useEffect, useState } from "react";
import useUserSession from "@/hooks/useSession";
import Help from "./Help";

interface EditStepOneProps {
	tagPrefijo: string;
	setTagPrefijo: React.Dispatch<React.SetStateAction<string>>;
	tagCentro: string;
	setTagCentro: React.Dispatch<React.SetStateAction<string>>;
	tagSubfijo: string;
	setTagSubfijo: React.Dispatch<React.SetStateAction<string>>;
	descripcion: string;
	setDescripcion: React.Dispatch<React.SetStateAction<string>>;
	disciplina: string;
	setDisciplina: React.Dispatch<React.SetStateAction<string>>;
	circuito: string;
	setCircuito: React.Dispatch<React.SetStateAction<string>>;
	setTurnoVigente: React.Dispatch<React.SetStateAction<string>>;
}

interface Option {
	id: string;
	descripcion: string;
	probabilidad?: string;
	impacto?: string;
	codigo?: string;
	horaInicio?: string;
	horaFin?: string;
	diasSemana?: number[];
}

const EditStepOne: React.FC<EditStepOneProps> = ({
	tagPrefijo,
	setTagPrefijo,
	tagCentro,
	setTagCentro,
	tagSubfijo,
	setTagSubfijo,
	descripcion,
	setDescripcion,
	disciplina,
	setDisciplina,
	circuito,
	setCircuito,
	setTurnoVigente,
}) => {
	useUserSession();
	const [tagPrefijos, setTagPrefijos] = useState<Option[]>([]);
	const [tagCentros, setTagCentros] = useState<Option[]>([]);
	const [disciplinas, setDisciplinas] = useState<Option[]>([]);
	const [turnos, setTurnos] = useState<Option[]>([]);
	const [circuitos, setCircuitos] = useState<Option[]>([]);
	const [currentTime, setCurrentTime] = useState<string>("");
	const [currentShift, setCurrentShift] = useState<string>("");
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const now = new Date();
		const formattedTime = now.toLocaleString("es-ES", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
		});
		setCurrentTime(formattedTime);

		if (turnos.length > 0) {
			const currentHour = now.getHours();
			const currentMinute = now.getMinutes();
			const currentDayOfWeek = now.getDay();
			const adjustedDayOfWeek = currentDayOfWeek === 0 ? 7 : currentDayOfWeek;

			const currentTimeInMinutes = currentHour * 60 + currentMinute;

			const activeShift = turnos.find((shift) => {
				const appliesToDay = shift.diasSemana ? shift.diasSemana.includes(adjustedDayOfWeek) : true;
				if (!appliesToDay) return false;

				const [startHour, startMinute] = shift.horaInicio!.split(":").map(Number);
				const [endHour, endMinute] = shift.horaFin!.split(":").map(Number);

				const startTimeInMinutes = startHour * 60 + startMinute;
				const endTimeInMinutes = endHour * 60 + endMinute;

				if (endTimeInMinutes < startTimeInMinutes) {
					if (currentTimeInMinutes >= startTimeInMinutes) {
						return true;
					} else if (currentTimeInMinutes <= endTimeInMinutes) {
						const previousDay = adjustedDayOfWeek === 1 ? 7 : adjustedDayOfWeek - 1;
						return shift.diasSemana ? shift.diasSemana.includes(previousDay) : true;
					}
					return false;
				} else {
					return currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes <= endTimeInMinutes;
				}
			});

			if (activeShift) {
				setCurrentShift(activeShift.descripcion);
				setTurnoVigente(activeShift.id);
				setError(null);
			} else {
				setCurrentShift("No se encontró un turno activo");
				setTurnoVigente("5"); // Valor por defecto para el turno "DÍA"
				setError("No se encontró un turno activo. Se asignó el turno 'DÍA' por defecto.");
			}
		}
	}, [turnos, setTurnoVigente]);

	useEffect(() => {
		const fetchData = async (url: string, setState: React.Dispatch<React.SetStateAction<Option[]>>) => {
			try {
				const response = await fetch(url);
				const data = await response.json();
				setState(data.values);
			} catch (error) {
				console.error(`Error al obtener datos de ${url}:`, error);
				setError(`Error al cargar datos: ${error.message}`);
			}
		};

		fetchData("/api/maestras/subarea", setTagPrefijos);
		fetchData("/api/maestras/activo", setTagCentros);
		fetchData("/api/maestras/disciplina", setDisciplinas);
		fetchData("/api/maestras/turno", setTurnos);
		fetchData("/api/maestras/circuito", setCircuitos);
	}, []);

	useEffect(() => {
		const fetchSolicitudData = async () => {
			const urlParams = new URLSearchParams(window.location.search);
			const id = urlParams.get("id");
			if (id) {
				try {
					const response = await fetch(`/api/solicitudes/forzado/${id}`);
					const result = await response.json();

					if (result.success && result.data.length > 0) {
						const solicitud = result.data[0];
						// Solo actualiza si los estados están vacíos
						setTagPrefijo((prev) => prev || String(solicitud.tagPrefijo));
						setTagCentro((prev) => prev || String(solicitud.tagCentro));
						setTagSubfijo((prev) => prev || solicitud.tagSubfijo || "");
						setDescripcion((prev) => prev || solicitud.descripcion || "");
						setDisciplina((prev) => prev || String(solicitud.disciplina));
						setCircuito((prev) => prev || String(solicitud.circuito || ""));
					} else {
						console.error("No se encontraron datos para la solicitud.");
						setError("No se encontraron datos para la solicitud.");
					}
				} catch (error) {
					console.error("Error al obtener datos de la solicitud:", error);
					setError(`Error al obtener datos de la solicitud: ${error.message}`);
				}
			}
		};
		fetchSolicitudData();
	}, []);

	return (
		<form className="space-y-6">
			<div>
				<label className="block text-lg font-medium text-gray-600 mb-2">
					<b>Fecha y Hora de la Solicitud:</b> {currentTime} <br />
					<b>Turno Vigente:</b> {currentShift}
				</label>
				{error && <div className="text-red-600">{error}</div>}
				<h2 className="text-center font-semibold text-2xl mb-2">Datos generales</h2>
			</div>

			<div>
				<label className="block text-sm font-medium text-gray-600 mb-2">Sub Área (Tag Prefijo) *</label>
				<select
					value={tagPrefijo}
					onChange={(e) => setTagPrefijo(e.target.value)}
					className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
					required
				>
					<option disabled value="">
						Seleccione Sub Área
					</option>
					{tagPrefijos.map((prefijo) => (
						<option key={prefijo.id} value={prefijo.id}>
							{prefijo.codigo} {prefijo.descripcion}
						</option>
					))}
				</select>
			</div>

			<div>
				<label className="block text-sm font-medium text-gray-600 mb-2">Activo (Tag Centro) *</label>
				<select
					value={tagCentro}
					onChange={(e) => setTagCentro(e.target.value)}
					className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
					required
				>
					<option disabled value="">
						Seleccione Activo
					</option>
					{tagCentros.map((centro) => (
						<option key={centro.id} value={centro.id}>
							{centro.codigo} {centro.descripcion}
						</option>
					))}
				</select>
			</div>

			<div>
				<label className="block text-sm font-medium text-gray-600 mb-2">Tag Subfijo *</label>
				<input
					type="text"
					value={tagSubfijo}
					onChange={(e) => setTagSubfijo(e.target.value)}
					className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
					placeholder="Ingrese Tag Subfijo"
					required
				/>
			</div>

			<div>
				<label className="block text-sm font-medium text-gray-600 mb-2">Descripción *</label>
				<textarea
					value={descripcion}
					onChange={(e) => setDescripcion(e.target.value)}
					className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
					placeholder="Ingrese una descripción"
					rows={3}
					required
				/>
				<div className="text-right text-xs text-gray-500 mt-1">
					{descripcion.length}/{1999} caracteres
				</div>
			</div>

			<div>
				<label className="block text-sm font-medium text-gray-600 mb-2">Disciplina *</label>
				<select
					value={disciplina}
					onChange={(e) => setDisciplina(e.target.value)}
					className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
					required
				>
					<option disabled value="">
						Seleccione Disciplina
					</option>
					{disciplinas.map((disciplina) => (
						<option key={disciplina.id} value={disciplina.id}>
							{disciplina.descripcion}
						</option>
					))}
				</select>
			</div>

			<div>
				<div className="flex justify-between">
					<label className="block text-sm font-medium text-gray-600 mb-2">Circuito *</label>
					<Help imagePath={"/images/MGFSN Circuitos ABC v1.png"} description={"Ver más"} />
				</div>
				<select value={circuito} onChange={(e) => setCircuito(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
					<option disabled value="">
						Seleccione Circuito
					</option>
					{circuitos.map((circuito) => (
						<option key={circuito.id} value={circuito.id}>
							{circuito.descripcion}
						</option>
					))}
				</select>
			</div>
		</form>
	);
};

export default EditStepOne;
