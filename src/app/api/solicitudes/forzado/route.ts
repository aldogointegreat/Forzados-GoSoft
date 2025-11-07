import { NextResponse } from "next/server";
import { poolPromise } from "@sql/lib/db";
import { mailer, MailOptions } from "@/lib/mailer";
import bcrypt from "bcrypt";
import { formatDateToUTC } from "@/helpers/format-date";

const generateRandomString = (length: number): string => {
	const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	let result = "";
	const charactersLength = characters.length;
	for (let i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
};

const isValidEmail = (email: string): boolean => {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
};

export async function GET() {
	try {
		const solicitudes = await getAllSolicitudes();
		return NextResponse.json({ success: true, message: "Records fetched successfully", data: solicitudes });
	} catch (error) {
		console.error("Error processing GET:", error);
		return NextResponse.json({ success: false, message: "Failed to fetch records" }, { status: 500 });
	}
}

const getSingleSolicitud = async (id: string) => {
  const pool = await poolPromise;
  const request = pool.request();
  request.input("id", id);

  const result = await request.query(`
  SELECT SF.DESCRIPCIONFORZADO,
    SF.SOLICITUD_ID,
    SF.TAG_CONCAT,
    SF.ESTADOSOLICITUD,
    SF.FECHA_FIN_PLANIFICADA,
    SF.FECHA_EJECUCION_A,
    SF.FECHACIERRE,
    SF.APROBADOR_A_ID,
    SF.CIRCUITO_ID,
    SF.INTERLOCK,
      CASE 
          WHEN SF.INTERLOCK = 0 THEN 'NO'
          WHEN SF.INTERLOCK = 1 THEN 'SÍ'
          ELSE NULL
      END AS INTERLOCK_DESC,
    CIR.DESCRIPCION AS NOMBRE_CIRCUITO,
    UXAP.CORREO AS APROBADOR_A_CORREO,
    (UXAP.NOMBRE + ' ' + UXAP.APEPATERNO + ' ' + UXAP.APEMATERNO) AS APROBADOR_A_NOMBRE,
    SF.GRUPO_A AS GRUPO_A,
    SF.GRUPO_B AS GRUPO_B,
    MG.NOMBRE AS NOMBRE_GRUPO,
    UXEJ.CORREO AS EJECUTOR_A_CORREO,
    (UXEJ.NOMBRE + ' ' + UXEJ.APEPATERNO + ' ' + UXEJ.APEMATERNO) AS EJECUTOR_A_NOMBRE,
    SF.SOLICITANTE_A_ID,
    UXSO.CORREO AS SOLICITANTE_A_CORREO,
    (UXSO.NOMBRE + ' ' + UXSO.APEPATERNO + ' ' + UXSO.APEMATERNO) AS SOLICITANTE_A_NOMBRE,
    SF.TAGSUFIJO AS TAGSUFIJO_DESCRIPCION,
    SA.CODIGO AS SUBAREA_CODIGO,
    SA.DESCRIPCION AS SUBAREA_DESCRIPCION,
    D.DESCRIPCION AS DISCIPLINA_DESCRIPCION,
    T.DESCRIPCION AS TURNO_DESCRIPCION,
    TF.DESCRIPCION AS TIPOFORZADO_DESCRIPCION,
    TC.CODIGO AS TAGCENTRO_CODIGO,
    TC.DESCRIPCION AS TAGCENTRO_DESCRIPCION,
    R.NOMBRE AS RESPONSABLE_NOMBRE,
    RA.DESCRIPCION AS RIESGOA_DESCRIPCION,
    SF.PROBABILIDAD_RIESGO AS PROBABILIDAD,
    PROB.DESCRIPCION AS PROBABILIDAD_DESCRIPCION, 
    SF.IMPACTO AS IMPACTO, 
    IMP.DESCRIPCION AS IMPACTO_DESCRIPCION,
    SF.RIESGO AS RIESGO,
    RSG.DESCRIPCION AS RIESGO_DESCRIPCION, 
    AREAX.DESCRIPCION AS AREA_DESCRIPCION
  FROM TRS_SOLICITUD_FORZADO SF
      LEFT JOIN SUB_AREA SA ON SF.SUBAREA_ID = SA.SUBAREA_ID
      LEFT JOIN DISCIPLINA D ON SF.DISCIPLINA_ID = D.DISCIPLINA_ID
      LEFT JOIN TURNO T ON SF.TURNO_ID = T.TURNO_ID
      LEFT JOIN TIPO_FORZADO TF ON SF.TIPOFORZADO_ID = TF.TIPOFORZADO_ID
      LEFT JOIN TAG_CENTRO TC ON SF.TAGCENTRO_ID = TC.TAGCENTRO_ID
      LEFT JOIN MAE_GRUPO MG ON SF.GRUPO_A = MG.GRUPO_ID
      LEFT JOIN RESPONSABLE R ON SF.RESPONSABLE_ID = R.RESPONSABLE_ID
      LEFT JOIN MAE_RIESGO_A RA ON SF.RIESGOA_ID = RA.RIESGOA_ID
      LEFT JOIN MAE_USUARIO UXAP ON SF.APROBADOR_A_ID = UXAP.USUARIO_ID
      LEFT JOIN MAE_USUARIO UXSO ON SF.SOLICITANTE_A_ID = UXSO.USUARIO_ID
      LEFT JOIN MAE_USUARIO UXEJ ON SF.GRUPO_A = UXEJ.GRUPO_ID
      LEFT JOIN MAE_CIRCUITO CIR ON SF.CIRCUITO_ID = CIR.CIRCUITO_ID
    LEFT JOIN MAE_AREA AREAX ON UXSO.AREA_ID = AREAX.AREA_ID
    LEFT JOIN dbo.IMPACTO IMP ON SF.IMPACTO = IMP.IMPACTO_ID
    LEFT JOIN dbo.PROBABILIDAD PROB ON SF.PROBABILIDAD_RIESGO = PROB.PROBABILIDAD_ID
    LEFT JOIN dbo.RIESGO RSG ON SF.RIESGO = RSG.RIESGO_ID
    WHERE SF.SOLICITUD_ID = @id
  `);
	return result.recordset.map((record) => ({
		id: record.SOLICITUD_ID,
		circuito: typeof record.CIRCUITO_ID === "string" ? record.CIRCUITO_ID.toUpperCase() : null,
		nombrecircuito: typeof record.NOMBRE_CIRCUITO === "string" ? record.NOMBRE_CIRCUITO.toUpperCase() : null,
		tagsufijo: typeof record.TAGSUFIJO_DESCRIPCION === "string" ? record.TAGSUFIJO_DESCRIPCION.toUpperCase() : null,
		descripcion: typeof record.DESCRIPCIONFORZADO === "string" ? record.DESCRIPCIONFORZADO: null,
		estadoSolicitud: typeof record.ESTADOSOLICITUD === "string" ? record.ESTADOSOLICITUD.toUpperCase() : null,
		fechaFinPlanificada: record.FECHA_FIN_PLANIFICADA ? record.FECHA_FIN_PLANIFICADA.toISOString() : null,
		fechaRealizacion: record.FECHA_EJECUCION_A ? record.FECHA_EJECUCION_A.toISOString() : "--",
		fechaCierre: record.FECHACIERRE ? record.FECHACIERRE.toISOString() : "--",
		aprobadorId: typeof record.APROBADOR_A_ID === "string" ? record.APROBADOR_A_ID.toUpperCase() : null,
		aprobadorNombre: typeof record.APROBADOR_A_NOMBRE === "string" ? record.APROBADOR_A_NOMBRE.toUpperCase() : null,
		grupo_A: typeof record.GRUPO_A === "string" ? record.GRUPO_A.toUpperCase() : null,
    grupo_B: typeof record.GRUPO_B === "string" ? record.GRUPO_B.toUpperCase() : null,
		grupoNombre: typeof record.NOMBRE_GRUPO === "string" ? record.NOMBRE_GRUPO.toUpperCase() : null,
		ejecutorNombre: typeof record.EJECUTOR_A_NOMBRE === "string" ? record.EJECUTOR_A_NOMBRE.toUpperCase() : null,
		solicitanteId: typeof record.SOLICITANTE_A_ID === "string" ? record.SOLICITANTE_A_ID.toUpperCase() : null,
		solicitanteNombre: typeof record.SOLICITANTE_A_NOMBRE === "string" ? record.SOLICITANTE_A_NOMBRE.toUpperCase() : null,
		subareaCodigo: typeof record.SUBAREA_CODIGO === "string" ? record.SUBAREA_CODIGO.toUpperCase() : null,
		subareaDescripcion: typeof record.SUBAREA_DESCRIPCION === "string" ? record.SUBAREA_DESCRIPCION.toUpperCase() : null,
		disciplinaDescripcion: typeof record.DISCIPLINA_DESCRIPCION === "string" ? record.DISCIPLINA_DESCRIPCION.toUpperCase() : null,
		turnoDescripcion: typeof record.TURNO_DESCRIPCION === "string" ? record.TURNO_DESCRIPCION.toUpperCase() : null,
		tipoForzadoDescripcion: typeof record.TIPOFORZADO_DESCRIPCION === "string" ? record.TIPOFORZADO_DESCRIPCION.toUpperCase() : null,
		tagCentroCodigo: typeof record.TAGCENTRO_CODIGO === "string" ? record.TAGCENTRO_CODIGO.toUpperCase() : null,
		tagCentroDescripcion: typeof record.TAGCENTRO_DESCRIPCION === "string" ? record.TAGCENTRO_DESCRIPCION.toUpperCase() : null,
		responsableNombre: typeof record.RESPONSABLE_NOMBRE === "string" ? record.RESPONSABLE_NOMBRE.toUpperCase() : null,
		riesgoDescripcion: typeof record.RIESGO_DESCRIPCION === "string" ? record.RIESGO_DESCRIPCION.toUpperCase() : null,
    observadoEjecucion: record.OBSERVADO_A ? record.OBSERVADO_A.toUpperCase() : null,
    riesgoa: record.RIESGOA !== null && record.RIESGOA == "string" ? record.RIESGOA : null,
    riesgoadescripcion: typeof record.RIESGOA_DESCRIPCION === "string" ? record.RIESGOA_DESCRIPCION.toUpperCase() : null,
    proyectoDescripcion: typeof record.PROYECTO_DESCRIPCION === "string" ? record.PROYECTO_DESCRIPCION.toUpperCase() : null,
		aprobadorACorreo: typeof record.APROBADOR_A_CORREO === "string" ? record.APROBADOR_A_CORREO.toUpperCase() : null,
		ejecutorACorreo: typeof record.EJECUTOR_A_CORREO === "string" ? record.EJECUTOR_A_CORREO.toUpperCase() : null,
		solicitanteACorreo: typeof record.SOLICITANTE_A_CORREO === "string" ? record.SOLICITANTE_A_CORREO.toUpperCase() : null,
		tagConcat: typeof record.TAG_CONCAT === "string" ? record.TAG_CONCAT.toUpperCase() : null,
		probabilidad: typeof record.PROBABILIDAD === "string" ? record.PROBABILIDAD.toUpperCase() : null,
    probabilidadDescripcion: typeof record.PROBABILIDAD_DESCRIPCION === "string" ? record.PROBABILIDAD_DESCRIPCION.toUpperCase() : null,
		impacto: record.IMPACTO !== null && record.IMPACTO == "string" ? record.IMPACTO : null,
    impactoDescripcion: typeof record.IMPACTO_DESCRIPCION === "string" ? record.IMPACTO_DESCRIPCION.toUpperCase() : null,
		riesgo: record.RIESGO !== null && record.RIESGO == "string" ? record.RIESGO : null,
    area: typeof record.AREA_DESCRIPCION === 'string' ? record.AREA_DESCRIPCION.toUpperCase() : null,
    interlock: record.INTERLOCK !== null && record.INTERLOCK == "string" ? record.INTERLOCK : null,
    interlockdesc: typeof record.INTERLOCK_DESC === "string" ? record.INTERLOCK_DESC.toUpperCase() : null,
	}));
};

const getAllSolicitudes = async () => {
	const pool = await poolPromise;
	const result = await pool.query(`
    SELECT DISTINCT
    SF.SOLICITUD_ID,
    SF.DESCRIPCIONFORZADO,
    SF.TAG_CONCAT,
    SF.IMPACTO AS IMPACTO,
     SF.CIRCUITO_ID,
    CIR.DESCRIPCION AS NOMBRE_CIRCUITO,
    IMP.DESCRIPCION AS IMPACTO_DESCRIPCION, 
    SF.PROBABILIDAD_RIESGO AS PROBABILIDAD,
    PROB.DESCRIPCION AS PROBABILIDAD_DESCRIPCION, 
    SF.RIESGO AS RIESGO,
    RSG.DESCRIPCION AS RIESGO_DESCRIPCION, 
    SF.ESTADOSOLICITUD,
    SF.FECHA_EJECUCION_A,
    SF.FECHACIERRE,
    SF.USUARIO_CREACION_A,
    SF.FECHA_CREACION_A,
    SF.USUARIO_MODIFICACION,
    SF.FECHA_MODIFICACION,
    SF.PROYECTO_ID AS PROYECTO_ID,
    PROY.DESCRIPCION AS PROYECTO_DESCRIPCION,
    SF.TAGSUFIJO AS TAGSUFIJO_DESCRIPCION,
    SA.CODIGO AS SUBAREA_CODIGO,
    SA.DESCRIPCION AS SUBAREA_DESCRIPCION,
    D.DESCRIPCION AS DISCIPLINA_DESCRIPCION,
    T.DESCRIPCION AS TURNO_DESCRIPCION,
    MR.DESCRIPCION AS MOTIVORECHAZO_DESCRIPCION,
    SF.OBSERVACION_EJECUCION_A,
    SF.DESCRIPCION_EJECUCION_A,
    SF.TIPOFORZADO_ID AS TIPOFORZADO,
    TF.DESCRIPCION AS TIPOFORZADO_DESCRIPCION,
    SF.GRUPO_A AS GRUPO_A,
    SF.GRUPO_B AS GRUPO_B,
    MG.NOMBRE AS NOMBRE_GRUPO,
    TC.CODIGO AS TAGCENTRO_CODIGO,
    TC.DESCRIPCION AS TAGCENTRO_DESCRIPCION,
    R.NOMBRE AS RESPONSABLE_NOMBRE,
   SF.RIESGOA_ID AS RIESGOA,
    RA.DESCRIPCION AS RIESGOA_DESCRIPCION,
    SF.SOLICITANTE_A_ID,
    UXSA.NOMBRE AS NOMBRE_SOLICITANTE_A,
    UXSA.APEPATERNO AS AP_SOLICITANTE_A,
    UXSA.APEMATERNO AS AM_SOLICITANTE_A,
    SF.APROBADOR_A_ID,
    UXAA.NOMBRE AS NOMBRE_APROBADOR_A,
    UXAA.APEPATERNO AS AP_APROBADOR_A,
    UXAA.APEMATERNO AS AM_APROBADOR_A,
    SF.SOLICITANTE_B_ID,
    UXSB.NOMBRE AS NOMBRE_SOLICITANTE_B,
    UXSB.APEPATERNO AS AP_SOLICITANTE_B,
    UXSB.APEMATERNO AS AM_SOLICITANTE_B,
    SF.APROBADOR_B_ID,
    UXAB.NOMBRE AS NOMBRE_APROBADOR_B,
    UXAB.APEPATERNO AS AP_APROBADOR_B,
    UXAB.APEMATERNO AS AM_APROBADOR_B,
    SF.INTERLOCK,
    CASE 
        WHEN SF.INTERLOCK = 0 THEN 'NO'
        WHEN SF.INTERLOCK = 1 THEN 'SÍ'
        ELSE NULL
    END AS INTERLOCK_DESC,
    UXSA.AREA_ID,
    AREAX.DESCRIPCION AS AREA_DESCRIPCION,
    SF.OBSERVADO_A,
    SF.OBSERVACION_RECHAZO_A AS OBSERVACION_RECHAZO
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
  LEFT JOIN MAE_AREA AREAX ON UXSA.AREA_ID = AREAX.AREA_ID
  LEFT JOIN MAE_USUARIO UXAA ON SF.APROBADOR_A_ID = CAST(UXAA.USUARIO_ID AS CHAR)
  LEFT JOIN MAE_USUARIO UXAB ON SF.APROBADOR_B_ID = CAST(UXAB.USUARIO_ID AS CHAR)
  LEFT JOIN MAE_USUARIO UXEA ON SF.GRUPO_A = CAST(UXEA.GRUPO_ID AS CHAR)
  LEFT JOIN MAE_USUARIO UXEB ON SF.EJECUTOR_B_ID = CAST(UXEB.USUARIO_ID AS CHAR)
  LEFT JOIN MAE_PROYECTO PROY ON SF.PROYECTO_ID = CAST(PROY.PROYECTO_ID AS CHAR)
  LEFT JOIN MAE_GRUPO MG ON SF.GRUPO_A = MG.GRUPO_ID
  LEFT JOIN dbo.IMPACTO IMP ON SF.IMPACTO = IMP.IMPACTO_ID  
  LEFT JOIN dbo.PROBABILIDAD PROB ON SF.PROBABILIDAD_RIESGO = PROB.PROBABILIDAD_ID  
  LEFT JOIN dbo.RIESGO RSG ON SF.RIESGO = RSG.RIESGO_ID  
   LEFT JOIN MAE_CIRCUITO CIR ON SF.CIRCUITO_ID = CIR.CIRCUITO_ID
  `);
	return result.recordset.map((record) => ({
		id: record.SOLICITUD_ID,
		nombre: record.DESCRIPCIONFORZADO,
		area: record.AREA_DESCRIPCION,
		circuito: record.CIRCUITO_ID,
		nombrecircuito: typeof record.NOMBRE_CIRCUITO === "string" ? record.NOMBRE_CIRCUITO.toUpperCase() : null,
		tipo: record.SOLICITANTE_B_ID == null ? "Forzado" : "Retiro",
		solicitante:
			record.SOLICITANTE_B_ID === null
				? record.NOMBRE_SOLICITANTE_A + " " + record.AP_SOLICITANTE_A + " " + record.AM_SOLICITANTE_A
				: record.NOMBRE_SOLICITANTE_B + " " + record.AP_SOLICITANTE_B + " " + record.AM_SOLICITANTE_B,
		aprobador:
			record.APROBADOR_B_ID === null
				? record.NOMBRE_APROBADOR_A + " " + record.AP_APROBADOR_A + " " + record.AM_APROBADOR_A
				: record.NOMBRE_APROBADOR_B + " " + record.AP_APROBADOR_B + " " + record.AM_APROBADOR_B,
		solicitanteAId: record.SOLICITANTE_A_ID,
		aprobadorAId: record.APROBADOR_A_ID,
		solicitanteBId: record.SOLICITANTE_B_ID,
		aprobadorBId: record.APROBADOR_B_ID,
		estado: record.ESTADOSOLICITUD,
		fecha: record.FECHA_CREACION_A,
		descripcion: record.DESCRIPCIONFORZADO,
		estadoSolicitud: record.ESTADOSOLICITUD,
		fechaRealizacion: record.FECHA_EJECUCION_A,
		fechaCierre: record.FECHACIERRE,
		usuarioCreacion: record.USUARIO_CREACION_A,
		fechaCreacion: record.FECHA_CREACION_A,
		usuarioModificacion: record.USUARIO_MODIFICACION,
		fechaModificacion: record.FECHA_MODIFICACION,
		subareaCodigo: record.SUBAREA_CODIGO,
		subareaDescripcion: record.SUBAREA_DESCRIPCION,
		disciplinaDescripcion: record.DISCIPLINA_DESCRIPCION,
		turnoDescripcion: record.TURNO_DESCRIPCION,
		motivoRechazoDescripcion: record.MOTIVORECHAZO_DESCRIPCION,
		tipoForzadoDescripcion: record.TIPOFORZADO_DESCRIPCION,
		tagsufijo: record.TAGSUFIJO_DESCRIPCION,
		tagCentroCodigo: record.TAGCENTRO_CODIGO,
		tagCentroDescripcion: record.TAGCENTRO_DESCRIPCION,
		responsableNombre: record.RESPONSABLE_NOMBRE,
		riesgoa: record.RIESGOA,
		riesgoaDescripcion: record.RIESGOA_DESCRIPCION,
		interlock: record.INTERLOCK,
		interlockdesc: record.INTERLOCK_DESC,
		proyectoDescripcion: record.PROYECTO_DESCRIPCION,
		proyectoId: record.PROYECTO_ID,
		observadoEjecucion: record.OBSERVADO_A,
		desObservacionEjecucion: record.OBSERVACION_RECHAZO,
		tagConcat: record.TAG_CONCAT,
		probabilidad: record.PROBABILIDAD,
		probabilidadDescripcion: record.PROBABILIDAD_DESCRIPCION,
		impacto: record.IMPACTO,
		impactoDescripcion: record.IMPACTO_DESCRIPCION,
		riesgo: record.RIESGO,
		riesgoDescripcion: record.RIESGO_DESCRIPCION,
		grupo_A: record.GRUPO_A,
    grupo_B: record.GRUPO_B,
		grupoNombre: record.NOMBRE_GRUPO,
    observacionEjecucion: record.OBSERVACION_EJECUCION_A,
    descripcionEjecucion: record.DESCRIPCION_EJECUCION_A,
	}));
};

type InsertQueryParameters = {
	circuito: string;
	tagPrefijo: string;
	tagCentro: string;
	tagSufijo: string;
	descripcion: string;
	disciplina: string;
	turno: string;
	interlockSeguridad: string;
	responsable: string;
	riesgo: string;
	probabilidad: string;
	solicitante: string;
	aprobador: string;
	grupoA: string;
	usuario: string;
	impacto: string;
	fechaFinPlanificada: string;
};

const generateInsertQuery = async (parameters: InsertQueryParameters, request: any) => {
	request.input("tagPrefijo", parameters.tagPrefijo);
	request.input("disciplina", parameters.disciplina);
	request.input("turno", parameters.turno);
	request.input("tagCentro", parameters.tagCentro);
	request.input("tagSufijo", parameters.tagSufijo);
	request.input("responsable", parameters.responsable);
	request.input("riesgo", parameters.riesgo);
	request.input("interlockSeguridad", parameters.interlockSeguridad.toLowerCase() === "sí" ? 1 : 0);
	request.input("descripcion", parameters.descripcion);
	request.input("usuario", parameters.usuario);
	request.input("solicitante", parameters.solicitante);
	request.input("aprobador", parameters.aprobador);
	request.input("grupoA", parameters.grupoA);
	request.input("probabilidad", parameters.probabilidad);
	request.input("impacto", parameters.impacto);
	request.input("circuito", parameters.circuito);

	return `
    INSERT INTO TRS_SOLICITUD_FORZADO (
        SUBAREA_ID,
        DISCIPLINA_ID,
        TURNO_ID,
        MOTIVORECHAZO_A_ID,
        TAGCENTRO_ID,
        TAGSUFIJO,
        TAG_CONCAT,
        RESPONSABLE_ID,
        RIESGOA_ID,
        INTERLOCK,
        DESCRIPCIONFORZADO,
        FECHA_EJECUCION_A,
        FECHACIERRE,
        USUARIO_CREACION_A,
        FECHA_CREACION_A,
        ESTADOSOLICITUD,
        SOLICITANTE_A_ID,
        APROBADOR_A_ID,
        GRUPO_A,
        PROBABILIDAD_RIESGO,
        IMPACTO,
        RIESGO,
        FECHA_FIN_PLANIFICADA,
        CIRCUITO_ID
    )
    OUTPUT INSERTED.SOLICITUD_ID
    VALUES (
        @tagPrefijo,
        @disciplina,
        @turno,
        NULL,
        @tagCentro,
        @tagSufijo,
        (SELECT TOP 1 CODIGO FROM SUB_AREA WHERE SUBAREA_ID = @tagPrefijo)
        + '-' +
        (SELECT CODIGO FROM TAG_CENTRO WHERE TAGCENTRO_ID = @tagCentro)
        + '-' + @tagSufijo,
        @responsable,
        @riesgo,
        @interlockSeguridad,
        @descripcion,
        NULL,
        NULL,
        @usuario,
        GETDATE(),
        'PENDIENTE-FORZADO',
        @solicitante,
        @aprobador,
        @grupoA,
        @probabilidad,
        @impacto,
        @riesgo,
        @fechaFinPlanificada,
        @circuito
    );
  `;
};

type UpdateQueryParameters = {
	[key: string]: string | number | boolean;
	id: string;
	circuito: string;
	tagPrefijo: string;
	tagCentro: string;
	tagSufijo: string;
	descripcion: string;
	disciplina: string;
	turno: string;
	interlockSeguridad: string;
	responsable: string;
	riesgo: string;
	probabilidad: string;
	solicitante: string;
	aprobador: string;
	grupoA: string;
	usuario: string;
	impacto: string;
	fechaFinPlanificada: string;
};

const generateUpdateQuery = async (parameters: UpdateQueryParameters, request: any) => {
	console.log(parameters.fechaFinPlanificada, "sin formatear desde el back");
	const fechaFinPlanificadaFormatted = formatDateToUTC(parameters.fechaFinPlanificada);
	console.log(fechaFinPlanificadaFormatted, "formateada el back fecha");

	request.input("tagPrefijo", parameters.tagPrefijo);
	request.input("disciplina", parameters.disciplina);
	request.input("turno", parameters.turno);
	request.input("tagCentro", parameters.tagCentro);
	request.input("tagSufijo", parameters.tagSufijo);
	request.input("responsable", parameters.responsable);
	request.input("riesgo", parameters.riesgo);
	request.input("interlockSeguridad", parameters.interlockSeguridad.toLowerCase() === "sí" ? 1 : 0);
	request.input("descripcion", parameters.descripcion);
	request.input("solicitante", parameters.solicitante);
	request.input("aprobador", parameters.aprobador);
	request.input("grupoA", parameters.grupoA);
	request.input("usuario", parameters.usuario);
	request.input("fechaFinPlanificada", fechaFinPlanificadaFormatted);
	request.input("circuito", parameters.circuito);
	request.input("id", parameters.id);

	return `
    UPDATE TRS_SOLICITUD_FORZADO SET
      SUBAREA_ID = @tagPrefijo,
      DISCIPLINA_ID = @disciplina,
      TURNO_ID = @turno,
      TAGCENTRO_ID = @tagCentro,
      TAGSUFIJO = @tagSufijo,
      TAG_CONCAT = (SELECT TOP 1 CODIGO FROM SUB_AREA WHERE SUBAREA_ID = @tagPrefijo)
        + '-' +
        (SELECT CODIGO FROM TAG_CENTRO WHERE TAGCENTRO_ID = @tagCentro)
        + '-' + @tagSufijo,
      RESPONSABLE_ID = @responsable,
      RIESGOA_ID = @riesgo,
      INTERLOCK = @interlockSeguridad,
      DESCRIPCIONFORZADO = @descripcion,
      SOLICITANTE_A_ID = @solicitante,
      APROBADOR_A_ID = @aprobador,
      GRUPO_A = @grupoA,
      USUARIO_MODIFICACION = @usuario,
      FECHA_MODIFICACION = GETDATE(),
      FECHA_FIN_PLANIFICADA = @fechaFinPlanificada,
      ESTADOSOLICITUD = 'PENDIENTE-FORZADO',
      CIRCUITO_ID = @circuito
    WHERE SOLICITUD_ID = @id;
  `;
};

type ResumenSolicitud = {
	id: string;
	descripcion: string;
	estadoSolicitud: string;
	fecha?: string;
	fechaRealizacion: string | null;
	fechaFinPlanificada: string | null;
	fechaCierre: string | null;
	solicitanteNombre: string;
	aprobadorNombre: string;
	ejecutorNombre?: string;
	subareaCodigo: string;
	subareaDescripcion: string;
	disciplinaDescripcion: string;
	turnoDescripcion: string;
	motivoRechazoDescripcion?: string;
	tipoForzadoDescripcion: string;
	tagsufijo: string;
	tagCentroCodigo: string;
	tagCentroDescripcion: string;
	responsableNombre: string;
	riesgoDescripcion: string;
	observadoEjecucion?: string | null;
	desObservacionEjecucion?: string | null;
	tagConcat: string | null;
	grupoA?: string;
  grupoB?: string;
	grupoNombre?: string;
	circuito?: string;
  nombrecircuito?: string;
  area?: string;
  interlock?: string | null;
  interlockdesc?: string | null;
  riesgoa?: string | null;
  riesgoadescripcion?: string | null;
  probabilidad?: string | null;
  probabilidadDescripcion?: string | null;
  impacto?: string | null;
  impactoDescripcion?: string | null;
};

const createSolicitudHTML = (solicitud: ResumenSolicitud, actionToken: string, insertedId: string, usuario: string) => {
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
                ${solicitud.subareaCodigo}-${solicitud.tagCentroCodigo}-${solicitud.tagsufijo}
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
            <tr style="display: flex;justify-content:center;width:600px; gap:48px">
              <td style="text-align: center;">
                <a 
                  href="http${process.env.NODE_ENV == "production" ? "s" : ""}://${process.env.HOSTNAME}/acciones/aprobar/forzado?token=${actionToken}&id=${insertedId}&bxs=${usuario}&action=forzado"
                  class="button">
                  Aprobar
                </a>
              </td>
              <td style="text-align: center;">
                <a 
                  href="http${process.env.NODE_ENV == "production" ? "s" : ""}://${process.env.HOSTNAME}/acciones/rechazar/forzado?token=${actionToken}&id=${insertedId}&bxs=${usuario}&action=forzado" 
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

const createSolicitudHTMLOtros = (solicitud: ResumenSolicitud) => {
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
        </div>
      </body>
    </html>
  `;
};

export async function POST(request: Request) {
	try {
		const data = await request.json();
		console.log("Data received in POST:", data);

		// Validate all required fields
		const requiredFields: (keyof InsertQueryParameters)[] = [
			"circuito",
			"tagPrefijo",
			"tagCentro",
			"tagSufijo",
			"descripcion",
			"disciplina",
			"turno",
			"interlockSeguridad",
			"responsable",
			"riesgo",
			"probabilidad",
			"solicitante",
			"aprobador",
			"grupoA",
			"usuario",
			"impacto",
			"fechaFinPlanificada",
		];

		for (const field of requiredFields) {
			if (data[field] === undefined || data[field] === null || data[field] === "") {
				return NextResponse.json({ success: false, message: `El campo '${field}' es requerido` }, { status: 400 });
			}
		}

		// Additional validation for numeric fields
		const numericFields = ["tagPrefijo", "disciplina", "turno", "tagCentro", "responsable", "riesgo", "solicitante", "aprobador", "grupoA", "probabilidad", "impacto", "circuito"];
		for (const field of numericFields) {
			if (isNaN(Number(data[field]))) {
				return NextResponse.json({ success: false, message: `El campo '${field}' debe ser un número válido` }, { status: 400 });
			}
		}

		// Remove ejecutor if present
		if (data.ejecutor) {
			delete data.ejecutor;
			console.warn("El campo 'ejecutor' fue removido del payload, ya no es necesario.");
		}

		// Generate and execute the insert query
		const pool = await poolPromise;
		const requestSql = pool.request();
		requestSql.input("fechaFinPlanificada", formatDateToUTC(data.fechaFinPlanificada));
		const query = await generateInsertQuery(data, requestSql);
		console.log("Generated INSERT query:", query);
		const result = await requestSql.query(query);

		if (result.recordset && result.recordset.length > 0) {
			const insertedId = result.recordset[0].SOLICITUD_ID;

			const randomString = generateRandomString(5);
			const actionToken = await bcrypt.hash(randomString, 10);
			const updateTokenQuery = `UPDATE TRS_SOLICITUD_FORZADO SET ACTION_TOKEN = @actionToken WHERE SOLICITUD_ID = @insertedId`;
			const tokenRequest = pool.request();
			tokenRequest.input("actionToken", actionToken);
			tokenRequest.input("insertedId", insertedId);
			await tokenRequest.query(updateTokenQuery);

			const newSolicitud = await getSingleSolicitud(insertedId);
			const newSolicitudHtmlAprobador = createSolicitudHTML(newSolicitud[0], randomString, insertedId, data.usuario);
			const newSolicitudHtmlOtros = createSolicitudHTMLOtros(newSolicitud[0]);

			const grupoA = data.grupoA;
			const emailQuery = `
        SELECT MU.CORREO
        FROM MAE_USUARIO MU
        WHERE MU.GRUPO_ID = @grupoA
      `;
			const emailRequest = pool.request();
			emailRequest.input("grupoA", grupoA);
			const emailResult = await emailRequest.query(emailQuery);

			const individualEmailQuery = `
        SELECT UA.CORREO AS aprobadorCorreo, US.CORREO AS solicitanteCorreo
        FROM TRS_SOLICITUD_FORZADO SF
        LEFT JOIN MAE_USUARIO UA ON SF.APROBADOR_A_ID = UA.USUARIO_ID
        LEFT JOIN MAE_USUARIO US ON SF.SOLICITANTE_A_ID = US.USUARIO_ID
        WHERE SF.SOLICITUD_ID = @insertedId
      `;
			const individualEmailRequest = pool.request();
			individualEmailRequest.input("insertedId", insertedId);
			const individualEmailResult = await individualEmailRequest.query(individualEmailQuery);
			const { aprobadorCorreo, solicitanteCorreo } = individualEmailResult.recordset[0] || {};

			const ejecutorCorreos = emailResult.recordset.map((row: any) => row.CORREO).filter((correo: string) => correo && isValidEmail(correo) && correo !== aprobadorCorreo && correo !== solicitanteCorreo);

			const emailErrors: string[] = [];

			if (aprobadorCorreo) {
				const mailOptionsAprobador: MailOptions = {
					from: process.env.SMTP_USER,
					to: aprobadorCorreo,
					subject: "[APP FORZADOS] Solicitud de Forzado por Aprobar",
					html: newSolicitudHtmlAprobador,
				};
				try {
					await mailer.sendMail(mailOptionsAprobador);
				} catch (err) {
					emailErrors.push(`Error enviando correo al aprobador (${aprobadorCorreo}): ${err.message}`);
				}
			}

			if (solicitanteCorreo) {
				const mailOptionsSolicitante: MailOptions = {
					from: process.env.SMTP_USER,
					to: solicitanteCorreo,
					subject: "[APP FORZADOS] Solicitud de Forzado",
					html: newSolicitudHtmlOtros,
				};
				try {
					await mailer.sendMail(mailOptionsSolicitante);
				} catch (err) {
					emailErrors.push(`Error enviando correo al solicitante (${solicitanteCorreo}): ${err.message}`);
				}
			}

			if (ejecutorCorreos.length > 0) {
				for (const correo of ejecutorCorreos) {
					const mailOptionsEjecutor: MailOptions = {
						from: process.env.SMTP_USER,
						to: correo,
						subject: "[APP FORZADOS] Solicitud de Forzado por Ejecutar",
						html: newSolicitudHtmlOtros,
					};
					try {
						await mailer.sendMail(mailOptionsEjecutor);
					} catch (err) {
						emailErrors.push(`Error enviando correo al ejecutor (${correo}): ${err.message}`);
					}
				}
			}

			if (emailErrors.length > 0) {
				console.error("Errores al enviar correos:", emailErrors);
				return NextResponse.json({
					success: true,
					message: "Record inserted successfully, but some emails failed to send",
					data,
					emailErrors,
				});
			}

			return NextResponse.json({
				success: true,
				message: "Record inserted successfully",
				data,
			});
		} else {
			return NextResponse.json({ success: false, message: "Failed to insert record" }, { status: 500 });
		}
	} catch (error) {
		console.error("Error processing POST:", error);
		return NextResponse.json({ success: false, message: `Invalid request data: ${error.message}` }, { status: 400 });
	}
}

export async function PUT(request: Request) {
	try {
		const data = await request.json();
		console.log("Datos recibidos en PUT:", data);

		// Validate all required fields
		const requiredFields: (keyof UpdateQueryParameters)[] = [
			"id",
			"circuito",
			"tagPrefijo",
			"tagCentro",
			"tagSufijo",
			"descripcion",
			"disciplina",
			"turno",
			"interlockSeguridad",
			"responsable",
			"riesgo",
			"probabilidad",
			"solicitante",
			"aprobador",
			"grupoA",
			"usuario",
			"impacto",
			"fechaFinPlanificada",
		];

		for (const field of requiredFields) {
			if (data[field] === undefined || data[field] === null || data[field] === "") {
				return NextResponse.json({ success: false, message: `El campo '${field}' es requerido` }, { status: 400 });
			}
		}

		const numericFields = ["tagPrefijo", "disciplina", "turno", "tagCentro", "responsable", "riesgo", "solicitante", "aprobador", "grupoA", "probabilidad", "impacto", "circuito", "id"];
		for (const field of numericFields) {
			if (isNaN(Number(data[field]))) {
				return NextResponse.json({ success: false, message: `El campo '${field}' debe ser un número válido` }, { status: 400 });
			}
		}

		if (data.ejecutor) {
			delete data.ejecutor;
			console.warn("El campo 'ejecutor' fue removido del payload, ya no es necesario.");
		}

		const pool = await poolPromise;
		const requestSql = pool.request();
		const query = await generateUpdateQuery(data, requestSql);
		console.log("Generated UPDATE query:", query);
		const result = await requestSql.query(query);

		if (result.rowsAffected && result.rowsAffected[0] > 0) {
			const randomString = generateRandomString(5);
			const actionToken = await bcrypt.hash(randomString, 10);
			const updateTokenQuery = `UPDATE TRS_SOLICITUD_FORZADO SET ACTION_TOKEN = @actionToken WHERE SOLICITUD_ID = @id`;
			const tokenRequest = pool.request();
			tokenRequest.input("actionToken", actionToken);
			tokenRequest.input("id", data.id);
			await tokenRequest.query(updateTokenQuery);

			const updatedSolicitud = await getSingleSolicitud(data.id);

			const updatedSolicitudHtmlAprobador = createSolicitudHTML(updatedSolicitud[0], randomString, data.id, data.usuario);
			const updatedSolicitudHtmlOtros = createSolicitudHTMLOtros(updatedSolicitud[0]);

			const grupoA = data.grupoA;
			const emailQuery = `
        SELECT MU.CORREO
        FROM MAE_USUARIO MU
        WHERE MU.GRUPO_ID = @grupo
      `;
			const emailRequest = pool.request();
			emailRequest.input("grupo", grupoA);
			const emailResult = await emailRequest.query(emailQuery);

			const individualEmailQuery = `
        SELECT UA.CORREO AS aprobadorCorreo, US.CORREO AS solicitanteCorreo
        FROM TRS_SOLICITUD_FORZADO SF
        LEFT JOIN MAE_USUARIO UA ON SF.APROBADOR_A_ID = UA.USUARIO_ID
        LEFT JOIN MAE_USUARIO US ON SF.SOLICITANTE_A_ID = US.USUARIO_ID
        WHERE SF.SOLICITUD_ID = @id
      `;
			const individualEmailRequest = pool.request();
			individualEmailRequest.input("id", data.id);
			const individualEmailResult = await individualEmailRequest.query(individualEmailQuery);
			const { aprobadorCorreo, solicitanteCorreo } = individualEmailResult.recordset[0] || {};

			const ejecutorCorreos = emailResult.recordset.map((row: any) => row.CORREO).filter((correo: string) => correo && isValidEmail(correo) && correo !== aprobadorCorreo && correo !== solicitanteCorreo);

			const emailErrors: string[] = [];

			if (aprobadorCorreo) {
				const mailOptionsAprobador: MailOptions = {
					from: process.env.SMTP_USER,
					to: aprobadorCorreo,
					subject: "[APP FORZADOS] Solicitud de Forzado modificada",
					html: updatedSolicitudHtmlAprobador,
				};
				try {
					await mailer.sendMail(mailOptionsAprobador);
				} catch (err) {
					emailErrors.push(`Error enviando correo al aprobador (${aprobadorCorreo}): ${err.message}`);
				}
			}

			if (solicitanteCorreo) {
				const mailOptionsSolicitante: MailOptions = {
					from: process.env.SMTP_USER,
					to: solicitanteCorreo,
					subject: "[APP FORZADOS] Solicitud de Forzado modificada",
					html: updatedSolicitudHtmlOtros,
				};
				try {
					await mailer.sendMail(mailOptionsSolicitante);
				} catch (err) {
					emailErrors.push(`Error enviando correo al solicitante (${solicitanteCorreo}): ${err.message}`);
				}
			}

			if (ejecutorCorreos.length > 0) {
				for (const correo of ejecutorCorreos) {
					const mailOptionsEjecutor: MailOptions = {
						from: process.env.SMTP_USER,
						to: correo,
						subject: "[APP FORZADOS] Solicitud de Forzado modificada",
						html: updatedSolicitudHtmlOtros,
					};
					try {
						await mailer.sendMail(mailOptionsEjecutor);
					} catch (err) {
						emailErrors.push(`Error enviando correo al ejecutor (${correo}): ${err.message}`);
					}
				}
			}

			if (emailErrors.length > 0) {
				console.error("Errores al enviar correos:", emailErrors);
				return NextResponse.json({
					success: true,
					message: "Record updated successfully, but some emails failed to send",
					data,
					emailErrors,
				});
			}

			return NextResponse.json({
				success: true,
				message: "Record updated successfully",
				data,
			});
		} else {
			return NextResponse.json({ success: false, message: "Failed to update record" }, { status: 500 });
		}
	} catch (error) {
		console.error("Error processing PUT:", error);
		return NextResponse.json({ success: false, message: `Invalid request data: ${error.message}` }, { status: 400 });
	}
}
