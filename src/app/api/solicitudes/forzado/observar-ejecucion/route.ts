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
  grupoNombre?: string | null;
  solicitanteACorreo?: string | null;
  aprobadorBCorreo?: string | null;
  aprobadorBNombre?: string | null;
  ejecutorBCorreo?: string | null;
  ejecutorBNombre?: string | null;
  solicitanteBCorreo?: string | null;
  solicitanteBNombre?: string | null;
  tagconcat?: string | null;
  area?: string | null; 
  nombrecircuito?: string | null;
  interlockdesc?: string | null;
  riesgoadescripcion?: string | null;
  probabilidadDescripcion?: string | null;
  impactoDescripcion?: string | null; 
  observacionEjecucion?: string | null;
}

const createRejectionHTML = (solicitud: Solicitud) => {
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
               <td style="text-align: left;"><b>Motivo de Observación:</b></td>
               <td style="text-align: right;">${solicitud.observacionEjecucion}</td>
             </tr>
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
  const pool = await poolPromise;

  const transaction = await pool.transaction();
  await transaction.begin();

  try {
    const { id, observacionEjecucion, userId } = await request.json();

    console.log("Received payload from request:", { id, observacionEjecucion, userId });

    if (!id || !observacionEjecucion || !userId) {
      console.log("Validation failed - Missing required fields:", { id, observacionEjecucion, userId });
      await transaction.rollback();
      return NextResponse.json(
        {
          success: false,
          message: "Faltan datos requeridos (id, observacionEjecucion, userId)",
        },
        { status: 400 }
      );
    }

    const userIdNumber = parseInt(userId, 10);
    if (isNaN(userIdNumber)) {
      console.log("Invalid userId format:", userId);
      await transaction.rollback();
      return NextResponse.json(
        {
          success: false,
          message: "El userId debe ser un número válido",
        },
        { status: 400 }
      );
    }

    console.log("Executing SQL query with inputs:", { id, observacionEjecucion, userId: userIdNumber });
    const result = await pool
      .request()
      .input("id", id)
      .input("observacionEjecucion", observacionEjecucion)
      .input("userId", userIdNumber)
      .query(`
        UPDATE TRS_Solicitud_forzado 
        SET OBSERVADO_A = 1,
            OBSERVACION_EJECUCION_A = @observacionEjecucion,
            FECHA_OBSERVACION_A = GETDATE(),
            USUARIO_OBSERVACION_A = @userId,
            ESTADOSOLICITUD = 'PENDIENTE-FORZADO'
        WHERE SOLICITUD_ID = @id
      `);

    console.log("SQL query result:", result);
    if (result.rowsAffected[0] === 0) {
      console.log("No rows updated for id:", id);
      await transaction.rollback();
      return NextResponse.json(
        {
          success: false,
          message: "No se encontró la solicitud para actualizar",
        },
        { status: 404 }
      );
    }

    const [solicitud] = await getSingleSolicitud(id);
    console.log("Fetched solicitud data:", solicitud);

    const mailOptionsAprobador: MailOptions = {
      from: process.env.SMTP_USER,
      to: solicitud.aprobadorACorreo,
      subject: "[APP FORZADOS] Solicitud de forzado observada",
      html: createRejectionHTML(solicitud),
    };

    const mailOptionsEjecutor: MailOptions = {
      from: process.env.SMTP_USER,
      to: solicitud.ejecutorACorreo,
      subject: "[APP FORZADOS] Solicitud de forzado observada",
      html: createRejectionHTML(solicitud),
    };

    const mailOptionsSolicitante: MailOptions = {
      from: process.env.SMTP_USER,
      to: solicitud.solicitanteACorreo,
      subject: "[APP FORZADOS] Solicitud de forzado observada",
      html: createRejectionHTML(solicitud),
    };

    console.log("Sending emails to:", { aprobador: mailOptionsAprobador.to, ejecutor: mailOptionsEjecutor.to, solicitante: mailOptionsSolicitante.to });
    await Promise.all([
      mailer.sendMail(mailOptionsAprobador).catch((error) => {
        console.error("Error sending email to aprobador:", error);
        return null;
      }),
      mailer.sendMail(mailOptionsEjecutor).catch((error) => {
        console.error("Error sending email to ejecutor:", error);
        return null;
      }),
      mailer.sendMail(mailOptionsSolicitante).catch((error) => {
        console.error("Error sending email to solicitante:", error);
        return null;
      }),
    ]);

    await transaction.commit();
    console.log("Transaction committed successfully for id:", id);
    return NextResponse.json({
      success: true,
      message: "Solicitud observada exitosamente",
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error processing POST:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error interno del servidor",
        error: error.message,
      },
      { status: 500 }
    );
  }
}