import { NextResponse } from "next/server";
import { poolPromise } from "@sql/lib/db";

// Manejo del método GET
export async function GET() {
    try {
        const pool = await poolPromise;

        // Obtener la hora de inicio laboral desde la tabla HORARIO_TRABAJO
        const horarioResult = await pool.request().query(`
            SELECT TOP 1 CONVERT(varchar(8), HORA_INICIO, 108) AS HORA_INICIO
            FROM dbo.HORARIO_TRABAJO
            WHERE ESTADO = 1
        `);

        if (!horarioResult.recordset || horarioResult.recordset.length === 0) {
            return NextResponse.json({ success: false, message: "No se encontró un horario laboral activo" }, { status: 400 });
        }


        // Obtener los turnos
        const turnosResult = await pool.request().query(`
            SELECT TURNO_ID, DESCRIPCION, CONVERT(varchar(8), HORA_INICIO, 108) AS HORA_INICIO, CONVERT(varchar(8), HORA_FIN, 108) AS HORA_FIN  FROM dbo.TURNO        WHERE ESTADO = 1
        `);

        const turnos = turnosResult.recordset.map((turno: any) => ({
            id: turno.TURNO_ID,
            descripcion: turno.DESCRIPCION,
            horaInicio: turno.HORA_INICIO,
            horaFin: turno.HORA_FIN,
        }));

        return NextResponse.json({ success: true, values: turnos });
    } catch (error) {
        console.error("Error processing GET:", error);
        return NextResponse.json({ success: false, message: "Error retrieving data" }, { status: 500 });
    }
}

// Manejo del método POST
export async function POST(request: Request) {
    try {
        const pool = await poolPromise;
        const { descripcion, usuario } = await request.json();

        // Obtener la hora de inicio laboral desde la tabla HORARIO_TRABAJO
        const horarioResult = await pool.request().query(`
            SELECT TOP 1 CONVERT(varchar(8), HORA_INICIO, 108) AS HORA_INICIO
            FROM dbo.HORARIO_TRABAJO
            WHERE ESTADO = 1
        `);

        if (!horarioResult.recordset || horarioResult.recordset.length === 0) {
            return NextResponse.json({ success: false, message: "No se encontró un horario laboral activo" }, { status: 400 });
        }

        const horaInicioLaboral = horarioResult.recordset[0].HORA_INICIO;

        // Validar el formato de horaInicioLaboral
        if (!horaInicioLaboral || !/^\d{2}:\d{2}:\d{2}$/.test(horaInicioLaboral)) {
            return NextResponse.json({ success: false, message: "El formato de la hora de inicio laboral es inválido" }, { status: 500 });
        }

        // Contar los turnos existentes
        const turnosCountResult = await pool.request().query(`
            SELECT COUNT(*) AS count
            FROM dbo.TURNO
            WHERE ESTADO = 1
        `);

        const turnosCount = turnosCountResult.recordset[0].count;
        const newTurnoCount = turnosCount + 1; // Incluye el turno que estamos creando

        // Calcular la duración de cada turno (24 horas / número de turnos)
        const shiftDuration = 24 / newTurnoCount; // Duración en horas

        // Obtener la hora de inicio laboral
        const [startHours,] = horaInicioLaboral.split(":").map(Number);

        let horaInicio, horaFin;
        if (turnosCount === 0) {
            // Primer turno
            horaInicio = horaInicioLaboral; // e.g., "07:00:00"
            const endHours = (startHours + shiftDuration - 1) % 24;
            horaFin = `${endHours < 10 ? "0" : ""}${Math.floor(endHours)}:59:59`;
        } else {
            // Obtener el último turno existente para calcular la hora de inicio del nuevo turno
            const ultimoTurno = await pool.request().query(`
                SELECT TOP 1 CONVERT(varchar(8), HORA_FIN, 108) AS HORA_FIN
                FROM dbo.TURNO
                WHERE ESTADO = 1
                ORDER BY HORA_INICIO DESC
            `);

            const horaFinUltimoTurno = ultimoTurno.recordset[0].HORA_FIN;
            if (!horaFinUltimoTurno || !/^\d{2}:\d{2}:\d{2}$/.test(horaFinUltimoTurno)) {
                return NextResponse.json({ success: false, message: "El formato de la hora de fin del turno existente es inválido" }, { status: 500 });
            }

            const [finHours] = horaFinUltimoTurno.split(":").map(Number);
            const nextStartHour = (finHours + 1) % 24;
            horaInicio = `${nextStartHour < 10 ? "0" : ""}${nextStartHour}:00:00`;
            const endHours = (nextStartHour + shiftDuration - 1) % 24;
            horaFin = `${endHours < 10 ? "0" : ""}${Math.floor(endHours)}:59:59`;
        }

        // Insertar el turno
        const turnoResult = await pool
            .request()
            .input("descripcion", descripcion)
            .input("horaInicio", horaInicio)
            .input("horaFin", horaFin)
            .input("usuario", usuario)
            .query(
                "INSERT INTO dbo.TURNO (DESCRIPCION, HORA_INICIO, HORA_FIN, USUARIO_CREACION, USUARIO_MODIFICACION, FECHA_CREACION, FECHA_MODIFICACION, ESTADO) " +
                "VALUES (@descripcion, @horaInicio, @horaFin, @usuario, @usuario, GETDATE(), GETDATE(), 1); " +
                "SELECT SCOPE_IDENTITY() AS id;"
            );

        const turnoId = turnoResult.recordset[0].id;

        // Recalcular los tiempos de todos los turnos para distribuir equitativamente
        const turnos = await pool.request().query(`
            SELECT TURNO_ID, CONVERT(varchar(8), HORA_INICIO, 108) AS HORA_INICIO
            FROM dbo.TURNO
            WHERE ESTADO = 1
            ORDER BY HORA_INICIO
        `);

        let currentStartHour = startHours;
        for (let i = 0; i < turnos.recordset.length; i++) {
            const turno = turnos.recordset[i];
            const newHoraInicio = `${currentStartHour < 10 ? "0" : ""}${currentStartHour}:00:00`;
            const endHours = (currentStartHour + shiftDuration - 1) % 24;
            const newHoraFin = `${endHours < 10 ? "0" : ""}${Math.floor(endHours)}:59:59`;

            await pool.request()
                .input("turnoId", turno.TURNO_ID)
                .input("horaInicio", newHoraInicio)
                .input("horaFin", newHoraFin)
                .input("usuario", usuario)
                .query(`
                    UPDATE dbo.TURNO
                    SET HORA_INICIO = @horaInicio, HORA_FIN = @horaFin, USUARIO_MODIFICACION = @usuario, FECHA_MODIFICACION = GETDATE()
                    WHERE TURNO_ID = @turnoId;
                `);

            currentStartHour = (currentStartHour + shiftDuration) % 24;
        }

        return NextResponse.json({ success: true, id: turnoId });
    } catch (error) {
        console.error("Error processing POST:", error);
        return NextResponse.json({ success: false, message: "Error inserting data" }, { status: 500 });
    }
}

// Manejo del método PUT
export async function PUT(request: Request) {
    try {
        const pool = await poolPromise;
        const { id, descripcion, usuario } = await request.json();

        // Actualizar el turno (solo la descripción)
        const turnoResult = await pool
            .request()
            .input("id", id)
            .input("descripcion", descripcion)
            .input("usuario", usuario)
            .query(
                "UPDATE dbo.TURNO SET DESCRIPCION = @descripcion, " +
                "USUARIO_MODIFICACION = @usuario, FECHA_MODIFICACION = GETDATE() WHERE TURNO_ID = @id"
            );

        if (turnoResult.rowsAffected[0] === 0) {
            return NextResponse.json({ success: false, message: "No record found to update" }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: "Record updated successfully" });
    } catch (error) {
        console.error("Error processing PUT:", error);
        return NextResponse.json({ success: false, message: "Error updating data" }, { status: 500 });
    }
}

// Manejo del método DELETE (soft delete)
export async function DELETE(request: Request) {
    try {
        const pool = await poolPromise;
        const { id, usuario } = await request.json();

        // Actualizar el estado del turno (soft delete)
        const turnoResult = await pool
            .request()
            .input("id", id)
            .input("usuario", usuario)
            .query(
                "UPDATE dbo.TURNO SET ESTADO = 0, USUARIO_MODIFICACION = @usuario, FECHA_MODIFICACION = GETDATE() WHERE TURNO_ID = @id"
            );

        if (turnoResult.rowsAffected[0] === 0) {
            return NextResponse.json({ success: false, message: "No record found to update" }, { status: 404 });
        }

        // Recalcular HORA_INICIO y HORA_FIN para los turnos restantes
        const turnosCountResult = await pool.request().query(`
            SELECT COUNT(*) AS count
            FROM dbo.TURNO
            WHERE ESTADO = 1
        `);

        const turnosCount = turnosCountResult.recordset[0].count;

        if (turnosCount > 0) {
            const horarioResult = await pool.request().query(`
                SELECT TOP 1 CONVERT(varchar(8), HORA_INICIO, 108) AS HORA_INICIO
                FROM dbo.HORARIO_TRABAJO
                WHERE ESTADO = 1
            `);

            if (horarioResult.recordset && horarioResult.recordset.length > 0) {
                const horaInicioLaboral = horarioResult.recordset[0].HORA_INICIO;
                if (!horaInicioLaboral || !/^\d{2}:\d{2}:\d{2}$/.test(horaInicioLaboral)) {
                    return NextResponse.json({ success: false, message: "El formato de la hora de inicio laboral es inválido" }, { status: 500 });
                }

                const [startHours] = horaInicioLaboral.split(":").map(Number);
                const shiftDuration = 24 / turnosCount; // Nueva duración por turno

                const turnos = await pool.request().query(`
                    SELECT TURNO_ID, CONVERT(varchar(8), HORA_INICIO, 108) AS HORA_INICIO
                    FROM dbo.TURNO
                    WHERE ESTADO = 1
                    ORDER BY HORA_INICIO
                `);

                let currentStartHour = startHours;
                for (let i = 0; i < turnos.recordset.length; i++) {
                    const turno = turnos.recordset[i];
                    const newHoraInicio = `${currentStartHour < 10 ? "0" : ""}${currentStartHour}:00:00`;
                    const endHours = (currentStartHour + shiftDuration - 1) % 24;
                    const newHoraFin = `${endHours < 10 ? "0" : ""}${Math.floor(endHours)}:59:59`;

                    await pool.request()
                        .input("turnoId", turno.TURNO_ID)
                        .input("horaInicio", newHoraInicio)
                        .input("horaFin", newHoraFin)
                        .input("usuario", usuario)
                        .query(`
                            UPDATE dbo.TURNO
                            SET HORA_INICIO = @horaInicio, HORA_FIN = @horaFin, USUARIO_MODIFICACION = @usuario, FECHA_MODIFICACION = GETDATE()
                            WHERE TURNO_ID = @turnoId;
                        `);

                    currentStartHour = (currentStartHour + shiftDuration) % 24;
                }
            }
        }

        return NextResponse.json({ success: true, message: "Record updated successfully" });
    } catch (error) {
        console.error("Error processing DELETE:", error);
        return NextResponse.json({ success: false, message: "Error updating data" }, { status: 500 });
    }
}