import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { poolPromise } from "@sql/lib/db"; // Tu conexión a la base de datos
import bcrypt from "bcrypt";

const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || "lvjancarrion";

export async function POST(req: NextRequest) {
	try {
		// Parsear la solicitud
		const body = await req.json();
		const { username, password } = body || {};

		// Validar campos requeridos
		if (!username || typeof username !== "string" || username.trim() === "") {
			return NextResponse.json({ message: "Username is required and must be a non-empty string." }, { status: 400 });
		}

		if (!password || typeof password !== "string" || password.trim() === "") {
			return NextResponse.json({ message: "Password is required and must be a non-empty string." }, { status: 400 });
		}

		// Validar credenciales con la base de datos
		const pool = await poolPromise;
		const result = await pool.request().query(`SELECT u.*, A.DESCRIPCION FROM MAE_USUARIO as u
         INNER JOIN MAE_AREA A on u.AREA_ID = A.AREA_ID
         WHERE U.USUARIO = '${username}' AND U.ESTADO = 1`);

		if (result.recordset.length === 0) {
			// Si el usuario no está en la BD local, intentar con Active Directory
			try {
				const res = await fetch(`http://localhost:${process.env.PORT_AD}/ad/user?username=${username}&password1=${password}`);
				
				if (res.ok && res.status === 200) {
					const adUser = await res.json();
					
					// Crear un JWT para usuario de AD
					const token = jwt.sign(
						{
							name: adUser.cn,
							email: adUser.mail,
							areaId: null,
							areaName: null,
							userId: null,
							isADUser: true, // Flag para identificar usuarios de AD
						},
						NEXTAUTH_SECRET,
						{ expiresIn: "24h" }
					);

					return NextResponse.json({ token }, { status: 200 });
				} else {
					return NextResponse.json({ message: "El usuario no existe" }, { status: 401 });
				}
			} catch (adError) {
				console.error("Error connecting to Active Directory:", adError);
				return NextResponse.json({ message: "Error de conexión con Active Directory" }, { status: 503 });
			}
		}

		const user = result.recordset[0];
		const registeredHash = user.PASSWORD;

		// Verificar contraseña de usuario local
		const isPasswordValid = await bcrypt.compare(password, registeredHash);
		
		if (isPasswordValid) {
			// Crear un JWT para usuario local
			const token = jwt.sign(
				{
					name: user.NOMBRE,
					email: user.CORREO,
					areaId: user.AREA_ID,
					areaName: user.DESCRIPCION,
					userId: user.ID,
					isADUser: false,
				},
				NEXTAUTH_SECRET,
				{ expiresIn: "24h" }
			);

			return NextResponse.json({ token }, { status: 200 });
		} else {
			// Si la contraseña local falla, intentar con Active Directory
			try {
				const res = await fetch(`http://localhost:${process.env.PORT_AD}/ad/user?username=${username}&password1=${password}`);
				
				if (res.ok && res.status === 200) {
					const adUser = await res.json();
					
					// Crear un JWT para usuario de AD
					const token = jwt.sign(
						{
							name: adUser.cn,
							email: adUser.mail,
							areaId: null,
							areaName: null,
							userId: null,
							isADUser: true,
						},
						NEXTAUTH_SECRET,
						{ expiresIn: "24h" }
					);

					return NextResponse.json({ token }, { status: 200 });
				} else {
					return NextResponse.json({ message: "Credenciales Incorrectas" }, { status: 401 });
				}
			} catch (adError) {
				console.error("Error connecting to Active Directory:", adError);
				return NextResponse.json({ message: "Credenciales Incorrectas" }, { status: 401 });
			}
		}
	} catch (error) {
		console.error("Error in mobile auth endpoint:", error);
		return NextResponse.json({ message: "Internal server error" }, { status: 500 });
	}
}
