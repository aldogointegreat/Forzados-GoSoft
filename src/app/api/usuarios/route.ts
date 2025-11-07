import { NextResponse } from "next/server";
import { poolPromise } from "@sql/lib/db";
import bcrypt from "bcrypt";

// Manejo del método GET
export async function GET() {
  try {
    const pool = await poolPromise;
    const { recordset } = await pool.request().query(`
      SELECT 
        UX.USUARIO_ID,
        UX.NOMBRE,
        UX.APEPATERNO,
        UX.APEMATERNO,
        UX.AREA_ID,
        AR.DESCRIPCION AS AREA_DESCRIPCION,
        UX.ROL_ID,
        ROL.DESCRIPCION AS ROL_DESCRIPCION,
        UX.ESTADO,
        UX.DNI,
        UX.PUESTO_ID,
        PX.DESCRIPCION AS PUESTO_DESCRIPCION,
        UX.CORREO,
        UX.USUARIO,
        GX.GRUPO_ID AS grupoId,
        GX.NOMBRE AS gruponombre,
        (
          SELECT STUFF(
            (
              SELECT ',' + '"' + CAST(ROL.ROL_ID AS NVARCHAR) + '": "' + ROL.DESCRIPCION + '"'
              FROM MAE_PUESTO_ROL PR
              INNER JOIN MAE_ROL ROL ON PR.ROL_ID = ROL.ROL_ID
              WHERE PR.PUESTO_ID = UX.PUESTO_ID
              FOR XML PATH('')
            ), 1, 1, ''
          )
        ) AS ROLES_JSON,
        (
          SELECT STUFF(
            (
              SELECT 
                ',' + '"' + CAST(R.RIESGO_ID AS NVARCHAR) + '": "' + R.DESCRIPCION + '"'
              FROM MAE_PUESTO P
              INNER JOIN MAE_PUESTO_RIESGO2 PR ON P.PUESTO_ID = PR.PUESTO_ID
              INNER JOIN RIESGO R ON R.RIESGO_ID = PR.RIESGO_ID
              WHERE PR.PUESTO_ID = UX.PUESTO_ID
              FOR XML PATH('')
            ), 1, 1, ''
          )
        ) AS NIVELRIESGO_JSON
      FROM MAE_USUARIO UX
      LEFT JOIN MAE_AREA AR ON UX.AREA_ID = AR.AREA_ID
      LEFT JOIN MAE_ROL ROL ON UX.ROL_ID = ROL.ROL_ID
      LEFT JOIN MAE_PUESTO PX ON UX.PUESTO_ID = PX.PUESTO_ID
      LEFT JOIN MAE_GRUPO GX ON UX.GRUPO_ID = GX.GRUPO_ID
    `);

    const Usuarios = recordset.map((singleValue) => {
      return {
        id: singleValue.USUARIO_ID,
        nombre: singleValue.NOMBRE,
        apePaterno: singleValue.APEPATERNO,
        apeMaterno: singleValue.APEMATERNO,
        areaId: singleValue.AREA_ID,
        areaDescripcion: singleValue.AREA_DESCRIPCION,
        rolId: singleValue.ROL_ID,
        rolDescripcion: singleValue.ROL_DESCRIPCION,
        roles: singleValue.ROLES_JSON != undefined ? JSON.parse(`{${singleValue.ROLES_JSON}}`) : {},
        nivelRiesgoJ: singleValue.NIVELRIESGO_JSON != undefined ? JSON.parse(`{${singleValue.NIVELRIESGO_JSON}}`) : {},
        estado: singleValue.ESTADO,
        dni: singleValue.DNI,
        puestoId: singleValue.PUESTO_ID,
        puestoDescripcion: singleValue.PUESTO_DESCRIPCION,
        correo: singleValue.CORREO,
        usuario: singleValue.USUARIO,
        grupoId: singleValue.grupoId,
        gruponombre: singleValue.gruponombre,
      };
    });

    console.log("GET /api/usuarios: Retrieved", Usuarios.length, "users");
    return NextResponse.json({ success: true, values: Usuarios });
  } catch (error) {
    console.error("Error processing GET /api/usuarios:", error);
    return NextResponse.json({ success: false, message: "Error retrieving data" }, { status: 500 });
  }
}

// Manejo del método POST
export async function POST(request: Request) {
  try {
    const pool = await poolPromise;
    const { areaId, puestoId, grupoId, usuario, dni, nombre, apePaterno, apeMaterno, correo, estado, usuarioCreacion } = await request.json();
    const newPassword = (apePaterno + dni).replace(/ /g, "").toLowerCase();
    const passwordHash = await bcrypt.hash(newPassword, 10);

    console.log("POST /api/usuarios: Creating user with usuario:", usuario);

    const result = await pool
      .request()
      .input("areaId", areaId)
      .input("puestoId", puestoId)
      .input("grupoId", grupoId || null)
      .input("usuario", usuario)
      .input("passwordHash", passwordHash)
      .input("dni", dni)
      .input("nombre", nombre)
      .input("apePaterno", apePaterno)
      .input("apeMaterno", apeMaterno)
      .input("correo", correo)
      .input("estado", estado)
      .input("usuarioCreacion", usuarioCreacion)
      .query(`
        INSERT INTO MAE_USUARIO (
          AREA_ID, PUESTO_ID, GRUPO_ID, USUARIO, PASSWORD, DNI, NOMBRE, 
          APEPATERNO, APEMATERNO, CORREO, FLAG_INGRESO, ESTADO, 
          USUARIO_CREACION, FECHA_CREACION, USUARIO_MODIFICACION, FECHA_MODIFICACION
        ) 
        VALUES (
          @areaId, @puestoId, @grupoId, @usuario, @passwordHash, @dni, @nombre, 
          @apePaterno, @apeMaterno, @correo, 1, @estado, 
          @usuarioCreacion, GETDATE(), @usuarioCreacion, GETDATE()
        )
      `);

    if (result.rowsAffected[0] > 0) {
      console.log("POST /api/usuarios: User created successfully for usuario:", usuario);
      return NextResponse.json({ success: true, message: "Values inserted into database" });
    } else {
      console.log("POST /api/usuarios: No rows affected for usuario:", usuario);
      return NextResponse.json({ success: false, message: "No values inserted" }, { status: 500 });
    }
  } catch (error) {
    console.error("Error processing POST /api/usuarios:", error);
    return NextResponse.json({ success: false, message: "Error inserting data" }, { status: 500 });
  }
}

// Manejo del método PUT
export async function PUT(request: Request) {
  try {
    const pool = await poolPromise;
    const requestBody = await request.json();
    const { usuarioId } = requestBody;

    console.log("PUT /api/usuarios: Received request with body:", requestBody);

    if (!usuarioId) {
      console.log("PUT /api/usuarios: Missing usuarioId");
      return NextResponse.json(
        { success: false, message: "ID de usuario requerido para la actualización" },
        { status: 400 }
      );
    }

    const updateFields = [];
    const requestBuilder = pool.request();

    // Siempre se requiere usuarioId
    requestBuilder.input("usuarioId", usuarioId);

    // Agrega campos a actualizar solo si están definidos en la solicitud
    if (requestBody.areaId !== undefined) {
      updateFields.push("AREA_ID = @areaId");
      requestBuilder.input("areaId", requestBody.areaId === '' ? null : requestBody.areaId);
    }
    if (requestBody.puestoId !== undefined) {
      updateFields.push("PUESTO_ID = @puestoId");
      requestBuilder.input("puestoId", requestBody.puestoId === '' ? null : requestBody.puestoId);
    }
    if (requestBody.grupoId !== undefined) {
      updateFields.push("GRUPO_ID = @grupoId");
      requestBuilder.input("grupoId", requestBody.grupoId === '' ? null : requestBody.grupoId);
    }
    if (requestBody.usuario !== undefined) {
      updateFields.push("USUARIO = @usuario");
      requestBuilder.input("usuario", requestBody.usuario === '' ? null : requestBody.usuario);
    }
    if (requestBody.dni !== undefined) {
      updateFields.push("DNI = @dni");
      requestBuilder.input("dni", requestBody.dni === '' ? null : requestBody.dni);
    }
    if (requestBody.nombre !== undefined) {
      updateFields.push("NOMBRE = @nombre");
      requestBuilder.input("nombre", requestBody.nombre === '' ? null : requestBody.nombre);
    }
    if (requestBody.apePaterno !== undefined) {
      updateFields.push("APEPATERNO = @apePaterno");
      requestBuilder.input("apePaterno", requestBody.apePaterno === '' ? null : requestBody.apePaterno);
    }
    if (requestBody.apeMaterno !== undefined) {
      updateFields.push("APEMATERNO = @apeMaterno");
      requestBuilder.input("apeMaterno", requestBody.apeMaterno === '' ? null : requestBody.apeMaterno);
    }
    if (requestBody.correo !== undefined) {
      updateFields.push("CORREO = @correo");
      requestBuilder.input("correo", requestBody.correo === '' ? null : requestBody.correo);
    }
    if (requestBody.rolId !== undefined) {
      updateFields.push("ROL_ID = @rolId");
      requestBuilder.input("rolId", requestBody.rolId === '' ? null : requestBody.rolId);
    }
    if (requestBody.estado !== undefined) {
      updateFields.push("ESTADO = @estado");
      requestBuilder.input("estado", requestBody.estado);
    }
    if (requestBody.usuarioModificacion !== undefined) {
      updateFields.push("USUARIO_MODIFICACION = @usuarioModificacion");
      requestBuilder.input("usuarioModificacion", requestBody.usuarioModificacion);
    } else if (requestBody.estado !== undefined) {
      console.log("PUT /api/usuarios: Missing usuarioModificacion for estado update");
      return NextResponse.json(
        { success: false, message: "usuarioModificacion es requerido para la actualización de estado" },
        { status: 400 }
      );
    }

    // Siempre se actualiza la fecha de modificación
    updateFields.push("FECHA_MODIFICACION = GETDATE()");

    if (updateFields.length === 0) {
      console.log("PUT /api/usuarios: No fields to update");
      return NextResponse.json(
        { success: false, message: "No hay campos válidos para actualizar" },
        { status: 400 }
      );
    }

    const query = `UPDATE MAE_USUARIO SET ${updateFields.join(", ")} WHERE USUARIO_ID = @usuarioId`;
    console.log("PUT /api/usuarios: Executing query:", query);

    const result = await requestBuilder.query(query);

    if (result.rowsAffected[0] > 0) {
      console.log("PUT /api/usuarios: User updated successfully for usuarioId:", usuarioId);
      return NextResponse.json({ success: true, message: "Usuario actualizado correctamente" });
    } else {
      console.log("PUT /api/usuarios: User not found for usuarioId:", usuarioId);
      return NextResponse.json(
        { success: false, message: "Error al actualizar el usuario: usuario no encontrado" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Error processing PUT /api/usuarios:", error);
    return NextResponse.json(
      { success: false, message: "Error actualizando datos" },
      { status: 500 }
    );
  }
}

// Manejo del método DELETE
export async function DELETE(request: Request) {
  const { usuarioId, usuarioModificacion } = await request.json();

  console.log("DELETE /api/usuarios: Received request with body:", { usuarioId, usuarioModificacion });

  if (!usuarioId) {
    console.log("DELETE /api/usuarios: Missing usuarioId");
    return NextResponse.json(
      { success: false, message: "ID de usuario requerido para deshabilitar" },
      { status: 400 }
    );
  }

  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("usuarioId", usuarioId)
      .input("usuarioModificacion", usuarioModificacion || 'SYSTEM')
      .query(`
        UPDATE MAE_USUARIO 
        SET ESTADO = 0, 
            USUARIO_MODIFICACION = @usuarioModificacion, 
            FECHA_MODIFICACION = GETDATE() 
        WHERE USUARIO_ID = @usuarioId
      `);

    if (result.rowsAffected[0] > 0) {
      console.log("DELETE /api/usuarios: User disabled successfully for usuarioId:", usuarioId);
      return NextResponse.json({ success: true, message: "Usuario deshabilitado correctamente" });
    } else {
      console.log("DELETE /api/usuarios: User not found for usuarioId:", usuarioId);
      return NextResponse.json(
        { success: false, message: "No se pudo deshabilitar el usuario: usuario no encontrado" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Error processing DELETE /api/usuarios:", error);
    return NextResponse.json(
      { success: false, message: "Error deshabilitando el usuario" },
      { status: 500 }
    );
  }
}

// Manejo de CORS (OPTIONS)
export async function OPTIONS() {
  console.log("OPTIONS /api/usuarios: Handling CORS preflight request");
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}