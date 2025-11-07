"use client";

import Table from "@/components/Table";
import React, { useState, useEffect, useCallback } from "react";
import Popover from "@/components/Popover";
import { FaSpinner } from "react-icons/fa";

export interface Role {
	id: number;
	descripcion: string;
}

interface Option {
	id: number;
	descripcion: string;
	codigo?: string;
}

export interface Row {
	id: number;
	prefijoId: string;
	centroId: string;
	sufijo: string;
	probabilidadId: number;
	impactoId: number;
	descripcion?: string;
	tagConcat?: string;
	prefijoCodigo?: string;
	prefijoDescripcion?: string;
	centroCodigo?: string;
	centroDescripcion?: string;
	riesgo_descripcion?: string;
	interlock?: number;
	riesgoAId?: number;
	riesgoADescripcion?: string;
}

const Page = () => {
	const [matrizData, setMatrizData] = useState<Row[]>([]);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [popoverMessage, setPopoverMessage] = useState("");
	const [popoverType, setPopoverType] = useState<"success" | "error">("success");
	const [showPopover, setShowPopover] = useState(false);
	const [newRecord, setNewRecord] = useState<Row>({
		id: 0,
		prefijoId: "",
		centroId: "",
		sufijo: "",
		probabilidadId: 0,
		impactoId: 0,
		descripcion: "--", // Default value set to "--"
		tagConcat: "",
		riesgo_descripcion: "",
		interlock: 0,
		riesgoAId: 0,
		riesgoADescripcion: "",
	});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [riesgoMap, setRiesgoMap] = useState<{ [key: string]: string }>({});
	const [tagPrefijos, setTagPrefijos] = useState<Option[]>([]);
	const [tagCentros, setTagCentros] = useState<Option[]>([]);
	const [probabilidades, setProbabilidades] = useState<Option[]>([]);
	const [impactos, setImpactos] = useState<Option[]>([]);
	const [riesgoAOptions, setRiesgoAOptions] = useState<Option[]>([]);
	const [isDataLoaded, setIsDataLoaded] = useState(false);

	const fetchRiesgoMap = useCallback(async () => {
		try {
			const response = await fetch("/api/maestras/matriz-riesgo");
			const result = await response.json();
			console.log("Riesgo map response:", result);
			const map: { [key: string]: string } = {};
			if (result.success && result.values) {
				result.values.forEach((row: any) => {
					const key = `${row.probabilidad_id}-${row.impacto_id}`;
					map[key] = row.riesgo_descripcion || "N/A";
				});
			}
			setRiesgoMap(map);
			return map;
		} catch (error) {
			console.error("Error fetching riesgo map:", error);
			return {};
		}
	}, []);

	const fetchParameters = async (url: string, setState: React.Dispatch<React.SetStateAction<Option[]>>) => {
		try {
			console.log(`Fetching data from ${url}...`);
			const response = await fetch(url);
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			const data = await response.json();
			console.log(`Data received from ${url}:`, data);
			setState(data.values || []);
		} catch (error) {
			console.error(`Error fetching data from ${url}:`, error);
			setState([]);
		}
	};

	const fetchData = useCallback(async (map: { [key: string]: string }) => {
		try {
			console.log("Fetching matriz data...");
			const response = await fetch("/api/maestras/tags-matriz-riesgo");
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			const result = await response.json();
			console.log("Matriz data received:", result);

			const updatedData = result.values.map((item: Row) => {
				const key = `${item.probabilidadId}-${item.impactoId}`;
				const riesgoDescripcion = map[key] || "N/A";
				console.log(`Mapping riesgo for key ${key}: ${riesgoDescripcion}`);

				return {
					...item,
					prefijoId: String(item.prefijoId) || "",
					centroId: String(item.centroId) || "",
					descripcion: item.descripcion || "--", // Ensure existing records also default to "--" if undefined
					tagConcat: item.tagConcat || "",
					prefijoCodigo: item.prefijoCodigo || "",
					prefijoDescripcion: item.prefijoDescripcion || "",
					centroCodigo: item.centroCodigo || "",
					centroDescripcion: item.centroDescripcion || "",
					riesgo_descripcion: riesgoDescripcion,
					interlock: item.interlock || 0,
					riesgoAId: item.riesgoAId || 0,
					riesgoADescripcion: item.riesgoADescripcion || "N/A",
				};
			});

			setMatrizData(updatedData || []);
		} catch (error) {
			console.error("Error fetching matriz data:", error);
			setMatrizData([]);
		}
	}, []);

	useEffect(() => {
		if (!isDataLoaded) {
			fetchRiesgoMap().then((map) => {
				fetchData(map);
				fetchParameters("/api/maestras/subarea", setTagPrefijos);
				fetchParameters("/api/maestras/activo", setTagCentros);
				fetchParameters("/api/maestras/probabilidad", setProbabilidades);
				fetchParameters("/api/maestras/impacto", setImpactos);
				fetchParameters("/api/maestras/riesgo-a", setRiesgoAOptions);
				setIsDataLoaded(true);
			});
		}
	}, [isDataLoaded]);

	const getDescriptionById = (id: string | number, options: Option[], field: "codigo" | "id" = "id"): string => {
		const idStr = id ? id.toString() : "0";
		const option = options.find((opt) => opt[field]?.toString() === idStr);
		return option ? option.descripcion : "N/A";
	};

	const generateTagConcat = (prefijoId: string, centroId: string, sufijo: string): string => {
		const prefijo = tagPrefijos.find((p) => p.codigo === prefijoId)?.codigo || "";
		const centro = tagCentros.find((c) => c.codigo === centroId)?.codigo || "";
		return `${prefijo}-${centro}-${sufijo}`.toUpperCase();
	};

	const getRiesgoClass = (riesgo: string): string => {
		switch (riesgo.toLowerCase()) {
			case "bajo":
				return "bg-green-600 text-gray-200 font-bold";
			case "moderado":
				return "bg-[#FBBC04] text-white font-bold";
			case "alto":
				return "bg-red-500 text-white font-bold";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const handleCreateOrUpdate = async () => {
		setIsSubmitting(true);
		if (!newRecord.prefijoId || !newRecord.centroId || !newRecord.sufijo || !newRecord.probabilidadId || !newRecord.impactoId || !newRecord.descripcion) {
			alert("Por favor, complete todos los campos.");
			setIsSubmitting(false);
			return;
		}

		const tagConcat = generateTagConcat(newRecord.prefijoId, newRecord.centroId, newRecord.sufijo);
		const updatedRecord = { ...newRecord, tagConcat };

		try {
			const method = isEditing ? "PUT" : "POST";
			const response = await fetch("/api/maestras/tags-matriz-riesgo", {
				method,
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(updatedRecord),
			});

			const result = await response.json();
			if (result.success) {
				await fetchData(riesgoMap);
				setPopoverMessage(isEditing ? "Registro actualizado correctamente" : "Registro creado correctamente");
				setPopoverType("success");
			} else {
				setPopoverMessage(result.message || (isEditing ? "Error al actualizar el registro" : "Error al crear el registro"));
				setPopoverType("error");
			}
		} catch (error) {
			console.error("Error creating/updating record:", error);
			setPopoverMessage(isEditing ? "Error al actualizar el registro" : "Error al crear el registro");
			setPopoverType("error");
		}

		setShowPopover(true);
		setTimeout(() => setShowPopover(false), 3000);
		setIsSubmitting(false);
		setIsModalOpen(false);
		setNewRecord({
			id: 0,
			prefijoId: "",
			centroId: "",
			sufijo: "",
			probabilidadId: 0,
			impactoId: 0,
			descripcion: "--",
			tagConcat: "",
			riesgo_descripcion: "",
			interlock: 0,
			riesgoAId: 0,
			riesgoADescripcion: "",
		});
	};

	const handleEdit = (id: number) => {
		const row = matrizData.find((rowx) => rowx.id === id);
		if (row) {
			setIsEditing(true);
			setIsModalOpen(true);
			setNewRecord({
				...row,
				prefijoId: row.prefijoCodigo || "",
				centroId: row.centroCodigo || "",
				riesgo_descripcion: row.riesgo_descripcion || "",
				interlock: row.interlock || 0,
				riesgoAId: row.riesgoAId || 0,
				riesgoADescripcion: row.riesgoADescripcion || "",
			});
		}
	};

	return (
		<div className="space-y-6 p-4">
			<div className="space-y-4">
				<div className="flex justify-end">
					<button
						onClick={() => {
							setIsEditing(false);
							setIsModalOpen(true);
							setNewRecord({
								id: 0,
								prefijoId: "",
								centroId: "",
								sufijo: "",
								probabilidadId: 0,
								impactoId: 0,
								descripcion: "--",
								tagConcat: "",
								riesgo_descripcion: "",
								interlock: 0,
								riesgoAId: 0,
								riesgoADescripcion: "",
							});
						}}
						className="px-4 py-2 bg-green-500 text-white rounded-md active:bg-green-600 hover:bg-green-600"
					>
						Añadir Registro
					</button>
				</div>
				<Table
					columns={[
						{ key: "id", label: "ID" },
						{ key: "tagConcat", label: "Tag concatenado" },
						{ key: "prefijo", label: "Tag prefijo" },
						{ key: "centro", label: "Tag centro" },
						{ key: "sufijo", label: "Tag sufijo" },
						{ key: "interlock", label: "Interlock" },
						{ key: "riesgoA", label: "Riesgo A" },
						{ key: "probabilidad", label: "Probabilidad" },
						{ key: "impacto", label: "Impacto" },
						{ key: "riesgo_descripcion", label: "Nivel de Riesgo" },
						{ key: "descripcion", label: "Descripción" },
					]}
					rows={matrizData.map((rowx) => {
						console.log("Row data for debugging:", rowx);
						console.log("Probabilidades array:", probabilidades);
						console.log("Impactos array:", impactos);

						const riesgoClass = getRiesgoClass(rowx.riesgo_descripcion || "N/A");

						return {
							...rowx,
							prefijo: rowx.prefijoCodigo ? `${rowx.prefijoCodigo} | ${rowx.prefijoDescripcion || "N/A"}` : "N/A",
							centro: rowx.centroCodigo ? `${rowx.centroCodigo} | ${rowx.centroDescripcion || "N/A"}` : "N/A",
							probabilidad: getDescriptionById(rowx.probabilidadId || 0, probabilidades, "id"),
							impacto: getDescriptionById(rowx.impactoId || 0, impactos, "id"),
							riesgo_descripcion: <span className={`inline-block w-full text-center py-1 rounded ${riesgoClass}`}>{rowx.riesgo_descripcion || "N/A"}</span>,
							descripcion: rowx.descripcion || "--",
							tagConcat: rowx.tagConcat || "N/A",
							interlock: rowx.interlock === 1 ? "Si" : "No",
							riesgoA: rowx.riesgoADescripcion || "N/A",
						};
					})}
					onEdit={handleEdit}
					actions={["edit"]}
				/>
			</div>

			{isModalOpen && (
				<div className="fixed inset-0 bg-gray-400 bg-opacity-50 flex items-center justify-center p-4">
					<div className="absolute inset-0 bg-black bg-opacity-50"></div>
					<div className="relative bg-white p-6 rounded-lg shadow-lg w-1/3 z-60">
						<h2 className="text-lg font-semibold mb-4">{isEditing ? "Editar registro" : "Crear nuevo registro"}</h2>

						<div>
							<div className="mb-4">
								<label className="block text-sm font-medium mb-2">Prefijo (sub área) *</label>
								<select className="w-full p-2 border rounded-lg" value={newRecord.prefijoId} onChange={(e) => setNewRecord({ ...newRecord, prefijoId: e.target.value })}>
									<option disabled value="">Seleccionar opción</option>
									{tagPrefijos.map((option) => (
										<option key={option.codigo} value={option.codigo}>
											{option.codigo + " | " + option.descripcion}
										</option>
									))}
								</select>
							</div>
							<div className="mb-4">
								<label className="block text-sm font-medium mb-2">Tag Centro (activo) *</label>
								<select className="w-full p-2 border rounded-lg" value={newRecord.centroId} onChange={(e) => setNewRecord({ ...newRecord, centroId: e.target.value })}>
									<option disabled value="">Seleccionar opción</option>
									{tagCentros.map((option) => (
										<option key={option.codigo} value={option.codigo}>
											{option.codigo + " | " + option.descripcion}
										</option>
									))}
								</select>
							</div>
							<div className="mb-4">
								<label className="block text-sm font-medium mb-2">Interlock *</label>
								<select className="w-full p-2 border rounded-lg" value={newRecord.interlock === 1 ? "Si" : "No"} onChange={(e) => setNewRecord({ ...newRecord, interlock: e.target.value === "Si" ? 1 : 0 })}>
									<option disabled value="">Seleccionar opción</option>
									<option value="No">No</option>
									<option value="Si">Si</option>
								</select>
							</div>
							<div className="mb-4">
								<label className="block text-sm font-medium mb-2">Riesgo a *</label>
								<select
									className="w-full p-2 border rounded-lg"
									value={newRecord.riesgoAId || ""}
									onChange={(e) => {
										const selectedId = Number(e.target.value);
										const selectedOption = riesgoAOptions.find((opt) => opt.id === selectedId);
										setNewRecord({ ...newRecord, riesgoAId: selectedId, riesgoADescripcion: selectedOption?.descripcion || "" });
									}}
								>
									<option disabled value="">Seleccionar opción</option>
									{riesgoAOptions.map((option) => (
										<option key={option.id} value={option.id}>
											{option.descripcion}
										</option>
									))}
								</select>
							</div>
						</div>

						<div className="mb-4">
							<label className="block text-sm font-medium mb-2">Tag Sufijo *</label>
							<input type="text" className="w-full p-2 border rounded-lg" value={newRecord.sufijo} onChange={(e) => setNewRecord({ ...newRecord, sufijo: e.target.value })} />
						</div>

						<div>
							<div className="mb-4">
								<label className="block text-sm font-medium mb-2">Probabilidad *</label>
								<select className="w-full p-2 border rounded-lg" value={newRecord.probabilidadId} onChange={(e) => setNewRecord({ ...newRecord, probabilidadId: Number(e.target.value) })}>
									<option disabled value="">Seleccionar opción</option>
									{probabilidades.map((option) => (
										<option key={option.id} value={option.id}>
											{option.descripcion}
										</option>
									))}
								</select>
							</div>
							<div className="mb-4">
								<label className="block text-sm font-medium mb-2">Impacto *</label>
								<select className="w-full p-2 border rounded-lg" value={newRecord.impactoId} onChange={(e) => setNewRecord({ ...newRecord, impactoId: Number(e.target.value) })}>
									<option disabled value="">Seleccionar opción</option>
									{impactos.map((option) => (
										<option key={option.id} value={option.id}>
											{option.descripcion}
										</option>
									))}
								</select>
							</div>
							<div className="mb-4">
								<label className="block text-sm font-medium mb-2">Descripción</label>
								<input type="text" className="w-full p-2 border rounded-lg" placeholder="Escriba aquí la descripción" value={newRecord.descripcion} onChange={(e) => setNewRecord({ ...newRecord, descripcion: e.target.value })} />
							</div>
							<div className="mb-4">
								<label className="block text-sm font-medium mb-2">TAG Concatenado</label>
								<input
									type="text"
									className="w-full p-2 border rounded-lg bg-gray-100 cursor-not-allowed"
									value={newRecord.tagConcat || generateTagConcat(newRecord.prefijoId, newRecord.centroId, newRecord.sufijo) || "N/A"}
									readOnly
								/>
							</div>
						</div>

						<div className="flex justify-end space-x-4">
							<button onClick={() => setIsModalOpen(false)} className={`bg-gray-300 text-gray-800 px-4 py-2 rounded-lg ${isSubmitting ? "cursor-not-allowed" : "hover:bg-gray-400"}`} disabled={isSubmitting}>
								Cancelar
							</button>
							<button
								onClick={handleCreateOrUpdate}
								className={`bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center justify-center ${isSubmitting ? "cursor-not-allowed bg-gray-500" : "hover:bg-blue-600"}`}
								disabled={isSubmitting}
							>
								{isSubmitting && <FaSpinner className="animate-spin mr-2" />}
								{isEditing ? "Guardar cambios" : "Crear"}
							</button>
						</div>
					</div>
				</div>
			)}
			<Popover message={popoverMessage} type={popoverType} show={showPopover} />
		</div>
	);
};

export default Page;
