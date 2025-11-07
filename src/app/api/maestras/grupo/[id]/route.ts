import { NextRequest, NextResponse } from "next/server";
import { poolPromise } from "@sql/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const pool = await poolPromise;
    const { recordset } = await pool
      .request()
      .input("id", id)
      .query(
        `SELECT 
        gru.GRUPO_ID AS grupoId,
        us.USUARIO_ID AS usuarioId,
        us.USUARIO AS usuario,
        gru.NOMBRE AS grupoNombre
        FROM MAE_USUARIO us 
        LEFT JOIN MAE_GRUPO gru ON us.GRUPO_ID = gru.GRUPO_ID
        WHERE us.USUARIO_ID = @id;`
      );

    if (recordset.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const grupoData = {
      grupoId: recordset[0].grupoId ?? null,
      usuarioId: recordset[0].usuarioId ?? null,
      usuario: recordset[0].usuario ?? null,
      grupoNombre: recordset[0].grupoNombre ?? null,
    };

    return NextResponse.json(grupoData, { status: 200 });
  } catch (error) {
    console.error("Error fetching grupo data:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}