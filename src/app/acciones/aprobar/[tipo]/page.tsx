"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Popover from "@/components/Popover";



const AprobarPage = () => {
	const searchParams = useSearchParams();
	const action = searchParams.get("action");

	const token = searchParams.get("token");
	const id = searchParams.get("id");
	const usuario = searchParams.get("bsx");

	const [message, setMessage] = useState("");
	const [type, setType] = useState<"success" | "error">("success");
	const [show, setShow] = useState(false);

	const handleSolicitudAlta = () => {
		fetch("/api/solicitudes/forzado/aprobar", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ id, usuario, token }),
		})
			.then((response) => response.json())
			.then((data) => {
				setMessage(data.message);
				setType(data.success ? "success" : "error");
				setShow(true);
			})
			.catch((error) => {
				setMessage(error.message || "Error al procesar la solicitud de forzado");
				setType("error");
				setShow(true);
			});
	};

	const handleSolicitudBaja = () => {
		fetch("/api/solicitudes/retiro/aprobar", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ id, usuario, token }),
		})
			.then((response) => response.json())
			.then((data) => {
				setMessage(data.message);
				setType(data.success ? "success" : "error");
				setShow(true);
			})
			.catch((error) => {
				setMessage(error.message || "Error al procesar la solicitud de retiro");
				setType("error");
				setShow(true);
			});
	};

	useEffect(() => {
		if (token && id) {
			if (action === "forzado") {
				handleSolicitudAlta();
			} else if (action === "retiro") {
				handleSolicitudBaja();
			}
		}
	}, [token, id, usuario, action]);
	

	return (
		<div>
			<Popover message={message} type={type} show={show} />
		</div>
	);
};

export default AprobarPage;