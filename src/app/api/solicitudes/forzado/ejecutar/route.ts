import { NextResponse } from "next/server";
import { poolPromise } from "@sql/lib/db";
import { mailer, MailOptions } from "@/lib/mailer";
import { getSingleSolicitud } from "../common";

interface Solicitud {
  id: string;
  descripcion?: string | null;
  estadoSolicitud?: string | null;
  fechaRealizacion?: string | null;
  fechaCierre?: string | null;
  fechaCreacionA?: string | null;
  fechaCreacionB?: string | null;
  fechaAprobacionA?: string | null;
  fechaAprobacionB?: string | null;
  fechaEjecucionA?: string | null;
  fechaEjecucionB?: string | null;
  fechaFinPlanificada?: string | null;
  aprobadorId?: string | null;
  aprobadorNombre?: string | null;
  ejecutorId?: string | null;
  ejecutorNombre?: string | null;
  solicitanteId?: string | null;
  solicitanteNombre?: string | null;
  subareaCodigo?: string | null;
  subareaDescripcion?: string | null;
  disciplinaDescripcion?: string | null;
  turnoDescripcion?: string | null;
  motivoRechazoDescripcion?: string | null;
  motivoRechazoBDescripcion?: string | null;
  tipoForzadoDescripcion?: string | null;
  tagCentroCodigo?: string | null;
  tagCentroDescripcion?: string | null;
  tagsufijo?: string | null;
  tagSufijoDescripcion?: string | null;
  responsableNombre?: string | null;
  riesgoDescripcion?: string | null;
  aprobadorACorreo?: string | null;
  ejecutorACorreo?: string | null;
  solicitanteACorreo?: string | null;
  aprobadorBCorreo?: string | null;
  aprobadorBNombre?: string | null;
  ejecutorBCorreo?: string | null;
  ejecutorBNombre?: string | null;
  solicitanteBCorreo?: string | null;
  solicitanteBNombre?: string | null;
  tagconcat?: string | null;
  grupoNombre?: string | null;
  area?: string | null;
  nombrecircuito?: string | null;
  interlockdesc?: string | null;
  riesgoadescripcion?: string | null;
  probabilidadDescripcion?: string | null;
  impactoDescripcion?: string | null;
  descripcionEjecucion?: string | null;
}

const createExecutionHTML = (solicitud: Solicitud, ) => {
  return `
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>La Solicitud de Forzado ha sido Ejecutado</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 0;
        background-color: #f4f4f4;
      }
      .container {
        width: 90%;
        max-width: 700px;
        margin: 20px auto;
        background-color: #fff;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        text-align: center;
      }
      h1 {
        text-align: center;
        color: #444;
        margin-bottom: 20px;
      }
      .field-group {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 20px;
      }
      .field {
        background-color: #f9f9f9;
        padding: 15px;
        border: 1px solid #ddd;
        border-radius: 5px;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
      }
      .field label {
        font-weight: bold;
        color: #333;
        margin-bottom: 8px;
        display: block;
      }
      .field span {
        display: block;
        color: #555;
        margin-top: 5px;
        word-wrap: break-word;
      }
      .button {
        display: block;
        width: 150px;
        margin: 30px auto 0;
        padding: 10px;
        text-align: center;
        background-color: #103483;
        color: #ffffff !important;
        text-decoration: none;
        border-radius: 5px;
        transition: background-color 0.3s ease, box-shadow 0.3s ease;
      }
      .button:hover {
        background-color: #0056b3;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      }
      .button-reject {
        background-color: #d9534f;
        color: #ffffff !important;
      }
      .button-reject:hover {
        background-color: #c9302c;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      }
      table {
        border-collapse: collapse;
        margin: 0 auto;
      }
    </style>
  </head>
  <body>
        <div class="container">
          <table 
            cellpadding="5" 
            cellspacing="2" 
            border="0.8" 
            style="table-layout: fixed; width: 600px;"
          >
            <colgroup>
              <col style="width:200px;">
              <col style="width:400px;">
            </colgroup>

              <td colspan="2" 
                  style="text-align:center; font-family:Arial,Tahoma,Helvetica; 
                         font-size:18px; line-height:32px; color:#002b93; 
                         padding: 0 5px;">
                <h3>Resumen</h3>
              </td>
            </tr>
            <tr>
              <td style="text-align: left;"><b>ID Solicitud:</b></td>
              <td style="text-align: right;">${solicitud.id}</td>
            </tr>
            <tr>
              <td style="text-align: left;"><b>Descripción:</b></td>
              <td style="text-align: right;">${solicitud.descripcion}</td>
            </tr>
            <tr>
              <td style="text-align: left;"><b>Tag:</b></td>
              <td style="text-align: right;">
                ${solicitud.subareaCodigo}-${solicitud.tagCentroCodigo}-${solicitud.tagsufijo}
              </td>
            </tr>
            <tr>
              <td style="text-align: left;"><b>Fecha de creación:</b></td>
              <td style="text-align: right;">${new Date().toLocaleString()}</td>
            </tr>
            <tr>
              <td style="text-align: left;"><b>Fecha fin Planificada:</b></td>
              <td style="text-align: right;">${new Date(solicitud.fechaFinPlanificada).toLocaleString()}</td>
            </tr>
            <tr>
               <td style="text-align: left;"><b>Tipo de Forzado:</b></td>
               <td style="text-align: right;">${solicitud.tipoForzadoDescripcion}</td>
             </tr>
            <tr>
            <tr>
               <td style="text-align: left;"><b>Descripción de la ejecución:</b></td>
               <td style="text-align: right;">${solicitud.descripcionEjecucion}</td>
             </tr>
            <tr>
            <tr>
               <td style="text-align: left;"><b>Solicitante:</b></td>
               <td style="text-align: right;">${solicitud.solicitanteNombre}</td>
             </tr>
            <tr>
               <td style="text-align: left;"><b>Aprobador:</b></td>
               <td style="text-align: right;">${solicitud.aprobadorNombre}</td>
            </tr>
            <tr>
               <td style="text-align: left;"><b>Grupo de ejecución:</b></td>
               <td style="text-align: right;">${solicitud.grupoNombre}</td>
            </tr>
            <tr>
               <td style="text-align: left;"><b>Turno:</b></td>
               <td style="text-align: right;">${solicitud.turnoDescripcion}</td>
            </tr>
            <tr>
               <td style="text-align: left;"><b>Gerencia responsable:</b></td>
               <td style="text-align: right;">${solicitud.responsableNombre}</td>
            </tr>
            <tr>
               <td style="text-align: left;"><b>Área:</b></td>
               <td style="text-align: right;">${solicitud.area}</td>
            </tr>
            <tr>
               <td style="text-align: left;"><b>Circuito:</b></td>
               <td style="text-align: right;">${solicitud.nombrecircuito}</td>
            </tr>
            <tr>
               <td style="text-align: left;"><b>Disciplina:</b></td>
               <td style="text-align: right;">${solicitud.disciplinaDescripcion}</td>
            </tr>
            <tr>
               <td style="text-align: left;"><b>Interlock de seguridad:</b></td>
               <td style="text-align: right;">${solicitud.interlockdesc}</td>
             </tr>
            <tr>
               <td style="text-align: left;"><b>Riesgo a:</b></td>
               <td style="text-align: right;">${solicitud.riesgoadescripcion}</td>
            </tr>
            <tr>
               <td style="text-align: left;"><b>Probabilidad: </b></td>
               <td style="text-align: right;">${solicitud.probabilidadDescripcion}</td>
            </tr>
            <tr>
               <td style="text-align: left;"><b>Impacto: </b></td>
               <td style="text-align: right;">${solicitud.impactoDescripcion}</td>
            </tr>
            <tr>
               <td style="text-align: left;"><b>Nivel de Riesgo: </b></td>
               <td style="text-align: right;">${solicitud.riesgoDescripcion}</td>
            </tr>
          </table>
          <br>
          <br>
          <br>
          <a href="https://forzados.goldfields.cl/auth/ingresar" target="_blank">
              <span>Regresar al sistema Control Forzados MGFSN</span>
          </a>
        </div>
      </body>
    </html>
  `;
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const id = formData.get("id") as string;
    const usuario = formData.get("usuario");
    const fechaEjecucion = formData.get("fechaEjecucion") as string;
    const tipoForzado = formData.get("tipoForzado") as string;
    const descripcionEjecucion = formData.get("descripcionEjecucion") as string;

    // Log the incoming form data
    console.log("Received form data:", {
      id,
      usuario,
      fechaEjecucion,
      tipoForzado,
      descripcionEjecucion
    });

    const files = [];
    for (let i = 0; i < 3; i++) {
      const file = formData.get(`file${i + 1}`);
      if (file) {
        const arrayBuffer = await (file as Blob).arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        files.push({ name: (file as File).name, data: buffer });
      }
    }

    // Log the files being processed
    console.log("Files to be uploaded:", files.map(file => file.name));

    // Validar la fecha
    if (!fechaEjecucion || isNaN(Date.parse(fechaEjecucion))) {
      console.log("Invalid date format detected:", fechaEjecucion);
      return NextResponse.json({ success: false, message: "Invalid date format" }, { status: 400 });
    }

    // Crear objeto Date sin aplicar offset de zona horaria
    const fechaEjecucionDate = new Date(fechaEjecucion);
    console.log("Parsed fechaEjecucionDate:", fechaEjecucionDate);

    const pool = await poolPromise;
    console.log("Database pool connection established");

    // Log the SQL query and parameters before execution
    const sqlQuery = `
        UPDATE TRS_Solicitud_forzado 
        SET 
          ESTADOSOLICITUD = 'EJECUTADO-FORZADO',
          FECHA_EJECUCION_A = @fechaEjecucion,
          EJECUTOR_A_ID = @usuario,
          TIPOFORZADO_ID = @tipoForzado,
          DESCRIPCION_EJECUCION_A = @descripcionEjecucion
        WHERE SOLICITUD_ID = @id
      `;
    console.log("Executing SQL query:", sqlQuery);
    console.log("SQL Parameters:", {
      id,
      usuario,
      fechaEjecucion: fechaEjecucionDate,
      tipoForzado,
      descripcionEjecucion: descripcionEjecucion || null
    });

    const result = await pool.request()
      .input("id", id)
      .input("usuario", usuario)
      .input("fechaEjecucion", fechaEjecucionDate)
      .input("tipoForzado", tipoForzado)
      .input("descripcionEjecucion", descripcionEjecucion || null)
      .query(sqlQuery);

    // Log the result of the query
    console.log("SQL query result:", {
      rowsAffected: result.rowsAffected,
      recordset: result.recordset
    });

    if (result.rowsAffected[0] > 0) {
      console.log("Record updated successfully in TRS_Solicitud_forzado");

      const [solicitud] = await getSingleSolicitud(id);
      console.log("Fetched solicitud after update:", solicitud);

      for (const file of files) {
        console.log("Inserting file into MAE_DATO_ADJUNTO:", file.name);
        await pool.request()
          .input("nombreArchivo", file.name)
          .input("usuario", usuario)
          .input("archivo", file.data)
          .input("id", id)
          .query(`
            INSERT INTO MAE_DATO_ADJUNTO (SOLICITUD_ID, NOMBRE_ARCHIVO, ARCHIVO, ESTADO, USUARIO_CREACION, USUARIO_MODIFICACION, FECHA_CREACION, FECHA_MODIFICACION)
            VALUES (@id, @nombreArchivo, @archivo, 1, @usuario, @usuario, GETDATE(), GETDATE())
          `);
        console.log("File inserted successfully:", file.name);
      }

      // Update MAE_DATO to set ETAPA_DOCUMENTO to 'Forzado'
      console.log("Updating MAE_DATO to set ETAPA_DOCUMENTO to 'Forzado' for SOLICITUD_ID:", id);
      await pool.request()
        .input("id", id)
        .input("usuario", usuario) // Added missing usuario parameter
        .query(`
          UPDATE MAE_DATO_ADJUNTO
          SET ETAPA_DOCUMENTO = 'Forzado',
              USUARIO_MODIFICACION = @usuario,
              FECHA_MODIFICACION = GETDATE()
          WHERE SOLICITUD_ID = @id
        `);
      console.log("MAE_DATO updated successfully for SOLICITUD_ID:", id);

      const mailOptions: MailOptions = {
        from: process.env.SMTP_USER,
        to: `${solicitud.solicitanteACorreo}, ${solicitud.aprobadorACorreo}, ${solicitud.ejecutorACorreo}`,
        subject: "[APP FORZADOS] Solicitud de Forzado Ejecutada",
        html: createExecutionHTML(solicitud),
      };

      console.log("Sending email with options:", mailOptions);
      mailer.sendMail(mailOptions).catch((error) => console.error("Error sending email:", error));
      return NextResponse.json({ success: true, message: "Record updated successfully" });
    } else {
      console.log("No rows were affected by the UPDATE query");
      return NextResponse.json({ success: false, message: "Failed to update record" }, { status: 500 });
    }
  } catch (error) {
    console.error("Error processing POST:", error);
    return NextResponse.json({ success: false, message: "Error inserting data" }, { status: 500 });
  }
}