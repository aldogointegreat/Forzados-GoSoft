import React, { useState } from "react";
import { useRouter } from "next/navigation";
import useUserSession from "@/hooks/useSession";
import { signIn } from "next-auth/react";
import Image from "next/image";
import { FaUser, FaLock, FaSignInAlt, FaEye, FaEyeSlash, FaSpinner } from "react-icons/fa";
type ModalLoginProps = {
	isOpen: boolean;
	onClose: () => void;
 
    username: string;
    setUsername: (username: string) => void;
};

const ModalLogin: React.FC<ModalLoginProps> = ({ isOpen, onClose,  username,setUsername }) => {
 
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [loading, setLoading] = useState(false);
	const [errors, setErrors] = useState({ username: "", password: "" });
	const { fetchUserFromServer } = useUserSession();
	const router = useRouter();

	const handleLogin = async (e: React.FormEvent) => {
		setLoading(true);
		e.preventDefault();

		const upperUsername = username.toUpperCase();
		const newErrors = { username: "", password: "" };

		const validateUsername = (username: string) => {
			const usernameRegex = /^[A-ZÑ]{5,20}$/;
			return usernameRegex.test(username);
		};
		const validatePassword = (password: string) => {
			const errors = [];
			if (!/.{8,}/.test(password)) errors.push("al menos 8 caracteres");
			return errors;
		};

		// Validación de usuario
		if (!upperUsername) {
			newErrors.username = "El usuario es obligatorio ";
		} else if (!validateUsername(upperUsername)) {
			newErrors.username = "El usuario debe tener entre 5 y 20 letras mayúsculas";
		}

		// Validación de contraseña
		const passwordErrors = validatePassword(password);
		if (!password) {
			newErrors.password = "La contraseña es obligatoria";
		} else if (passwordErrors.length > 0) {
			newErrors.password = `La contraseña debe tener ${passwordErrors.join(", ")}`;
		}

		if (newErrors.username || newErrors.password) {
			setErrors(newErrors);
			setLoading(false);
			setTimeout(() => {
				setErrors({ username: "", password: "" });
			}, 2000);
			return;
		}
		const result = await signIn("credentials", {
			redirect: false,
			username: upperUsername,
			password,
			isAD: false,
			callbackUrl: "/dashboard",
		});

		if (result?.error) {
			setLoading(false);
			setErrors({ ...newErrors, password: "Credenciales incorrectas" });

			setTimeout(() => {
				setErrors({ username: "", password: "" });
			}, 2000);
			return;
		}

		const result2 = await fetchUserFromServer(upperUsername);

		if (!result2) {
			setLoading(false);
			setErrors({ ...newErrors, password: "Credenciales incorrectas" });

			setTimeout(() => {
				setErrors({ username: "", password: "" });
			}, 2000);
			return;
		}

		// Si la autenticación fue exitosa
		setErrors({ username: "", password: "" });

		setTimeout(() => {
			setLoading(false);
			router.push("/dashboard/consultas");
		}, 0);
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 flex items-center justify-center z-50">
			{/* Fondo oscuro que cierra el modal */}
			<div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>

			{/* Contenedor del modal */}
			<div
				className="relative bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6"
				onClick={(e) => e.stopPropagation()} // Evita que el modal se cierre al hacer clic dentro
			>
				<button onClick={onClose} className="absolute top-2 right-2">
					✖
				</button>

				<div className="flex justify-center">
					<Image src="/images/logo.svg" alt="Logo" width={100} height={85} />
				</div>

				<h2 className="text-2xl font-semibold text-center text-gray-800 ">
					<span className="text-[#001D39] text-3xl">Forzados GOSOFT</span>
				</h2>

				<form className="space-y-6  pt-6" onSubmit={handleLogin}>
					{/* Campo de Usuario */}
					<div className="relative">
						<FaUser className="absolute left-4 top-5 text-gray-400" />
						<input
							type="text"
							placeholder="Usuario"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							className="w-full pl-10 pr-6 py-4 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-600"
							required
						/>
						{errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
					</div>

					{/* Campo de Contraseña */}
					<div className="relative">
						<FaLock className="absolute left-4 top-5 text-gray-400" />
						<input
							type={showPassword ? "text" : "password"}
							placeholder="Contraseña"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="w-full pl-10 pr-10 py-4 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-600"
							required
						/>
						<button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-5 text-gray-400">
							{showPassword ? <FaEyeSlash /> : <FaEye />}
						</button>
						{errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
					</div>

					{/* Botón de Iniciar Sesión */}
					<button
						disabled={loading}
						type="submit"
						className="w-full flex items-center justify-center px-4 py-4 text-white bg-sky-950 hover:bg-sky-800 rounded-lg transition duration-200 focus:outline-none"
					>
						<FaSignInAlt className="mr-2" />
					
                        {loading ? <FaSpinner className="animate-spin" /> : "Iniciar Sesión"}
					</button>
				</form>
			</div>
		</div>
	);
};

export default ModalLogin;
