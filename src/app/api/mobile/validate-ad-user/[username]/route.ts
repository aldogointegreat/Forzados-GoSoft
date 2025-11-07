import { NextRequest, NextResponse } from 'next/server';

/**
 * API endpoint para validar si un usuario existe en Active Directory
 * Ruta dinámica: /api/mobile/validate-ad-user/{username}
 * Diseñado específicamente para uso en la aplicación móvil Flutter
 * 
 * @route GET /api/mobile/validate-ad-user/{username}
 * @param username - Nombre de usuario (path parameter)
 * @returns { isADUser: boolean, exists: boolean, message: string }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    // Validar que se proporcione el username
    if (!username || typeof username !== 'string' || username.trim() === '') {
      return NextResponse.json(
        {
          isADUser: false,
          exists: false,
          message: 'El nombre de usuario es requerido',
        },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim();

    // Consultar el servicio de Active Directory
    const adServiceUrl = process.env.AD_SERVICE_URL || 'http://127.0.0.1:8000';
    const adUrl = `${adServiceUrl}/ad/user?username=${encodeURIComponent(cleanUsername)}&password1=__validation_check__`;

    try {
      const response = await fetch(adUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Si la respuesta es 200, el usuario existe y las credenciales son correctas
      if (response.ok) {
        const userData = await response.json();
        return NextResponse.json(
          {
            isADUser: true,
            exists: true,
            message: 'Usuario existe en Active Directory',
            userData: {
              cn: userData.cn,
              mail: userData.mail,
              displayName: userData.displayName,
            },
          },
          { status: 200 }
        );
      }

      // Si la respuesta es 401, el usuario existe en AD pero las credenciales son incorrectas
      // Esto es lo esperado en esta validación
      if (response.status === 401) {
        return NextResponse.json(
          {
            isADUser: true,
            exists: true,
            message: 'Usuario pertenece a Active Directory',
          },
          { status: 200 }
        );
      }

      // Si la respuesta es 404, el usuario no existe en AD
      if (response.status === 404) {
        return NextResponse.json(
          {
            isADUser: false,
            exists: false,
            message: 'Usuario no encontrado en Active Directory',
          },
          { status: 200 }
        );
      }

      // Si hay error de conexión con el servidor AD
      if (response.status === 503) {
        return NextResponse.json(
          {
            isADUser: false,
            exists: false,
            message: 'Error de conexión con Active Directory',
            error: 'SERVICE_UNAVAILABLE',
          },
          { status: 503 }
        );
      }

      // Otros errores del servicio AD
      const errorData = await response.json().catch(() => ({ detail: 'Error desconocido' }));
      return NextResponse.json(
        {
          isADUser: false,
          exists: false,
          message: 'Error al consultar Active Directory',
          error: errorData.detail || 'Error desconocido',
        },
        { status: 500 }
      );

    } catch (fetchError: any) {
      console.error('Error al conectar con el servicio de AD:', fetchError);
      
      // Error de conexión con el servicio de Python
      return NextResponse.json(
        {
          isADUser: false,
          exists: false,
          message: 'No se pudo conectar con el servicio de Active Directory',
          error: 'CONNECTION_ERROR',
        },
        { status: 503 }
      );
    }

  } catch (error: any) {
    console.error('Error en validate-ad-user:', error);
    
    return NextResponse.json(
      {
        isADUser: false,
        exists: false,
        message: 'Error interno del servidor',
        error: error.message || 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
