import { NextRequest, NextResponse } from "next/server";
import { poolPromise } from "@sql/lib/db";

export async function GET(req: NextRequest, context: any) {
  const { id } = context.params as { id: string };
  try {
    const pool = await poolPromise;
    const { recordset } = await pool
      .request()
      .input("id", id)
      .query(
        `SELECT USX.*,
          AR.DESCRIPCION AS ADESC,
          RO.DESCRIPCION AS RODESC,
          MG.NOMBRE AS GRUPDESC,
          COALESCE(MG.GRUPO_ID, 0) AS GRUPO_ID,
          (
            SELECT STRING_AGG('"' + CAST(ROL.ROL_ID AS NVARCHAR) + '": "' + ROL.DESCRIPCION + '"', ',')
            FROM MAE_PUESTO_ROL PR
            INNER JOIN MAE_ROL ROL ON PR.ROL_ID = ROL.ROL_ID
            WHERE PR.PUESTO_ID = USX.PUESTO_ID
          ) AS ROLES_JSON
        FROM MAE_USUARIO USX
        LEFT JOIN MAE_AREA AR ON USX.AREA_ID = AR.AREA_ID
        LEFT JOIN MAE_ROL RO ON USX.ROL_ID = RO.ROL_ID
        LEFT JOIN MAE_GRUPO MG ON USX.GRUPO_ID = MG.GRUPO_ID
        WHERE USX.USUARIO = @id`
      );

    if (recordset.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("User data from DB:", recordset[0]);
    const userData = {
      id: recordset[0].USUARIO_ID,
      name: `${recordset[0].NOMBRE} ${recordset[0].APEPATERNO} ${recordset[0].APEMATERNO}`.trim(),
      area: recordset[0].ADESC || "No Area",
      grupo: recordset[0].GRUPDESC || "No Group",
      groupId: recordset[0].GRUPO_ID,
      role: recordset[0].ROL_ID || 0,
      roleName: recordset[0].RODESC || "No Role",
      roles: recordset[0].ROLES_JSON != null ? JSON.parse(`{${recordset[0].ROLES_JSON}}`) : {},
      flagNuevoIngreso: recordset[0].FLAG_INGRESO?.toString() || "0",
      jwt: "",
    };

    return NextResponse.json(userData, { status: 200 });
  } catch (error) {
    console.error("Error fetching user data:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}