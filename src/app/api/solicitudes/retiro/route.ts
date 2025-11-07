import { NextResponse } from "next/server";
import { poolPromise } from "@sql/lib/db";
import { mailer, MailOptions } from "@/lib/mailer";
import bcrypt from "bcrypt";

// Función para generar una cadena aleatoria
const generateRandomString = (length: number): string => {
	const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	let result = "";
	const charactersLength = characters.length;
	for (let i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
};

// Validación de correos electrónicos
const isValidEmail = (email: string): boolean => {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
};

// Endpoint POST
export async function POST(request: Request) {
	try {
		const data = await request.json();

		// Validación básica de datos
		if (!data.solicitanteRetiro || !data.aprobadorRetiro || !data.tipoGrupoB) {
			return NextResponse.json({ success: false, message: "Datos incompletos en la solicitud" }, { status: 400 });
		}

		const { id, solicitanteRetiro, aprobadorRetiro, tipoGrupoB, observaciones, usuario } = data;

		// Generar y ejecutar query de actualización
		const query = generateUpdateQuery({ id, solicitanteRetiro, aprobadorRetiro, tipoGrupoB, observaciones, usuario });
		const pool = await poolPromise;
		const result = await pool.query(query);

		if (result.rowsAffected?.[0] > 0) {
			// Generar token de seguridad
			const randomString = generateRandomString(5);
			const actionToken = await bcrypt.hash(randomString, 10);

			// Actualizar token en la base de datos
			const updateTokenQuery = `UPDATE TRS_SOLICITUD_FORZADO 
                               SET ACTION_TOKEN = @actionToken 
                               WHERE SOLICITUD_ID = @id`;
			const tokenRequest = pool.request();
			tokenRequest.input("actionToken", actionToken);
			tokenRequest.input("id", id);
			await tokenRequest.query(updateTokenQuery);

			// Obtener datos actualizados de la solicitud
			const solicitudResult = await pool.request().input("id", id).query(`
      SELECT 
        SF.SOLICITUD_ID,
        SF.DESCRIPCIONFORZADO,
        SF.TAG_CONCAT,
        SF.ESTADOSOLICITUD,
        SF.FECHA_CREACION_A,
        SF.FECHA_EJECUCION_A,
        SF.FECHA_CREACION_B,
        SF.USUARIO_CREACION_A,
        SF.FECHA_FIN_PLANIFICADA,
        SF.USUARIO_MODIFICACION,
        SF.PROYECTO_ID,
        SF.INTERLOCK,
        CASE 
            WHEN SF.INTERLOCK = 0 THEN 'NO'
            WHEN SF.INTERLOCK = 1 THEN 'SÍ'
            ELSE NULL
        END AS INTERLOCK_DESC,
        PROY.DESCRIPCION AS PROYECTO_DESCRIPCION,
        UXAA.CORREO AS APROBADOR_A_CORREO,
        (UXAA.NOMBRE + ' ' + UXAA.APEPATERNO + ' ' + UXAA.APEMATERNO) AS APROBADOR_A_NOMBRE,
        SF.GRUPO_B AS GRUPO_B,
        MG.NOMBRE AS GRUPO_NOMBRE,
        UXSA.CORREO AS SOLICITANTE_A_CORREO,
        (UXSA.NOMBRE + ' ' + UXSA.APEPATERNO + ' ' + UXSA.APEMATERNO) AS SOLICITANTE_A_NOMBRE,
        UXAB.CORREO AS APROBADOR_B_CORREO,
        (UXAB.NOMBRE + ' ' + UXAB.APEPATERNO + ' ' + UXAB.APEMATERNO) AS APROBADOR_B_NOMBRE,
        UXSB.CORREO AS SOLICITANTE_B_CORREO,
        (UXSB.NOMBRE + ' ' + UXSB.APEPATERNO + ' ' + UXSB.APEMATERNO) AS SOLICITANTE_B_NOMBRE,
        SF.TAGSUFIJO AS TAGSUFIJO_DESCRIPCION,
        SA.CODIGO AS SUBAREA_CODIGO,
        SA.DESCRIPCION AS SUBAREA_DESCRIPCION,
        D.DESCRIPCION AS DISCIPLINA_DESCRIPCION,
        T.DESCRIPCION AS TURNO_DESCRIPCION,
        MR.DESCRIPCION AS MOTIVORECHAZO_DESCRIPCION,
        TF.DESCRIPCION AS TIPOFORZADO_DESCRIPCION,
        TC.CODIGO AS TAGCENTRO_CODIGO,
        TC.DESCRIPCION AS TAGCENTRO_DESCRIPCION,
        R.NOMBRE AS RESPONSABLE_NOMBRE,
        RA.DESCRIPCION AS RIESGOA_DESCRIPCION,
        SF.OBSERVACIONES_B,
        AREAX.DESCRIPCION AS AREA_DESCRIPCION,
        CIR.DESCRIPCION AS NOMBRE_CIRCUITO,
        PROB.DESCRIPCION AS PROBABILIDAD_DESCRIPCION,
        IMP.DESCRIPCION AS IMPACTO_DESCRIPCION,
	RSG.DESCRIPCION AS RIESGO_DESCRIPCION
      FROM TRS_SOLICITUD_FORZADO SF
        LEFT JOIN SUB_AREA SA ON SF.SUBAREA_ID = SA.SUBAREA_ID
        LEFT JOIN DISCIPLINA D ON SF.DISCIPLINA_ID = D.DISCIPLINA_ID
        LEFT JOIN TURNO T ON SF.TURNO_ID = T.TURNO_ID
        LEFT JOIN MOTIVO_RECHAZO MR ON SF.MOTIVORECHAZO_A_ID = MR.MOTIVORECHAZO_ID
        LEFT JOIN TIPO_FORZADO TF ON SF.TIPOFORZADO_ID = TF.TIPOFORZADO_ID
        LEFT JOIN TAG_CENTRO TC ON SF.TAGCENTRO_ID = TC.TAGCENTRO_ID
        LEFT JOIN RESPONSABLE R ON SF.RESPONSABLE_ID = R.RESPONSABLE_ID
        LEFT JOIN MAE_RIESGO_A RA ON SF.RIESGOA_ID = RA.RIESGOA_ID
        LEFT JOIN MAE_USUARIO UXSA ON SF.SOLICITANTE_A_ID = CAST(UXSA.USUARIO_ID AS CHAR)
        LEFT JOIN MAE_USUARIO UXSB ON SF.SOLICITANTE_B_ID = CAST(UXSB.USUARIO_ID AS CHAR)
        LEFT JOIN MAE_USUARIO UXAA ON SF.APROBADOR_A_ID = CAST(UXAA.USUARIO_ID AS CHAR)
        LEFT JOIN MAE_USUARIO UXAB ON SF.APROBADOR_B_ID = CAST(UXAB.USUARIO_ID AS CHAR)
        LEFT JOIN MAE_PROYECTO PROY ON SF.PROYECTO_ID = CAST(PROY.PROYECTO_ID AS CHAR)
        LEFT JOIN MAE_GRUPO MG ON SF.GRUPO_B = MG.GRUPO_ID
        LEFT JOIN MAE_USUARIO UXSO ON SF.SOLICITANTE_B_ID = UXSO.USUARIO_ID
        LEFT JOIN MAE_AREA AREAX ON UXSO.AREA_ID = AREAX.AREA_ID
        LEFT JOIN MAE_CIRCUITO CIR ON SF.CIRCUITO_ID = CIR.CIRCUITO_ID
        LEFT JOIN dbo.PROBABILIDAD PROB ON SF.PROBABILIDAD_RIESGO = PROB.PROBABILIDAD_ID
        LEFT JOIN dbo.IMPACTO IMP ON SF.IMPACTO = IMP.IMPACTO_ID
	LEFT JOIN dbo.RIESGO RSG ON SF.RIESGO = RSG.RIESGO_ID
      WHERE SF.SOLICITUD_ID = @id
`);

			if (solicitudResult.recordset.length > 0) {
				const solicitud = solicitudResult.recordset[0];
				const newApprovalHTML = createApprovalHTML(solicitud, randomString, id, usuario);
				const newApprovalOtrosHTML = createApprovalOtrosHTML(solicitud);

				// Obtener correos de los usuarios del grupo seleccionado
				const grupoQuery = `
          SELECT MU.CORREO
          FROM MAE_USUARIO MU
          WHERE MU.GRUPO_ID = @grupoB
        `;
				const grupoRequest = pool.request();
				grupoRequest.input("grupoB", tipoGrupoB);
				const grupoResult = await grupoRequest.query(grupoQuery);

				const individualEmailQuery = `
          SELECT UA.CORREO AS aprobadorCorreo, US.CORREO AS solicitanteCorreo
          FROM TRS_SOLICITUD_FORZADO SF
          LEFT JOIN MAE_USUARIO UA ON SF.APROBADOR_B_ID = UA.USUARIO_ID
          LEFT JOIN MAE_USUARIO US ON SF.SOLICITANTE_B_ID = US.USUARIO_ID
          WHERE SF.SOLICITUD_ID = @id
        `;
				const individualEmailRequest = pool.request();
				individualEmailRequest.input("id", id);
				const individualEmailResult = await individualEmailRequest.query(individualEmailQuery);
				const { aprobadorCorreo, solicitanteCorreo } = individualEmailResult.recordset[0] || {};

				const grupoCorreos = grupoResult.recordset.map((row: any) => row.CORREO).filter((correo: string) => correo && isValidEmail(correo) && correo !== aprobadorCorreo && correo !== solicitanteCorreo);

				// Configurar correos electrónicos
				const mailOptions: { [key: string]: MailOptions } = {
					aprobador: {
						from: process.env.SMTP_USER,
						to: aprobadorCorreo,
						subject: "[APP FORZADOS] Solicitud de Retiro por Aprobar",
						html: newApprovalHTML,
					},
					solicitante: {
						from: process.env.SMTP_USER,
						to: solicitanteCorreo,
						subject: "[APP FORZADOS] Solicitud de Retiro",
						html: newApprovalOtrosHTML,
					},
				};

				const emailErrors: string[] = [];

				// Enviar correo al aprobador
				if (aprobadorCorreo) {
					try {
						await mailer.sendMail(mailOptions.aprobador);
					} catch (err) {
						emailErrors.push(`Error enviando correo al aprobador (${aprobadorCorreo}): ${(err as Error).message}`);
					}
				}

				// Enviar correo al solicitante
				if (solicitanteCorreo) {
					try {
						await mailer.sendMail(mailOptions.solicitante);
					} catch (err) {
						emailErrors.push(`Error enviando correo al solicitante (${solicitanteCorreo}): ${(err as Error).message}`);
					}
				}

				// Enviar correos a los usuarios del grupo
				if (grupoCorreos.length > 0) {
					for (const correo of grupoCorreos) {
						const mailOptionsGrupo: MailOptions = {
							from: process.env.SMTP_USER,
							to: correo,
							subject: "[APP FORZADOS] Solicitud de Retiro por Ejecutar",
							html: newApprovalOtrosHTML,
						};
						try {
							await mailer.sendMail(mailOptionsGrupo);
						} catch (err) {
							emailErrors.push(`Error enviando correo al miembro del grupo (${correo}): ${(err as Error).message}`);
						}
					}
				}

				if (emailErrors.length > 0) {
					console.error("Errores al enviar correos:", emailErrors);
					return NextResponse.json({
						success: true,
						message: "Registro actualizado, pero algunos correos fallaron",
						data,
						emailErrors,
					});
				}

				return NextResponse.json({
					success: true,
					message: "Registro actualizado y notificaciones enviadas",
					data,
				});
			} else {
				return NextResponse.json({ success: false, message: "No se encontraron datos de la solicitud actualizada" }, { status: 500 });
			}
		} else {
			return NextResponse.json({ success: false, message: "No se pudo actualizar el registro" }, { status: 500 });
		}
	} catch (error) {
		console.error("Error procesando la solicitud:", error);
		return NextResponse.json({ success: false, message: "Error interno del servidor" }, { status: 500 });
	}
}

// Tipos y funciones auxiliares
type UpdateQueryParameters = {
	id: string;
	solicitanteRetiro: string;
	aprobadorRetiro: string;
	tipoGrupoB: string;
	observaciones: string;
	usuario: string;
};

const generateUpdateQuery = (parameters: UpdateQueryParameters) => {
	const escapedObservaciones = parameters.observaciones.replace(/'/g, "''");
	return `UPDATE TRS_SOLICITUD_FORZADO SET
    SOLICITANTE_B_ID = ${parameters.solicitanteRetiro},
    APROBADOR_B_ID = ${parameters.aprobadorRetiro},
    GRUPO_B = ${parameters.tipoGrupoB},
    OBSERVACIONES_B = '${escapedObservaciones}',
    USUARIO_MODIFICACION = '${parameters.usuario}',
    FECHA_CREACION_B =  getdate(),
    ESTADOSOLICITUD = 'PENDIENTE-RETIRO'
    WHERE SOLICITUD_ID = ${parameters.id};`;
};

// Interfaz para la solicitud
interface SolicitudAprobada {
	SOLICITUD_ID: number;
	DESCRIPCIONFORZADO: string;
	TAG_CONCAT: string;
	ESTADOSOLICITUD: string;
	FECHA_EJECUCION_A: Date;
	FECHACIERRE: Date;
	FECHA_CREACION_A: Date;
	FECHA_CREACION_B: string;
	FECHA_FIN_PLANIFICADA: Date;
	USUARIO_MODIFICACION: string;
	PROYECTO_ID: string;
	PROYECTO_DESCRIPCION: string;
	TAGSUFIJO_DESCRIPCION: string;
	SUBAREA_CODIGO: string;
	SUBAREA_DESCRIPCION: string;
	DISCIPLINA_DESCRIPCION: string;
	TURNO_DESCRIPCION: string;
	MOTIVORECHAZO_DESCRIPCION: string;
	TIPOFORZADO_DESCRIPCION: string;
	TAGCENTRO_CODIGO: string;
	TAGCENTRO_DESCRIPCION: string;
	RESPONSABLE_NOMBRE: string;
	RIESGOA_DESCRIPCION: string;
	OBSERVACIONES_B: string;
	APROBADOR_A_CORREO: string;
	APROBADOR_A_NOMBRE: string;
	SOLICITANTE_A_CORREO: string;
	SOLICITANTE_A_NOMBRE: string;
	APROBADOR_B_CORREO: string;
	APROBADOR_B_NOMBRE: string;
	SOLICITANTE_B_CORREO: string;
	SOLICITANTE_B_NOMBRE: string;
	GRUPO_B: string;
	GRUPO_NOMBRE: string;
  AREA_DESCRIPCION: string;
  NOMBRE_CIRCUITO: string;
  INTERLOCK_DESC: string;
  PROBABILIDAD_DESCRIPCION: string;
  IMPACTO_DESCRIPCION: string;
  RIESGO_DESCRIPCION: string;
}

// Funciones para generar HTML de correos (reutilizando tus funciones originales)
const createApprovalHTML = (solicitud: SolicitudAprobada, actionToken: string, insertedId: string, usuario: string) => {
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
              <td style="text-align: right;">${solicitud.SOLICITUD_ID}</td>
            </tr>
            <tr>
              <td style="text-align: left;"><b>Descripción:</b></td>
              <td style="text-align: right;">${solicitud.DESCRIPCIONFORZADO}</td>
            </tr>
            <tr>
              <td style="text-align: left;"><b>Tag:</b></td>
              <td style="text-align: right;">
                ${solicitud.TAG_CONCAT}
              </td>
            </tr>
            <tr>
              <td style="text-align: left;"><b>Fecha de creación del retiro:</b></td>
              <td style="text-align: right;">${new Date().toLocaleString()}</td>
            </tr>
            <tr>
              <td style="text-align: left;"><b>Fecha fin planificada:</b></td>
              <td style="text-align: right;">${new Date(solicitud.FECHA_FIN_PLANIFICADA).toLocaleString()}</td>
            </tr>
            <tr>
               <td style="text-align: left;"><b>Observaciones del retiro:</b></td>
               <td style="text-align: right;">${solicitud.OBSERVACIONES_B}</td>
             </tr>
            <tr>
               <td style="text-align: left;"><b>Solicitante:</b></td>
               <td style="text-align: right;">${solicitud.SOLICITANTE_B_NOMBRE}</td>
             </tr>
             <tr>
               <td style="text-align: left;"><b>Aprobador:</b></td>
               <td style="text-align: right;">${solicitud.APROBADOR_B_NOMBRE}</td>
             </tr>
             <tr>
               <td style="text-align: left;"><b>Grupo de ejecución:</b></td>
               <td style="text-align: right;">${solicitud.GRUPO_NOMBRE}</td>
             </tr>
             <tr>
               <td style="text-align: left;"><b>Turno:</b></td>
               <td style="text-align: right;">${solicitud.TURNO_DESCRIPCION}</td>
             </tr>
             <tr>
               <td style="text-align: left;"><b>Gerencia responsable:</b></td>
               <td style="text-align: right;">${solicitud.RESPONSABLE_NOMBRE}</td>
             </tr>
             <tr>
               <td style="text-align: left;"><b>Área:</b></td>
               <td style="text-align: right;">${solicitud.AREA_DESCRIPCION}</td>
             </tr>
             <tr>
               <td style="text-align: left;"><b>Circuito:</b></td>
               <td style="text-align: right;">${solicitud.NOMBRE_CIRCUITO}</td>
             </tr>
             <tr>
               <td style="text-align: left;"><b>Disciplina:</b></td>
               <td style="text-align: right;">${solicitud.DISCIPLINA_DESCRIPCION}</td>
             </tr>
             <tr>
               <td style="text-align: left;"><b>Interlock de seguridad:</b></td>
               <td style="text-align: right;">${solicitud.INTERLOCK_DESC}</td>
             </tr>
             <tr>
               <td style="text-align: left;"><b>Riesgo a:</b></td>
               <td style="text-align: right;">${solicitud.RIESGOA_DESCRIPCION}</td>
             </tr>
             <tr>
               <td style="text-align: left;"><b>Probabilidad: </b></td>
               <td style="text-align: right;">${solicitud.PROBABILIDAD_DESCRIPCION}</td>
             </tr>
             <tr>
               <td style="text-align: left;"><b>Impacto: </b></td>
               <td style="text-align: right;">${solicitud.IMPACTO_DESCRIPCION}</td>
             </tr>
             <tr>
               <td style="text-align: left;"><b>Nivel de Riesgo: </b></td>
               <td style="text-align: right;">${solicitud.RIESGO_DESCRIPCION}</td>
             </tr>
             <tr style="display: flex;justify-content:center;width:600px; gap:48px">
              <td style="text-align: center;">
                <a 
                  href="http${process.env.NODE_ENV == "production" ? "s" : ""}://${process.env.HOSTNAME}/acciones/aprobar/retiro?token=${actionToken}&id=${insertedId}&bxs=${usuario}&action=retiro"
                  class="button">
                  Aprobar
                </a>
              </td>
              <td style="text-align: center;">
                <a 
                  href="http${process.env.NODE_ENV == "production" ? "s" : ""}://${process.env.HOSTNAME}/acciones/rechazar/retiro?token=${actionToken}&id=${insertedId}&bxs=${usuario}&action=retiro" 
                  class="button button-reject"
                >
                  Rechazar
                </a>
              </td>
            </tr>
          </table>
        </div>
      </body>
    </html>
  `;
};

const createApprovalOtrosHTML = (solicitud: SolicitudAprobada) => {
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
              <td style="text-align: right;">${solicitud.SOLICITUD_ID}</td>
            </tr>
            <tr>
              <td style="text-align: left;"><b>Descripción:</b></td>
              <td style="text-align: right;">${solicitud.DESCRIPCIONFORZADO}</td>
            </tr>
            <tr>
              <td style="text-align: left;"><b>Tag:</b></td>
              <td style="text-align: right;">
                ${solicitud.TAG_CONCAT}
              </td>
            </tr>
            <tr>
              <td style="text-align: left;"><b>Fecha de creación del retiro:</b></td>
              <td style="text-align: right;">${new Date().toLocaleString()}</td>
            </tr>
            <tr>
              <td style="text-align: left;"><b>Fecha fin planificada:</b></td>
              <td style="text-align: right;">${new Date(solicitud.FECHA_FIN_PLANIFICADA).toLocaleString()}</td>
            </tr>
            <tr>
               <td style="text-align: left;"><b>Observaciones del retiro:</b></td>
               <td style="text-align: right;">${solicitud.OBSERVACIONES_B}</td>
             </tr>
            <tr>
               <td style="text-align: left;"><b>Solicitante:</b></td>
               <td style="text-align: right;">${solicitud.SOLICITANTE_B_NOMBRE}</td>
             </tr>
             <tr>
               <td style="text-align: left;"><b>Aprobador:</b></td>
               <td style="text-align: right;">${solicitud.APROBADOR_B_NOMBRE}</td>
             </tr>
             <tr>
               <td style="text-align: left;"><b>Grupo de ejecución:</b></td>
               <td style="text-align: right;">${solicitud.GRUPO_NOMBRE}</td>
             </tr>
             <tr>
               <td style="text-align: left;"><b>Turno:</b></td>
               <td style="text-align: right;">${solicitud.TURNO_DESCRIPCION}</td>
             </tr>
             <tr>
               <td style="text-align: left;"><b>Gerencia responsable:</b></td>
               <td style="text-align: right;">${solicitud.RESPONSABLE_NOMBRE}</td>
             </tr>
             <tr>
               <td style="text-align: left;"><b>Área:</b></td>
               <td style="text-align: right;">${solicitud.AREA_DESCRIPCION}</td>
             </tr>
             <tr>
               <td style="text-align: left;"><b>Circuito:</b></td>
               <td style="text-align: right;">${solicitud.NOMBRE_CIRCUITO}</td>
             </tr>
             <tr>
               <td style="text-align: left;"><b>Disciplina:</b></td>
               <td style="text-align: right;">${solicitud.DISCIPLINA_DESCRIPCION}</td>
             </tr>
             <tr>
               <td style="text-align: left;"><b>Interlock de seguridad:</b></td>
               <td style="text-align: right;">${solicitud.INTERLOCK_DESC}</td>
             </tr>
             <tr>
               <td style="text-align: left;"><b>Riesgo a:</b></td>
               <td style="text-align: right;">${solicitud.RIESGOA_DESCRIPCION}</td>
             </tr>
             <tr>
               <td style="text-align: left;"><b>Probabilidad: </b></td>
               <td style="text-align: right;">${solicitud.PROBABILIDAD_DESCRIPCION}</td>
             </tr>
             <tr>
               <td style="text-align: left;"><b>Impacto: </b></td>
               <td style="text-align: right;">${solicitud.IMPACTO_DESCRIPCION}</td>
             </tr>
             <tr>
               <td style="text-align: left;"><b>Nivel de Riesgo: </b></td>
               <td style="text-align: right;">${solicitud.RIESGO_DESCRIPCION}</td>
             </tr>
          </table>
        </div>
      </body>
    </html>
  `;
};
