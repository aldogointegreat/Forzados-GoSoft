import { NextResponse } from "next/server";
import { poolPromise } from "@sql/lib/db";

// TAG CENTRO_______________________________________________________________

// Manejo del método GET
export async function GET() {
	try {
		const pool = await poolPromise;
		const { recordset } = await pool.request().query("SELECT u.* FROM MAE_USUARIO u JOIN MAE_PUESTO p ON u.PUESTO_ID = p.PUESTO_ID JOIN MAE_PUESTO_ROL pr ON p.PUESTO_ID = pr.PUESTO_ID JOIN MAE_ROL r ON pr.ROL_ID = r.ROL_ID WHERE r.DESCRIPCION = 'APROBADOR';");

		const turnos = recordset.map((singleValue) => {
			return {
				id: singleValue.USUARIO_ID,
				nombre: singleValue.NOMBRE + " " + singleValue.APEPATERNO + " " + singleValue.APEMATERNO,
			};
		});
		return NextResponse.json({ success: true, values: turnos });
	} catch (error) {
		console.error("Error processing GET:", error);
		return NextResponse.json({ success: false, message: "Error retrieving data" }, { status: 500 });
	}
}

