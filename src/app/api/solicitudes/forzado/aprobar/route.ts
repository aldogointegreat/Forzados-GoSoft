import { NextResponse } from "next/server";
import { poolPromise } from "@sql/lib/db";
import bcrypt from "bcrypt";
import { mailer, MailOptions } from "@/lib/mailer";
import { getSingleSolicitud } from "../common";

interface Solicitud {
	id?: string | null;
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
	aprobadorId?: string | null;
	aprobadorNombre?: string | null;
	solicitanteId?: string | null;
	solicitanteNombre?: string | null;
	nombreGrupo?: string | null;
	subareaCodigo?: string | null;
	subareaDescripcion?: string | null;
	disciplinaDescripcion?: string | null;
	turnoDescripcion?: string | null;
	motivoRechazoDescripcion?: string | null;
	motivoRechazoBDescripcion?: string | null;
	tipoForzadoDescripcion?: string | null;
	tagCentroCodigo?: string | null;
	tagCentroDescripcion?: string | null;
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
	tagConcat?: string | null;
	tagSufijo?: string | null;
	fechaFinPlanificada?: string | null;
	grupoNombre?: string | null;
	interlockdesc?: string | null;
	riesgoadescripcion?: string | null;
	probabilidadDescripcion?: string | null;
	area?: string | null;
	nombrecircuito?: string | null;
	impactoDescripcion?: string | null;
}
const createAprobacionHTML = (solicitud: Solicitud) => {
	return `
<!DOCTYPE html>
		<html lang="es">
           <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>La Solicitud de Forzado ah sido Aprobado</title>
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
            /* Centra horizontalmente todo el texto dentro del container */
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
            color: #ffffff !important; /* Blanco puro */
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
            color: #ffffff !important; /* Blanco puro */
          }
          .button-reject:hover {
            background-color: #c9302c;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          }
         /*   Si deseas que la tabla en sí se colapse y se centre, puedes descomentar estas reglas: */
          table {
            border-collapse: collapse;
            margin: 0 auto;
          }
         
          
          /* Ejemplo de media query, si lo necesitas:
          @media (max-width: 600px) {
            .field-group {
              grid-template-columns: 1fr;
            }
          }
          */
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
            <!-- Definimos anchos de columnas -->
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
              <td style="text-align: left;"><b>Fecha de creación:</b></td>
              <td style="text-align: right;">${new Date().toLocaleString()}</td>
            </tr>
            <tr>
              <td style="text-align: left;"><b>Fecha fin planificada:</b></td>
              <td style="text-align: right;">${new Date(solicitud.fechaFinPlanificada).toLocaleString()}</td>
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
		const { id, usuario, token } = await request.json();

		if (token) {
			const register = await transaction.request().input("id", id).query("SELECT ACTION_TOKEN FROM TRS_SOLICITUD_FORZADO WHERE SOLICITUD_ID = @id");

			if (!register.recordset.length || !register.recordset[0].ACTION_TOKEN) {
				return NextResponse.json(
					{
						success: false,
						message: "Token ha expirado",
					},
					{ status: 400 }
				);
			}

			const isTokenValid = await bcrypt.compare(token, register.recordset[0].ACTION_TOKEN);
			if (!isTokenValid) {
				return NextResponse.json(
					{
						success: false,
						message: "Token inválido",
					},
					{ status: 400 }
				);
			}
		}

		const result = await pool.request().input("id", id).input("usuario", usuario).query(`
    UPDATE TRS_Solicitud_forzado 
    SET ESTADOSOLICITUD = 'APROBADO-FORZADO',
      APROBADOR_A_ID = @usuario,
      FECHA_APROBACION_A = getdate(),
      ACTION_TOKEN = ''
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
			from: process.env.SMTP_USER,
			to: solicitud.aprobadorACorreo,
			subject: "[APP FORZADOS] Solicitud de Forzado Aprobada",
			html: createAprobacionHTML(solicitud),
		};

		const mailOptionsEjecutor: MailOptions = {
			from: process.env.SMTP_USER,
			to: solicitud.ejecutorACorreo,
			subject: "[APP FORZADOS] Solicitud de Forzado Aprobada",
			html: createAprobacionHTML(solicitud),
		};

		const mailOptionsSolicitante: MailOptions = {
			from: process.env.SMTP_USER,
			to: solicitud.solicitanteACorreo,
			subject: "[APP FORZADOS] Solicitud de Forzado Aprobada",
			html: createAprobacionHTML(solicitud),
		};

		// Enviar correos de forma asíncrona sin `await`
		Promise.all([
			mailer.sendMail(mailOptionsAprobador).catch((error) => console.error("Error sending email to aprobador:", error)),
			mailer.sendMail(mailOptionsEjecutor).catch((error) => console.error("Error sending email to ejecutor:", error)),
			mailer.sendMail(mailOptionsSolicitante).catch((error) => console.error("Error sending email to solicitante:", error)),
		]).catch((error) => console.error("Error sending emails:", error));

		await transaction.commit();
		return NextResponse.json({
			success: true,
			message: "Solicitud aprobada exitosamente",
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
