import { NextResponse } from "next/server";
import { poolPromise } from "@sql/lib/db";

// Manejo del método GET
export async function GET() {
	try {
		const pool = await poolPromise;
		const { recordset } = await pool.request().query(`
			SELECT mtr.*, 
				sa.CODIGO AS prefijoCodigo,
				sa.DESCRIPCION AS prefijoDescripcion,
				tc.CODIGO AS centroCodigo,
				tc.DESCRIPCION AS centroDescripcion,
				pro.DESCRIPCION as probabilidadDescripcion,
				imp.DESCRIPCION as impactoDescripcion,
				maera.DESCRIPCION as riesgo_a_descripcion,
				CASE 
					WHEN mtr.INTERLOCK = 0 THEN 'NO'
					WHEN mtr.INTERLOCK = 1 THEN 'SI'
					ELSE NULL 
				END AS interlock_descripcion
			FROM MAE_TAGS_MATRIZ_RIESGO mtr
			LEFT JOIN SUB_AREA sa ON mtr.SUB_AREA_ID = sa.SUBAREA_ID
			LEFT JOIN TAG_CENTRO tc ON mtr.TAG_CENTRO_ID = tc.TAGCENTRO_ID
			LEFT JOIN PROBABILIDAD pro ON mtr.PROBABILIDAD_ID = pro.PROBABILIDAD_ID
			LEFT JOIN IMPACTO imp ON mtr.IMPACTO_ID = imp.IMPACTO_ID
			LEFT JOIN MAE_RIESGO_A maera ON mtr.RIESGO_A = maera.RIESGOA_ID
			WHERE mtr.ESTADO = 1
		`);

		const rows = recordset.map((singleValue) => {
			return {
				id: singleValue.ID,
				prefijoId: singleValue.SUB_AREA_ID,
				centroId: singleValue.TAG_CENTRO_ID,
				sufijo: singleValue.SUFIJO,
				probabilidadDescripcion: singleValue.probabilidadDescripcion,
				impactoDescripcion: singleValue.impactoDescripcion,
				probabilidadId: singleValue.PROBABILIDAD_ID,
				impactoId: singleValue.IMPACTO_ID,
				descripcion: singleValue.DESCRIPCION,
				tagConcat: singleValue.TAG_CONCAT,
				prefijoCodigo: singleValue.prefijoCodigo,
				prefijoDescripcion: singleValue.prefijoDescripcion,
				centroCodigo: singleValue.centroCodigo,
				centroDescripcion: singleValue.centroDescripcion,
				interlock: singleValue.INTERLOCK,
				riesgoAId: singleValue.RIESGO_A,
				riesgoADescripcion: singleValue.riesgo_a_descripcion,
				interlockDescripcion: singleValue.interlock_descripcion,
			};
		});
		return NextResponse.json({ success: true, values: rows });
	} catch (error) {
		console.error("Error processing GET:", error);
		return NextResponse.json({ success: false, message: "Error retrieving data" }, { status: 500 });
	}
}

// Manejo del método POST
export async function POST(request: Request) {
	try {
		const pool = await poolPromise;
		const { prefijoId, centroId, sufijo, probabilidadId, impactoId, usuario, descripcion, interlock, riesgoAId } = await request.json();

		// Validar que prefijoId y centroId sean cadenas no vacías
		if (!prefijoId || !centroId) {
			return NextResponse.json({ success: false, message: "Prefijo y centro son requeridos" }, { status: 400 });
		}

		// Obtener los IDs numéricos de prefijo y centro usando los CODIGO (cadenas) de SUB_AREA y TAG_CENTRO
		const { recordset: prefijoRecord } = await pool
			.request()
			.input("prefijoId", prefijoId)
			.query("SELECT SUBAREA_ID FROM SUB_AREA WHERE CODIGO = @prefijoId AND ESTADO = 1");

		const { recordset: centroRecord } = await pool
			.request()
			.input("centroId", centroId)
			.query("SELECT TAGCENTRO_ID FROM TAG_CENTRO WHERE CODIGO = @centroId AND ESTADO = 1");

		// Verificar si se encontraron los registros
		if (!prefijoRecord || prefijoRecord.length === 0) {
			return NextResponse.json({ success: false, message: `Prefijo '${prefijoId}' no encontrado` }, { status: 400 });
		}
		if (!centroRecord || centroRecord.length === 0) {
			return NextResponse.json({ success: false, message: `Centro '${centroId}' no encontrado` }, { status: 400 });
		}

		// Obtener los IDs numéricos de prefijo y centro para insertar en MAE_TAGS_MATRIZ_RIESGO
		const prefijoIdNum = prefijoRecord[0].SUBAREA_ID;
		const centroIdNum = centroRecord[0].TAGCENTRO_ID;

		// Obtener los códigos para la concatenación
		const { recordset: prefijoCodigoRecord } = await pool
			.request()
			.input("prefijoIdNum", prefijoIdNum)
			.query("SELECT CODIGO FROM SUB_AREA WHERE SUBAREA_ID = @prefijoIdNum AND ESTADO = 1");

		const { recordset: centroCodigoRecord } = await pool
			.request()
			.input("centroIdNum", centroIdNum)
			.query("SELECT CODIGO FROM TAG_CENTRO WHERE TAGCENTRO_ID = @centroIdNum AND ESTADO = 1");

		// Generar el TAG_CONCAT concatenando prefijo, centro y sufijo
		const prefijoCodigo = prefijoCodigoRecord[0]?.CODIGO || "";
		const centroCodigo = centroCodigoRecord[0]?.CODIGO || "";
		const tagConcat = `${prefijoCodigo}-${centroCodigo}-${sufijo}`.toUpperCase();

		// Validar si ya existe un registro con los mismos prefijoId, centroId y sufijo
		const { recordset: existingRecords } = await pool
			.request()
			.input("prefijoIdNum", prefijoIdNum)
			.input("centroIdNum", centroIdNum)
			.input("sufijo", sufijo)
			.query("SELECT * FROM MAE_TAGS_MATRIZ_RIESGO WHERE SUB_AREA_ID = @prefijoIdNum AND TAG_CENTRO_ID = @centroIdNum AND SUFIJO = @sufijo AND ESTADO = 1");

		if (existingRecords.length > 0) {
			return NextResponse.json({ success: false, message: "Ya existe un registro con dicho prefijo, centro y sufijo" }, { status: 400 });
		}

		const result = await pool
			.request()
			.input("prefijoIdNum", prefijoIdNum)
			.input("centroIdNum", centroIdNum)
			.input("sufijo", sufijo)
			.input("probabilidadId", probabilidadId)
			.input("impactoId", impactoId)
			.input("usuario", usuario)
			.input("descripcion", descripcion)
			.input("tagConcat", tagConcat)
			.input("interlock", interlock !== undefined ? interlock : 0)
			.input("riesgoAId", riesgoAId || 0)
			.query(
				"INSERT INTO MAE_TAGS_MATRIZ_RIESGO (SUB_AREA_ID, TAG_CENTRO_ID, SUFIJO, PROBABILIDAD_ID, IMPACTO_ID, USUARIO_CREACION, USUARIO_MODIFICACION, FECHA_CREACION, FECHA_MODIFICACION, ESTADO, DESCRIPCION, TAG_CONCAT, INTERLOCK, RIESGO_A) VALUES (@prefijoIdNum, @centroIdNum, @sufijo, @probabilidadId, @impactoId, @usuario, @usuario, GETDATE(), GETDATE(), 1, @descripcion, @tagConcat, @interlock, @riesgoAId)"
			);

		if (result.rowsAffected[0] > 0) {
			return NextResponse.json({ success: true, message: "Values inserted into database" });
		} else {
			return NextResponse.json({ success: false, message: "No values inserted" }, { status: 500 });
		}
	} catch (error) {
		console.error("Error processing POST:", error);
		return NextResponse.json({ success: false, message: "Error inserting data" }, { status: 500 });
	}
}

// Manejo del método DELETE
export async function DELETE(request: Request) {
	try {
		const pool = await poolPromise;
		const { id, usuario } = await request.json();
		const result = await pool
			.request()
			.input("id", id)
			.input("usuario", usuario)
			.query("UPDATE MAE_TAGS_MATRIZ_RIESGO SET ESTADO = 0, USUARIO_MODIFICACION = @usuario, FECHA_MODIFICACION = GETDATE() WHERE ID = @id");

		if (result.rowsAffected[0] > 0) {
			return NextResponse.json({ success: true, message: "Record updated successfully" });
		} else {
			return NextResponse.json({ success: false, message: "No record found with the given ID" }, { status: 404 });
		}
	} catch (error) {
		console.error("Error processing DELETE:", error);
		return NextResponse.json({ success: false, message: "Error updating data" }, { status: 500 });
	}
}

// Manejo del método PUT
export async function PUT(request: Request) {
	try {
		const pool = await poolPromise;
		const { id, prefijoId, centroId, sufijo, probabilidadId, impactoId, usuario, descripcion, interlock, riesgoAId } = await request.json();

		// Validar que prefijoId y centroId sean cadenas no vacías
		if (!prefijoId || !centroId) {
			return NextResponse.json({ success: false, message: "Prefijo y centro son requeridos" }, { status: 400 });
		}

		// Obtener los IDs numéricos de prefijo y centro usando los CODIGO (cadenas)
		const { recordset: prefijoRecord } = await pool
			.request()
			.input("prefijoId", prefijoId)
			.query("SELECT SUBAREA_ID FROM SUB_AREA WHERE CODIGO = @prefijoId AND ESTADO = 1");

		const { recordset: centroRecord } = await pool
			.request()
			.input("centroId", centroId)
			.query("SELECT TAGCENTRO_ID FROM TAG_CENTRO WHERE CODIGO = @centroId AND ESTADO = 1");

		// Verificar si se encontraron los registros
		if (!prefijoRecord || prefijoRecord.length === 0) {
			return NextResponse.json({ success: false, message: `Prefijo '${prefijoId}' no encontrado` }, { status: 400 });
		}
		if (!centroRecord || centroRecord.length === 0) {
			return NextResponse.json({ success: false, message: `Centro '${centroId}' no encontrado` }, { status: 400 });
		}

		// Obtener los IDs numéricos de prefijo y centro para la actualización
		const prefijoIdNum = prefijoRecord[0].SUBAREA_ID;
		const centroIdNum = centroRecord[0].TAGCENTRO_ID;

		// Obtener los códigos para la concatenación (y descripciones para mostrar en el frontend)
		const { recordset: prefijoCodigoRecord } = await pool
			.request()
			.input("prefijoIdNum", prefijoIdNum)
			.query("SELECT CODIGO, DESCRIPCION FROM SUB_AREA WHERE SUBAREA_ID = @prefijoIdNum AND ESTADO = 1");

		const { recordset: centroCodigoRecord } = await pool
			.request()
			.input("centroIdNum", centroIdNum)
			.query("SELECT CODIGO, DESCRIPCION FROM TAG_CENTRO WHERE TAGCENTRO_ID = @centroIdNum AND ESTADO = 1");

		// Generar el TAG_CONCAT concatenando prefijo, centro y sufijo
		const prefijoCodigo = prefijoCodigoRecord[0]?.CODIGO || "";
		const centroCodigo = centroCodigoRecord[0]?.CODIGO || "";
		const tagConcat = `${prefijoCodigo}-${centroCodigo}-${sufijo}`.toUpperCase();

		// Validar si ya existe un registro con los mismos prefijoId, centroId y sufijo
		const { recordset: existingRecords } = await pool
			.request()
			.input("prefijoIdNum", prefijoIdNum)
			.input("centroIdNum", centroIdNum)
			.input("sufijo", sufijo)
			.input("id", id)
			.query("SELECT * FROM MAE_TAGS_MATRIZ_RIESGO WHERE SUB_AREA_ID = @prefijoIdNum AND TAG_CENTRO_ID = @centroIdNum AND SUFIJO = @sufijo AND ESTADO = 1 AND ID != @id");

		if (existingRecords.length > 0) {
			return NextResponse.json({ success: false, message: "Record with the same prefijoId, centroId, and sufijo already exists" }, { status: 400 });
		}

		const result = await pool
			.request()
			.input("id", id)
			.input("prefijoIdNum", prefijoIdNum)
			.input("centroIdNum", centroIdNum)
			.input("sufijo", sufijo)
			.input("probabilidadId", probabilidadId)
			.input("impactoId", impactoId)
			.input("usuario", usuario)
			.input("descripcion", descripcion)
			.input("tagConcat", tagConcat)
			.input("interlock", interlock !== undefined ? interlock : 0)
			.input("riesgoAId", riesgoAId || 0)
			.query(
				"UPDATE MAE_TAGS_MATRIZ_RIESGO SET SUB_AREA_ID = @prefijoIdNum, TAG_CENTRO_ID = @centroIdNum, SUFIJO = @sufijo, PROBABILIDAD_ID = @probabilidadId, IMPACTO_ID = @impactoId, USUARIO_MODIFICACION = @usuario, FECHA_MODIFICACION = GETDATE(), DESCRIPCION = @descripcion, TAG_CONCAT = @tagConcat, INTERLOCK = @interlock, RIESGO_A = @riesgoAId WHERE ID = @id"
			);

		if (result.rowsAffected[0] > 0) {
			return NextResponse.json({ success: true, message: "Record updated successfully" });
		} else {
			return NextResponse.json({ success: false, message: "No record found to update" }, { status: 404 });
		}
	} catch (error) {
		console.error("Error processing PUT:", error);
		return NextResponse.json({ success: false, message: "Error updating data" }, { status: 500 });
	}
}