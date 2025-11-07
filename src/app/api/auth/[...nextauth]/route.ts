 

import NextAuth from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import { poolPromise } from "@sql/lib/db";
import bcrypt from "bcrypt";

 
 


const handler = NextAuth({
	providers: [
		CredentialsProvider({
			name: "Credentials",
			credentials: {
				username: { label: "Username", type: "text" },
				password: { label: "Password", type: "password" }
		
			},
			async authorize(credentials) {
				const { username, password } = credentials ?? {};
				const pool = await poolPromise;
				let isAuthenticated = null;
		 
						const result = await pool.request().query(`SELECT u.*, A.DESCRIPCION FROM MAE_USUARIO as u
								INNER JOIN MAE_AREA A on u.AREA_ID = A.AREA_ID
								WHERE U.USUARIO = '${username}' and U.ESTADO = 1`);
	
						if (result.recordset.length === 0) {
							//let password1=encodeURI(password);

							const res = await fetch(`http://localhost:${process.env.PORT_AD}/ad/user?username=${username}&password1=${password}`);
							if(res.ok===true && res.status===200){
								isAuthenticated= await res.json()
							 
								return {
									id: null,
									name: isAuthenticated["cn"], 
									email: isAuthenticated["mail"], 
									area: null,
								};
							 
							}else{
								throw new Error("El usuario no existe");
							}
					
						}
	
						const registeredHash = result.recordset[0].PASSWORD;
	
						if (await bcrypt.compare(password ?? "", registeredHash)) {
							return {
								id: result.recordset[0].ID,
								name: result.recordset[0].NOMBRE,
								email: result.recordset[0].CORREO,
								area: result.recordset[0].AREA,
							};
						} else {
						
							const res = await fetch(`http://localhost:${process.env.PORT_AD}/ad/user?username=${username}&password1=${password}`);
							if(res.ok===true && res.status===200){
								isAuthenticated= await res.json()
							 
								return {
									id: null,
									name: isAuthenticated["cn"], 
									email: isAuthenticated["mail"], 
									area: null,
								};
							 
							}else{

								throw new Error("Credenciales Incorrectas");
							}
						}

						
						return null;
			
			},
		}),
	],
	pages: {
		signIn: "/auth/ingresar",
	},
	session: {
		strategy: "jwt",
		maxAge:372800 
	},
	callbacks: {
		async redirect({ url, baseUrl }) {
			console.log(" servicios en:", url, "Base URL:", baseUrl);
			return url.startsWith(baseUrl) ? url : baseUrl;
		},
	},
	secret: process.env.NEXTAUTH_SECRET || "lvjancarrion",
});

export { handler as GET, handler as POST };
