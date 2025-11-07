import { NextResponse } from "next/server";
import { poolPromise } from "@sql/lib/db";

// Manejo del método GET
export async function GET() {
  try {
    const pool = await poolPromise;
    const { recordset } = await pool.request().query("SELECT * FROM MAE_TOLERANCIA");

    const tolerancias = recordset.map((singleValue) => {
      return {
        id: singleValue.TOLERANCIA_ID,
        porcentajeTolerancia: singleValue.PORCENTAJE_TOLERANCIA,
        intervalo: singleValue.INTERVALO,
        fechaModificacion: singleValue.FECHA_MODIFICACION,
      };
    });
    return NextResponse.json({ success: true, values: tolerancias });
  } catch (error) {
    console.error("Error processing GET:", error);
    return NextResponse.json({ success: false, message: "Error retrieving data" }, { status: 500 });
  }
}
export async function POST(request: Request) {
  try {
    const pool = await poolPromise;
    const { porcentajeTolerancia, intervalo } = await request.json();

    // Verificar si ya existe un registro
    const existing = await pool.request().query("SELECT COUNT(*) as count FROM MAE_TOLERANCIA");
    if (existing.recordset[0].count > 0) {
      return NextResponse.json(
        { success: false, message: "Solo se permite un registro de tolerancia" },
        { status: 400 }
      );
    }

    // Resto del código de POST...
    if (porcentajeTolerancia == 0 || porcentajeTolerancia > 100) {
      return NextResponse.json(
        { success: false, message: "El porcentaje debe estar entre 0 y 100" },
        { status: 400 }
      );
    }
/*     if (!Number.isInteger(intervalo) || intervalo == 0) {
      return NextResponse.json(
        { success: false, message: "El intervalo debe ser un número entero positivo" },
        { status: 400 }
      );
    } */

    const result = await pool
      .request()
      .input("porcentajeTolerancia", porcentajeTolerancia)
      .input("intervalo", intervalo)
      .query(`
        INSERT INTO MAE_TOLERANCIA (PORCENTAJE_TOLERANCIA, INTERVALO, FECHA_MODIFICACION)
        VALUES (@porcentajeTolerancia, @intervalo, GETDATE())
      `);

    if (result.rowsAffected[0] > 0) {
      return NextResponse.json({ success: true, message: "Tolerancia insertada correctamente" });
    } else {
      return NextResponse.json(
        { success: false, message: "No se insertó el valor" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error processing POST:", error);
    return NextResponse.json({ success: false, message: "Error inserting data" }, { status: 500 });
  }
}
// Manejo del método PUT
export async function PUT(request: Request) {
  try {
    const pool = await poolPromise;
    const { id, porcentajeTolerancia, intervalo } = await request.json();

    // Validar porcentajeTolerancia (0-100)
    if (porcentajeTolerancia < 0 || porcentajeTolerancia > 100) {
      return NextResponse.json(
        { success: false, message: "El porcentaje debe estar entre 0 y 100" },
        { status: 400 }
      );
    }

    // Validar intervalo (debe ser un número entero positivo)
  /*   if (!Number.isInteger(intervalo) || intervalo <= 0) {
      return NextResponse.json(
        { success: false, message: "El intervalo debe ser un número entero positivo" },
        { status: 400 }
      );
    } */

    const result = await pool
      .request()
      .input("id", id)
      .input("porcentajeTolerancia", porcentajeTolerancia)
      .input("intervalo", intervalo)
      .query(`
        UPDATE MAE_TOLERANCIA
        SET PORCENTAJE_TOLERANCIA = @porcentajeTolerancia,
            INTERVALO = @intervalo,
            FECHA_MODIFICACION = GETDATE()
        WHERE TOLERANCIA_ID = @id
      `);

    if (result.rowsAffected[0] > 0) {
      return NextResponse.json({ success: true, message: "Registro actualizado correctamente" });
    } else {
      return NextResponse.json(
        { success: false, message: "No se encontró el registro para actualizar" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Error processing PUT:", error);
    return NextResponse.json({ success: false, message: "Error updating data" }, { status: 500 });
  }
}

// Manejo del método DELETE
export async function DELETE(request: Request) {
  try {
    const pool = await poolPromise;
    const { id } = await request.json();

    const result = await pool
      .request()
      .input("id", id)
      .query("DELETE FROM MAE_TOLERANCIA WHERE TOLERANCIA_ID = @id");

    if (result.rowsAffected[0] > 0) {
      return NextResponse.json({ success: true, message: "Registro eliminado correctamente" });
    } else {
      return NextResponse.json(
        { success: false, message: "No se encontró el registro para eliminar" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Error processing DELETE:", error);
    return NextResponse.json({ success: false, message: "Error deleting data" }, { status: 500 });
  }
}