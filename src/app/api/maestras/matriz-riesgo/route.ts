import { NextResponse } from "next/server";
import { poolPromise } from "@sql/lib/db"; // Ajusta la ruta a tu conexión

// GET: obtener todos los registros con ESTADO = 1
export async function GET() {
  try {
    const pool = await poolPromise;
    const { recordset } = await pool
      .request()
      .query(`
        SELECT 
          M.MATRIZ_ID AS id,
          M.IMPACTO_ID AS impacto_id,
          M.RIESGO_ID AS riesgo_id,
          M.PROBABILIDAD_ID AS probabilidad_id,
          M.NIVEL AS nivel,
          M.ESTADO AS estado,
          M.USUARIO_CREACION AS usuario_creacion,
          M.FECHA_CREACION AS fecha_creacion,
          M.USUARIO_MODIFICACION AS usuario_modificacion,
          M.FECHA_MODIFICACION AS fecha_modificacion,
          I.DESCRIPCION AS impacto_descripcion,
          P.DESCRIPCION AS probabilidad_descripcion,
          R.DESCRIPCION AS riesgo_descripcion
        FROM MATRIZ_RIESGO M
        INNER JOIN IMPACTO I ON I.IMPACTO_ID = M.IMPACTO_ID
        INNER JOIN PROBABILIDAD P ON P.PROBABILIDAD_ID = M.PROBABILIDAD_ID
        INNER JOIN RIESGO R ON R.RIESGO_ID = M.RIESGO_ID
        WHERE M.ESTADO = 1
      `);

    const matrizRiesgo = recordset.map((row) => ({
      id: row.id,
      impacto_id: row.impacto_id,
      riesgo_id: row.riesgo_id,
      probabilidad_id: row.probabilidad_id,
      nivel: row.nivel,
      estado: row.estado,
      usuario_creacion: row.usuario_creacion,
      fecha_creacion: row.fecha_creacion,
      usuario_modificacion: row.usuario_modificacion,
      fecha_modificacion: row.fecha_modificacion,
      impacto_descripcion: row.impacto_descripcion,
      probabilidad_descripcion: row.probabilidad_descripcion,
      riesgo_descripcion: row.riesgo_descripcion,
    }));

    return NextResponse.json({ success: true, values: matrizRiesgo });
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
    const { impactoId, riesgoId, probabilidadId, nivel, usuario } = await request.json();

    // Validate required fields
    if (!impactoId || !riesgoId || !probabilidadId || !usuario) {
      return NextResponse.json(
        { success: false, message: "Faltan campos requeridos", received: { impactoId, riesgoId, probabilidadId, usuario } },
        { status: 400 }
      );
    }

    // Validate that nivel is a number
    if (isNaN(Number(nivel))) {
      return NextResponse.json(
        { success: false, message: "El campo Nivel debe ser un valor numérico" },
        { status: 400 }
      );
    }

    const pool = await poolPromise;

    const result = await pool
      .request()
      .input("impactoId", impactoId)
      .input("riesgoId", riesgoId)
      .input("probabilidadId", probabilidadId)
      .input("nivel", Number(nivel))
      .input("usuario", usuario)
      .query(`
        INSERT INTO MATRIZ_RIESGO (IMPACTO_ID, RIESGO_ID, PROBABILIDAD_ID, NIVEL, ESTADO, USUARIO_CREACION, FECHA_CREACION)
        VALUES (@impactoId, @riesgoId, @probabilidadId, @nivel, 1, @usuario, GETDATE())
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
      { success: false, message: "Error al crear el registro", error: String(error) },
      { status: 500 }
    );
  }
}

// DELETE: marcar el registro como ESTADO = 0 (borrado lógico)
export async function DELETE(request: Request) {
  try {
    const { id, usuario } = await request.json();
    const pool = await poolPromise;

    const result = await pool
      .request()
      .input("id", id)
      .input("usuario", usuario)
      .query(`
        UPDATE MATRIZ_RIESGO
        SET ESTADO = 0, USUARIO_MODIFICACION = @usuario, FECHA_MODIFICACION = GETDATE()
        WHERE MATRIZ_ID = @id
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
      { success: false, message: "Error al eliminar el registro", error: String(error) },
      { status: 500 }
    );
  }
}

// PUT: actualizar los campos de la matriz de riesgo
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, impactoId, riesgoId, probabilidadId, nivel, estado, usuario } = body;

    // Validate required fields
    if (!id || !impactoId || !riesgoId || !probabilidadId || !usuario) {
      return NextResponse.json(
        { success: false, message: "Faltan campos requeridos", received: body },
        { status: 400 }
      );
    }

    // Validate that nivel is a number
    if (isNaN(Number(nivel))) {
      return NextResponse.json(
        { success: false, message: "El campo Nivel debe ser un valor numérico" },
        { status: 400 }
      );
    }

    const pool = await poolPromise;

    const result = await pool
      .request()
      .input("id", id)
      .input("impactoId", impactoId)
      .input("riesgoId", riesgoId)
      .input("probabilidadId", probabilidadId)
      .input("nivel", Number(nivel))
      .input("estado", Number(estado))
      .input("usuario", usuario)
      .query(`
        UPDATE MATRIZ_RIESGO
        SET 
          IMPACTO_ID = @impactoId,
          RIESGO_ID = @riesgoId,
          PROBABILIDAD_ID = @probabilidadId,
          NIVEL = @nivel,
          ESTADO = @estado,
          USUARIO_MODIFICACION = @usuario,
          FECHA_MODIFICACION = GETDATE()
        WHERE MATRIZ_ID = @id AND ESTADO = 1
      `);

    if (result.rowsAffected[0] > 0) {
      return NextResponse.json({
        success: true,
        message: "Registro actualizado correctamente",
      });
    } else {
      return NextResponse.json(
        { success: false, message: "No se encontró el registro o no está activo" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Error en PUT:", error);
    return NextResponse.json(
      { success: false, message: "Error al actualizar el registro", error: String(error) },
      { status: 500 }
    );
  }
}