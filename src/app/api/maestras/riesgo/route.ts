// app/api/maestras/riesgo/route.ts

import { NextResponse } from "next/server";
import { poolPromise } from "@sql/lib/db"; // Ajusta la ruta a tu conexión

// GET: obtener todos los registros con ESTADO = 1
export async function GET() {
  try {
    const pool = await poolPromise;
    const { recordset } = await pool
      .request()
      .query("SELECT * FROM RIESGO WHERE ESTADO = 1");

    const riesgos = recordset.map((row) => ({
      id: row.RIESGO_ID,
      descripcion: row.DESCRIPCION,
    }));

    return NextResponse.json({ success: true, values: riesgos });
  } catch (error) {
    console.error("Error en GET:", error);
    return NextResponse.json(
      { success: false, message: "Error al obtener los registros" },
      { status: 500 }
    );
  }
}

// POST: insertar un nuevo registro (ESTADO = 1 por defecto)
export async function POST(request: Request) {
  try {
    const { descripcion } = await request.json();
    const pool = await poolPromise;

    const result = await pool
      .request()
      .input("descripcion", descripcion)
      .query(`
        INSERT INTO RIESGO (DESCRIPCION, ESTADO)
        VALUES (@descripcion, 1)
      `);

    if (result.rowsAffected[0] > 0) {
      return NextResponse.json({
        success: true,
        message: "Registro creado correctamente",
      });
    } else {
      return NextResponse.json(
        { success: false, message: "No se pudo crear el registro" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error en POST:", error);
    return NextResponse.json(
      { success: false, message: "Error al crear el registro" },
      { status: 500 }
    );
  }
}

// DELETE: marcar el registro como ESTADO = 0 (borrado lógico)
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    const pool = await poolPromise;

    const result = await pool
      .request()
      .input("id", id)
      .query(`
        UPDATE RIESGO
        SET ESTADO = 0
        WHERE RIESGO_ID = @id
      `);

    if (result.rowsAffected[0] > 0) {
      return NextResponse.json({
        success: true,
        message: "Registro eliminado (lógico) correctamente",
      });
    } else {
      return NextResponse.json(
        { success: false, message: "No se encontró el registro" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Error en DELETE:", error);
    return NextResponse.json(
      { success: false, message: "Error al eliminar el registro" },
      { status: 500 }
    );
  }
}

// PUT: actualizar la DESCRIPCION (o campos que necesites)
export async function PUT(request: Request) {
  try {
    const { id, descripcion } = await request.json();
    const pool = await poolPromise;

    const result = await pool
      .request()
      .input("id", id)
      .input("descripcion", descripcion)
      .query(`
        UPDATE RIESGO
        SET DESCRIPCION = @descripcion
        WHERE RIESGO_ID = @id
      `);

    if (result.rowsAffected[0] > 0) {
      return NextResponse.json({
        success: true,
        message: "Registro actualizado correctamente",
      });
    } else {
      return NextResponse.json(
        { success: false, message: "No se encontró el registro" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Error en PUT:", error);
    return NextResponse.json(
      { success: false, message: "Error al actualizar el registro" },
      { status: 500 }
    );
  }
}
