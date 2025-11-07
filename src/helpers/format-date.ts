export const formatDate = (dateString?: string | null): string => {
    if (!dateString) return "N/A";
  
    const [datePart, timePart] = dateString.split("T");
    if (!datePart || !timePart) return "N/A";
  
    const [year, month, day] = datePart.split("-");
    const [hour, minute] = timePart.split(":");
  
    return `${day}/${month}/${year.slice(2)} ${hour}:${minute}`;
  };


  export const formatDateForm = (dateString?: string | null): string => {
    if (!dateString) return ""; // Maneja valores nulos o indefinidos
  
    const [datePart, timePart] = dateString.split("T");
    if (!datePart || !timePart) return ""; // Maneja valores inválidos
  
    const [year, month, day] = datePart.split("-");
    const [hour, minute] = timePart.split(":");
  
    // Devuelve el formato correcto para datetime-local
    return `${year}-${month}-${day}T${hour}:${minute}`;
  };


  export const formatDateToUTC = (dateString?: string | null): string => {
    if (!dateString) return ""; // Maneja valores nulos o indefinidos
  
    // Divide la cadena de fecha en partes
    const [datePart, timePart] = dateString.split("T");
    if (!datePart || !timePart) return ""; // Maneja valores inválidos
  
    const [year, month, day] = datePart.split("-");
    const [hour, minute] = timePart.split(":");
  
    // Reconstruye la fecha en formato ISO con "Z" indicando UTC
    return `${year}-${month}-${day}T${hour}:${minute}:00.000Z`;
  };
