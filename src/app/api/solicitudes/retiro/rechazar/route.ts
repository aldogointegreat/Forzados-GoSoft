import { NextResponse } from "next/server";
import { poolPromise } from "@sql/lib/db";
import { mailer, MailOptions } from "@/lib/mailer";
import bcrypt from "bcrypt";

interface SolicitudRechazo {
	SOLICITUD_ID: number;
	SOLICITANTE_B_ID: string;
	DESCRIPCIONFORZADO : string;
	TAG_CONCAT: string;
	ESTADOSOLICITUD: string;
	FECHA_EJECUCION_A: Date;
  FECHA_APROBACION_B: Date;
	FECHACIERRE: Date;
	USUARIO_CREACION_A: string;
	FECHA_CREACION_A: Date;
  FECHA_CREACION_B: Date;
	USUARIO_MODIFICACION: string;
	PROYECTO_ID: string;
	PROYECTO_DESCRIPCION: string;
 	TAGSUFIJO_DESCRIPCION : string;
	SUBAREA_CODIGO : string;
	SUBAREA_DESCRIPCION : string;
	DISCIPLINA_DESCRIPCION : string;
	TURNO_DESCRIPCION: string;
	MOTIVORECHAZO_DESCRIPCION: string;
	TIPOFORZADO_DESCRIPCION : string;
	TAGCENTRO_CODIGO: string;
	APROBADOR_A_NOMBRE: string;
	EJECUTOR_A_NOMBRE: string;
	SOLICITANTE_A_NOMBRE: string;
	TAGCENTRO_DESCRIPCION: string;
	RESPONSABLE_NOMBRE: string;
	RIESGOA_DESCRIPCION: string;
	SOLICITANTE_B_NOMBRE: string;
	APROBADOR_B_NOMBRE : string;
	EJECUTOR_B_NOMBRE : string;
	AP_SOLICITANTE_B: string;
	AM_SOLICITANTE_B: string;
	APROBADOR_B_ID: string;
	NOMBRE_APROBADOR_B: string;
	AP_APROBADOR_B: string;
	AM_APROBADOR_B: string;
	EJECUTOR_B_ID: string;
	AP_EJECUTOR_B: string;
	AM_EJECUTOR_B: string;
	OBSERVACIONES_B: string;
  FECHA_FIN_PLANIFICADA: Date;
  GRUPO_NOMBRE: string;
  AREA_DESCRIPCION: string;
  NOMBRE_CIRCUITO: string;
  INTERLOCK_DESC: string;
  PROBABILIDAD_DESCRIPCION: string;
  IMPACTO_DESCRIPCION: string;
  RIESGO_DESCRIPCION: string;
}

const createRejectionHTML = (solicitud: SolicitudRechazo) => {
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
              <td style="text-align: left;"><b>Fecha de aprobación del retiro:</b></td>
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
		const { id, motivoRechazo, usuario, token } = await request.json();

		if (token) {
			const register = await pool.request().input("id", id).query("SELECT ACTION_TOKEN FROM TRS_SOLICITUD_FORZADO WHERE SOLICITUD_ID = @id");

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

		const result = await pool.request().input("id", id).input("motivoRechazo", motivoRechazo).input("usuario", usuario).query(`
                UPDATE TRS_Solicitud_forzado 
                SET 
                    ESTADOSOLICITUD = 'RECHAZADO-RETIRO', 
                    MOTIVORECHAZO_B_ID = @motivoRechazo, 
                    FECHA_MODIFICACION = GETDATE(), 
                    USUARIO_MODIFICACION = @usuario,
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
    // Obtenemos datos adicionales para armar el correo
 	const motivoResult = await pool.request().input("id", id).query(`
    SELECT 
      SF.SOLICITUD_ID,
        SF.DESCRIPCIONFORZADO,
        SF.TAG_CONCAT, -- Agregamos TAG_CONCAT,
        SF.ESTADOSOLICITUD,
        SF.FECHA_EJECUCION_A,
        SF.FECHA_APROBACION_B,
        SF.FECHACIERRE,
        SF.USUARIO_CREACION_A,
        SF.FECHA_CREACION_A,
        SF.FECHA_CREACION_B,
        SF.USUARIO_MODIFICACION,
        SF.FECHA_APROBACION_B,
        SF.PROYECTO_ID AS PROYECTO_ID,
        PROY.DESCRIPCION AS PROYECTO_DESCRIPCION,
        SF.FECHA_FIN_PLANIFICADA,
        MG.NOMBRE AS GRUPO_NOMBRE,
        UXAA.CORREO AS APROBADOR_A_CORREO,
        (UXAA.NOMBRE + ' ' + UXAA.APEPATERNO + ' ' + UXAA.APEMATERNO) AS APROBADOR_A_NOMBRE,
        SF.EJECUTOR_A_ID,
        UXEA.CORREO AS EJECUTOR_A_CORREO,
        (UXEA.NOMBRE + ' ' + UXEA.APEPATERNO + ' ' + UXEA.APEMATERNO) AS EJECUTOR_A_NOMBRE,
        SF.SOLICITANTE_A_ID,
        UXSA.CORREO AS SOLICITANTE_A_CORREO,
        (UXSA.NOMBRE + ' ' + UXSA.APEPATERNO + ' ' + UXSA.APEMATERNO) AS SOLICITANTE_A_NOMBRE,
        UXAB.CORREO AS APROBADOR_B_CORREO,
        (UXAB.NOMBRE + ' ' + UXAB.APEPATERNO + ' ' + UXAB.APEMATERNO) AS APROBADOR_B_NOMBRE,
        SF.EJECUTOR_B_ID,
        UXEB.CORREO AS EJECUTOR_B_CORREO,
        (UXEB.NOMBRE + ' ' + UXEB.APEPATERNO + ' ' + UXEB.APEMATERNO) AS EJECUTOR_B_NOMBRE,
        SF.SOLICITANTE_B_ID,
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
      SF.INTERLOCK,
        CASE 
              WHEN SF.INTERLOCK = 0 THEN 'NO'
              WHEN SF.INTERLOCK = 1 THEN 'SÍ'
              ELSE NULL
        END AS INTERLOCK_DESC,
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
      LEFT JOIN MAE_USUARIO UXEA ON SF.EJECUTOR_A_ID = CAST(UXEA.USUARIO_ID AS CHAR)
      LEFT JOIN MAE_USUARIO UXEB ON SF.EJECUTOR_B_ID = CAST(UXEB.USUARIO_ID AS CHAR)
      LEFT JOIN MAE_PROYECTO PROY ON SF.PROYECTO_ID = CAST(PROY.PROYECTO_ID AS CHAR)
      LEFT JOIN MAE_GRUPO MG ON SF.GRUPO_B = MG.GRUPO_ID
      LEFT JOIN MAE_CIRCUITO CIR ON SF.CIRCUITO_ID = CIR.CIRCUITO_ID
      LEFT JOIN MAE_USUARIO UXSO ON SF.SOLICITANTE_A_ID = UXSO.USUARIO_ID
      LEFT JOIN MAE_AREA AREAX ON UXSO.AREA_ID = AREAX.AREA_ID
      LEFT JOIN dbo.PROBABILIDAD PROB ON SF.PROBABILIDAD_RIESGO = PROB.PROBABILIDAD_ID
      LEFT JOIN dbo.IMPACTO IMP ON SF.IMPACTO = IMP.IMPACTO_ID
      LEFT JOIN dbo.RIESGO RSG ON SF.RIESGO = RSG.RIESGO_ID
  WHERE SF.SOLICITUD_ID = @id
      `);

      if (motivoResult.recordset.length > 0) {
        const solicitud = motivoResult.recordset[0];
        const mailOptions: MailOptions = {
          from: process.env.SMTP_USER,
          to: `${solicitud.SOLICITANTE_B_CORREO}, ${solicitud.APROBADOR_B_CORREO}, ${solicitud.EJECUTOR_B_CORREO}`,
          subject: "[APP FORZADOS] Solicitud de Retiro Rechazado",
          html: createRejectionHTML(solicitud),
        };
  
        // Envío de correo no bloqueante
        mailer.sendMail(mailOptions).catch((error) => console.error("Error sending email:", error));
      }
  
      await transaction.commit();
      return NextResponse.json({
        success: true,
        message: "Solicitud rechazada exitosamente",
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
  