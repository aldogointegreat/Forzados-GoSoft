// api/maestras/turno/usuarios/route.ts
import { NextRequest, NextResponse } from "next/server";
import { poolPromise } from "@sql/lib/db";

export async function GET(req: NextRequest) {
  // Obtener el parámetro turno de la query
  const { searchParams } = new URL(req.url);
  const turno = searchParams.get("turno");

  try {
    // Validar que el parámetro turno esté presente
    if (!turno) {
      return NextResponse.json(
        { success: false, message: "El parámetro 'turno' es requerido." },
        { status: 400 }
      );
    }

    const pool = await poolPromise;
    const { recordset } = await pool
      .request()
      .input("turno", turno)
      .query(
        `SELECT 
          US.USUARIO_ID AS id,
          US.NOMBRE AS nombre,
          US.APEPATERNO AS apePaterno,
          US.APEMATERNO AS apeMaterno,
          US.PUESTO_ID AS puesto,
          US.TURNO_ID AS turnoId
        FROM MAE_USUARIO US
        WHERE US.TURNO_ID = @turno;`
      );

    // Si no hay usuarios para ese turno
    if (recordset.length === 0) {
      return NextResponse.json(
        { success: true, values: [] },
        { status: 200 }
      );
    }

    // Formatear los datos para que coincidan con lo esperado por el frontend
    const usuarios = recordset.map((row: any) => ({
      id: row.id,
      nombre: row.nombre,
      apePaterno: row.apePaterno,
      apeMaterno: row.apeMaterno,
      puesto: row.puesto,
      turnoId: row.turnoId ?? null,
    }));

    return NextResponse.json(
      { success: true, values: usuarios },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching usuarios by turno:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}