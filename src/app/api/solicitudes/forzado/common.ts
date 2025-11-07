import { poolPromise } from "@sql/lib/db";

// Obtener una sola solicitud
export const getSingleSolicitud = async (id: string) => {
	const pool = await poolPromise;
	const request = pool.request();
	request.input("id", id);

	const result = await pool.query(`
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
      AREAX.DESCRIPCION AS AREA_DESCRIPCION,
      MR.DESCRIPCION AS MOTIVORECHAZO_DESCRIPCION,
      SF.OBSERVACION_EJECUCION_A,
      SF.DESCRIPCION_EJECUCION_A,
      SF.OBSERVACIONES_B,
      (UXSB.NOMBRE + ' ' + UXSB.APEPATERNO + ' ' + UXSB.APEMATERNO) AS SOLICITANTE_B_NOMBRE,
	    (UXAB.NOMBRE + ' ' + UXAB.APEPATERNO + ' ' + UXAB.APEMATERNO) AS APROBADOR_B_NOMBRE,
      UXAB.CORREO AS APROBADOR_B_CORREO,
      UXSB.CORREO AS SOLICITANTE_B_CORREO,
      SF.DESCRIPCION_EJECUCION_B,
	    SF.OBSERVACION_APROBACION_B
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
    LEFT JOIN MOTIVO_RECHAZO MR ON SF.MOTIVORECHAZO_A_ID = MR.MOTIVORECHAZO_ID
    LEFT JOIN MAE_USUARIO UXSB ON SF.SOLICITANTE_B_ID = CAST(UXSB.USUARIO_ID AS CHAR)
	LEFT JOIN MAE_USUARIO UXAB ON SF.APROBADOR_B_ID = CAST(UXAB.USUARIO_ID AS CHAR)
    WHERE SF.SOLICITUD_ID = ${id}
  `);
	console.log(result);
	return result.recordset.map((record) => ({
		id: record.SOLICITUD_ID,
		circuito: typeof record.CIRCUITO_ID === "string" ? record.CIRCUITO_ID.toUpperCase() : null,
		nombrecircuito: typeof record.NOMBRE_CIRCUITO === "string" ? record.NOMBRE_CIRCUITO.toUpperCase() : null,
		tagsufijo: typeof record.TAGSUFIJO_DESCRIPCION === "string" ? record.TAGSUFIJO_DESCRIPCION.toUpperCase() : null,
		descripcion: typeof record.DESCRIPCIONFORZADO === "string" ? record.DESCRIPCIONFORZADO : null,
		estadoSolicitud: typeof record.ESTADOSOLICITUD === "string" ? record.ESTADOSOLICITUD.toUpperCase() : null,
		fechaFinPlanificada: record.FECHA_FIN_PLANIFICADA ? record.FECHA_FIN_PLANIFICADA.toISOString() : null,
		fechaRealizacion: record.FECHA_EJECUCION_A ? record.FECHA_EJECUCION_A.toISOString() : "--",
		fechaCierre: record.FECHACIERRE ? record.FECHACIERRE.toISOString() : "--",
		aprobadorId: typeof record.APROBADOR_A_ID === "string" ? record.APROBADOR_A_ID.toUpperCase() : null,
		aprobadorNombre: typeof record.APROBADOR_A_NOMBRE === "string" ? record.APROBADOR_A_NOMBRE.toUpperCase() : null,
		grupo_A: typeof record.GRUPO_A === "string" ? record.GRUPO_A.toUpperCase() : null,
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
		area: typeof record.AREA_DESCRIPCION === "string" ? record.AREA_DESCRIPCION.toUpperCase() : null,
		interlock: record.INTERLOCK !== null && record.INTERLOCK == "string" ? record.INTERLOCK : null,
		interlockdesc: typeof record.INTERLOCK_DESC === "string" ? record.INTERLOCK_DESC.toUpperCase() : null,
    motivoRechazoDescripcion: typeof record.MOTIVORECHAZO_DESCRIPCION === "string" ? record.MOTIVORECHAZO_DESCRIPCION : null ,
    observacionEjecucion: typeof record.OBSERVACION_EJECUCION_A === "string" ? record.OBSERVACION_EJECUCION_A : null,
    descripcionEjecucion: typeof record.DESCRIPCION_EJECUCION_A === "string" ? record.DESCRIPCION_EJECUCION_A : null,
    observacionesB: typeof record.OBSERVACIONES_B === "string" ? record.OBSERVACIONES_B.toUpperCase() : null,
    solicitanteBNombre: typeof record.SOLICITANTE_B_NOMBRE === "string" ? record.SOLICITANTE_B_NOMBRE.toUpperCase() : null,
    solicitanteBCorreo: typeof record.SOLICITANTE_B_CORREO === "string" ? record.SOLICITANTE_B_CORREO.toUpperCase() : null,
    aprobadorBNombre: typeof record.APROBADOR_B_NOMBRE === "string" ? record.APROBADOR_B_NOMBRE.toUpperCase() : null,
    aprobadorBCorreo: typeof record.APROBADOR_B_CORREO === "string" ? record.APROBADOR_B_CORREO.toUpperCase() : null,
    descripcionEjecucionB: typeof record.DESCRIPCION_EJECUCION_B === "string" ? record.DESCRIPCION_EJECUCION_B : null,
    observacionAprobacionB: typeof record.OBSERVACION_APROBACION_B === "string" ? record.OBSERVACION_APROBACION_B : null
	}));
};
