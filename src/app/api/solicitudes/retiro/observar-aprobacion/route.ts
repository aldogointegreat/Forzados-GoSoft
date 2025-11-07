import { NextResponse } from "next/server";
import { poolPromise } from "@sql/lib/db";
import { mailer, MailOptions } from "@/lib/mailer";
import { getSingleSolicitud } from "../../forzado/common";

interface Solicitud {
    id: string | number | null;
    descripcion: string | null;
    tagConcat?: string;
    estadoSolicitud?: string;
    fechaEjecucionA?: string;
    fechaCierre?: Date;
    usuarioCreacion?: string;
    fechaCreacion?: Date;
    usuarioModificacion?: string;
    fechaModificacion?: Date;
    proyectoId?: string;
    proyectoDescripcion?: string;
    tagSufijoDescripcion?: string;
    subareaCodigo?: string;
    subareaDescripcion?: string;
    disciplinaDescripcion?: string;
    turnoDescripcion?: string;
    motivoRechazoDescripcion?: string;
    tipoForzadoDescripcion?: string;
    tagCentroCodigo?: string;
    tagCentroDescripcion?: string;
    responsableNombre?: string;
    riesgoADescripcion?: string;
    observacionesB?: string;
    aprobadorACorreo?: string;
    aprobadorANombre?: string;
    ejecutorACorreo?: string;
    ejecutorANombre?: string;
    solicitanteACorreo?: string;
    solicitanteANombre?: string;
    aprobadorBCorreo?: string;
    aprobadorBNombre?: string;
    ejecutorBCorreo?: string;
    ejecutorBNombre?: string;
    solicitanteBCorreo?: string;
    solicitanteBNombre?: string;
    observadoEjecucion?: string | null; 
    desObservacionEjecucion?: string | null; 
    observarAprobacionretiro?: string | null;
    fechaFinPlanificada?: string | null;
    descripcionEjecucionB?: string | null;
    grupoNombre?: string | null;
    area?: string | null;
    nombrecircuito?: string | null;
    interlockdesc?: string | null;
    riesgoadescripcion?: string | null;
    probabilidadDescripcion?: string | null;
    impactoDescripcion?: string | null;
    riesgoDescripcion?: string | null;
    observacionAprobacionB?: string | null;
    // Eliminar tagconcat si no es intencional
}

// El npm run build no lo usa
// const isValidDate = (dateString: string | null): boolean => {
//     if (!dateString || dateString === "--" || dateString.trim() === "") return false;
//     const date = new Date(dateString);
//     return !isNaN(date.getTime());
// };

/* const isValidDate = (dateString: string | null): boolean => {
    if (!dateString || dateString === "--" || dateString.trim() === "") return false;
    const date = new Date(dateString);
    return !isNaN(date.getTime());
};
 */
export async function POST(request: Request) {
    const pool = await poolPromise;
    const transaction = await pool.transaction();

    try {
        await transaction.begin();

        const { id, observarAprobacionretiro, usuario } = await request.json();

        // Actualización combinada
        const result = await pool.request()
            .input("id", id)
            .input("observarAprobacionretiro", observarAprobacionretiro || null) // Manejo de valor nulo
            .input("usuario", usuario)
            .query(`
                UPDATE TRS_Solicitud_forzado 
                SET OBSERVACION_APROBACION_B = @observarAprobacionretiro,
                    FECHA_OBSERVACION_APROBACION_B = GETDATE(),
                    USUARIO_OBSERVACION_APROBACION_B = @usuario,
                    ESTADOSOLICITUD = 'PENDIENTE-RETIRO' -- Corregido a formato consistente
                WHERE SOLICITUD_ID = @id
            `);

        if (result.rowsAffected[0] === 0) {
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

        const mailOptionsAprobador: MailOptions = {
            from: "test@prot.one",
            to: solicitud.aprobadorACorreo,
            subject: "[APP FORZADOS] Solicitud de retiro observada durante la Aprobación",
            html: createRejectionHTML(solicitud),
        };

        const mailOptionsEjecutor: MailOptions = {
            from: "test@prot.one",
            to: solicitud.ejecutorACorreo,
            subject: "[APP FORZADOS] Solicitud de retiro observada durante la Aprobación",
            html: createRejectionHTML(solicitud),
        };

        const mailOptionsSolicitante: MailOptions = {
            from: "test@prot.one",
            to: solicitud.solicitanteACorreo, // Corrección aquí
            subject: "[APP FORZADOS] Solicitud de retiro observada durante la Aprobación",
            html: createRejectionHTML(solicitud),
        };

        // Enviar correos de forma no bloqueante
        await Promise.all([
            mailer.sendMail(mailOptionsAprobador).catch((error) => console.error("Error sending email to aprobador:", error)),
            mailer.sendMail(mailOptionsEjecutor).catch((error) => console.error("Error sending email to ejecutor:", error)),
            mailer.sendMail(mailOptionsSolicitante).catch((error) => console.error("Error sending email to solicitante:", error)),
        ]);

        await transaction.commit();
        return NextResponse.json({
            success: true,
            message: "Solicitud Observada exitosamente",
        });
    } catch (error) {
        await transaction.rollback();
        console.error("Error processing POST:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Error interno del servidor",
            },
            { status: 500 }
        );
    }
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
                ${solicitud.tagConcat}
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
               <td style="text-align: left;"><b>Motivo de observación:</b></td>
               <td style="text-align: right;">${solicitud.observacionAprobacionB}</td>
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