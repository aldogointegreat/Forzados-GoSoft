import { NextResponse } from "next/server";
import { poolPromise } from "@sql/lib/db"; // Tu conexión a la base de datos

// Manejo del método GET
export async function GET() {
    try {
        const pool = await poolPromise;
        const { recordset } = await pool.request().query(`
            SELECT 
                HORARIO_ID,
                DESCRIPCION,
                CONVERT(varchar(5), HORA_INICIO, 108) AS HORA_INICIO -- Formato HH:mm
            FROM dbo.HORARIO_TRABAJO 
            WHERE ESTADO = 1
        `);

        const horarios = recordset.map((singleValue) => {
            return {
                id: singleValue.HORARIO_ID,
                descripcion: singleValue.DESCRIPCION || "",
                horaInicio: singleValue.HORA_INICIO || "",
            };
        });
        return NextResponse.json({ success: true, values: horarios });
    } catch (error) {
        console.error("Error processing GET:", error);
        return NextResponse.json({ success: false, message: "Error retrieving data" }, { status: 500 });
    }
}

// Manejo del método POST
export async function POST(request: Request) {
    try {
        const pool = await poolPromise;
        const { descripcion, horaInicio, usuario } = await request.json();
        const result = await pool
            .request()
            .input("descripcion", descripcion)
            .input("horaInicio", horaInicio)
            .input("usuario", usuario)
            .query(
                "INSERT INTO dbo.HORARIO_TRABAJO (DESCRIPCION, HORA_INICIO, USUARIO_CREACION, USUARIO_MODIFICACION, FECHA_CREACION, FECHA_MODIFICACION, ESTADO) " +
                "VALUES (@descripcion, @horaInicio, @usuario, @usuario, GETDATE(), GETDATE(), 1); " +
                "SELECT SCOPE_IDENTITY() AS id;"
            );

        if (result.recordset && result.recordset.length > 0) {
            return NextResponse.json({ success: true, id: result.recordset[0].id });
        } else {
            return NextResponse.json({ success: false, message: "No values inserted" }, { status: 500 });
        }
    } catch (error) {
        console.error("Error processing POST:", error);
        return NextResponse.json({ success: false, message: "Error inserting data" }, { status: 500 });
    }
}

// Manejo del método DELETE (soft delete)
export async function DELETE(request: Request) {
    try {
        const pool = await poolPromise;
        const { id, usuario } = await request.json();
        const result = await pool
            .request()
            .input("id", id)
            .input("usuario", usuario)
            .query(
                "UPDATE dbo.HORARIO_TRABAJO SET ESTADO = 0, USUARIO_MODIFICACION = @usuario, FECHA_MODIFICACION = GETDATE() WHERE HORARIO_ID = @id"
            );

        if (result.rowsAffected[0] > 0) {
            return NextResponse.json({ success: true, message: "Record updated successfully" });
        } else {
            return NextResponse.json({ success: false, message: "No record found to update" }, { status: 404 });
        }
    } catch (error) {
        console.error("Error processing DELETE:", error);
        return NextResponse.json({ success: false, message: "Error updating data" }, { status: 500 });
    }
}

// Manejo del método PUT
export async function PUT(request: Request) {
    try {
        const pool = await poolPromise;
        const { id, descripcion, horaInicio, usuario } = await request.json();
        const result = await pool
            .request()
            .input("id", id)
            .input("descripcion", descripcion)
            .input("horaInicio", horaInicio)
            .input("usuario", usuario)
            .query(
                "UPDATE dbo.HORARIO_TRABAJO SET DESCRIPCION = @descripcion, HORA_INICIO = @horaInicio, " +
                "USUARIO_MODIFICACION = @usuario, FECHA_MODIFICACION = GETDATE() WHERE HORARIO_ID = @id"
            );

        if (result.rowsAffected[0] > 0) {
            return NextResponse.json({ success: true, message: "Record updated successfully" });
        } else {
            return NextResponse.json({ success: false, message: "No record found to update" }, { status: 404 });
        }
    } catch (error) {
        console.error("Error processing PUT:", error);
        return NextResponse.json({ success: false, message: "Error updating data" }, { status: 500 });
    }
}