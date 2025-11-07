import { NextResponse } from "next/server";
import { poolPromise } from "@sql/lib/db"; // Ajusta la ruta a tu conexión

// GET: obtener todos los registros con ESTADO = 1, incluyendo descripciones
export async function GET() {
  try {
    const pool = await poolPromise;
    const { recordset } = await pool
      .request()
      .query(`
        SELECT 
          PR.PUESTO_RIESGO_ID AS id,
          PR.PUESTO_ID AS puesto_id,
          PR.RIESGO_ID AS riesgo_id,
           P.DESCRIPCION AS puesto_descripcion,
          R.DESCRIPCION AS riesgo_descripcion,
          PR.ESTADO AS estado,
          PR.USUARIO_CREACION AS usuario_creacion,
          PR.FECHA_CREACION AS fecha_creacion,
          PR.USUARIO_MODIFICACION AS usuario_modificacion,
          PR.FECHA_MODIFICACION AS fecha_modificacion
         
        FROM MAE_PUESTO_RIESGO2 PR
        INNER JOIN MAE_PUESTO P ON P.PUESTO_ID = PR.PUESTO_ID
        INNER JOIN RIESGO R ON R.RIESGO_ID = PR.RIESGO_ID
        WHERE PR.ESTADO = 1
      `);

    const puestoRiesgo = recordset.map((row) => ({
      id: row.id,
      puesto_id: row.puesto_id,
      riesgo_id: row.riesgo_id,
      estado: row.estado,
      usuario_creacion: row.usuario_creacion,
      fecha_creacion: row.fecha_creacion,
      usuario_modificacion: row.usuario_modificacion,
      fecha_modificacion: row.fecha_modificacion,
      puesto_descripcion: row.puesto_descripcion,
      riesgo_descripcion: row.riesgo_descripcion,
    }));

    return NextResponse.json({ success: true, values: puestoRiesgo });
  } catch (error) {
    console.error("Error en GET:", error);
    return NextResponse.json(
      { success: false, message: "Error al obtener los registros" },
      { status: 500 }
    );
  }
}

// POST: insertar un nuevo registro y devolverlo con descripciones
export async function POST(request: Request) {
  try {
    const { puestoId, riesgoId, usuario } = await request.json();

    // Validar campos requeridos
    if (!puestoId || !riesgoId || !usuario) {
      return NextResponse.json(
        { success: false, message: "Faltan campos requeridos", received: { puestoId, riesgoId, usuario } },
        { status: 400 }
      );
    }

    const pool = await poolPromise;

    // Insertar y obtener el registro recién creado con descripciones
    const { recordset } = await pool
      .request()
      .input("puestoId", puestoId)
      .input("riesgoId", riesgoId)
      .input("usuario", usuario)
      .query(`
        INSERT INTO MAE_PUESTO_RIESGO2 (PUESTO_ID, RIESGO_ID, ESTADO, USUARIO_CREACION, FECHA_CREACION)
        OUTPUT 
          INSERTED.PUESTO_RIESGO_ID AS id,
          INSERTED.PUESTO_ID AS puesto_id,
          INSERTED.RIESGO_ID AS riesgo_id,
          INSERTED.ESTADO AS estado,
          INSERTED.USUARIO_CREACION AS usuario_creacion,
          INSERTED.FECHA_CREACION AS fecha_creacion,
          INSERTED.USUARIO_MODIFICACION AS usuario_modificacion,
          INSERTED.FECHA_MODIFICACION AS fecha_modificacion,
          P.DESCRIPCION AS puesto_descripcion,
          R.DESCRIPCION AS riesgo_descripcion
        VALUES (@puestoId, @riesgoId, 1, @usuario, GETDATE())
        FROM MAE_PUESTO_RIESGO2 PR
        INNER JOIN MAE_PUESTO P ON P.PUESTO_ID = @puestoId
        INNER JOIN RIESGO R ON R.RIESGO_ID = @riesgoId
      `);

    if (recordset.length > 0) {
      const newRecord = {
        id: recordset[0].id,
        puesto_id: recordset[0].puesto_id,
        riesgo_id: recordset[0].riesgo_id,
        estado: recordset[0].estado,
        usuario_creacion: recordset[0].usuario_creacion,
        fecha_creacion: recordset[0].fecha_creacion,
        usuario_modificacion: recordset[0].usuario_modificacion,
        fecha_modificacion: recordset[0].fecha_modificacion,
        puesto_descripcion: recordset[0].puesto_descripcion,
        riesgo_descripcion: recordset[0].riesgo_descripcion,
      };
      return NextResponse.json({
        success: true,
        message: "Registro creado correctamente",
        value: newRecord,
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
        UPDATE MAE_PUESTO_RIESGO2
        SET ESTADO = 0, USUARIO_MODIFICACION = @usuario, FECHA_MODIFICACION = GETDATE()
        WHERE PUESTO_RIESGO_ID = @id
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

// PUT: actualizar el registro y devolverlo con descripciones
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, puestoId, riesgoId, estado, usuario } = body;

    // Validar campos requeridos
    if (!id || !puestoId || !riesgoId || !usuario) {
      return NextResponse.json(
        { success: false, message: "Faltan campos requeridos", received: body },
        { status: 400 }
      );
    }

    const pool = await poolPromise;

    // Actualizar y obtener el registro actualizado con descripciones
    const { recordset } = await pool
      .request()
      .input("id", id)
      .input("puestoId", puestoId)
      .input("riesgoId", riesgoId)
      .input("estado", Number(estado))
      .input("usuario", usuario)
      .query(`
        UPDATE MAE_PUESTO_RIESGO
        SET 
          PUESTO_ID = @puestoId,
          RIESGO_ID = @riesgoId,
          ESTADO = @estado,
          USUARIO_MODIFICACION = @usuario,
          FECHA_MODIFICACION = GETDATE()
        OUTPUT 
          INSERTED.PUESTO_RIESGO_ID AS id,
          INSERTED.PUESTO_ID AS puesto_id,
          INSERTED.RIESGO_ID AS riesgo_id,
          INSERTED.ESTADO AS estado,
          INSERTED.USUARIO_CREACION AS usuario_creacion,
          INSERTED.FECHA_CREACION AS fecha_creacion,
          INSERTED.USUARIO_MODIFICACION AS usuario_modificacion,
          INSERTED.FECHA_MODIFICACION AS fecha_modificacion,
          P.DESCRIPCION AS puesto_descripcion,
          R.DESCRIPCION AS riesgo_descripcion
        FROM MAE_PUESTO_RIESGO2 PR
        INNER JOIN MAE_PUESTO P ON P.PUESTO_ID = @puestoId
        INNER JOIN RIESGO R ON R.RIESGO_ID = @riesgoId
        WHERE PUESTO_RIESGO_ID = @id AND PR.ESTADO = 1
      `);

    if (recordset.length > 0) {
      const updatedRecord = {
        id: recordset[0].id,
        puesto_id: recordset[0].puesto_id,
        riesgo_id: recordset[0].riesgo_id,
        estado: recordset[0].estado,
        usuario_creacion: recordset[0].usuario_creacion,
        fecha_creacion: recordset[0].fecha_creacion,
        usuario_modificacion: recordset[0].usuario_modificacion,
        fecha_modificacion: recordset[0].fecha_modificacion,
        puesto_descripcion: recordset[0].puesto_descripcion,
        riesgo_descripcion: recordset[0].riesgo_descripcion,
      };
      return NextResponse.json({
        success: true,
        message: "Registro actualizado correctamente",
        value: updatedRecord,
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