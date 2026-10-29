import { createClient } from "@supabase/supabase-js";

// Credenciales desde variables de entorno de Vite (.env)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const DEFAULT_ADMIN_PIN = import.meta.env.VITE_ADMIN_PIN || "castillo2026";

// Determinar si Supabase está configurado con valores reales
export function isSupabaseConfigured() {
  return (
    typeof supabaseUrl === "string" &&
    supabaseUrl.startsWith("https://") &&
    !supabaseUrl.includes("tu-proyecto") &&
    typeof supabaseAnonKey === "string" &&
    supabaseAnonKey.length > 20 &&
    !supabaseAnonKey.includes("tu-anon-key")
  );
}

// Instancia del cliente de Supabase (o null si aún no está configurado)
export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * -------------------------------------------------------------
 * GESTIÓN DE FIXTURE / TORNEO EN LA NUBE
 * -------------------------------------------------------------
 */

// Cargar el estado oficial del torneo desde Supabase
export async function fetchRemoteTournamentState() {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase
      .from("tournament_state")
      .select("data, updated_at")
      .eq("id", "official")
      .maybeSingle();

    if (error) {
      console.warn("Error al consultar torneo en Supabase:", error.message);
      return null;
    }

    return data?.data || null;
  } catch (err) {
    console.error("Excepción al cargar estado remoto:", err);
    return null;
  }
}

// Guardar el estado oficial del torneo en Supabase (Solo Admin)
export async function saveRemoteTournamentState(state) {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "Supabase no está configurado en .env" };
  }

  try {
    const payload = {
      id: "official",
      data: state,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from("tournament_state")
      .upsert(payload, { onConflict: "id" });

    if (error) {
      console.error("Error al guardar torneo en Supabase:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Excepción al guardar torneo:", err);
    return { success: false, error: err.message };
  }
}

/**
 * -------------------------------------------------------------
 * GESTIÓN DE PRONÓSTICOS DEL PRODE
 * -------------------------------------------------------------
 */

// Comprobar si un número de teléfono ya envió su prode
export async function checkPhoneAlreadySubmitted(phone) {
  if (!isSupabaseConfigured()) {
    // Modo local / fallback
    const local = localStorage.getItem("castillo_cup_my_prode");
    if (!local) return false;
    try {
      const parsed = JSON.parse(local);
      return parsed.phone === phone;
    } catch {
      return false;
    }
  }

  try {
    const cleanedPhone = phone.trim().replace(/\D/g, "");
    const { data, error } = await supabase
      .from("prode_submissions")
      .select("id, user_name")
      .eq("user_phone", cleanedPhone)
      .maybeSingle();

    if (error) return false;
    return Boolean(data);
  } catch {
    return false;
  }
}

// Guardar un nuevo pronóstico en Supabase
export async function saveRemoteProdeSubmission(submission) {
  const cleanedPhone = submission.phone.trim().replace(/\D/g, "");

  const payload = {
    user_name: submission.name.trim(),
    user_phone: cleanedPhone,
    predictions: submission.predictions,
    created_at: new Date().toISOString()
  };

  // Guardar siempre una copia local de respaldo en el dispositivo del usuario
  try {
    localStorage.setItem("castillo_cup_my_prode", JSON.stringify({
      name: payload.user_name,
      phone: payload.user_phone,
      predictions: payload.predictions,
      submittedAt: payload.created_at
    }));
  } catch (e) {
    // ignore
  }

  if (!isSupabaseConfigured()) {
    return {
      success: true,
      isLocalFallback: true,
      message: "Guardado localmente (Supabase aún no configurado)."
    };
  }

  try {
    // Verificar si ya existe este teléfono
    const { data: existing } = await supabase
      .from("prode_submissions")
      .select("id")
      .eq("user_phone", cleanedPhone)
      .maybeSingle();

    if (existing) {
      return {
        success: false,
        error: "Este número de WhatsApp ya tiene una jugada registrada oficial."
      };
    }

    const { error } = await supabase
      .from("prode_submissions")
      .insert([payload]);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Obtener todas las jugadas del Prode para calcular la tabla de posiciones (o verlas en el admin)
export async function fetchAllProdeSubmissions() {
  if (!isSupabaseConfigured()) {
    // Si no está Supabase, retornar el prode local si existe
    const local = localStorage.getItem("castillo_cup_my_prode");
    if (local) {
      try {
        const parsed = JSON.parse(local);
        return [{
          id: "local-user",
          user_name: parsed.name,
          user_phone: parsed.phone,
          predictions: parsed.predictions,
          created_at: parsed.submittedAt || new Date().toISOString()
        }];
      } catch {
        return [];
      }
    }
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("prode_submissions")
      .select("id, user_name, user_phone, predictions, created_at")
      .order("created_at", { ascending: true });

    if (error) {
      console.warn("Error al cargar prode submissions:", error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("Excepción al cargar prode:", err);
    return [];
  }
}

// Borrar todas las jugadas del Prode (Para dejar la base en blanco antes de producción)
export async function clearAllRemoteProdeSubmissions() {
  if (!isSupabaseConfigured()) return { success: true };
  try {
    const { error } = await supabase
      .from("prode_submissions")
      .delete()
      .neq("user_name", "___non_existent___");

    if (error) {
      console.error("Error al limpiar prode_submissions:", error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Borrar o reiniciar el torneo en Supabase (Dejar en blanco antes del sorteo oficial)
export async function clearRemoteTournamentState() {
  if (!isSupabaseConfigured()) return { success: true };
  try {
    const { error } = await supabase
      .from("tournament_state")
      .delete()
      .eq("id", "official");

    if (error) {
      console.error("Error al borrar tournament_state:", error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

