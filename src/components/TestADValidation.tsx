"use client"

import React, { useState } from 'react';
import useUserSession from '@/hooks/useSession';

const TestADValidation: React.FC = () => {
  const [testUsername, setTestUsername] = useState('');
  const [result, setResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, isActiveDirectoryUser, shouldShowPasswordModal } = useUserSession();

  const testADUser = async () => {
    if (!testUsername) return;
    
    setIsLoading(true);
    setResult('Iniciando test...');
    
    try {
      console.log(`[TEST-COMPONENT] 🧪 Iniciando test para usuario: ${testUsername}`);
      const isAD = await isActiveDirectoryUser(testUsername);
      console.log(`[TEST-COMPONENT] 🎯 Resultado: ${isAD}`);
      setResult(`Usuario ${testUsername} ${isAD ? 'ES' : 'NO ES'} de Active Directory`);
    } catch (error) {
      console.error(`[TEST-COMPONENT] ❌ Error:`, error);
      setResult(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testPasswordModal = async () => {
    setIsLoading(true);
    setResult('Verificando modal...');
    
    try {
      console.log(`[TEST-COMPONENT] 🧪 Iniciando test de modal para usuario actual`);
      const shouldShow = await shouldShowPasswordModal();
      console.log(`[TEST-COMPONENT] 🎯 Resultado modal: ${shouldShow}`);
      setResult(`¿Mostrar modal de cambio de contraseña? ${shouldShow ? 'SÍ' : 'NO'}`);
    } catch (error) {
      console.error(`[TEST-COMPONENT] ❌ Error:`, error);
      setResult(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testDirectAPI = async () => {
    if (!testUsername) return;
    
    setIsLoading(true);
    setResult('Probando API directamente...');
    
    try {
      console.log(`[TEST-COMPONENT] 🧪 Probando API directamente para: ${testUsername}`);
      
      const response = await fetch('/api/usuarios/validate-ad', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: testUsername.toUpperCase() }),
      });

      console.log(`[TEST-COMPONENT] 📡 Response status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`[TEST-COMPONENT] 📋 Response data:`, data);
        setResult(`API Response: ${JSON.stringify(data, null, 2)}`);
      } else {
        const text = await response.text();
        console.error(`[TEST-COMPONENT] ❌ API Error:`, text);
        setResult(`Error API (${response.status}): ${text}`);
      }
    } catch (error) {
      console.error(`[TEST-COMPONENT] ❌ Error:`, error);
      setResult(`Error de conexión: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50 m-4">
      <h3 className="text-lg font-bold mb-4">🧪 Test Validación Active Directory</h3>
      
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <strong>Usuario actual:</strong>
        <pre className="text-xs mt-2 bg-white p-2 rounded border">
          {JSON.stringify({
            name: user?.name,
            id: user?.id,
            flagNuevoIngreso: user?.flagNuevoIngreso
          }, null, 2)}
        </pre>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Usuario a probar:
        </label>
        <input
          type="text"
          value={testUsername}
          onChange={(e) => setTestUsername(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="Ingrese nombre de usuario (ej: ADMIN, USUARIO_PRUEBA)"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
        <button
          onClick={testADUser}
          disabled={isLoading || !testUsername}
          className="px-4 py-2 bg-blue-500 text-white rounded-md disabled:bg-gray-300"
        >
          {isLoading ? 'Probando...' : 'Test Hook AD'}
        </button>
        
        <button
          onClick={testDirectAPI}
          disabled={isLoading || !testUsername}
          className="px-4 py-2 bg-purple-500 text-white rounded-md disabled:bg-gray-300"
        >
          {isLoading ? 'Probando...' : 'Test API Directa'}
        </button>
        
        <button
          onClick={testPasswordModal}
          disabled={isLoading}
          className="px-4 py-2 bg-green-500 text-white rounded-md disabled:bg-gray-300"
        >
          {isLoading ? 'Probando...' : 'Test Modal'}
        </button>
      </div>

      {result && (
        <div className="p-3 bg-white border rounded-md">
          <strong>Resultado:</strong>
          <pre className="text-xs mt-2 whitespace-pre-wrap">{result}</pre>
        </div>
      )}
      
      <div className="mt-4 text-xs text-gray-600">
        💡 <strong>Tip:</strong> Abre la consola del navegador (F12) para ver logs detallados
      </div>
    </div>
  );
};

export default TestADValidation;