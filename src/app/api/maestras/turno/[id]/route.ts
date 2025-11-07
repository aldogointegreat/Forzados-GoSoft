// api/maestras/turno/usuario/[id]/route.ts
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
        TU.TURNO_ID AS turnoId, 
        US.USUARIO_ID AS usuarioID,+
        US.USUARIO AS usuario,
        TU.DESCRIPCION AS turnoDesc
         FROM MAE_USUARIO US
         LEFT JOIN TURNO TU ON US.TURNO_ID = TU.TURNO_ID
         WHERE US.USUARIO_ID = @id;`
      );

    if (recordset.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const turnoData = {
      turnoId: recordset[0].turnoId ?? null,
      usuarioID: recordset[0].usuarioID ?? null,
      usuario: recordset[0].usuario ?? null,
       turnoDesc: recordset[0].turnoDesc ?? null,
    };

    return NextResponse.json(turnoData, { status: 200 });
  } catch (error) {
    console.error("Error fetching turno data:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}