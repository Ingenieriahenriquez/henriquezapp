import { useEffect, useRef, useState } from "react";
import { supabase } from "./supabaseClient";

// Mapea nombres de campo camelCase (los que usa la app) a snake_case (los que
// usa la base de datos). Los campos que no aparecen aquí se guardan tal cual.
const CAMEL_TO_SNAKE = {
  clienteId: "cliente_id",
  clienteNombre: "cliente_nombre",
  marcaModelo: "marca_modelo",
  userId: "user_id",
  esAdmin: "es_admin",
  tipoComprobante: "tipo_comprobante",
  ncfManual: "ncf_manual",
  aplicaItbis: "aplicaitbis",
  montoApertura: "monto_apertura",
  montoCierre: "monto_cierre",
  montoEsperado: "monto_esperado",
  usuarioEmail: "usuario_email",
  sesionId: "sesion_id",
  fechaHora: "fecha_hora",
  facturaId: "factura_id",
  creadoEn: "creado_en",
  facturaSuplidor: "factura_suplidor",
  cuentaId: "cuenta_id",
  saldoInicial: "saldo_inicial",
  esPredeterminada: "es_predeterminada",
  cuentaDestinoId: "cuenta_destino_id",
  esAutomatico: "es_automatico",
  ultimos4: "ultimos4",
  plantillaId: "plantilla_id",
};
const SNAKE_TO_CAMEL = Object.fromEntries(
  Object.entries(CAMEL_TO_SNAKE).map(([camel, snake]) => [snake, camel])
);

function toDbRow(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    out[CAMEL_TO_SNAKE[k] || k] = v;
  }
  return out;
}

function fromDbRow(row) {
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    out[SNAKE_TO_CAMEL[k] || k] = v;
  }
  return out;
}

/**
 * Hook de reemplazo para useStoredState. Se comporta igual desde afuera
 * ([datos, setDatos]) pero en vez de guardar en window.storage, guarda en
 * la tabla de Supabase indicada. Cada vez que el componente hace
 * setDatos(nuevoArreglo), este hook compara contra el estado anterior y:
 *  - si un registro es nuevo (id no existía antes) -> lo inserta
 *  - si un registro cambió -> lo actualiza
 *  - si un registro desapareció -> lo borra
 */
export function useSupabaseState(table) {
  const [state, setState] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const prevRef = useRef([]);

  useEffect(() => {
    let activo = true;
    (async () => {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .order("creado_en", { ascending: true });
      if (!activo) return;
      if (error) {
        console.error(`No se pudo cargar "${table}":`, error.message);
      } else {
        const mapeado = (data || []).map(fromDbRow);
        setState(mapeado);
        prevRef.current = mapeado;
      }
      setLoaded(true);
    })();
    return () => {
      activo = false;
    };
  }, [table]);

  useEffect(() => {
    if (!loaded) return;
    const prev = prevRef.current;
    const prevById = Object.fromEntries(prev.map((r) => [r.id, r]));
    const nextIds = new Set(state.map((r) => r.id));

    (async () => {
      for (const row of state) {
        const antes = prevById[row.id];
        if (!antes) {
          const { error } = await supabase.from(table).insert(toDbRow(row));
          if (error) {
            console.error(`Error creando en "${table}":`, error.message);
            alert(`No se pudo guardar en "${table}": ${error.message}\n\nEs posible que falte una columna en la base de datos. Avisa a soporte con este mensaje.`);
          }
        } else if (JSON.stringify(antes) !== JSON.stringify(row)) {
          const dbRow = toDbRow(row);
          delete dbRow.id;
          const { error } = await supabase.from(table).update(dbRow).eq("id", row.id);
          if (error) {
            console.error(`Error actualizando "${table}":`, error.message);
            alert(`No se pudo actualizar en "${table}": ${error.message}\n\nEs posible que falte una columna en la base de datos. Avisa a soporte con este mensaje.`);
          }
        }
      }
      for (const antes of prev) {
        if (!nextIds.has(antes.id)) {
          const { error } = await supabase.from(table).delete().eq("id", antes.id);
          if (error) {
            console.error(`Error eliminando de "${table}":`, error.message);
            alert(`No se pudo eliminar de "${table}": ${error.message}`);
          }
        }
      }
      prevRef.current = state;
    })();
  }, [state, loaded, table]);

  return [state, setState];
}
