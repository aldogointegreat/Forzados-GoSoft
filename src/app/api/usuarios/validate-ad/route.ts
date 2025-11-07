import { NextRequest, NextResponse } from "next/server";
import { poolPromise } from "@sql/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { username } = await req.json();
    
    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    const pool = await poolPromise;
    
    // Verificar si el usuario existe en la base de datos local
    const result = await pool
      .request()
      .input("username", username.toUpperCase())
      .query("SELECT USUARIO_ID, USUARIO FROM MAE_USUARIO WHERE USUARIO = @username AND ESTADO = 1");

    // Si el usuario existe en BD local, NO es de Active Directory
    if (result.recordset.length > 0) {
      return NextResponse.json({ 
        isADUser: false, 
        message: "Usuario existe en base de datos local" 
      }, { status: 200 });
    }

    // Si no existe en BD local, intentar verificar en Active Directory
    const adPort = process.env.PORT_AD || '8000';
    const adUrl = `http://localhost:${adPort}/ad/user?username=${username}&password1=dummy_password`;
    
    console.log(`[AD-VALIDATION] Intentando conectar a Active Directory: ${adUrl}`);
    
    try {
      const adResponse = await fetch(adUrl);
      
      console.log(`[AD-VALIDATION] Respuesta de AD para usuario ${username}: Status ${adResponse.status}`);
      
      // Si AD responde con 401 (credenciales incorrectas), significa que el usuario SÍ existe en AD
      // Si responde con 404, el usuario no existe en AD
      if (adResponse.status === 401) {
        console.log(`[AD-VALIDATION] ✅ Usuario ${username} EXISTE en Active Directory`);
        return NextResponse.json({ 
          isADUser: true, 
          message: "Usuario existe en Active Directory" 
        }, { status: 200 });
      } else if (adResponse.status === 404) {
        console.log(`[AD-VALIDATION] ❌ Usuario ${username} NO EXISTE en Active Directory`);
        return NextResponse.json({ 
          isADUser: false, 
          message: "Usuario no existe ni en BD local ni en Active Directory" 
        }, { status: 200 });
      }
      
      // Otros códigos de respuesta - error en AD
      return NextResponse.json({ 
        isADUser: false, 
        message: "Error al verificar Active Directory",
        error: `AD responded with status: ${adResponse.status}`
      }, { status: 200 });
      
    } catch (adError) {
      console.error(`[AD-VALIDATION] ❌ Error conectando a Active Directory para usuario ${username}:`, adError);
      console.error(`[AD-VALIDATION] URL intentada: ${adUrl}`);
      return NextResponse.json({ 
        isADUser: false, 
        message: "Error de conexión con Active Directory",
        error: adError instanceof Error ? adError.message : "Unknown error"
      }, { status: 200 });
    }

  } catch (error) {
    console.error("Error in validate-ad:", error);
    return NextResponse.json({ 
      error: "Internal Server Error",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}