import { NextResponse } from "next/server";
import { poolPromise } from "@sql/lib/db";

// Manejo del método GET
export async function GET() {
    try {
        const pool = await poolPromise;
        const { recordset } = await pool.request().query("SELECT SOLICITUD_ID, NOMBRE_ARCHIVO, USUARIO_CREACION, FECHA_CREACION, USUARIO_MODIFICACION, FECHA_MODIFICACION, ETAPA_DOCUMENTO FROM MAE_DATO_ADJUNTO");

        const turnos = recordset.map((singleValue) => {
            return {
                id: singleValue.SOLICITUD_ID,
                nombreArchivo: singleValue.NOMBRE_ARCHIVO,
                usuarioCreacion: singleValue.USUARIO_CREACION,
                fechaCreacion: singleValue.FECHA_CREACION,
                usuarioModificacion: singleValue.USUARIO_MODIFICACION,
                fechaModificacion: singleValue.FECHA_MODIFICACION,
                etapaDocumento: singleValue.ETAPA_DOCUMENTO
            };
        });
        return NextResponse.json({ success: true, values: turnos });
    } catch (error) {
        console.error("Error processing GET:", error);
        return NextResponse.json({ success: false, message: "Error retrieving data" }, { status: 500 });
    }
}