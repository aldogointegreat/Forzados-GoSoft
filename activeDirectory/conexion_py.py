from fastapi import FastAPI, HTTPException, Query
from ldap3 import Server, Connection, ALL, NTLM, SIMPLE
import re
import logging
from datetime import datetime

# Configurar logging más detallado
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI()

AD_SERVER = "ldap://10.130.221.20:389"
AD_DOMAIN = "gfpe"
BASE_DN = "DC=gfpe,DC=gfiroot,DC=local"

@app.on_event("startup")
async def startup_event():
    logger.info("=" * 60)
    logger.info("🚀 SERVICIO ACTIVE DIRECTORY INICIADO")
    logger.info(f"📡 Servidor AD: {AD_SERVER}")
    logger.info(f"🏢 Dominio: {AD_DOMAIN}")
    logger.info(f"📁 Base DN: {BASE_DN}")
    logger.info("=" * 60)

@app.get("/ad/user")
def get_user_info(username: str = Query(..., description="Nombre de usuario"), password1: str = Query(..., description="Contraseña")):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    logger.info("-" * 50)
    logger.info(f"🔍 [{timestamp}] NUEVA CONSULTA AD")
    logger.info(f"👤 Usuario solicitado: {username}")
    
    try:
        # Formar usuario NTLM: dominio\\usuario
        ntlm_user = f"{AD_DOMAIN}\\{username}"

        logger.info(f"🔐 Intentando autenticar: {ntlm_user}")
        logger.info(f"📡 Conectando a: {AD_SERVER}")

        # Crear servidor y conexión LDAP
        server = Server(AD_SERVER, get_info=ALL)
        conn = Connection(server, user=ntlm_user, password=password1, authentication=NTLM, auto_bind=True)

        # Si el bind fue exitoso, hacemos búsqueda
        search_filter = f"(sAMAccountName={username})"
        logger.info(f"✅ Autenticación exitosa! Buscando: {search_filter}")
        conn.search(search_base=BASE_DN, search_filter=search_filter, attributes=["cn", "mail", "displayName"])

        if not conn.entries:
            logger.warning(f"❌ Usuario {username} no encontrado en AD")
            raise HTTPException(status_code=404, detail="Usuario no encontrado en Active Directory")

        user_data = conn.entries[0]
        logger.info(f"✅ Usuario encontrado en AD: {user_data.cn.value}")
        logger.info(f"📧 Email: {user_data.mail.value if user_data.mail else 'No disponible'}")
        
        result = {
            "cn": user_data.cn.value,
            "mail": user_data.mail.value if user_data.mail else None,
            "displayName": user_data.displayName.value if user_data.displayName else None,
        }
        logger.info(f"📤 Respuesta enviada: {result}")
        
        # Cerrar conexión
        conn.unbind()
        
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ ERROR en consulta AD para usuario {username}")
        logger.error(f"🔍 Tipo de error: {type(e).__name__}")
        logger.error(f"📝 Detalle: {str(e)}")
        
        # Determinar tipo de error para respuesta apropiada
        if "invalidCredentials" in str(e) or "Invalid credentials" in str(e) or "authentication" in str(e).lower() or "LDAPBindError" in str(type(e).__name__):
            logger.info(f"🔐 Error de autenticación para usuario {username} (credenciales incorrectas pero usuario existe en AD)")
            raise HTTPException(status_code=401, detail="Credenciales incorrectas")
        elif "server" in str(e).lower() or "connection" in str(e).lower():
            logger.error(f"🌐 Error de conexión al servidor AD: {AD_SERVER}")
            raise HTTPException(status_code=503, detail="Error de conexión con Active Directory")
        else:
            logger.error(f"❓ Error desconocido: {str(e)}")
            raise HTTPException(status_code=500, detail="Error interno del servidor AD")

if __name__ == "__main__":
    import uvicorn
    logger.info("🚀 Iniciando servidor AD en modo directo...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
