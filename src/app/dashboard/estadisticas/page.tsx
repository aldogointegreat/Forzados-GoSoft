"use client";

import React, { useEffect, useState } from "react";
import { FaCheckCircle, FaClock, FaTimesCircle, FaPlayCircle, FaLock, FaLockOpen } from "react-icons/fa";
import { IoIosWarning } from "react-icons/io";

const getRandomColor = () => {
	const colors = ["bg-red-500", "bg-green-500", "bg-blue-500", "bg-yellow-500", "bg-purple-500"];
	return colors[Math.floor(Math.random() * colors.length)];
};

const Estadisticas: React.FC = () => {
	const [stats, setStats] = useState({
		aprobadasAlta: 0,
		aprobadasBaja: 0,

		pendientesAlta: 0,
		pendientesBaja: 0,

		rechazadasAlta: 0,
		rechazadasBaja: 0,

		ejecutadasAlta: 0,
		ejecutadasBaja: 0,

		finalizadas: 0,
	});

	const [areaStats, setAreaStats] = useState<{ [key: string]: number }>({});

	useEffect(() => {
		const fetchStats = async () => {
			try {
				const response = await fetch("/api/estadisticas/solicitudes-por-estado");
				const result = await response.json();
				if (result.success) {
					console.log(result.data);
					setStats(result.data);
				}
			} catch {
				console.error("Error al cargar las estadísticas");
			}
		};

		const fetchAreaStats = async () => {
			try {
				const response = await fetch("/api/estadisticas/solicitudes-por-area");
				const result = await response.json();
				if (result.success) {
					setAreaStats(result.data);
				}
			} catch {
				console.error("Error al cargar las estadísticas por área");
			}
		};

		fetchStats();
		fetchAreaStats();
	}, []);

		const noIniciadoCount =
			stats.aprobadasAlta +
			//stats.aprobadasBaja +
			stats.pendientesAlta +
			//stats.pendientesBaja +
			stats.rechazadasAlta;
			// stats.rechazadasBaja;
		const abiertosCount =
			stats.ejecutadasAlta +
			// stats.ejecutadasBaja +
			stats.aprobadasBaja +
			stats.pendientesBaja +
			stats.rechazadasBaja;

	return (
		<div className="p-6 bg-gray-50 min-h-screen">
			<h1 className="text-2xl font-bold mb-6 mt-8">Forzados Abierto y Cerrado</h1>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<div className="bg-white p-4 rounded-lg shadow flex items-center">
					<IoIosWarning className="text-[#6099F6] w-10 h-10 mr-4" />
					<div>
						<h2 className="text-lg font-semibold">Forzados No Iniciados</h2>
						<p className="text-2xl">{noIniciadoCount}</p>
					</div>
				</div>
				<div className="bg-white p-4 rounded-lg shadow flex items-center">
					<FaLockOpen className="text-[#EA4335] w-10 h-10 mr-4" />
					<div>
						<h2 className="text-lg font-semibold">Forzados Abiertos</h2>
						<p className="text-2xl">{abiertosCount}</p>
					</div>
				</div>
				
				<div className="bg-white p-4 rounded-lg shadow flex items-center">
					<FaLock className="text-[#4CA154] w-10 h-10 mr-4"/>
					<div>
						<h2 className="text-lg font-semibold">Forzados Cerrados</h2>
						<p className="text-2xl">{stats.finalizadas}</p>
					</div>
				</div>
			</div>
			<div className="mt-8">
				<h2 className="text-2xl font-bold mb-6">Solicitudes por área (cualquier estado)</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
					{Object.entries(areaStats).map(([area, count]) => (
						<div key={area} className="bg-white p-4 rounded-lg shadow flex items-center">
							<div className={`w-10 h-10 rounded-full mr-4 ${getRandomColor()}`}></div>
							<div>
								<h3 className="text-lg font-semibold">{area}</h3>
								<p className="text-2xl">{count}</p>
							</div>
						</div>
					))}
				</div>
			</div>
			<h1 className="text-2xl font-bold mb-6 mt-8">Estadísticas de Solicitudes</h1>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				<div className="bg-white p-4 rounded-lg shadow flex items-center">
					<FaCheckCircle className="text-[#6099F6] w-10 h-10 mr-4" />
					<div>
						<h2 className="text-lg font-semibold">Forzados Aprobados</h2>
						<p className="text-2xl">{stats.aprobadasAlta}</p>
					</div>
				</div>

				<div className="bg-white p-4 rounded-lg shadow flex items-center">
					<FaClock className="text-[#FBBC04] w-10 h-10 mr-4" />
					<div>
						<h2 className="text-lg font-semibold">Forzados Pendientes</h2>
						<p className="text-2xl">{stats.pendientesAlta}</p>
					</div>
				</div>
				<div className="bg-white p-4 rounded-lg shadow flex items-center">
					<FaTimesCircle className="text-[#F28E86] w-10 h-10 mr-4" />
					<div>
						<h2 className="text-lg font-semibold">Forzados Rechazados</h2>
						<p className="text-2xl">{stats.rechazadasAlta}</p>
					</div>
				</div>
				<div className="bg-white p-4 rounded-lg shadow flex items-center">
					<FaPlayCircle className="text-[#EA4335] w-10 h-10 mr-4" />
					<div>
						<h2 className="text-lg font-semibold">Forzados Ejecutados</h2>
						<p className="text-2xl">{stats.ejecutadasAlta}</p>
					</div>
				</div>
				<div className="bg-white p-4 rounded-lg shadow flex items-center">
					<FaCheckCircle className="text-[#6099F6] w-10 h-10 mr-4" />
					<div>
						<h2 className="text-lg font-semibold">Retiros Aprobados</h2>
						<p className="text-2xl">{stats.aprobadasBaja}</p>
					</div>
				</div>
				<div className="bg-white p-4 rounded-lg shadow flex items-center">
					<FaClock className="text-[#FBBC04] w-10 h-10 mr-4" />
					<div>
						<h2 className="text-lg font-semibold">Retiros Pendientes</h2>
						<p className="text-2xl">{stats.pendientesBaja}</p>
					</div>
				</div>
				{/* <div className="bg-white p-4 rounded-lg shadow flex items-center">
					<FaPlayCircle className="text-blue-500 w-10 h-10 mr-4" />
					<div>
						<h2 className="text-lg font-semibold">Retiros Ejecutados</h2>
						<p className="text-2xl">{stats.ejecutadasBaja}</p>
					</div>
				</div> */}
				<div className="bg-white p-4 rounded-lg shadow flex items-center">
					<FaTimesCircle className="text-[#F28E86] w-10 h-10 mr-4" />
					<div>
						<h2 className="text-lg font-semibold">Retiros Rechazados</h2>
						<p className="text-2xl">{stats.rechazadasBaja}</p>
					</div>
				</div>
				<div className="bg-white p-4 rounded-lg shadow flex items-center">
					<FaCheckCircle className="text-[#4CA154] w-10 h-10 mr-4" />
					<div>
						<h2 className="text-lg font-semibold">Forzados Finalizados</h2>
						<p className="text-2xl">{stats.finalizadas}</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Estadisticas;
