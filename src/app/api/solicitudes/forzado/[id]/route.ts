import { NextRequest, NextResponse } from "next/server";
import { poolPromise } from "@sql/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;

		const solicitud = await getSingleSolicitud(id);
		return NextResponse.json({ success: true, message: "Records fetched successfully", data: solicitud });
	} catch (error) {
		console.error("Error processing GET:", error);
		return NextResponse.json({ success: false, message: "Failed to fetch records" }, { status: 500 });
	}
}

const getSingleSolicitud = async (id: string) => {
	const pool = await poolPromise;
	const result = await pool.query(`
      SELECT 
    SF.SOLICITUD_ID,
    SF.SUBAREA_ID,
    SF.DISCIPLINA_ID,
    SF.TURNO_ID,
    SF.MOTIVORECHAZO_A_ID,
    SF.MOTIVORECHAZO_B_ID,
    SF.TIPOFORZADO_ID,
    SF.TAGCENTRO_ID,
    SF.CIRCUITO_ID,
    SF.TAGSUFIJO,
    SF.RESPONSABLE_ID,
    SF.RIESGOA_ID,
    SF.RIESGO,
    SF.IMPACTO,
    IMP.DESCRIPCION AS IMPACTO_DESCRIPCION,  -- Campo adicional
    SF.PROBABILIDAD_RIESGO,
    PROB.DESCRIPCION AS PROBABILIDAD_DESCRIPCION,  -- Campo adicional
    SF.GRUPO_A,
    SF.INTERLOCK,
    SF.DESCRIPCIONFORZADO,
    SF.FECHA_EJECUCION_A,
    SF.FECHA_EJECUCION_B,
    SF.FECHACIERRE,
    SF.FECHA_FIN_PLANIFICADA,
    SF.USUARIO_CREACION_A,
    SF.FECHA_CREACION_A,
    SF.USUARIO_MODIFICACION,
    SF.FECHA_MODIFICACION,
    SF.ESTADOSOLICITUD,
    SF.APROBADOR_A_ID,
    SF.EJECUTOR_A_ID,
    SF.SOLICITANTE_A_ID,
    SF.OBSERVADO_A,
    SF.TAG_CONCAT,  -- Campo adicional
    PROY.DESCRIPCION AS PROYECTO_DESCRIPCION,  -- Campo adicional
    SA.CODIGO AS SUBAREA_CODIGO,  -- Campo adicional
    SA.DESCRIPCION AS SUBAREA_DESCRIPCION,  -- Campo adicional
    D.DESCRIPCION AS DISCIPLINA_DESCRIPCION,  -- Campo adicional
    T.DESCRIPCION AS TURNO_DESCRIPCION,  -- Campo adicional
    MR.DESCRIPCION AS MOTIVORECHAZO_DESCRIPCION,  -- Campo adicional
    TF.DESCRIPCION AS TIPOFORZADO_DESCRIPCION,  -- Campo adicional
    TC.CODIGO AS TAGCENTRO_CODIGO,  -- Campo adicional
    TC.DESCRIPCION AS TAGCENTRO_DESCRIPCION,  -- Campo adicional
    R.NOMBRE AS RESPONSABLE_NOMBRE,  -- Campo adicional
    RA.DESCRIPCION AS RIESGOA_DESCRIPCION,  -- Campo adicional
    RSG.DESCRIPCION AS RIESGO_DESCRIPCION,  -- Campo adicional
    UXSA.NOMBRE AS NOMBRE_SOLICITANTE_A,  -- Campo adicional
    UXSA.APEPATERNO AS AP_SOLICITANTE_A,  -- Campo adicional
    UXSA.APEMATERNO AS AM_SOLICITANTE_A,  -- Campo adicional
    UXAA.NOMBRE AS NOMBRE_APROBADOR_A,  -- Campo adicional
    UXAA.APEPATERNO AS AP_APROBADOR_A,  -- Campo adicional
    UXAA.APEMATERNO AS AM_APROBADOR_A,  -- Campo adicional
    UXSB.NOMBRE AS NOMBRE_SOLICITANTE_B,  -- Campo adicional
    UXSB.APEPATERNO AS AP_SOLICITANTE_B,  -- Campo adicional
    UXSB.APEMATERNO AS AM_SOLICITANTE_B,  -- Campo adicional
    UXAB.NOMBRE AS NOMBRE_APROBADOR_B,  -- Campo adicional
    UXAB.APEPATERNO AS AP_APROBADOR_B,  -- Campo adicional
    UXAB.APEMATERNO AS AM_APROBADOR_B,  -- Campo adicional
    UXEA.NOMBRE AS NOMBRE_EJECUTOR_A,  -- Campo adicional
    UXEA.APEPATERNO AS AP_EJECUTOR_A,  -- Campo adicional
    UXEA.APEMATERNO AS AM_EJECUTOR_A,  -- Campo adicional
    UXEB.NOMBRE AS NOMBRE_EJECUTOR_B,  -- Campo adicional
    UXEB.APEPATERNO AS AP_EJECUTOR_B,  -- Campo adicional
    UXEB.APEMATERNO AS AM_EJECUTOR_B,  -- Campo adicional
    MG.NOMBRE AS NOMBRE_GRUPO,  -- Campo adicional
    UXSA.AREA_ID,  -- Campo adicional
    AREAX.DESCRIPCION AS AREA_DESCRIPCION,  -- Campo adicional
    SF.OBSERVACION_RECHAZO_A AS OBSERVACION_RECHAZO  -- Campo adicional
FROM 
    TRS_SOLICITUD_FORZADO SF
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
    LEFT JOIN MAE_USUARIO UXEA ON SF.EJECUTOR_A_ID = CAST(UXEA.USUARIO_ID AS CHAR)
    LEFT JOIN MAE_USUARIO UXEB ON SF.EJECUTOR_B_ID = CAST(UXEB.USUARIO_ID AS CHAR)
    LEFT JOIN MAE_PROYECTO PROY ON SF.PROYECTO_ID = CAST(PROY.PROYECTO_ID AS CHAR)
    LEFT JOIN MAE_GRUPO MG ON SF.GRUPO_A = MG.GRUPO_ID
    LEFT JOIN dbo.IMPACTO IMP ON SF.IMPACTO = IMP.IMPACTO_ID
       LEFT JOIN MAE_CIRCUITO CIR ON SF.CIRCUITO_ID = CIR.CIRCUITO_ID
    LEFT JOIN dbo.PROBABILIDAD PROB ON SF.PROBABILIDAD_RIESGO = PROB.PROBABILIDAD_ID
    LEFT JOIN dbo.RIESGO RSG ON SF.RIESGO = RSG.RIESGO_ID WHERE 
    SF.SOLICITUD_ID = ${id}
    `);
	return result.recordset.map((record) => ({
		id: record.SOLICITUD_ID,
        circuito: record.CIRCUITO_ID,
    	tagPrefijo: record.SUBAREA_ID,
		tagPrefijoCodigo: record.SUBAREA_CODIGO, // Nuevo campo: código de la subárea
		tagPrefijoDescripcion: record.SUBAREA_DESCRIPCION, // Nuevo campo: descripción de la subárea
		tagCentro: record.TAGCENTRO_ID,
		tagCentroCodigo: record.TAGCENTRO_CODIGO, // Nuevo campo: código del tag centro
		tagCentroDescripcion: record.TAGCENTRO_DESCRIPCION, // Nuevo campo: descripción del tag centro
		tagSubfijo: record.TAGSUFIJO,
		tagConcat: record.TAG_CONCAT, 
		descripcion: record.DESCRIPCIONFORZADO,
		disciplina: record.DISCIPLINA_ID,
		disciplinaDescripcion: record.DISCIPLINA_DESCRIPCION, // Nuevo campo: descripción de la disciplina
		turno: record.TURNO_ID,
		turnoDescripcion: record.TURNO_DESCRIPCION, // Nuevo campo: descripción del turno
		interlockSeguridad: record.INTERLOCK,
		responsable: record.RESPONSABLE_ID,
		responsableNombre: record.RESPONSABLE_NOMBRE, // Nuevo campo: nombre del responsable
		riesgoA: record.RIESGOA_ID,
		riesgoADescripcion: record.RIESGOA_DESCRIPCION, // Nuevo campo: descripción del riesgo A
		probabilidad: record.PROBABILIDAD_RIESGO,
		probabilidadDescripcion: record.PROBABILIDAD_DESCRIPCION, // Nuevo campo: descripción de la probabilidad
		impacto: record.IMPACTO,
		impactoDescripcion: record.IMPACTO_DESCRIPCION, // Nuevo campo: descripción del impacto
		riesgo: record.RIESGO,
		riesgoDescripcion: record.RIESGO_DESCRIPCION, // Nuevo campo: descripción del riesgo
		grupoA: record.GRUPO_A,
		grupoNombre: record.NOMBRE_GRUPO, // Nuevo campo: nombre del grupo
		solicitante: record.SOLICITANTE_A_ID,
		solicitanteNombre: record.NOMBRE_SOLICITANTE_A, // Nuevo campo: nombre del solicitante A
		solicitanteApellidoPaterno: record.AP_SOLICITANTE_A, // Nuevo campo: apellido paterno del solicitante A
		solicitanteApellidoMaterno: record.AM_SOLICITANTE_A, // Nuevo campo: apellido materno del solicitante A
		solicitanteB: record.SOLICITANTE_B_ID, // Nuevo campo: ID del solicitante B
		solicitanteBNombre: record.NOMBRE_SOLICITANTE_B, // Nuevo campo: nombre del solicitante B
		solicitanteBApellidoPaterno: record.AP_SOLICITANTE_B, // Nuevo campo: apellido paterno del solicitante B
		solicitanteBApellidoMaterno: record.AM_SOLICITANTE_B, // Nuevo campo: apellido materno del solicitante B
		aprobador: record.APROBADOR_A_ID,
		aprobadorNombre: record.NOMBRE_APROBADOR_A, // Nuevo campo: nombre del aprobador A
		aprobadorApellidoPaterno: record.AP_APROBADOR_A, // Nuevo campo: apellido paterno del aprobador A
		aprobadorApellidoMaterno: record.AM_APROBADOR_A, // Nuevo campo: apellido materno del aprobador A
		aprobadorB: record.APROBADOR_B_ID, // Nuevo campo: ID del aprobador B
		aprobadorBNombre: record.NOMBRE_APROBADOR_B, // Nuevo campo: nombre del aprobador B
		aprobadorBApellidoPaterno: record.AP_APROBADOR_B, // Nuevo campo: apellido paterno del aprobador B
		aprobadorBApellidoMaterno: record.AM_APROBADOR_B, // Nuevo campo: apellido materno del aprobador B
		ejecutor: record.EJECUTOR_A_ID,
		ejecutorNombre: record.NOMBRE_EJECUTOR_A, // Nuevo campo: nombre del ejecutor A
		ejecutorApellidoPaterno: record.AP_EJECUTOR_A, // Nuevo campo: apellido paterno del ejecutor A
		ejecutorApellidoMaterno: record.AM_EJECUTOR_A, // Nuevo campo: apellido materno del ejecutor A
		ejecutorB: record.EJECUTOR_B_ID, // Nuevo campo: ID del ejecutor B
		ejecutorBNombre: record.NOMBRE_EJECUTOR_B, // Nuevo campo: nombre del ejecutor B
		ejecutorBApellidoPaterno: record.AP_EJECUTOR_B, // Nuevo campo: apellido paterno del ejecutor B
		ejecutorBApellidoMaterno: record.AM_EJECUTOR_B, // Nuevo campo: apellido materno del ejecutor B
		autorizacion: record.ESTADOSOLICITUD,
		tipoForzado: record.TIPOFORZADO_ID,
		tipoForzadoDescripcion: record.TIPOFORZADO_DESCRIPCION, // Nuevo campo: descripción del tipo de forzado
		motivoRechazo: record.MOTIVORECHAZO_A_ID, // Campo existente en la consulta
		motivoRechazoB: record.MOTIVORECHAZO_B_ID, // Campo existente en la consulta
		motivoRechazoDescripcion: record.MOTIVORECHAZO_DESCRIPCION, // Nuevo campo: descripción del motivo de rechazo
		observadoAlta: record.OBSERVADO_A,
		observacionRechazo: record.OBSERVACION_RECHAZO, // Nuevo campo: observación de rechazo
		areaId: record.AREA_ID, // Nuevo campo: ID del área
		areaDescripcion: record.AREA_DESCRIPCION, // Nuevo campo: descripción del área
		usuarioCreacion: record.USUARIO_CREACION_A, // Campo existente en la consulta
		fechaCreacion: record.FECHA_CREACION_A, // Campo existente en la consulta
		usuarioModificacion: record.USUARIO_MODIFICACION, // Campo existente en la consulta
		fechaModificacion: record.FECHA_MODIFICACION, // Campo existente en la consulta
		fechaEjecucionA: record.FECHA_EJECUCION_A, // Campo existente en la consulta
		fechaEjecucionB: record.FECHA_EJECUCION_B, // Campo existente en la consulta
		fechaCierre: record.FECHACIERRE,
        fechaFinPlanificada:record.FECHA_FIN_PLANIFICADA // Campo existente en la consulta
	}));
};
