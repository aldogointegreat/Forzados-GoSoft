import { useState, useEffect } from "react";

interface UserSession {
  name: string;
  id: number;
  area: string;
  roleName: string;
  role: number;
  roles: { [key: number]: string };
  jwt: string;
  flagNuevoIngreso: string;
  groupId: number | null; // Añadido para groupId
  grupo: string | null; // Añadido para el nombre descriptivo del grupo
}

export default function useUserSession() {
  const [user, setUser] = useState<UserSession | null>(null);

  // Recuperar datos de localStorage al montar el componente y fetch si no existe
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        console.log("User from localStorage:", parsedUser); // Debug log
        setUser({
          ...parsedUser,
          groupId: parsedUser.groupId || null,
          grupo: parsedUser.grupo || null,
        });
   /*    } else {
        // Fetch user data if not in localStorage (e.g., initial load)
        const userId = "1"; // Default to "ADMIN" or get from auth context
        fetchUserFromServer(userId).then((success) => {
          if (!success) console.error("Failed to fetch user data on initial load");
        }); */
      }
    }
  }, []);

  const saveUser = (userData: UserSession) => {
    console.log("Saving user:", userData); // Debug log
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  // Eliminar datos de localStorage
  const clearUser = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  // Obtener datos del usuario desde el servidor
  const fetchUserFromServer = async (id: string) => {
    try {
      const response = await fetch(`/api/usuarios/${encodeURIComponent(id)}`);
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }
      const userData: UserSession = await response.json();
      saveUser(userData);
      return true;
    } catch (error) {
      console.error("Error fetching user data:", error);
      return false;
    }
  };

  const disableFlagNuevoIngreso = async () => {
    if (user) {
      const updatedUser = { ...user, flagNuevoIngreso: "0" };
      saveUser(updatedUser);
    }
  };

  // Función para verificar si un usuario es de Active Directory
  const isActiveDirectoryUser = async (username: string): Promise<boolean> => {
    console.log(`[HOOK-AD] 🔍 Verificando si usuario "${username}" es de Active Directory...`);
    
    try {
      // Usar la nueva API para validar si es usuario de AD
      const response = await fetch('/api/usuarios/validate-ad', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username.toUpperCase() }),
      });

      console.log(`[HOOK-AD] 📡 Respuesta de API validate-ad: Status ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        console.log(`[HOOK-AD] 📋 Datos recibidos:`, data);
        const isAD = data.isADUser || false;
        console.log(`[HOOK-AD] ${isAD ? '✅' : '❌'} Usuario "${username}" ${isAD ? 'ES' : 'NO ES'} de Active Directory`);
        return isAD;
      }
      
      // Si hay error en la API, usar fallback
      console.log(`[HOOK-AD] ⚠️ Error en API, usando fallback para usuario "${username}"`);
      const fallback = !user?.id || user.id === null;
      console.log(`[HOOK-AD] 🔄 Fallback: ${fallback ? 'ES' : 'NO ES'} de AD (basado en ID: ${user?.id})`);
      return fallback;
    } catch (error) {
      console.error(`[HOOK-AD] ❌ Error verificando si es usuario AD:`, error);
      // En caso de error, si el usuario no tiene ID, asumir que es de AD
      const fallback = !user?.id || user.id === null;
      console.log(`[HOOK-AD] 🔄 Fallback por error: ${fallback ? 'ES' : 'NO ES'} de AD (basado en ID: ${user?.id})`);
      return fallback;
    }
  };

  // Función para verificar si debe mostrar el modal de cambio de contraseña
  const shouldShowPasswordModal = async (): Promise<boolean> => {
    console.log(`[MODAL-CHECK] 🔍 Verificando si mostrar modal de cambio de contraseña...`);
    console.log(`[MODAL-CHECK] 👤 Usuario actual:`, { 
      name: user?.name, 
      id: user?.id, 
      flagNuevoIngreso: user?.flagNuevoIngreso 
    });

    if (!user || user.flagNuevoIngreso !== "1") {
      console.log(`[MODAL-CHECK] ❌ No mostrar modal: ${!user ? 'No hay usuario' : 'Flag no es "1"'}`);
      return false;
    }

    // Extraer el username - usar diferentes estrategias según lo que esté disponible
    let username = '';
    
    if (user.name && user.name.includes('@')) {
      // Si el name es un email, extraer la parte antes del @
      username = user.name.split('@')[0];
      console.log(`[MODAL-CHECK] 📧 Username extraído de email: ${username}`);
    } else if (user.name) {
      // Si no es email, usar el name completo
      username = user.name;
      console.log(`[MODAL-CHECK] 👤 Username es el name completo: ${username}`);
    } else {
      // Fallback: usar el ID como string si está disponible
      username = user.id?.toString() || '';
      console.log(`[MODAL-CHECK] 🆔 Username usando ID: ${username}`);
    }
    
    if (!username) {
      // Si no podemos determinar el username, mostrar el modal por seguridad
      console.log(`[MODAL-CHECK] ⚠️ No se pudo determinar username, mostrar modal por seguridad`);
      return true;
    }
    
    // Si es usuario de AD, no mostrar el modal
    const isADUser = await isActiveDirectoryUser(username.toUpperCase());
    
    const shouldShow = !isADUser;
    console.log(`[MODAL-CHECK] 🎯 DECISIÓN FINAL: ${shouldShow ? 'MOSTRAR' : 'NO MOSTRAR'} modal`);
    console.log(`[MODAL-CHECK] 📊 Resumen: Usuario="${username}", esAD=${isADUser}, flag="${user.flagNuevoIngreso}", mostrarModal=${shouldShow}`);
    
    return shouldShow;
  };

  const validateUserSession = (): boolean => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user");
      return !!storedUser;
    }
    return false;
  };

  const doLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return { user, saveUser, clearUser, fetchUserFromServer, disableFlagNuevoIngreso, validateUserSession, doLogout, isActiveDirectoryUser, shouldShowPasswordModal };
}