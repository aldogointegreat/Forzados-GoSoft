import { NextResponse } from "next/server";
import { poolPromise } from "@sql/lib/db";
import { mailer, MailOptions } from "@/lib/mailer";
import { getSingleSolicitud } from "../../forzado/common";

interface Solicitud {
  id: string | number | null;
  descripcion: string | null;
  estadoSolicitud: string | null;
  fechaRealizacion: string | null;
  fechaCierre: string | null;
  grupoA: string | null;
  nombreGrupo: string | null;
  aprobadorId: string | null;
  aprobadorNombre: string | null;
  ejecutorNombre: string | null;
  solicitanteId: string | null;
  solicitanteNombre: string | null;
  subareaCodigo: string | null;
  subareaDescripcion: string | null;
  disciplinaDescripcion: string | null;
  turnoDescripcion: string | null;
  motivoRechazoDescripcion: string | null;
  tipoForzadoDescripcion: string | null;
  tagCentroCodigo: string | null;
  tagCentroDescripcion: string | null;
  tagSufijoDescripcion: string | null;
  responsableNombre: string | null;
  riesgoDescripcion: string | null;
  aprobadorACorreo: string | null;
  ejecutorACorreo: string | null;
  solicitanteACorreo: string | null;
  aprobadorBCorreo: string | null;
  aprobadorBNombre: string | null;
  solicitanteBCorreo: string | null;
  solicitanteBNombre: string | null;
  tagconcat: string | null;
  observacionesB: string | null;
  fechaFinPlanificada?: string | null;
  area?: string | null;
  nombrecircuito?: string | null;
  interlockdesc?: string | null;
  riesgoadescripcion?: string | null;
  probabilidadDescripcion?: string | null;
  impactoDescripcion?: string | null;
  descripcionEjecucionB?: string | null;
}

const createApprovalHTML = (solicitud: Solicitud) => {
  return `
<!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Resumen de Solicitud</title>
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
            <tr>
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
                ${solicitud.tagconcat}
              </td>
            </tr>
            <tr>
              <td style="text-align: left;"><b>Fecha de creación del retiro:</b></td>
              <td style="text-align: right;">${new Date().toLocaleString()}</td>
            </tr>
            <tr>
              <td style="text-align: left;"><b>Fecha fin planificada:</b></td>
              <td style="text-align: right;">${new Date(solicitud.fechaFinPlanificada).toLocaleString()}</td>
            </tr>
            <tr>
               <td style="text-align: left;"><b>Descripción de la ejecución:</b></td>
               <td style="text-align: right;">${solicitud.descripcionEjecucionB}</td>
             </tr>
            <tr>
               <td style="text-align: left;"><b>Solicitante:</b></td>
               <td style="text-align: right;">${solicitud.solicitanteBNombre}</td>
             </tr>
             <tr>
               <td style="text-align: left;"><b>Aprobador:</b></td>
               <td style="text-align: right;">${solicitud.aprobadorBNombre}</td>
             </tr>
             <tr>
               <td style="text-align: left;"><b>Grupo de ejecución:</b></td>
               <td style="text-align: right;">${solicitud.nombreGrupo}</td>
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
    const usuario = formData.get("usuario") as string;
    const fechaEjecucion = formData.get("fechaEjecucion") as string;
    const descripcionEjecucion = formData.get("descripcionEjecucion") as string;

    console.log("Received form data:", { id, usuario, fechaEjecucion, descripcionEjecucion });

    const files = [];
    for (let i = 0; i < 3; i++) {
      const file = formData.get(`file${i + 1}`);
      if (file) {
        const arrayBuffer = await (file as Blob).arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        files.push({ name: (file as File).name, data: buffer });
      }
    }

    console.log("Files to be uploaded:", files.map((file) => file.name));

    if (!fechaEjecucion || isNaN(Date.parse(fechaEjecucion))) {
      console.log("Invalid date format detected:", fechaEjecucion);
      return NextResponse.json({ success: false, message: "Invalid date format" }, { status: 400 });
    }

    const fechaEjecucionDate = new Date(fechaEjecucion);
    console.log("Parsed fechaEjecucionDate:", fechaEjecucionDate);

    const pool = await poolPromise;
    console.log("Database pool connection established");

    const sqlQuery = `
      UPDATE TRS_Solicitud_forzado 
      SET 
        ESTADOSOLICITUD = 'FINALIZADO',
        FECHA_EJECUCION_B = @fechaEjecucion,
        FECHACIERRE = @fechaEjecucion,
        EJECUTOR_B_ID = @usuario,
        DESCRIPCION_EJECUCION_B = @descripcionEjecucion
      WHERE SOLICITUD_ID = @id
    `;
    console.log("Executing SQL query:", sqlQuery);
    console.log("SQL Parameters:", { id, usuario, fechaEjecucion: fechaEjecucionDate, descripcionEjecucion: descripcionEjecucion || null });

    const result = await pool
      .request()
      .input("id", id)
      .input("usuario", usuario)
      .input("fechaEjecucion", fechaEjecucionDate)
      .input("descripcionEjecucion", descripcionEjecucion || null)
      .query(sqlQuery);

    console.log("SQL query result:", { rowsAffected: result.rowsAffected });

    if (result.rowsAffected[0] > 0) {
      console.log("Record updated successfully in TRS_Solicitud_forzado");

      for (const file of files) {
        console.log("Inserting file into MAE_DATO_ADJUNTO:", file.name);
        await pool
          .request()
          .input("nombreArchivo", file.name)
          .input("usuario", usuario)
          .input("archivo", file.data)
          .input("id", id)
          .query(`
            INSERT INTO MAE_DATO_ADJUNTO (SOLICITUD_ID, NOMBRE_ARCHIVO, ARCHIVO, ESTADO, USUARIO_CREACION, USUARIO_MODIFICACION, FECHA_CREACION, FECHA_MODIFICACION,ETAPA_DOCUMENTO)
            VALUES (@id, @nombreArchivo, @archivo, 1, @usuario, @usuario, GETDATE(), GETDATE(),'Retiro')
          `);
        console.log("File inserted successfully:", file.name);
      }

 

      const rawSolicitudes = await getSingleSolicitud(id);
      console.log("Fetched raw solicitud after update:", rawSolicitudes);

      if (!rawSolicitudes || rawSolicitudes.length === 0) {
        console.log("No solicitud found for id:", id);
        return NextResponse.json({ success: false, message: "Solicitud not found" }, { status: 404 });
      }

      const rawSolicitud = rawSolicitudes[0];

      const solicitud: Solicitud = {
        id: rawSolicitud.id ?? null,
        descripcion: rawSolicitud.descripcion ?? null,
        estadoSolicitud: rawSolicitud.estadoSolicitud ?? null,
        fechaRealizacion: rawSolicitud.fechaRealizacion ?? null,
        fechaCierre: rawSolicitud.fechaCierre ?? null,
        grupoA: rawSolicitud.grupo_A ?? null,
        nombreGrupo: rawSolicitud.grupoNombre ?? null,
        aprobadorId: rawSolicitud.aprobadorId ?? null,
        aprobadorNombre: rawSolicitud.aprobadorNombre ?? null,
        ejecutorNombre: rawSolicitud.ejecutorNombre ?? null,
        solicitanteId: rawSolicitud.solicitanteId ?? null,
        solicitanteNombre: rawSolicitud.solicitanteNombre ?? null,
        subareaCodigo: rawSolicitud.subareaCodigo ?? null,
        subareaDescripcion: rawSolicitud.subareaDescripcion ?? null,
        disciplinaDescripcion: rawSolicitud.disciplinaDescripcion ?? null,
        turnoDescripcion: rawSolicitud.turnoDescripcion ?? null,
        motivoRechazoDescripcion: rawSolicitud.motivoRechazoDescripcion ?? null,
        tipoForzadoDescripcion: rawSolicitud.tipoForzadoDescripcion ?? null,
        tagCentroCodigo: rawSolicitud.tagCentroCodigo ?? null,
        tagCentroDescripcion: rawSolicitud.tagCentroDescripcion ?? null,
        tagSufijoDescripcion: rawSolicitud.tagsufijo ?? null,
        responsableNombre: rawSolicitud.responsableNombre ?? null,
        riesgoDescripcion: rawSolicitud.riesgoDescripcion ?? null,
        aprobadorACorreo: rawSolicitud.aprobadorACorreo ?? null,
        ejecutorACorreo: rawSolicitud.ejecutorACorreo ?? null,
        solicitanteACorreo: rawSolicitud.solicitanteACorreo ?? null,
        aprobadorBCorreo: rawSolicitud.aprobadorBCorreo ?? null,
        aprobadorBNombre: rawSolicitud.aprobadorBNombre ?? null,
        solicitanteBCorreo: rawSolicitud.solicitanteBCorreo ?? null,
        solicitanteBNombre: rawSolicitud.solicitanteBNombre ?? null,
        tagconcat: rawSolicitud.tagConcat ?? null,
        observacionesB: rawSolicitud.observacionesB ?? null,
        fechaFinPlanificada: rawSolicitud.fechaFinPlanificada ?? null,
        area: rawSolicitud.area ?? null,
        nombrecircuito: rawSolicitud.nombrecircuito ?? null,
        interlockdesc: rawSolicitud.interlockdesc ?? null,
        riesgoadescripcion: rawSolicitud.riesgoadescripcion ?? null,
        probabilidadDescripcion: rawSolicitud.probabilidadDescripcion ?? null,
        impactoDescripcion: rawSolicitud.impactoDescripcion ?? null,
        descripcionEjecucionB: rawSolicitud.descripcionEjecucionB ?? null,
      };

      const recipients = [
        solicitud.solicitanteBCorreo,
        solicitud.aprobadorBCorreo,
      ].filter(Boolean);

      for (const recipient of recipients) {
        const mailOptions: MailOptions = {
          from: process.env.SMTP_USER,
          to: recipient,
          subject: "[APP FORZADOS] Solicitud de Retiro Ejecutada",
          html: createApprovalHTML(solicitud),
        };

        console.log("Sending email to:", recipient);
        await mailer
          .sendMail(mailOptions)
          .then(() => {
            console.log("Email sent successfully to:", recipient);
          })
          .catch((error) => {
            console.error("Error sending email to", recipient, ":", error.message, error.stack);
          });
      }

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