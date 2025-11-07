import { NextResponse } from "next/server";
import { poolPromise } from "@sql/lib/db";

// Manejo del método GET
export async function GET() {
  try {
    const pool = await poolPromise;
    const { recordset } = await pool.request().query(`
      SELECT
        P.PUESTO_ID,
        P.DESCRIPCION,
        P.ESTADO,
        (
          SELECT
            R.ROL_ID as id,
            R.DESCRIPCION as descripcion
          FROM
            MAE_PUESTO_ROL PR
          JOIN
            MAE_ROL R ON PR.ROL_ID = R.ROL_ID
          WHERE
            PR.PUESTO_ID = P.PUESTO_ID
          FOR JSON PATH
        ) AS ROLES_JSON,
        P.NIVEL_RIESGO_APROBACION,
        (
          SELECT
            T.TURNO_ID as id
          FROM
            MAE_PUESTO_TURNO PT
          JOIN
            TURNO T ON PT.TURNO_ID = T.TURNO_ID
          WHERE
            PT.PUESTO_ID = P.PUESTO_ID
          FOR JSON PATH
        ) AS TURNOS_JSON
      FROM
        MAE_PUESTO P;
    `);

    const puestos = recordset.map((singleValue) => {
      return {
        id: singleValue.PUESTO_ID,
        descripcion: singleValue.DESCRIPCION,
        estado: singleValue.ESTADO,
        roles: singleValue.ROLES_JSON,
        aprobadorNivel: singleValue.NIVEL_RIESGO_APROBACION,
        turnos: singleValue.TURNOS_JSON ? JSON.parse(singleValue.TURNOS_JSON).map((t) => t.id) : [],
      };
    });
    return NextResponse.json({ success: true, values: puestos });
  } catch (error) {
    console.error("Error processing GET:", error);
    return NextResponse.json(
      { success: false, message: "Error retrieving data" },
      { status: 500 }
    );
  }
}