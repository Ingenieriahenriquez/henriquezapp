import React, { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { Users, FileText, ClipboardList, Package, LayoutDashboard, Plus, X, Check, AlertTriangle, Search, Wallet, Clock, ShieldAlert, Wrench, ShoppingCart, Edit2, ArrowRight, Hammer, MapPin, Printer, MessageCircle, BarChart3, UserCog, Barcode, Coins, LineChart, Banknote, Settings, Headphones, Download } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { useSupabaseState } from "./useSupabaseState";
import { supabase } from "./supabaseClient";
import JsBarcode from "jsbarcode";
import QRCode from "qrcode";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const ITBIS = 0.18;
const BUSINESS = { nombre: "Ingeniería y Tecnología Henríquez", direccion: "Reparto Oquet, Santiago de los Caballeros, R.D.", telefono: "849-393-6337" };
const uid = () => crypto.randomUUID();
const money = (n) => "RD$ " + Number(n || 0).toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const moneyShort = (n) => {
  const v = Number(n || 0);
  if (v >= 1000) return (v / 1000).toFixed(1) + "k";
  return v.toFixed(0);
};

function formatTelDO(tel) {
  if (!tel) return null;
  const digits = tel.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 10) return "1" + digits;
  if (digits.length === 11 && digits.startsWith("1")) return digits;
  return digits;
}

function enviarWhatsApp(telefono, mensaje) {
  const tel = formatTelDO(telefono);
  if (!tel) {
    alert("Este cliente no tiene un número de teléfono registrado.");
    return;
  }
  window.open(`https://wa.me/${tel}?text=${encodeURIComponent(mensaje)}`, "_blank");
}

function pastDate(daysAgo) {
  const d = new Date("2026-08-19");
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function formatearFechaHora(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleString("es-DO", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
}

function nombreUsuario(email) {
  if (!email) return "";
  if (email.toLowerCase() === "ingenieriaytecnologiahenriquez@gmail.com") return "Ing. Henríquez";
  const usuario = email.split("@")[0] || email;
  return usuario.charAt(0).toUpperCase() + usuario.slice(1);
}

const seedClientes = [
  { id: uid(), nombre: "Carlos Peña", negocio: "Gimnasio Fuerza Total", rnc: "1-31-45678-9", telefono: "829-555-0142", correo: "carlos@fuerzatotal.do", direccion: "Av. 27 de Febrero, Santiago", nota: "Cliente de instalación de cámaras + control de acceso." },
  { id: uid(), nombre: "Yolanda Reyes", negocio: "Clínica Dental Reyes", rnc: "1-30-98212-3", telefono: "849-555-8890", correo: "info@clinicareyes.do", direccion: "Los Jardines, Santiago", nota: "Interesada en sistema de citas a medida." },
  { id: uid(), nombre: "Julio Henríquez", negocio: "", rnc: "", telefono: "809-555-2231", correo: "", direccion: "Reparto Oquet, Santiago", nota: "" },
  { id: uid(), nombre: "Marisol Tejada", negocio: "Laboratorio Clínico Tejada", rnc: "1-29-77451-2", telefono: "829-555-3321", correo: "marisol@labtejada.do", direccion: "Bella Vista, Santiago", nota: "Sistema a medida para gestión de muestras." },
];

const seedProductos = [
  { id: uid(), nombre: "Cámara IP 4MP", categoria: "Cámaras", costo: 1800, precio: 2900, stock: 14, minimo: 5 },
  { id: uid(), nombre: "DVR 8 canales", categoria: "Cámaras", costo: 4200, precio: 6500, stock: 4, minimo: 3 },
  { id: uid(), nombre: "Control de acceso biométrico", categoria: "Acceso", costo: 5200, precio: 8200, stock: 6, minimo: 2 },
  { id: uid(), nombre: "Motor corredera 1/2 HP", categoria: "Motores", costo: 7800, precio: 11500, stock: 2, minimo: 3 },
  { id: uid(), nombre: "Kit cerco eléctrico 60m", categoria: "Cerco eléctrico", costo: 6100, precio: 9800, stock: 5, minimo: 2 },
  { id: uid(), nombre: "Panel solar 450W", categoria: "Solar", costo: 9500, precio: 14200, stock: 18, minimo: 6 },
  { id: uid(), nombre: "Inversor híbrido 5kW", categoria: "Solar", costo: 32000, precio: 46000, stock: 3, minimo: 2 },
];

const seedFacturas = [
  { id: uid(), ncf: "B0200000038", clienteId: null, clienteNombre: "Marisol Tejada", fecha: pastDate(6), items: [{ nombre: "Desarrollo software - módulo muestras", cantidad: 1, precio: 28000 }], metodo: "Transferencia", estado: "Pagada", abono: 0 },
  { id: uid(), ncf: "B0200000039", clienteId: null, clienteNombre: "Julio Henríquez", fecha: pastDate(5), items: [{ nombre: "Panel solar 450W", cantidad: 6, precio: 14200 }], metodo: "Transferencia", estado: "Pagada", abono: 0 },
  { id: uid(), ncf: "B0200000040", clienteId: null, clienteNombre: "Carlos Peña", fecha: pastDate(4), items: [{ nombre: "Control de acceso biométrico", cantidad: 2, precio: 8200 }], metodo: "Tarjeta", estado: "Pagada", abono: 0 },
  { id: uid(), ncf: "B0200000041", clienteId: null, clienteNombre: "Carlos Peña", fecha: pastDate(3), items: [{ nombre: "Cámara IP 4MP", cantidad: 4, precio: 2900 }], metodo: "Transferencia", estado: "Pagada", abono: 0 },
  { id: uid(), ncf: "B0200000042", clienteId: null, clienteNombre: "Yolanda Reyes", fecha: pastDate(2), items: [{ nombre: "Desarrollo software - módulo citas", cantidad: 1, precio: 35000 }], metodo: "Efectivo", estado: "Abonada", abono: 15000 },
  { id: uid(), ncf: "B0200000043", clienteId: null, clienteNombre: "Julio Henríquez", fecha: pastDate(1), items: [{ nombre: "Kit cerco eléctrico 60m", cantidad: 1, precio: 9800 }], metodo: "Efectivo", estado: "Pagada", abono: 0 },
  { id: uid(), ncf: "B0200000044", clienteId: null, clienteNombre: "Marisol Tejada", fecha: pastDate(0), items: [{ nombre: "Motor corredera 1/2 HP", cantidad: 1, precio: 11500 }], metodo: "Tarjeta", estado: "Pagada", abono: 0 },
];

const seedCotizaciones = [
  { id: uid(), numero: "COT-0198", clienteNombre: "Julio Henríquez", fecha: pastDate(1), items: [{ nombre: "Kit cerco eléctrico 60m", cantidad: 1, precio: 9800 }], estado: "Pendiente" },
  { id: uid(), numero: "COT-0199", clienteNombre: "Marisol Tejada", fecha: pastDate(0), items: [{ nombre: "Inversor híbrido 5kW", cantidad: 1, precio: 46000 }], estado: "Pendiente" },
];

const seedRecepciones = [
  { id: uid(), numero: "REC-0031", clienteNombre: "Carlos Peña", tipo: "DVR 8 canales", marcaModelo: "Hikvision DS-7208", serie: "HK220317", accesorios: "Fuente de poder, control remoto", falla: "No graba en 2 de los 8 canales", tecnico: "José Manuel", estado: "En diagnóstico", fecha: pastDate(1) },
  { id: uid(), numero: "REC-0032", clienteNombre: "Yolanda Reyes", tipo: "Laptop", marcaModelo: "Dell Latitude 5420", serie: "DL5420-991", accesorios: "Cargador", falla: "No enciende, posible falla de tarjeta madre", tecnico: "Ramón A.", estado: "Esperando repuesto", fecha: pastDate(3) },
];

const TIPOS_TRABAJO = ["Instalación de cámaras", "Instalación de control de acceso", "Instalación de motor/corredera", "Instalación de cerco eléctrico", "Instalación de paneles solares", "Desarrollo de software", "Soporte técnico"];
const ESTADOS_ORDEN = ["Agendada", "En proceso", "Esperando materiales", "Completada", "Facturada"];

const seedOrdenes = [
  { id: uid(), numero: "OT-0071", clienteNombre: "Marisol Tejada", tipo: "Instalación de paneles solares", direccion: "Bella Vista, Santiago", descripcion: "Instalación de 6 paneles + inversor híbrido en techo del laboratorio.", tecnico: "Ramón A.", estado: "En proceso", fecha: pastDate(2) },
  { id: uid(), numero: "OT-0072", clienteNombre: "Carlos Peña", tipo: "Instalación de control de acceso", direccion: "Av. 27 de Febrero, Santiago", descripcion: "Instalación de biométrico en entrada principal del gimnasio.", tecnico: "José Manuel", estado: "Agendada", fecha: pastDate(0) },
];

// El almacenamiento ahora vive en Supabase — ver useSupabaseState.js

const NAV = [
  { id: "dashboard", label: "Inicio", icon: LayoutDashboard },
  { id: "clientes", label: "Clientes", icon: Users },
  { id: "facturacion", label: "Facturación", icon: FileText },
  { id: "cotizaciones", label: "Cotizaciones", icon: ClipboardList },
  { id: "recepcion", label: "Recepción equipos", icon: Wrench },
  { id: "ordenes", label: "Órdenes de trabajo", icon: Hammer },
  { id: "inventario", label: "Inventario", icon: Package },
  { id: "reportes", label: "Reportes", icon: BarChart3 },
  { id: "usuarios", label: "Usuarios", icon: UserCog },
  { id: "codigobarras", label: "Código de barras · Consulta", icon: Barcode },
  { id: "abonos", label: "Abonos", icon: Coins },
  { id: "graficas", label: "Gráficas", icon: LineChart },
  { id: "caja", label: "Caja", icon: Banknote },
  { id: "ajustes", label: "Ajustes", icon: Settings },
  { id: "chatsoporte", label: "Chat soporte", icon: Headphones },
];

// Pantalla simple para módulos que todavía no tienen funcionalidad real
function Proximamente({ titulo }) {
  return (
    <div>
      <div className="hw-header">
        <div><div className="hw-title">{titulo}</div><div className="hw-sub">Este módulo está en construcción</div></div>
      </div>
      <div className="hw-panel" style={{ padding: "48px 24px", textAlign: "center", color: "var(--muted)" }}>
        <div style={{ fontSize: 15 }}>"{titulo}" estará disponible próximamente.</div>
        <div style={{ fontSize: 13, marginTop: 6 }}>Este acceso ya está listo en el menú — solo falta construir la funcionalidad.</div>
      </div>
    </div>
  );
}

function CodigoBarras({ productos }) {
  const [texto, setTexto] = useState("");
  const [resultado, setResultado] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [noEncontrado, setNoEncontrado] = useState(false);
  const [etiquetaProducto, setEtiquetaProducto] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  function buscar(e) {
    if (e.key !== "Enter") return;
    const q = texto.trim().toLowerCase();
    if (!q) return;
    const exacto = productos.find((p) => p.codigo?.toLowerCase() === q);
    const porNombre = !exacto ? productos.find((p) => p.nombre?.toLowerCase().includes(q)) : null;
    const encontrado = exacto || porNombre;
    if (encontrado) {
      setResultado(encontrado);
      setNoEncontrado(false);
      setHistorial((prev) => [encontrado, ...prev.filter((p) => p.id !== encontrado.id)].slice(0, 8));
    } else {
      setResultado(null);
      setNoEncontrado(true);
    }
    setTexto("");
  }

  return (
    <div>
      <div className="hw-header">
        <div><div className="hw-title">Código de barras</div><div className="hw-sub">Escanea o escribe un código o nombre para consultar el producto</div></div>
      </div>

      <div className="hw-panel" style={{ padding: 20, marginBottom: 16 }}>
        <input ref={inputRef} className="hw-input" style={{ fontSize: 17, padding: "13px 16px" }} placeholder="Escanea aquí con el lector, o escribe y presiona Enter..." value={texto} onChange={(e) => setTexto(e.target.value)} onKeyDown={buscar} />
      </div>

      {noEncontrado && (
        <div className="hw-panel" style={{ padding: 20, textAlign: "center", color: "var(--red)", marginBottom: 16 }}>
          No se encontró ningún producto con ese código o nombre.
        </div>
      )}

      {resultado && (
        <div className="hw-panel" style={{ padding: 24, marginBottom: 16 }}>
          <div style={{ fontSize: 21, fontWeight: 700 }}>{resultado.nombre}</div>
          <div style={{ color: "var(--muted)", fontFamily: "'IBM Plex Mono',monospace", marginBottom: 14 }}>{resultado.codigo || "Sin código asignado"}</div>
          <div className="hw-grid">
            <div className="hw-card"><div className="hw-kpi-label">Categoría</div><div className="hw-kpi-value" style={{ fontSize: 16 }}>{resultado.categoria || "—"}</div></div>
            <div className="hw-card"><div className="hw-kpi-label">Precio</div><div className="hw-kpi-value">{money(resultado.precio)}</div></div>
            <div className="hw-card"><div className="hw-kpi-label">Costo</div><div className="hw-kpi-value">{money(resultado.costo)}</div></div>
            <div className="hw-card"><div className="hw-kpi-label">Stock</div><div className="hw-kpi-value" style={{ color: resultado.stock <= resultado.minimo ? "var(--red)" : undefined }}>{resultado.stock}</div></div>
          </div>
          <button className="hw-btn ghost small" style={{ marginTop: 14 }} onClick={() => setEtiquetaProducto(resultado)}><Printer size={13} /> Imprimir etiqueta (Zebra)</button>
        </div>
      )}

      <EtiquetaPreview producto={etiquetaProducto} onClose={() => setEtiquetaProducto(null)} />

      {historial.length > 0 && (
        <div className="hw-panel">
          <div style={{ padding: "14px 16px", fontWeight: 600 }}>Consultados recientemente</div>
          <table className="hw-table hw-t-scanhist">
            <thead><tr><th>Producto</th><th>Código</th><th>Precio</th><th>Stock</th></tr></thead>
            <tbody>
              {historial.map((p) => (
                <tr key={p.id} style={{ cursor: "pointer" }} onClick={() => setResultado(p)}>
                  <td>{p.nombre}</td><td className="hw-mono">{p.codigo || "—"}</td><td>{money(p.precio)}</td><td>{p.stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ChatSoporte({ negocio }) {
  const [mensaje, setMensaje] = useState("");

  function enviar() {
    const texto = mensaje.trim() || "Hola, tengo una consulta sobre el sistema de facturación.";
    enviarWhatsApp("849-393-6337", texto);
  }

  return (
    <div>
      <div className="hw-header">
        <div><div className="hw-title">Chat soporte</div><div className="hw-sub">¿Tienes algún problema usando el sistema? Escríbenos directo por WhatsApp</div></div>
      </div>
      <div className="hw-panel" style={{ padding: 24, maxWidth: 420 }}>
        <div style={{ fontWeight: 700, fontSize: 17 }}>{negocio.nombre}</div>
        <div style={{ color: "var(--muted)", marginBottom: 14 }}>Ing. Henríquez · 849-393-6337</div>
        <FieldRow label="Cuéntanos qué pasó (opcional)">
          <textarea className="hw-input" rows={3} value={mensaje} onChange={(e) => setMensaje(e.target.value)} placeholder="Ej. no me deja guardar una factura..." style={{ resize: "vertical" }} />
        </FieldRow>
        <button className="hw-btn soft-green" style={{ width: "100%", justifyContent: "center", marginTop: 10 }} onClick={enviar}><MessageCircle size={15} /> Escribir por WhatsApp</button>
      </div>
    </div>
  );
}

function Reportes({ facturas, abonosPagos }) {
  const hoy = new Date().toISOString().slice(0, 10);
  const hace30 = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const [desde, setDesde] = useState(hace30);
  const [hasta, setHasta] = useState(hoy);

  const enRango = useMemo(
    () => facturas.filter((f) => f.estado !== "Anulada" && f.fecha >= desde && f.fecha <= hasta),
    [facturas, desde, hasta]
  );

  const totalFacturado = enRango.reduce((s, f) => s + calcTotal(f.items, f.aplicaItbis).total, 0);
  const cantFacturas = enRango.length;
  const promedio = cantFacturas ? totalFacturado / cantFacturas : 0;

  const totalCobrado = enRango.reduce((s, f) => {
    const total = calcTotal(f.items, f.aplicaItbis).total;
    if (f.estado === "Pendiente") {
      const pagado = abonosPagos.filter((a) => a.facturaId === f.id).reduce((s2, a) => s2 + Number(a.monto), 0);
      return s + Math.min(pagado, total);
    }
    return s + total;
  }, 0);

  const topClientes = useMemo(() => {
    const porCliente = {};
    enRango.forEach((f) => {
      const t = calcTotal(f.items, f.aplicaItbis).total;
      porCliente[f.clienteNombre] = (porCliente[f.clienteNombre] || 0) + t;
    });
    return Object.entries(porCliente).map(([nombre, total]) => ({ nombre, total })).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [enRango]);

  const pendientesCobro = useMemo(() => {
    return facturas.filter((f) => f.estado !== "Anulada").map((f) => {
      const total = calcTotal(f.items, f.aplicaItbis).total;
      const pagado = abonosPagos.filter((a) => a.facturaId === f.id).reduce((s, a) => s + Number(a.monto), 0);
      return { ...f, total, pagado, pendiente: total - pagado };
    }).filter((f) => f.pendiente > 0.009).sort((a, b) => b.pendiente - a.pendiente);
  }, [facturas, abonosPagos]);

  return (
    <div>
      <div className="hw-header">
        <div><div className="hw-title">Reportes</div><div className="hw-sub">Resumen de ventas, clientes y cobros pendientes</div></div>
      </div>

      <div className="hw-panel" style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <FieldRow label="Desde"><input className="hw-input" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} /></FieldRow>
          <FieldRow label="Hasta"><input className="hw-input" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} /></FieldRow>
        </div>
      </div>

      <div className="hw-grid" style={{ marginBottom: 16 }}>
        <div className="hw-card">
          <div className="hw-kpi-top"><div className="hw-kpi-icon" style={{ background: "var(--accent-soft)" }}><FileText size={17} color="var(--accent2)" /></div></div>
          <div className="hw-kpi-label">Facturas en el período</div>
          <div className="hw-kpi-value">{cantFacturas}</div>
        </div>
        <div className="hw-card">
          <div className="hw-kpi-top"><div className="hw-kpi-icon" style={{ background: "var(--green-soft)" }}><Wallet size={17} color="var(--green)" /></div></div>
          <div className="hw-kpi-label">Total facturado</div>
          <div className="hw-kpi-value" style={{ color: "var(--green)" }}>{money(totalFacturado)}</div>
        </div>
        <div className="hw-card">
          <div className="hw-kpi-top"><div className="hw-kpi-icon" style={{ background: "var(--blue-soft)" }}><Coins size={17} color="var(--blue)" /></div></div>
          <div className="hw-kpi-label">Total cobrado</div>
          <div className="hw-kpi-value">{money(totalCobrado)}</div>
        </div>
        <div className="hw-card">
          <div className="hw-kpi-top"><div className="hw-kpi-icon" style={{ background: "var(--red-soft)" }}><BarChart3 size={17} color="var(--red)" /></div></div>
          <div className="hw-kpi-label">Promedio por factura</div>
          <div className="hw-kpi-value">{money(promedio)}</div>
        </div>
      </div>

      <div className="hw-panel" style={{ marginBottom: 16 }}>
        <div style={{ padding: "14px 16px", fontWeight: 600 }}>Top clientes del período</div>
        <table className="hw-table hw-t-topclientes">
          <thead><tr><th>Cliente</th><th>Total comprado</th></tr></thead>
          <tbody>
            {topClientes.map((c, i) => (<tr key={i}><td>{c.nombre}</td><td>{money(c.total)}</td></tr>))}
            {topClientes.length === 0 && <tr><td colSpan={2} className="hw-empty">Sin facturas en este período</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="hw-panel">
        <div style={{ padding: "14px 16px", fontWeight: 600 }}>Facturas pendientes de cobro (todas, no solo el período)</div>
        <table className="hw-table hw-t-abonospend">
          <thead><tr><th>NCF</th><th>Cliente</th><th>Total</th><th>Pagado</th><th>Pendiente</th></tr></thead>
          <tbody>
            {pendientesCobro.map((f) => (
              <tr key={f.id}>
                <td className="hw-mono">{f.ncf}</td><td>{f.clienteNombre}</td><td>{money(f.total)}</td><td>{money(f.pagado)}</td>
                <td style={{ fontWeight: 600, color: "var(--red)" }}>{money(f.pendiente)}</td>
              </tr>
            ))}
            {pendientesCobro.length === 0 && <tr><td colSpan={5} className="hw-empty">No hay facturas pendientes de cobro</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Graficas({ facturas, cotizaciones, productos }) {
  const trendData = useMemo(() => {
    const byDate = {};
    facturas.filter((f) => f.estado !== "Anulada").forEach((f) => {
      const t = calcTotal(f.items, f.aplicaItbis).total;
      byDate[f.fecha] = (byDate[f.fecha] || 0) + t;
    });
    return Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b)).map(([fecha, total]) => ({
      fecha: fecha.slice(5).split("-").reverse().join("/"), total,
    }));
  }, [facturas]);

  const catData = useMemo(() => {
    const byCat = {};
    facturas.filter((f) => f.estado !== "Anulada").forEach((f) => f.items.forEach((it) => {
      const cat = categoriaDe(it.nombre, productos);
      byCat[cat] = (byCat[cat] || 0) + it.cantidad * it.precio;
    }));
    return Object.entries(byCat).map(([categoria, total]) => ({ categoria, total })).sort((a, b) => b.total - a.total);
  }, [facturas, productos]);

  const topProductos = useMemo(() => {
    const byNombre = {};
    facturas.filter((f) => f.estado !== "Anulada").forEach((f) => f.items.forEach((it) => {
      byNombre[it.nombre] = (byNombre[it.nombre] || 0) + it.cantidad;
    }));
    return Object.entries(byNombre).map(([nombre, cantidad]) => ({ nombre, cantidad })).sort((a, b) => b.cantidad - a.cantidad).slice(0, 5);
  }, [facturas]);

  const cotizData = useMemo(() => {
    const conteo = { Pendiente: 0, Aprobada: 0, Rechazada: 0 };
    cotizaciones.forEach((c) => { conteo[c.estado] = (conteo[c.estado] || 0) + 1; });
    return Object.entries(conteo).map(([estado, cantidad]) => ({ estado, cantidad }));
  }, [cotizaciones]);

  return (
    <div>
      <div className="hw-header">
        <div><div className="hw-title">Gráficas</div><div className="hw-sub">Ventas, categorías y cotizaciones de un vistazo</div></div>
      </div>

      <div className="hw-panel" style={{ marginBottom: 16 }}>
        <div className="hw-panel-head"><div className="hw-panel-title">Ingresos por día</div></div>
        <div style={{ padding: "14px 10px 4px" }}>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={trendData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="hwGradG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E0791C" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#E0791C" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#EDEEF2" />
              <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} tickFormatter={moneyShort} width={44} />
              <Tooltip formatter={(v) => money(v)} contentStyle={{ borderRadius: 10, border: "1px solid #E7E9EF", fontSize: 12 }} />
              <Area type="monotone" dataKey="total" stroke="#E0791C" strokeWidth={2.5} fill="url(#hwGradG)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div className="hw-panel">
          <div className="hw-panel-head"><div className="hw-panel-title">Ingresos por categoría</div></div>
          <div style={{ padding: "14px 12px 4px" }}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={catData} layout="vertical" margin={{ top: 4, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 5" horizontal={false} stroke="#EDEEF2" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} tickFormatter={moneyShort} />
                <YAxis type="category" dataKey="categoria" tick={{ fontSize: 11, fill: "#151A24" }} axisLine={false} tickLine={false} width={110} />
                <Tooltip formatter={(v) => money(v)} contentStyle={{ borderRadius: 10, border: "1px solid #E7E9EF", fontSize: 12 }} />
                <Bar dataKey="total" radius={[0, 6, 6, 0]}>
                  {catData.map((d, i) => <Cell key={i} fill={CAT_COLORS[d.categoria] || "#8B93A1"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {catData.length === 0 && <div className="hw-empty" style={{ padding: 20 }}>Sin datos todavía</div>}
          </div>
        </div>

        <div className="hw-panel">
          <div className="hw-panel-head"><div className="hw-panel-title">Top 5 productos vendidos (cantidad)</div></div>
          <div style={{ padding: "14px 12px 4px" }}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topProductos} layout="vertical" margin={{ top: 4, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 5" horizontal={false} stroke="#EDEEF2" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="nombre" tick={{ fontSize: 11, fill: "#151A24" }} axisLine={false} tickLine={false} width={110} />
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #E7E9EF", fontSize: 12 }} />
                <Bar dataKey="cantidad" radius={[0, 6, 6, 0]} fill="#3F6FD1" />
              </BarChart>
            </ResponsiveContainer>
            {topProductos.length === 0 && <div className="hw-empty" style={{ padding: 20 }}>Sin datos todavía</div>}
          </div>
        </div>
      </div>

      <div className="hw-panel">
        <div className="hw-panel-head"><div className="hw-panel-title">Cotizaciones por estado</div></div>
        <div style={{ padding: "14px 12px 4px" }}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={cotizData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#EDEEF2" />
              <XAxis dataKey="estado" tick={{ fontSize: 12, fill: "#151A24" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #E7E9EF", fontSize: 12 }} />
              <Bar dataKey="cantidad" radius={[6, 6, 0, 0]}>
                {cotizData.map((d, i) => <Cell key={i} fill={d.estado === "Aprobada" ? "#2F9E67" : d.estado === "Rechazada" ? "#C24F3A" : "#E0952E"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function Abonos({ facturas, setFacturas, abonosPagos, setAbonosPagos }) {
  const [facturaId, setFacturaId] = useState("");
  const [monto, setMonto] = useState("");
  const [metodo, setMetodo] = useState("Efectivo");
  const [nota, setNota] = useState("");

  const pendientes = facturas
    .filter((f) => f.estado !== "Anulada")
    .map((f) => {
      const total = calcTotal(f.items, f.aplicaItbis).total;
      const pagado = abonosPagos.filter((a) => a.facturaId === f.id).reduce((s, a) => s + Number(a.monto), 0);
      return { ...f, total, pagado, pendiente: total - pagado };
    })
    .filter((f) => f.pendiente > 0.009);

  function registrarAbono() {
    const f = pendientes.find((f) => f.id === facturaId);
    if (!f || !monto) return;
    const nuevoAbono = { id: uid(), facturaId: f.id, monto: Number(monto), fecha: new Date().toISOString().slice(0, 10), metodo, nota };
    setAbonosPagos([...abonosPagos, nuevoAbono]);
    if (f.pagado + Number(monto) >= f.total - 0.01) {
      setFacturas(facturas.map((x) => (x.id === f.id ? { ...x, estado: "Pagada" } : x)));
    }
    setFacturaId("");
    setMonto("");
    setNota("");
  }

  return (
    <div>
      <div className="hw-header">
        <div><div className="hw-title">Abonos</div><div className="hw-sub">Pagos parciales a facturas a crédito</div></div>
      </div>

      <div className="hw-panel" style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 10 }}>Registrar abono</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <select className="hw-select" value={facturaId} onChange={(e) => setFacturaId(e.target.value)} style={{ flex: 1, minWidth: 220 }}>
            <option value="">Selecciona una factura pendiente...</option>
            {pendientes.map((f) => <option key={f.id} value={f.id}>{f.ncf} · {f.clienteNombre} · Pendiente: {money(f.pendiente)}</option>)}
          </select>
          <input className="hw-input" type="number" placeholder="Monto" value={monto} onChange={(e) => setMonto(e.target.value)} style={{ maxWidth: 130 }} />
          <select className="hw-select" value={metodo} onChange={(e) => setMetodo(e.target.value)} style={{ maxWidth: 150 }}>
            <option>Efectivo</option><option>Transferencia</option><option>Tarjeta</option>
          </select>
          <input className="hw-input" placeholder="Nota (opcional)" value={nota} onChange={(e) => setNota(e.target.value)} style={{ flex: 1, minWidth: 140 }} />
          <button className="hw-btn" onClick={registrarAbono}><Plus size={14} /> Registrar</button>
        </div>
      </div>

      <div className="hw-panel" style={{ marginBottom: 16 }}>
        <table className="hw-table hw-t-abonospend">
          <thead><tr><th>NCF</th><th>Cliente</th><th>Total</th><th>Pagado</th><th>Pendiente</th></tr></thead>
          <tbody>
            {pendientes.map((f) => (
              <tr key={f.id}>
                <td className="hw-mono">{f.ncf}</td><td>{f.clienteNombre}</td><td>{money(f.total)}</td><td>{money(f.pagado)}</td>
                <td style={{ fontWeight: 600, color: "var(--red)" }}>{money(f.pendiente)}</td>
              </tr>
            ))}
            {pendientes.length === 0 && <tr><td colSpan={5} className="hw-empty">No hay facturas con saldo pendiente</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="hw-panel">
        <div style={{ padding: "14px 16px", fontWeight: 600 }}>Historial de abonos</div>
        <table className="hw-table hw-t-abonoshist">
          <thead><tr><th>Fecha</th><th>Factura</th><th>Monto</th><th>Método</th><th>Nota</th></tr></thead>
          <tbody>
            {abonosPagos.slice().reverse().map((a) => {
              const f = facturas.find((f) => f.id === a.facturaId);
              return (
                <tr key={a.id}>
                  <td>{a.fecha}</td><td className="hw-mono">{f?.ncf || "—"}</td><td>{money(a.monto)}</td><td>{a.metodo}</td><td>{a.nota}</td>
                </tr>
              );
            })}
            {abonosPagos.length === 0 && <tr><td colSpan={5} className="hw-empty">Sin abonos registrados todavía</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Ajustes({ negocioConfig, setNegocioConfig, esAdmin }) {
  const actual = negocioConfig[0] || BUSINESS;
  const [form, setForm] = useState({ nombre: actual.nombre || "", eslogan: actual.eslogan || "", direccion: actual.direccion || "", telefono: actual.telefono || "", rnc: actual.rnc || "" });
  const [guardado, setGuardado] = useState(false);
  const cargadoRef = useRef(false);

  useEffect(() => {
    if (negocioConfig[0] && !cargadoRef.current) {
      const n = negocioConfig[0];
      setForm({ nombre: n.nombre || "", eslogan: n.eslogan || "", direccion: n.direccion || "", telefono: n.telefono || "", rnc: n.rnc || "" });
      cargadoRef.current = true;
    }
  }, [negocioConfig]);

  function guardar() {
    if (negocioConfig[0]) {
      setNegocioConfig(negocioConfig.map((n) => (n.id === negocioConfig[0].id ? { ...n, ...form } : n)));
    } else {
      setNegocioConfig([...negocioConfig, { id: uid(), ...form }]);
    }
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2500);
  }

  if (!esAdmin) {
    return (
      <div>
        <div className="hw-header"><div><div className="hw-title">Ajustes</div><div className="hw-sub">Información del negocio</div></div></div>
        <div className="hw-panel" style={{ padding: 20 }}>
          <div><b>Nombre:</b> {actual.nombre}</div>
          {actual.eslogan && <div><b>Eslogan:</b> {actual.eslogan}</div>}
          <div><b>Dirección:</b> {actual.direccion}</div>
          <div><b>Teléfono:</b> {actual.telefono}</div>
          {actual.rnc && <div><b>RNC:</b> {actual.rnc}</div>}
          <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 10 }}>Solo un administrador puede editar estos datos.</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="hw-header"><div><div className="hw-title">Ajustes</div><div className="hw-sub">Datos de tu negocio (aparecen en toda la app, facturas y cotizaciones)</div></div></div>
      <div className="hw-panel" style={{ padding: 20, maxWidth: 480 }}>
        <FieldRow label="Nombre del negocio">
          <input className="hw-input" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
        </FieldRow>
        <FieldRow label="Eslogan (opcional)">
          <input className="hw-input" placeholder="Ej. Seguridad y tecnología para tu hogar y negocio" value={form.eslogan} onChange={(e) => setForm({ ...form, eslogan: e.target.value })} />
        </FieldRow>
        <FieldRow label="Dirección">
          <input className="hw-input" value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} />
        </FieldRow>
        <FieldRow label="Teléfono / WhatsApp">
          <input className="hw-input" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
        </FieldRow>
        <FieldRow label="RNC">
          <input className="hw-input" value={form.rnc} onChange={(e) => setForm({ ...form, rnc: e.target.value })} />
        </FieldRow>
        <button className="hw-btn" style={{ width: "100%", justifyContent: "center", marginTop: 10 }} onClick={guardar}>Guardar cambios</button>
        {guardado && <div style={{ color: "var(--green)", fontSize: 13, marginTop: 8, textAlign: "center" }}>Guardado — ya se actualizó en toda la app.</div>}
      </div>
    </div>
  );
}

const MODULOS_ASIGNABLES = NAV.filter((n) => n.id !== "dashboard" && n.id !== "usuarios");

function UsuariosAdmin({ permisos, setPermisos, miEmail }) {
  const [nuevoEmail, setNuevoEmail] = useState("");
  const [nuevosModulos, setNuevosModulos] = useState([]);

  function toggleModulo(persona, moduloId) {
    const tiene = persona.modulos?.includes(moduloId);
    const modulos = tiene ? persona.modulos.filter((m) => m !== moduloId) : [...(persona.modulos || []), moduloId];
    setPermisos(permisos.map((p) => (p.id === persona.id ? { ...p, modulos } : p)));
  }

  function toggleNuevoModulo(moduloId) {
    setNuevosModulos((prev) => (prev.includes(moduloId) ? prev.filter((m) => m !== moduloId) : [...prev, moduloId]));
  }

  function agregarUsuario() {
    const correo = nuevoEmail.trim().toLowerCase();
    if (!correo) return;
    if (permisos.find((p) => p.email === correo)) { alert("Ya existe un permiso para ese correo."); return; }
    setPermisos([...permisos, { id: uid(), email: correo, esAdmin: false, modulos: nuevosModulos }]);
    setNuevoEmail("");
    setNuevosModulos([]);
  }

  function quitarUsuario(id) {
    setPermisos(permisos.filter((p) => p.id !== id));
  }

  return (
    <div>
      <div className="hw-header">
        <div><div className="hw-title">Usuarios</div><div className="hw-sub">Controla a qué módulos tiene acceso cada persona</div></div>
      </div>

      <div className="hw-panel" style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 10 }}>
          Aquí solo controlas los <b>permisos</b>. Para que alguien pueda entrar de verdad, primero crea su correo y contraseña en Supabase (Authentication → Users → Add user), con el mismo correo que escribas aquí.
        </div>
        <FieldRow label="Correo del empleado">
          <input className="hw-input" type="email" placeholder="correo@ejemplo.com" value={nuevoEmail} onChange={(e) => setNuevoEmail(e.target.value)} />
        </FieldRow>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "8px 0 12px" }}>
          {MODULOS_ASIGNABLES.map((m) => (
            <label key={m.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, background: "var(--bg2, #f3f5f8)", padding: "6px 10px", borderRadius: 8, cursor: "pointer" }}>
              <input type="checkbox" checked={nuevosModulos.includes(m.id)} onChange={() => toggleNuevoModulo(m.id)} />
              {m.label}
            </label>
          ))}
        </div>
        <button className="hw-btn" onClick={agregarUsuario}><Plus size={15} /> Agregar usuario</button>
      </div>

      <div className="hw-panel">
        <table className="hw-table hw-t-usuarios">
          <thead><tr><th>Correo</th><th>Módulos permitidos</th><th></th></tr></thead>
          <tbody>
            {permisos.map((p) => (
              <tr key={p.id}>
                <td>{p.email}{p.email === miEmail && " (tú)"}{p.esAdmin && <span className="hw-badge" style={{ marginLeft: 6 }}>Administrador</span>}</td>
                <td>
                  {p.esAdmin ? "Acceso total" : (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {MODULOS_ASIGNABLES.map((m) => (
                        <label key={m.id} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                          <input type="checkbox" checked={p.modulos?.includes(m.id) || false} onChange={() => toggleModulo(p, m.id)} />
                          {m.label}
                        </label>
                      ))}
                    </div>
                  )}
                </td>
                <td>{!p.esAdmin && <button className="hw-btn soft-red small" onClick={() => quitarUsuario(p.id)}>Quitar</button>}</td>
              </tr>
            ))}
            {permisos.length === 0 && <tr><td colSpan={3} className="hw-empty">Sin usuarios todavía</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function entrar(e) {
    e.preventDefault();
    setError("");
    setCargando(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setCargando(false);
    if (error) setError("Correo o contraseña incorrectos.");
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg, #0c1420)", padding: 16 }}>
      <form onSubmit={entrar} style={{ width: 340, maxWidth: "100%", background: "var(--panel, #121b29)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 28 }}>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 20, color: "#fff", marginBottom: 4 }}>Ingeniería y Tecnología Henríquez</div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 20 }}>Inicia sesión para continuar</div>
        <label style={{ fontSize: 12.5, color: "rgba(255,255,255,0.7)" }}>Correo</label>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.04)", color: "#fff", margin: "6px 0 14px", fontSize: 14 }} />
        <label style={{ fontSize: 12.5, color: "rgba(255,255,255,0.7)" }}>Contraseña</label>
        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.04)", color: "#fff", margin: "6px 0 6px", fontSize: 14 }} />
        {error && <div style={{ color: "#ff8080", fontSize: 12.5, marginBottom: 10 }}>{error}</div>}
        <button type="submit" disabled={cargando}
          style={{ width: "100%", marginTop: 14, padding: "11px 0", borderRadius: 10, border: "none", background: "#177A63", color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
          {cargando ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}

function Panel({ session }) {
  const [tab, setTab] = useState("dashboard");
  const [clientes, setClientes] = useSupabaseState("clientes");
  const [productos, setProductos] = useSupabaseState("productos");
  const [facturas, setFacturas] = useSupabaseState("facturas");
  const [cotizaciones, setCotizaciones] = useSupabaseState("cotizaciones");
  const [recepciones, setRecepciones] = useSupabaseState("recepciones");
  const [ordenes, setOrdenes] = useSupabaseState("ordenes");
  const [permisos, setPermisos] = useSupabaseState("permisos_usuario");
  const [cajaSesiones, setCajaSesiones] = useSupabaseState("caja_sesiones");
  const [cajaMovimientos, setCajaMovimientos] = useSupabaseState("caja_movimientos");
  const [negocioConfig, setNegocioConfig] = useSupabaseState("negocio_config");
  const [abonosPagos, setAbonosPagos] = useSupabaseState("abonos_pagos");
  const negocio = negocioConfig[0] || BUSINESS;

  const miEmail = session?.user?.email || "";
  const miPermiso = permisos.find((p) => p.email === miEmail);
  const esAdmin = !!miPermiso?.esAdmin;
  const modulosPermitidos = esAdmin
    ? NAV.map((n) => n.id)
    : ["dashboard", ...(miPermiso?.modulos || [])];
  const puedeVer = (id) => id === "dashboard" || (id === "usuarios" ? esAdmin : modulosPermitidos.includes(id));

  return (
    <div style={{ "--ink": "#151A24", "--bg": "#F3F4F8", "--panel": "#FFFFFF", "--navy": "#101827", "--navy2": "#1B2A41", "--accent": "#E0791C", "--accent2": "#C4640F", "--accent-soft": "#FDECD9", "--teal": "#0F6E84", "--teal-soft": "#DFF0F3", "--green": "#2F9E67", "--green-soft": "#E1F5EA", "--red": "#C24F3A", "--red-soft": "#FBE7E3", "--blue": "#3F6FD1", "--blue-soft": "#E5EBFB", "--purple": "#8B5FBF", "--purple-soft": "#EFE6F7", "--jade": "#177A63", "--jade-soft": "#DCF1EA", "--line": "#E7E9EF", "--muted": "#6B7280" }}
      className="hw-root">
      <style>{`
        .hw-root{font-family:'Inter',system-ui,sans-serif;color:var(--ink);background:var(--bg);height:100vh;display:flex;overflow:hidden;}
        .hw-root *{box-sizing:border-box;}
        .hw-mono{font-family:'IBM Plex Mono',monospace;}
        .hw-display{font-family:'Space Grotesk','Inter',sans-serif;}
        .hw-sidebar{width:230px;background:linear-gradient(180deg,var(--navy) 0%, var(--navy2) 100%);color:#fff;display:flex;flex-direction:column;flex-shrink:0;height:100vh;overflow-y:auto;position:sticky;top:0;}
        .hw-brand{padding:22px 20px 18px;border-bottom:1px solid rgba(255,255,255,0.08);}
        .hw-brand-name{font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:16px;line-height:1.25;}
        .hw-brand-sub{font-size:11px;color:rgba(255,255,255,0.5);margin-top:4px;letter-spacing:.04em;text-transform:uppercase;}
        .hw-nav{padding:14px 10px;display:flex;flex-direction:column;gap:3px;flex:1;}
        .hw-nav-btn{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:9px;border:none;background:transparent;color:rgba(255,255,255,0.72);font-size:13.5px;cursor:pointer;text-align:left;transition:all .18s ease;}
        .hw-nav-btn:hover{background:rgba(255,255,255,0.08);color:#fff;transform:translateX(2px);}
        .hw-nav-btn.active{background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;box-shadow:0 4px 12px rgba(224,121,28,0.35);}
        .hw-sidebar-foot{padding:16px 20px;border-top:1px solid rgba(255,255,255,0.08);font-size:11px;color:rgba(255,255,255,0.45);}
        .hw-main{flex:1;padding:28px 34px;min-width:0;height:100vh;overflow-y:auto;}
        .hw-main::-webkit-scrollbar{width:8px;}
        .hw-main::-webkit-scrollbar-thumb{background:#D7D9E0;border-radius:10px;}
        .hw-sidebar::-webkit-scrollbar{width:6px;}
        .hw-sidebar::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.15);border-radius:10px;}

        .hw-header{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:22px;}
        .hw-title{font-family:'Space Grotesk',sans-serif;font-size:22px;font-weight:600;}
        .hw-sub{color:var(--muted);font-size:13px;margin-top:2px;}
        .hw-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px;}
        .hw-card{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:16px 18px;transition:all .18s ease;box-shadow:0 1px 2px rgba(16,24,39,0.03);}
        .hw-card:hover{box-shadow:0 8px 20px rgba(16,24,39,0.08);transform:translateY(-2px);border-color:transparent;}
        .hw-kpi-top{display:flex;align-items:center;justify-content:space-between;}
        .hw-kpi-icon{width:34px;height:34px;border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .hw-kpi-label{font-size:11.5px;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;margin-top:12px;}
        .hw-kpi-value{font-family:'Space Grotesk',sans-serif;font-size:25px;font-weight:600;margin-top:4px;}
        .hw-panel{background:var(--panel);border:1px solid var(--line);border-radius:12px;overflow:hidden;box-shadow:0 1px 2px rgba(16,24,39,0.03);}
        .hw-panel-head{padding:14px 18px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;}
        .hw-panel-title{font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:14.5px;}
        table.hw-table{width:100%;border-collapse:collapse;font-size:13px;}
        .hw-table th{text-align:left;padding:10px 18px;font-size:11px;text-transform:uppercase;letter-spacing:.03em;color:var(--muted);border-bottom:1px solid var(--line);}
        .hw-table td{padding:11px 18px;border-bottom:1px solid var(--line);vertical-align:top;}
        .hw-table tr:last-child td{border-bottom:none;}
        .hw-table tbody tr{transition:background .15s ease;}
        .hw-table tbody tr:hover{background:#FAFAFC;}
        .hw-badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;}
        .hw-badge.green{background:var(--green-soft);color:var(--green);}
        .hw-badge.amber{background:var(--accent-soft);color:var(--accent2);}
        .hw-badge.red{background:var(--red-soft);color:var(--red);}
        .hw-badge.blue{background:var(--blue-soft);color:var(--blue);}
        .hw-badge.grey{background:#EEF0F3;color:var(--muted);}
        .hw-btn{display:inline-flex;align-items:center;gap:6px;background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;border:none;padding:9px 15px;border-radius:9px;font-size:13px;font-weight:600;cursor:pointer;transition:all .15s ease;box-shadow:0 2px 6px rgba(224,121,28,0.28);}
        .hw-btn:hover{box-shadow:0 5px 14px rgba(224,121,28,0.4);transform:translateY(-1px);}
        .hw-btn:active{transform:translateY(0);}
        .hw-btn.ghost{background:#fff;color:var(--ink);border:1px solid var(--line);box-shadow:none;}
        .hw-btn.ghost:hover{background:#F7F8FA;box-shadow:0 2px 6px rgba(16,24,39,0.06);}
        .hw-btn.small{padding:6px 11px;font-size:12px;border-radius:8px;}
        .hw-btn.soft-green{background:var(--green-soft);color:var(--green);box-shadow:none;}
        .hw-btn.soft-green:hover{background:#D3F0DF;box-shadow:0 3px 8px rgba(47,158,103,0.18);}
        .hw-btn.soft-red{background:var(--red-soft);color:var(--red);box-shadow:none;}
        .hw-btn.soft-red:hover{background:#F7D9D2;box-shadow:0 3px 8px rgba(194,79,58,0.18);}
        .hw-btn.soft-blue{background:var(--blue-soft);color:var(--blue);box-shadow:none;}
        .hw-btn.soft-blue:hover{background:#D6E0F8;box-shadow:0 3px 8px rgba(63,111,209,0.18);}
        .hw-btn.soft-purple{background:var(--purple-soft);color:var(--purple);box-shadow:none;}
        .hw-btn.soft-purple:hover{background:#E2D2F1;box-shadow:0 3px 8px rgba(139,95,191,0.18);}
        .hw-btn.soft-jade{background:var(--jade-soft);color:var(--jade);box-shadow:none;}
        .hw-btn.soft-jade:hover{background:#C7E8DD;box-shadow:0 3px 8px rgba(23,122,99,0.18);}
        .hw-input,.hw-select{width:100%;padding:8px 10px;border:1px solid var(--line);border-radius:8px;font-size:13px;font-family:inherit;background:#fff;transition:border-color .15s;}
        .hw-input:focus,.hw-select:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft);}
        label.hw-label{font-size:12px;color:var(--muted);margin-bottom:4px;display:block;}
        .hw-field{margin-bottom:12px;}
        .hw-modal-overlay{position:fixed;inset:0;background:rgba(16,24,39,0.55);display:flex;align-items:center;justify-content:center;z-index:50;padding:20px;backdrop-filter:blur(2px);}
        .hw-modal{background:#fff;border-radius:14px;width:100%;max-width:520px;max-height:88vh;overflow-y:auto;padding:22px 24px;box-shadow:0 20px 50px rgba(16,24,39,0.25);}
        .hw-modal-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;}
        .hw-modal-title{font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:17px;}
        .hw-close{background:none;border:none;cursor:pointer;color:var(--muted);border-radius:6px;padding:4px;transition:background .15s;}
        .hw-close:hover{background:#F0F1F4;color:var(--ink);}
        .hw-search{display:flex;align-items:center;gap:8px;background:#fff;border:1px solid var(--line);border-radius:9px;padding:8px 12px;width:240px;transition:box-shadow .15s;}
        .hw-search:focus-within{box-shadow:0 0 0 3px var(--accent-soft);border-color:var(--accent);}
        .hw-search input{border:none;outline:none;font-size:13px;width:100%;}
        .hw-ncf-stub{font-family:'IBM Plex Mono',monospace;background:var(--navy);color:#fff;padding:3px 9px;border-radius:6px;font-size:11.5px;letter-spacing:.02em;}
        .hw-empty{padding:40px;text-align:center;color:var(--muted);font-size:13px;}
        .hw-lowstock-row{background:#FFF8F0;}
        .hw-line-item{display:grid;grid-template-columns:1fr 70px 100px auto;gap:8px;margin-bottom:8px;align-items:center;}
        .hw-li-actions{display:flex;gap:4px;align-items:center;}
        .hw-suggest{position:absolute;top:100%;left:0;right:0;z-index:30;background:#fff;border:1px solid var(--line);border-radius:10px;box-shadow:0 6px 18px rgba(16,24,39,0.12);margin-top:2px;max-height:220px;overflow-y:auto;-webkit-overflow-scrolling:touch;}
        .hw-suggest-item{display:flex;justify-content:space-between;gap:8px;padding:8px 12px;cursor:pointer;font-size:13.5px;}
        .hw-suggest-item:hover{background:var(--bg2,#f3f5f8);}
        .hw-suggest-code{font-family:'IBM Plex Mono',monospace;font-size:11.5px;color:var(--muted);}
        .hw-total-row{display:flex;justify-content:space-between;padding:6px 0;font-size:13px;}
        .hw-total-row.grand{font-weight:700;font-size:15px;border-top:1px solid var(--line);margin-top:6px;padding-top:10px;}
        .hw-chip{padding:5px 12px;border-radius:20px;font-size:11.5px;font-weight:600;}
        .hw-legend{display:flex;align-items:center;gap:6px;font-size:11.5px;color:var(--muted);}
        .hw-legend-dot{width:8px;height:8px;border-radius:50%;}

        .hw-hero{background:linear-gradient(135deg,var(--navy) 0%, var(--navy2) 100%);border-radius:16px;padding:22px 24px 26px;margin-bottom:22px;position:relative;overflow:hidden;border:2px solid var(--jade);box-shadow:0 0 0 4px rgba(23,122,99,0.12),0 10px 26px rgba(16,24,39,0.18);}
        .hw-hero-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px;}
        .hw-hero-brand{color:#fff;font-family:'Space Grotesk',sans-serif;font-size:20px;font-weight:700;display:flex;align-items:center;gap:10px;}
        .hw-hero-badge{font-size:11px;background:rgba(255,255,255,0.14);color:#fff;padding:4px 10px;border-radius:20px;font-family:'IBM Plex Mono',monospace;}
        .hw-hero-sub{color:rgba(255,255,255,0.55);font-size:12.5px;margin-top:3px;}
        .hw-tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;}
        .hw-tile{border:none;border-radius:12px;padding:18px 14px;display:flex;flex-direction:column;align-items:flex-start;gap:14px;cursor:pointer;transition:all .18s ease;text-align:left;}
        .hw-tile:hover{transform:translateY(-3px);filter:brightness(1.05);}
        .hw-tile-icon{width:38px;height:38px;border-radius:10px;background:rgba(255,255,255,0.22);display:flex;align-items:center;justify-content:center;}
        .hw-tile-label{color:#fff;font-weight:600;font-size:13.5px;}
        .hw-quick{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:22px;}
        .hw-quick-row{display:flex;justify-content:space-between;align-items:center;padding:10px 16px;border-bottom:1px solid var(--line);gap:10px;}
        .hw-quick-row:last-child{border-bottom:none;}
        .hw-quick-name{font-weight:600;font-size:13px;}
        .hw-quick-meta{font-size:11.5px;color:var(--muted);margin-top:2px;}
        .hw-quick-icon-btn{width:28px;height:28px;border-radius:7px;border:none;background:var(--bg);color:var(--muted);display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;}
        .hw-quick-icon-btn:hover{background:var(--accent-soft);color:var(--accent2);}

        .hw-print-tabs{display:flex;gap:8px;margin-bottom:16px;}
        .hw-print-tab{flex:1;padding:9px;border-radius:9px;border:1.5px solid var(--line);background:#fff;cursor:pointer;font-size:13px;font-weight:600;color:var(--muted);transition:all .15s;}
        .hw-print-tab.active{border-color:var(--accent);color:var(--accent2);background:var(--accent-soft);}
        .hw-paper-wrap{background:#EAEBEF;border-radius:10px;padding:14px;display:flex;justify-content:center;max-height:70vh;overflow-y:auto;}
        .hw-paper-carta{background:#fff;width:100%;max-width:380px;padding:22px 20px;font-size:11.5px;box-shadow:0 4px 16px rgba(16,24,39,0.12);}
        .hw-paper-ticket{background:#fff;width:220px;padding:14px 12px;font-family:'IBM Plex Mono',monospace;font-size:10.5px;box-shadow:0 4px 16px rgba(16,24,39,0.12);}
        .hw-paper-h1{font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:14px;}
        .hw-paper-line{border-top:1px dashed #B9BDC7;margin:8px 0;}
        .hw-paper-table td{padding:3px 0;font-size:11px;vertical-align:top;}
        .hw-paper-total-row{display:flex;justify-content:space-between;font-size:11.5px;padding:2px 0;}
        .hw-paper-total-row.grand{font-weight:700;font-size:13px;border-top:1px solid #ccc;margin-top:4px;padding-top:5px;}

        #hw-print-target{position:absolute;left:-10000px;top:0;pointer-events:none;}
        .hwp-page{width:190mm;box-sizing:border-box;padding:8mm 7mm;font-family:'Inter',system-ui,sans-serif;font-size:12.5px;color:#151A24;background-color:#ffffff;background-image:repeating-linear-gradient(45deg, rgba(16,24,39,0.045) 0, rgba(16,24,39,0.045) 1px, transparent 1px, transparent 15px),repeating-linear-gradient(-45deg, rgba(224,121,28,0.035) 0, rgba(224,121,28,0.035) 1px, transparent 1px, transparent 15px);-webkit-print-color-adjust:exact;print-color-adjust:exact;}
        .hwp-header{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;padding-bottom:10px;}
        .hwp-brand{font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:32px;color:#101827;line-height:1.15;}
        .hwp-slogan{font-style:italic;font-size:14.5px;color:#6B7280;margin-top:3px;}
        .hwp-contact{font-size:13.5px;color:#374151;margin-top:3px;}
        .hwp-doctype{text-align:right;flex-shrink:0;}
        .hwp-doctype-label{font-weight:700;font-size:14.5px;color:#E0791C;letter-spacing:.03em;}
        .hwp-doctype-num{font-size:14px;font-weight:600;margin-top:4px;}
        .hwp-doctype-date{font-size:11.5px;color:#6B7280;margin-top:2px;}
        .hwp-rule{border-top:2px solid #101827;margin:6px 0 12px;}
        .hwp-cliente{background:rgba(16,24,39,0.035);border:1px solid rgba(16,24,39,0.08);border-radius:8px;padding:9px 13px;margin-bottom:14px;font-size:12.5px;}
        .hwp-cliente-grid{display:grid;grid-template-columns:1fr 1fr;gap:2px 14px;margin-top:4px;}
        .hwp-cliente-sub{color:#374151;font-size:11.5px;}
        .hwp-table{width:100%;border-collapse:collapse;margin-bottom:14px;}
        .hwp-table thead td{font-weight:700;font-size:11.5px;text-transform:uppercase;letter-spacing:.03em;color:#374151;border-bottom:2px solid #101827;padding:6px 4px;}
        .hwp-table tbody td{font-size:12.5px;padding:7px 4px;border-bottom:1px solid rgba(16,24,39,0.09);}
        .hwp-table tbody tr{page-break-inside:avoid;}
        .hwp-table tbody tr:nth-child(even){background:rgba(16,24,39,0.025);}
        .hwp-bottom{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;margin-bottom:10px;page-break-inside:avoid;}
        .hwp-notes{font-size:11.5px;color:#374151;}
        .hwp-totals{min-width:210px;background:#fff;border:1.5px solid #101827;border-radius:8px;padding:8px 14px;}
        .hwp-total-row{display:flex;justify-content:space-between;font-size:12.5px;padding:2px 0;}
        .hwp-total-row.grand{font-weight:700;font-size:15.5px;border-top:1.5px solid #101827;margin-top:4px;padding-top:6px;color:#101827;}
        .hwp-footer{border-top:1px dashed #B9BDC7;padding-top:10px;page-break-inside:avoid;}
        .hwp-thanks-line{text-align:center;font-style:italic;color:#6B7280;font-size:12.5px;}
        .hwp-qr-wrap{display:flex;justify-content:center;margin:8px 0;}
        .hwp-warranty{border-top:1px dashed #B9BDC7;margin-top:4px;padding-top:8px;font-size:9.5px;line-height:1.5;color:#4B5563;text-align:center;}
        .hwp-warranty b{color:#101827;}
        .hwp-footer-text{font-size:9px;color:#9AA1AC;text-align:center;margin-top:6px;}
        .hwp-ticket{width:80mm;box-sizing:border-box;padding:4mm;font-family:'IBM Plex Mono',monospace;font-size:11.5px;color:#151A24;}
        .hwp-ticket .hwp-t-warranty{border-top:1px dashed #B9BDC7;margin-top:6px;padding-top:6px;font-size:8.5px;line-height:1.45;color:#4B5563;text-align:center;}
        .hwp-ticket .hwp-t-h1{font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:15px;text-align:center;}
        .hwp-ticket .hwp-t-line{border-top:1px dashed #B9BDC7;margin:7px 0;}
        .hwp-ticket .hwp-t-total{display:flex;justify-content:space-between;font-size:11.5px;padding:2px 0;}
        .hwp-ticket .hwp-t-total.grand{font-weight:700;font-size:13.5px;border-top:1px solid #101827;margin-top:4px;padding-top:5px;}

        @media (max-width: 1440px) {
          .hw-main{padding:20px 22px;}
          .hw-sidebar{width:200px;}
          .hw-title{font-size:19px;}
          .hw-tiles{grid-template-columns:repeat(3,1fr);gap:9px;}
          .hw-tile{padding:14px 10px;gap:10px;}
          .hw-tile-label{font-size:12px;}
        }
        @media (max-width: 1200px) {
          .hw-grid{grid-template-columns:repeat(2,1fr);}
          .hw-quick{grid-template-columns:1fr;}
          .hw-tiles{grid-template-columns:repeat(2,1fr);}
        }
        @media (max-width: 900px) {
          .hw-root{flex-direction:column;height:auto;overflow:visible;}
          .hw-sidebar{width:100%;height:auto;position:relative;flex-direction:row;flex-wrap:wrap;padding:8px;}
          .hw-main{height:auto;overflow:visible;}
        }
        .hw-mobile-topbar{display:none;}
        @media (max-width: 640px) {
          .hw-root{height:100vh;overflow:hidden;}
          .hw-mobile-topbar{display:flex;align-items:center;justify-content:space-between;position:fixed;top:0;left:0;right:0;height:52px;background:var(--navy);color:#fff;padding:0 14px;z-index:41;box-shadow:0 2px 8px rgba(0,0,0,0.15);}
          .hw-mobile-topbar-name{font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:14px;}
          .hw-mobile-topbar-sub{font-size:10px;color:rgba(255,255,255,0.5);}
          .hw-sidebar{position:fixed;top:auto;bottom:0;left:0;right:0;width:100%;height:auto;flex-direction:row;flex-wrap:nowrap;overflow-x:auto;overflow-y:hidden;padding:6px 4px;z-index:42;box-shadow:0 -2px 10px rgba(0,0,0,0.18);-webkit-overflow-scrolling:touch;}
          .hw-brand,.hw-sidebar-foot{display:none;}
          .hw-nav{flex-direction:row;flex:none;width:max-content;min-width:100%;padding:0;gap:2px;justify-content:space-around;}
          .hw-nav-btn{flex-direction:column;gap:3px;font-size:9.5px;padding:7px 10px;white-space:nowrap;border-radius:8px;}
          .hw-nav-btn:hover{transform:none;}
          .hw-main{padding:68px 14px 78px;height:100vh;overflow-y:auto;}
          .hw-header{flex-direction:column;align-items:flex-start;gap:6px;}
          .hw-header .hw-btn{width:100%;justify-content:center;}
          .hw-title{font-size:19px;}
          .hw-grid{grid-template-columns:repeat(2,1fr);gap:9px;}
          .hw-tiles{grid-template-columns:repeat(2,1fr);}
          .hw-quick{grid-template-columns:1fr;gap:12px;}
          .hw-panel{overflow-x:visible;}
          table.hw-table{width:100%;border-collapse:collapse;}
          table.hw-table thead{display:none;}
          table.hw-table, table.hw-table tbody, table.hw-table tr, table.hw-table td{display:block;width:100%;}
          table.hw-table tr{border:1px solid var(--line);border-radius:10px;padding:10px 12px;margin-bottom:10px;background:#fff;}
          table.hw-table td{border:none;padding:4px 0;white-space:normal;}
          .hw-t-usuarios td:nth-of-type(1):not(.hw-empty)::before{content:"Correo: ";font-weight:600;color:var(--muted);}
          .hw-t-usuarios td:nth-of-type(2)::before{content:"Módulos: ";font-weight:600;color:var(--muted);display:block;margin-bottom:4px;}
          .hw-t-facrec td:nth-of-type(1):not(.hw-empty)::before{content:"NCF: ";font-weight:600;color:var(--muted);}
          .hw-t-facrec td:nth-of-type(2)::before{content:"Cliente: ";font-weight:600;color:var(--muted);}
          .hw-t-facrec td:nth-of-type(3)::before{content:"Fecha: ";font-weight:600;color:var(--muted);}
          .hw-t-facrec td:nth-of-type(4)::before{content:"Total: ";font-weight:600;color:var(--muted);}
          .hw-t-facrec td:nth-of-type(5)::before{content:"Estado: ";font-weight:600;color:var(--muted);}
          .hw-t-equiporep td:nth-of-type(1):not(.hw-empty)::before{content:"Equipo: ";font-weight:600;color:var(--muted);}
          .hw-t-equiporep td:nth-of-type(2)::before{content:"Estado: ";font-weight:600;color:var(--muted);}
          .hw-t-clientes td:nth-of-type(1):not(.hw-empty)::before{content:"Nombre: ";font-weight:600;color:var(--muted);}
          .hw-t-clientes td:nth-of-type(2)::before{content:"Negocio: ";font-weight:600;color:var(--muted);}
          .hw-t-clientes td:nth-of-type(3)::before{content:"RNC/Cédula: ";font-weight:600;color:var(--muted);}
          .hw-t-clientes td:nth-of-type(4)::before{content:"Teléfono: ";font-weight:600;color:var(--muted);}
          .hw-t-facturas td:nth-of-type(1):not(.hw-empty)::before{content:"NCF: ";font-weight:600;color:var(--muted);}
          .hw-t-facturas td:nth-of-type(2)::before{content:"Cliente: ";font-weight:600;color:var(--muted);}
          .hw-t-facturas td:nth-of-type(3)::before{content:"Fecha: ";font-weight:600;color:var(--muted);}
          .hw-t-facturas td:nth-of-type(4)::before{content:"Método: ";font-weight:600;color:var(--muted);}
          .hw-t-facturas td:nth-of-type(5)::before{content:"Total: ";font-weight:600;color:var(--muted);}
          .hw-t-facturas td:nth-of-type(6)::before{content:"Estado: ";font-weight:600;color:var(--muted);}
          .hw-t-cotizaciones td:nth-of-type(1):not(.hw-empty)::before{content:"No.: ";font-weight:600;color:var(--muted);}
          .hw-t-cotizaciones td:nth-of-type(2)::before{content:"Cliente: ";font-weight:600;color:var(--muted);}
          .hw-t-cotizaciones td:nth-of-type(3)::before{content:"Fecha: ";font-weight:600;color:var(--muted);}
          .hw-t-cotizaciones td:nth-of-type(4)::before{content:"Total: ";font-weight:600;color:var(--muted);}
          .hw-t-cotizaciones td:nth-of-type(5)::before{content:"Estado: ";font-weight:600;color:var(--muted);}
          .hw-t-recepcion td:nth-of-type(1):not(.hw-empty)::before{content:"No.: ";font-weight:600;color:var(--muted);}
          .hw-t-recepcion td:nth-of-type(2)::before{content:"Cliente: ";font-weight:600;color:var(--muted);}
          .hw-t-recepcion td:nth-of-type(3)::before{content:"Equipo: ";font-weight:600;color:var(--muted);}
          .hw-t-recepcion td:nth-of-type(4)::before{content:"Técnico: ";font-weight:600;color:var(--muted);}
          .hw-t-recepcion td:nth-of-type(5)::before{content:"Estado: ";font-weight:600;color:var(--muted);}
          .hw-t-ordenes td:nth-of-type(1):not(.hw-empty)::before{content:"No.: ";font-weight:600;color:var(--muted);}
          .hw-t-ordenes td:nth-of-type(2)::before{content:"Cliente: ";font-weight:600;color:var(--muted);}
          .hw-t-ordenes td:nth-of-type(3)::before{content:"Tipo: ";font-weight:600;color:var(--muted);}
          .hw-t-ordenes td:nth-of-type(4)::before{content:"Técnico: ";font-weight:600;color:var(--muted);}
          .hw-t-ordenes td:nth-of-type(5)::before{content:"Estado: ";font-weight:600;color:var(--muted);}
          .hw-t-inventario td:nth-of-type(1):not(.hw-empty)::before{content:"Producto: ";font-weight:600;color:var(--muted);}
          .hw-t-inventario td:nth-of-type(2)::before{content:"Código: ";font-weight:600;color:var(--muted);}
          .hw-t-inventario td:nth-of-type(3)::before{content:"Categoría: ";font-weight:600;color:var(--muted);}
          .hw-t-inventario td:nth-of-type(4)::before{content:"Costo: ";font-weight:600;color:var(--muted);}
          .hw-t-inventario td:nth-of-type(5)::before{content:"Precio: ";font-weight:600;color:var(--muted);}
          .hw-t-inventario td:nth-of-type(6)::before{content:"Stock: ";font-weight:600;color:var(--muted);}
          .hw-t-cajamov td:nth-of-type(1):not(.hw-empty)::before{content:"Hora: ";font-weight:600;color:var(--muted);}
          .hw-t-cajamov td:nth-of-type(2)::before{content:"Tipo: ";font-weight:600;color:var(--muted);}
          .hw-t-cajamov td:nth-of-type(3)::before{content:"Monto: ";font-weight:600;color:var(--muted);}
          .hw-t-cajamov td:nth-of-type(4)::before{content:"Descripción: ";font-weight:600;color:var(--muted);}
          .hw-t-cajahist td:nth-of-type(1):not(.hw-empty)::before{content:"Fecha: ";font-weight:600;color:var(--muted);}
          .hw-t-cajahist td:nth-of-type(2)::before{content:"Apertura: ";font-weight:600;color:var(--muted);}
          .hw-t-cajahist td:nth-of-type(3)::before{content:"Cierre: ";font-weight:600;color:var(--muted);}
          .hw-t-cajahist td:nth-of-type(4)::before{content:"Esperado: ";font-weight:600;color:var(--muted);}
          .hw-t-cajahist td:nth-of-type(5)::before{content:"Diferencia: ";font-weight:600;color:var(--muted);}
          .hw-t-cajahist td:nth-of-type(6)::before{content:"Estado: ";font-weight:600;color:var(--muted);}
          .hw-t-scanhist td:nth-of-type(1):not(.hw-empty)::before{content:"Producto: ";font-weight:600;color:var(--muted);}
          .hw-t-scanhist td:nth-of-type(2)::before{content:"Código: ";font-weight:600;color:var(--muted);}
          .hw-t-scanhist td:nth-of-type(3)::before{content:"Precio: ";font-weight:600;color:var(--muted);}
          .hw-t-scanhist td:nth-of-type(4)::before{content:"Stock: ";font-weight:600;color:var(--muted);}
          .hw-t-abonospend td:nth-of-type(1):not(.hw-empty)::before{content:"NCF: ";font-weight:600;color:var(--muted);}
          .hw-t-abonospend td:nth-of-type(2)::before{content:"Cliente: ";font-weight:600;color:var(--muted);}
          .hw-t-abonospend td:nth-of-type(3)::before{content:"Total: ";font-weight:600;color:var(--muted);}
          .hw-t-abonospend td:nth-of-type(4)::before{content:"Pagado: ";font-weight:600;color:var(--muted);}
          .hw-t-abonospend td:nth-of-type(5)::before{content:"Pendiente: ";font-weight:600;color:var(--muted);}
          .hw-t-abonoshist td:nth-of-type(1):not(.hw-empty)::before{content:"Fecha: ";font-weight:600;color:var(--muted);}
          .hw-t-abonoshist td:nth-of-type(2)::before{content:"Factura: ";font-weight:600;color:var(--muted);}
          .hw-t-abonoshist td:nth-of-type(3)::before{content:"Monto: ";font-weight:600;color:var(--muted);}
          .hw-t-abonoshist td:nth-of-type(4)::before{content:"Método: ";font-weight:600;color:var(--muted);}
          .hw-t-abonoshist td:nth-of-type(5)::before{content:"Nota: ";font-weight:600;color:var(--muted);}
          .hw-t-topclientes td:nth-of-type(1):not(.hw-empty)::before{content:"Cliente: ";font-weight:600;color:var(--muted);}
          .hw-t-topclientes td:nth-of-type(2)::before{content:"Total comprado: ";font-weight:600;color:var(--muted);}
          .hw-modal-overlay{padding:10px;align-items:flex-end;}
          .hw-modal{max-width:100%;max-height:92vh;border-radius:14px 14px 0 0;}
          .hw-btn.small{padding:8px 12px;font-size:12.5px;}
          .hw-line-item{
            display:grid;
            grid-template-columns:1fr 1fr;
            grid-template-areas:"nombre nombre" "cant precio" "actions actions";
            gap:6px;
            padding:10px;
            border:1px solid var(--line);
            border-radius:10px;
            margin-bottom:10px;
          }
          .hw-li-nombre{grid-area:nombre;font-size:16px;padding:10px 12px;}
          .hw-li-cant{grid-area:cant;font-size:16px;padding:10px 12px;}
          .hw-li-precio{grid-area:precio;font-size:16px;padding:10px 12px;}
          .hw-li-actions{grid-area:actions;justify-content:flex-end;gap:10px;}
          .hw-li-actions .hw-close{padding:8px;background:var(--bg);border-radius:8px;}
          .hw-suggest{max-height:45vh;}
          .hw-suggest-item{padding:12px 14px;font-size:14.5px;}
        }
        @media print {
          body > *:not(#hw-print-target) { display: none !important; }
          #hw-print-target { position: static !important; left: auto !important; display: block !important; }
        }
      `}</style>

      <div className="hw-mobile-topbar">
        <div>
          <div className="hw-mobile-topbar-name">{negocio.nombre}</div>
          <div className="hw-mobile-topbar-sub">{negocio.eslogan || "Sistema de facturación"}</div>
        </div>
      </div>

      <aside className="hw-sidebar">
        <div className="hw-brand">
          <div className="hw-brand-name">{negocio.nombre}</div>
          <div className="hw-brand-sub">{negocio.eslogan || "Henríquez System v0.2"}</div>
        </div>
        <nav className="hw-nav">
          {NAV.filter((n) => puedeVer(n.id)).map((n) => (
            <button key={n.id} className={"hw-nav-btn" + (tab === n.id ? " active" : "")} onClick={() => setTab(n.id)}>
              <n.icon size={16} /> {n.label}
            </button>
          ))}
        </nav>
        <div className="hw-sidebar-foot">
          {negocio.direccion}<br />
          {negocio.telefono}<br />
          <button onClick={() => supabase.auth.signOut()} style={{ marginTop: 8, background: "none", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)", borderRadius: 7, padding: "4px 9px", fontSize: 11, cursor: "pointer" }}>Cerrar sesión</button>
        </div>
      </aside>

      <main className="hw-main">
        <div style={{ display: tab === "dashboard" ? "block" : "none" }}>
          <Dashboard clientes={clientes} facturas={facturas} cotizaciones={cotizaciones} productos={productos} recepciones={recepciones} ordenes={ordenes} setTab={setTab} puedeVer={puedeVer} negocio={negocio} />
        </div>
        <div style={{ display: tab === "clientes" ? "block" : "none" }}>
          <Clientes clientes={clientes} setClientes={setClientes} facturas={facturas} />
        </div>
        <div style={{ display: tab === "facturacion" ? "block" : "none" }}>
          <Facturacion facturas={facturas} setFacturas={setFacturas} clientes={clientes} productos={productos} setProductos={setProductos} negocio={negocio} miEmail={miEmail} />
        </div>
        <div style={{ display: tab === "cotizaciones" ? "block" : "none" }}>
          <Cotizaciones cotizaciones={cotizaciones} setCotizaciones={setCotizaciones} clientes={clientes} productos={productos} setProductos={setProductos} setFacturas={setFacturas} setTab={setTab} negocio={negocio} miEmail={miEmail} />
        </div>
        <div style={{ display: tab === "recepcion" ? "block" : "none" }}>
          <RecepcionEquipos recepciones={recepciones} setRecepciones={setRecepciones} clientes={clientes} />
        </div>
        <div style={{ display: tab === "ordenes" ? "block" : "none" }}>
          <OrdenesTrabajo ordenes={ordenes} setOrdenes={setOrdenes} clientes={clientes} />
        </div>
        <div style={{ display: tab === "inventario" ? "block" : "none" }}>
          <Inventario productos={productos} setProductos={setProductos} />
        </div>
        <div style={{ display: tab === "reportes" ? "block" : "none" }}><Reportes facturas={facturas} abonosPagos={abonosPagos} /></div>
        <div style={{ display: tab === "usuarios" ? "block" : "none" }}>{esAdmin ? <UsuariosAdmin permisos={permisos} setPermisos={setPermisos} miEmail={miEmail} /> : <Proximamente titulo="Usuarios" />}</div>
        <div style={{ display: tab === "codigobarras" ? "block" : "none" }}><CodigoBarras productos={productos} /></div>
        <div style={{ display: tab === "abonos" ? "block" : "none" }}><Abonos facturas={facturas} setFacturas={setFacturas} abonosPagos={abonosPagos} setAbonosPagos={setAbonosPagos} /></div>
        <div style={{ display: tab === "graficas" ? "block" : "none" }}><Graficas facturas={facturas} cotizaciones={cotizaciones} productos={productos} /></div>
        <div style={{ display: tab === "caja" ? "block" : "none" }}><Caja sesiones={cajaSesiones} setSesiones={setCajaSesiones} movimientos={cajaMovimientos} setMovimientos={setCajaMovimientos} facturas={facturas} miEmail={miEmail} /></div>
        <div style={{ display: tab === "ajustes" ? "block" : "none" }}><Ajustes negocioConfig={negocioConfig} setNegocioConfig={setNegocioConfig} esAdmin={esAdmin} /></div>
        <div style={{ display: tab === "chatsoporte" ? "block" : "none" }}><ChatSoporte negocio={negocio} /></div>
      </main>
    </div>
  );
}

function calcTotal(items, aplicaItbis = true) {
  const sub = items.reduce((s, i) => s + i.cantidad * i.precio, 0);
  const itbis = aplicaItbis ? sub * ITBIS : 0;
  return { sub, itbis, total: sub + itbis };
}

const CAT_COLORS = { "Cámaras": "#3F6FD1", "Acceso": "#0F6E84", "Motores": "#E0791C", "Cerco eléctrico": "#C24F3A", "Solar": "#2F9E67", "Electrodomésticos": "#A6456B", "Eléctricos": "#B08D2B", "Redes y cableado": "#4A6FA1", "Desarrollo / Software": "#6B4FB0", "Computación / Soporte técnico": "#2A8F9E", "Herramientas": "#6E6E6E", "Servicio de instalación y configuración": "#3F8F5C", "Servicios": "#8B5FBF", "Otro": "#8B93A1" };

function categoriaDe(nombre, productos) {
  const p = productos.find((p) => p.nombre === nombre);
  if (p) return p.categoria;
  return "Servicios";
}

const TILES = [
  { id: "clientes", label: "Clientes", icon: Users, from: "#4E7CE0", to: "#3457B2" },
  { id: "inventario", label: "Inventario", icon: Package, from: "#3DAE72", to: "#278052" },
  { id: "facturacion", label: "Facturación", icon: FileText, from: "#D9573D", to: "#B03F28" },
  { id: "cotizaciones", label: "Cotizaciones", icon: ClipboardList, from: "#E0952E", to: "#B9720F" },
  { id: "recepcion", label: "Recepción\nequipos", icon: Wrench, from: "#9A6BD1", to: "#7448AC" },
  { id: "ordenes", label: "Órdenes de\ntrabajo", icon: Hammer, from: "#1D9A7C", to: "#116651" },
  { id: "reportes", label: "Reportes", icon: BarChart3, from: "#3F8FE0", to: "#2B67AC" },
  { id: "usuarios", label: "Usuarios", icon: UserCog, from: "#6B7280", to: "#454A52" },
  { id: "codigobarras", label: "Código de\nbarras · Consulta", icon: Barcode, from: "#1F2937", to: "#0F1520" },
  { id: "abonos", label: "Abonos", icon: Coins, from: "#C9A227", to: "#96790E" },
  { id: "graficas", label: "Gráficas", icon: LineChart, from: "#2FA6A6", to: "#1E7A7A" },
  { id: "caja", label: "Caja", icon: Banknote, from: "#2F9E67", to: "#1E7449" },
  { id: "ajustes", label: "Ajustes", icon: Settings, from: "#7A7F87", to: "#565A61" },
  { id: "chatsoporte", label: "Chat\nsoporte", icon: Headphones, from: "#D1497A", to: "#A5325C" },
];

function Dashboard({ clientes, facturas, cotizaciones, productos, recepciones, ordenes, setTab, puedeVer, negocio }) {
  const [qc, setQc] = useState("");
  const [qa, setQa] = useState("");
  const mesFacturas = facturas.length;
  const ingresos = facturas.reduce((s, f) => s + calcTotal(f.items, f.aplicaItbis).total, 0);
  const pendientesCotiz = cotizaciones.filter((c) => c.estado === "Pendiente").length;
  const stockBajo = productos.filter((p) => p.stock <= p.minimo);

  const trendData = useMemo(() => {
    const byDate = {};
    facturas.forEach((f) => {
      const t = calcTotal(f.items, f.aplicaItbis).total;
      byDate[f.fecha] = (byDate[f.fecha] || 0) + t;
    });
    return Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b)).map(([fecha, total]) => ({
      fecha: fecha.slice(5).split("-").reverse().join("/"), total,
    }));
  }, [facturas]);

  const catData = useMemo(() => {
    const byCat = {};
    facturas.forEach((f) => f.items.forEach((it) => {
      const cat = categoriaDe(it.nombre, productos);
      byCat[cat] = (byCat[cat] || 0) + it.cantidad * it.precio;
    }));
    return Object.entries(byCat).map(([categoria, total]) => ({ categoria, total })).sort((a, b) => b.total - a.total);
  }, [facturas, productos]);

  const clientesFiltrados = clientes.filter((c) => (c.nombre + c.negocio).toLowerCase().includes(qc.toLowerCase())).slice(0, 4);
  const productosFiltrados = productos.filter((p) => p.nombre.toLowerCase().includes(qa.toLowerCase())).slice(0, 5);

  return (
    <div>
      <div className="hw-hero">
        <div className="hw-hero-top">
          <div>
            <div className="hw-hero-brand">Henríquez System <span className="hw-hero-badge">v0.2</span></div>
            <div className="hw-hero-sub">{negocio.eslogan || (negocio.nombre + " · " + negocio.direccion)}</div>
          </div>
        </div>
        <div className="hw-tiles">
          {TILES.filter((t) => puedeVer(t.id)).map((t) => (
            <button key={t.id} className="hw-tile" style={{ background: `linear-gradient(135deg, ${t.from}, ${t.to})` }} onClick={() => setTab(t.id)}>
              <div className="hw-tile-icon"><t.icon size={19} color="#fff" /></div>
              <div className="hw-tile-label" style={{ whiteSpace: "pre-line" }}>{t.label}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="hw-quick">
        <div className="hw-panel">
          <div className="hw-panel-head">
            <div className="hw-panel-title">Consulta rápida de clientes</div>
          </div>
          <div style={{ padding: "10px 16px" }}>
            <div className="hw-search" style={{ width: "100%" }}>
              <Search size={13} color="var(--muted)" />
              <input placeholder="Buscar nombre, negocio, RNC..." value={qc} onChange={(e) => setQc(e.target.value)} />
            </div>
          </div>
          <div>
            {clientesFiltrados.map((c) => (
              <div className="hw-quick-row" key={c.id}>
                <div>
                  <div className="hw-quick-name">{c.nombre}{c.negocio ? <span style={{ color: "var(--muted)", fontWeight: 400 }}> · {c.negocio}</span> : ""}</div>
                  <div className="hw-quick-meta">{c.rnc || c.telefono || "Sin RNC registrado"}</div>
                </div>
                <button className="hw-quick-icon-btn" onClick={() => setTab("clientes")}><ArrowRight size={14} /></button>
              </div>
            ))}
            {clientesFiltrados.length === 0 && <div className="hw-empty">Sin resultados</div>}
          </div>
        </div>

        <div className="hw-panel">
          <div className="hw-panel-head">
            <div className="hw-panel-title">Consulta rápida de artículos</div>
          </div>
          <div style={{ padding: "10px 16px" }}>
            <div className="hw-search" style={{ width: "100%" }}>
              <Search size={13} color="var(--muted)" />
              <input placeholder="Buscar producto..." value={qa} onChange={(e) => setQa(e.target.value)} />
            </div>
          </div>
          <div>
            {productosFiltrados.map((p) => (
              <div className="hw-quick-row" key={p.id}>
                <div>
                  <div className="hw-quick-name">{p.nombre}</div>
                  <div className="hw-quick-meta">{p.categoria} · stock {p.stock}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{money(p.precio)}</span>
                  <button className="hw-quick-icon-btn" onClick={() => setTab("inventario")}><Edit2 size={13} /></button>
                </div>
              </div>
            ))}
            {productosFiltrados.length === 0 && <div className="hw-empty">Sin resultados</div>}
          </div>
        </div>
      </div>

      <div className="hw-grid">
        <div className="hw-card">
          <div className="hw-kpi-top">
            <div className="hw-kpi-icon" style={{ background: "var(--accent-soft)" }}><FileText size={17} color="var(--accent2)" /></div>
          </div>
          <div className="hw-kpi-label">Facturas este mes</div>
          <div className="hw-kpi-value">{mesFacturas}</div>
        </div>
        <div className="hw-card">
          <div className="hw-kpi-top">
            <div className="hw-kpi-icon" style={{ background: "var(--green-soft)" }}><Wallet size={17} color="var(--green)" /></div>
          </div>
          <div className="hw-kpi-label">Ingresos facturados</div>
          <div className="hw-kpi-value" style={{ color: "var(--green)" }}>{money(ingresos)}</div>
        </div>
        <div className="hw-card">
          <div className="hw-kpi-top">
            <div className="hw-kpi-icon" style={{ background: "var(--blue-soft)" }}><Clock size={17} color="var(--blue)" /></div>
          </div>
          <div className="hw-kpi-label">Cotizaciones pendientes</div>
          <div className="hw-kpi-value">{pendientesCotiz}</div>
        </div>
        <div className="hw-card">
          <div className="hw-kpi-top">
            <div className="hw-kpi-icon" style={{ background: "var(--red-soft)" }}><ShieldAlert size={17} color="var(--red)" /></div>
          </div>
          <div className="hw-kpi-label">Productos con stock bajo</div>
          <div className="hw-kpi-value" style={{ color: stockBajo.length ? "var(--red)" : "var(--ink)" }}>{stockBajo.length}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16, marginBottom: 16 }}>
        <div className="hw-panel">
          <div className="hw-panel-head">
            <div className="hw-panel-title">Ingresos recientes</div>
            <div className="hw-legend"><span className="hw-legend-dot" style={{ background: "var(--accent)" }} /> Total facturado por día</div>
          </div>
          <div style={{ padding: "14px 10px 4px" }}>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trendData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="hwGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E0791C" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#E0791C" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#EDEEF2" />
                <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} tickFormatter={moneyShort} width={44} />
                <Tooltip formatter={(v) => money(v)} contentStyle={{ borderRadius: 10, border: "1px solid #E7E9EF", fontSize: 12 }} />
                <Area type="monotone" dataKey="total" stroke="#E0791C" strokeWidth={2.5} fill="url(#hwGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="hw-panel">
          <div className="hw-panel-head"><div className="hw-panel-title">Ingresos por línea de negocio</div></div>
          <div style={{ padding: "14px 12px 4px" }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={catData} layout="vertical" margin={{ top: 4, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 5" horizontal={false} stroke="#EDEEF2" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} tickFormatter={moneyShort} />
                <YAxis type="category" dataKey="categoria" tick={{ fontSize: 11.5, fill: "#151A24" }} axisLine={false} tickLine={false} width={90} />
                <Tooltip formatter={(v) => money(v)} contentStyle={{ borderRadius: 10, border: "1px solid #E7E9EF", fontSize: 12 }} />
                <Bar dataKey="total" radius={[0, 6, 6, 0]}>
                  {catData.map((d, i) => <Cell key={i} fill={CAT_COLORS[d.categoria] || "#8B93A1"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>
        <div className="hw-panel">
          <div className="hw-panel-head"><div className="hw-panel-title">Últimas facturas</div></div>
          <table className="hw-table hw-t-facrec">
            <thead><tr><th>NCF</th><th>Cliente</th><th>Fecha</th><th>Total</th><th>Estado</th></tr></thead>
            <tbody>
              {facturas.slice(-5).reverse().map((f) => {
                const { total } = calcTotal(f.items, f.aplicaItbis);
                return (
                  <tr key={f.id}>
                    <td><span className="hw-ncf-stub">{f.ncf}</span></td>
                    <td>{f.clienteNombre}</td>
                    <td>{f.fecha}</td>
                    <td>{money(total)}</td>
                    <td><EstadoBadge estado={f.estado} /></td>
                  </tr>
                );
              })}
              {facturas.length === 0 && <tr><td colSpan={5} className="hw-empty">Sin facturas todavía</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="hw-panel">
          <div className="hw-panel-head"><div className="hw-panel-title">Equipos en taller</div></div>
          <table className="hw-table hw-t-equiporep">
            <thead><tr><th>Equipo</th><th>Estado</th></tr></thead>
            <tbody>
              {recepciones.slice(-5).reverse().map((r) => (
                <tr key={r.id}><td>{r.tipo}<div className="hw-quick-meta">{r.clienteNombre}</div></td><td><EstadoBadge estado={r.estado} /></td></tr>
              ))}
              {recepciones.length === 0 && <tr><td colSpan={2} className="hw-empty">No hay equipos en recepción</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function EstadoBadge({ estado }) {
  const map = {
    Pagada: "green", Abonada: "amber", Pendiente: "amber", Anulada: "red", Aprobada: "green", Rechazada: "red",
    Recibido: "grey", "En diagnóstico": "blue", "En reparación": "amber", "Esperando repuesto": "red", Listo: "green", Entregado: "grey",
    Agendada: "blue", "En proceso": "amber", "Esperando materiales": "red", Completada: "green", Facturada: "grey",
  };
  return <span className={"hw-badge " + (map[estado] || "grey")}>{estado}</span>;
}

function Clientes({ clientes, setClientes, facturas }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ nombre: "", negocio: "", rnc: "", telefono: "", correo: "", direccion: "", nota: "" });

  const filtered = clientes.filter((c) => (c.nombre + c.negocio).toLowerCase().includes(q.toLowerCase()));

  function guardar() {
    if (!form.nombre.trim()) return;
    setClientes([...clientes, { id: uid(), ...form }]);
    setForm({ nombre: "", negocio: "", rnc: "", telefono: "", correo: "", direccion: "", nota: "" });
    setOpen(false);
  }

  const historial = selected ? facturas.filter((f) => f.clienteId === selected.id || f.clienteNombre === selected.nombre) : [];

  return (
    <div>
      <div className="hw-header">
        <div><div className="hw-title">Clientes</div><div className="hw-sub">{clientes.length} clientes registrados</div></div>
        <button className="hw-btn" onClick={() => setOpen(true)}><Plus size={15} /> Nuevo cliente</button>
      </div>

      <div className="hw-search" style={{ marginBottom: 14 }}>
        <Search size={14} color="var(--muted)" />
        <input placeholder="Buscar por nombre o negocio..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: selected ? "1.3fr 1fr" : "1fr", gap: 16 }}>
        <div className="hw-panel">
          <table className="hw-table hw-t-clientes">
            <thead><tr><th>Nombre</th><th>Negocio</th><th>RNC/Cédula</th><th>Teléfono</th><th></th></tr></thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} style={{ cursor: "pointer" }} onClick={() => setSelected(c)}>
                  <td>{c.nombre}</td>
                  <td>{c.negocio || "—"}</td>
                  <td className="hw-mono">{c.rnc || "—"}</td>
                  <td>{c.telefono || "—"}</td>
                  <td><button className="hw-btn soft-blue small" onClick={(e) => { e.stopPropagation(); setSelected(c); }}>Ver</button></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={5} className="hw-empty">No se encontraron clientes</td></tr>}
            </tbody>
          </table>
        </div>

        {selected && (
          <div className="hw-panel">
            <div className="hw-panel-head">
              <div className="hw-panel-title">{selected.nombre}</div>
              <button className="hw-close" onClick={() => setSelected(null)}><X size={16} /></button>
            </div>
            <div style={{ padding: 18, fontSize: 13 }}>
              {selected.negocio && <p><b>Negocio:</b> {selected.negocio}</p>}
              {selected.rnc && <p><b>RNC/Cédula:</b> {selected.rnc}</p>}
              {selected.telefono && <p><b>Teléfono:</b> {selected.telefono}</p>}
              {selected.correo && <p><b>Correo:</b> {selected.correo}</p>}
              {selected.direccion && <p><b>Dirección:</b> {selected.direccion}</p>}
              {selected.nota && <p style={{ background: "var(--accent-soft)", padding: "8px 10px", borderRadius: 8, marginTop: 10 }}><b>Nota interna:</b> {selected.nota}</p>}
              <div style={{ marginTop: 16 }}>
                <div className="hw-panel-title" style={{ marginBottom: 8 }}>Historial de facturas</div>
                {historial.length === 0 && <div className="hw-sub">Sin facturas registradas.</div>}
                {historial.map((f) => (
                  <div key={f.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--line)" }}>
                    <span className="hw-mono" style={{ fontSize: 12 }}>{f.ncf}</span>
                    <span>{money(calcTotal(f.items, f.aplicaItbis).total)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {open && (
        <div className="hw-modal-overlay" onClick={() => setOpen(false)}>
          <div className="hw-modal" onClick={(e) => e.stopPropagation()}>
            <div className="hw-modal-head"><div className="hw-modal-title">Nuevo cliente</div><button className="hw-close" onClick={() => setOpen(false)}><X size={18} /></button></div>
            <FieldRow label="Nombre completo *"><input className="hw-input" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></FieldRow>
            <FieldRow label="Nombre del negocio"><input className="hw-input" value={form.negocio} onChange={(e) => setForm({ ...form, negocio: e.target.value })} /></FieldRow>
            <FieldRow label="RNC / Cédula"><input className="hw-input" value={form.rnc} onChange={(e) => setForm({ ...form, rnc: e.target.value })} /></FieldRow>
            <FieldRow label="Teléfono"><input className="hw-input" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} /></FieldRow>
            <FieldRow label="Correo"><input className="hw-input" value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} /></FieldRow>
            <FieldRow label="Dirección"><input className="hw-input" value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} /></FieldRow>
            <FieldRow label="Nota interna"><textarea className="hw-input" rows={2} value={form.nota} onChange={(e) => setForm({ ...form, nota: e.target.value })} /></FieldRow>
            <button className="hw-btn" style={{ width: "100%", justifyContent: "center", marginTop: 6 }} onClick={guardar}>Guardar cliente</button>
          </div>
        </div>
      )}
    </div>
  );
}

function FieldRow({ label, children }) {
  return <div className="hw-field"><label className="hw-label">{label}</label>{children}</div>;
}

function ItemsEditor({ items, setItems, productos, setProductos }) {
  const [nuevoIdx, setNuevoIdx] = useState(null);
  const [np, setNp] = useState({ nombre: "", codigo: "", categoria: "Otro", precio: 0, costo: 0, stock: 0, minimo: 0 });
  const [abiertoIdx, setAbiertoIdx] = useState(null);

  function update(idx, field, value) {
    const next = [...items];
    next[idx] = { ...next[idx], [field]: value };
    setItems(next);
  }
  function addItem() {
    setItems([...items, { nombre: "", cantidad: 1, precio: 0 }]);
  }
  function removeItem(idx) {
    setItems(items.filter((_, i) => i !== idx));
  }
  function seleccionarProducto(idx, p) {
    const next = [...items];
    next[idx] = { nombre: p.nombre, cantidad: next[idx].cantidad || 1, precio: p.precio };
    setItems(next);
    setAbiertoIdx(null);
  }
  function sugerenciasPara(texto) {
    const q = (texto || "").trim().toLowerCase();
    if (!q) return [];
    return productos.filter((p) => p.nombre?.toLowerCase().includes(q) || p.codigo?.toLowerCase().includes(q)).slice(0, 6);
  }
  function alEscribir(idx, texto) {
    update(idx, "nombre", texto);
    setAbiertoIdx(idx);
  }
  function porCodigoEnter(idx, e) {
    if (e.key !== "Enter") return;
    const texto = items[idx].nombre || "";
    const exacto = productos.find((p) => p.codigo && p.codigo.toLowerCase() === texto.trim().toLowerCase());
    const sugs = sugerenciasPara(texto);
    const elegido = exacto || (sugs.length === 1 ? sugs[0] : null);
    if (elegido) { e.preventDefault(); seleccionarProducto(idx, elegido); }
  }
  function abrirNuevoProducto(idx) {
    setNp({ nombre: items[idx]?.nombre || "", codigo: "", categoria: "Otro", precio: 0, costo: 0, stock: 0, minimo: 0 });
    setNuevoIdx(idx);
  }
  function guardarNuevoProducto() {
    if (!np.nombre.trim()) return;
    const producto = { id: uid(), nombre: np.nombre.trim(), codigo: np.codigo.trim(), categoria: np.categoria, precio: Number(np.precio) || 0, costo: Number(np.costo) || 0, stock: Number(np.stock) || 0, minimo: Number(np.minimo) || 0 };
    setProductos([...productos, producto]);
    seleccionarProducto(nuevoIdx, producto);
    setNuevoIdx(null);
  }

  return (
    <div>
      {items.map((it, idx) => {
        const sugs = abiertoIdx === idx ? sugerenciasPara(it.nombre) : [];
        return (
          <div className="hw-line-item" key={idx} style={{ position: "relative" }}>
            <input
              className="hw-input hw-li-nombre"
              placeholder="Nombre, código o escanea con el lector..."
              value={it.nombre}
              onChange={(e) => alEscribir(idx, e.target.value)}
              onFocus={() => setAbiertoIdx(idx)}
              onBlur={() => setTimeout(() => setAbiertoIdx((v) => (v === idx ? null : v)), 150)}
              onKeyDown={(e) => porCodigoEnter(idx, e)}
            />
            {sugs.length > 0 && (
              <div className="hw-suggest">
                {sugs.map((p) => (
                  <div key={p.id} className="hw-suggest-item" onMouseDown={() => seleccionarProducto(idx, p)}>
                    <span>{p.nombre}</span>
                    {p.codigo && <span className="hw-suggest-code">{p.codigo}</span>}
                  </div>
                ))}
              </div>
            )}
            <input className="hw-input hw-li-cant" type="number" min={1} value={it.cantidad} onChange={(e) => update(idx, "cantidad", Number(e.target.value))} />
            <input className="hw-input hw-li-precio" type="number" value={it.precio} onChange={(e) => update(idx, "precio", Number(e.target.value))} />
            <div className="hw-li-actions">
              {setProductos && <button className="hw-close" title="Crear producto nuevo" onClick={() => abrirNuevoProducto(idx)}><Plus size={15} /></button>}
              <button className="hw-close" onClick={() => removeItem(idx)}><X size={15} /></button>
            </div>
          </div>
        );
      })}
      <button className="hw-btn ghost small" onClick={addItem}><Plus size={13} /> Agregar línea</button>

      {nuevoIdx !== null && (
        <div className="hw-modal-overlay" onClick={() => setNuevoIdx(null)}>
          <div className="hw-modal" style={{ maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
            <div className="hw-modal-head">
              <div className="hw-modal-title">Nuevo producto rápido</div>
              <button className="hw-close" onClick={() => setNuevoIdx(null)}><X size={18} /></button>
            </div>
            <FieldRow label="Nombre *">
              <input className="hw-input" autoFocus value={np.nombre} onChange={(e) => setNp({ ...np, nombre: e.target.value })} />
            </FieldRow>
            <FieldRow label="Código (barras o referencia)">
              <input className="hw-input" value={np.codigo} onChange={(e) => setNp({ ...np, codigo: e.target.value })} />
            </FieldRow>
            <FieldRow label="Categoría">
              <input className="hw-input" value={np.categoria} onChange={(e) => setNp({ ...np, categoria: e.target.value })} />
            </FieldRow>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <FieldRow label="Precio de venta">
                <input className="hw-input" type="number" value={np.precio} onChange={(e) => setNp({ ...np, precio: e.target.value })} />
              </FieldRow>
              <FieldRow label="Costo">
                <input className="hw-input" type="number" value={np.costo} onChange={(e) => setNp({ ...np, costo: e.target.value })} />
              </FieldRow>
              <FieldRow label="Stock inicial">
                <input className="hw-input" type="number" value={np.stock} onChange={(e) => setNp({ ...np, stock: e.target.value })} />
              </FieldRow>
              <FieldRow label="Mínimo">
                <input className="hw-input" type="number" value={np.minimo} onChange={(e) => setNp({ ...np, minimo: e.target.value })} />
              </FieldRow>
            </div>
            <button className="hw-btn" style={{ width: "100%", justifyContent: "center", marginTop: 12 }} onClick={guardarNuevoProducto}>Crear y usar en esta línea</button>
          </div>
        </div>
      )}
    </div>
  );
}

function nextNcf(facturas) {
  const nums = facturas.map((f) => parseInt(f.ncf.replace("B02", ""), 10)).filter((n) => !isNaN(n));
  const max = nums.length ? Math.max(...nums) : 40;
  return "B02" + String(max + 1).padStart(8, "0");
}

function triggerPrint(formato) {
  let styleEl = document.getElementById("hw-dynamic-page-style");
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = "hw-dynamic-page-style";
    document.head.appendChild(styleEl);
  }
  styleEl.innerHTML = formato === "ticket"
    ? "@page { size: 80mm auto; margin: 4mm; }"
    : "@page { size: letter; margin: 14mm; }";
  setTimeout(() => window.print(), 50);
}

function triggerPrintLabel() {
  let styleEl = document.getElementById("hw-dynamic-page-style");
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = "hw-dynamic-page-style";
    document.head.appendChild(styleEl);
  }
  styleEl.innerHTML = "@page { size: 2in 1in; margin: 1.5mm; }";
  setTimeout(() => window.print(), 50);
}

async function guardarComoImagen(nodo, nombreArchivo) {
  if (!nodo) return;
  try {
    const canvas = await html2canvas(nodo, { scale: 3, backgroundColor: "#ffffff" });
    const link = document.createElement("a");
    link.download = nombreArchivo + ".png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  } catch (e) {
    console.error("No se pudo guardar la imagen:", e);
    alert("No se pudo guardar como imagen. Prueba con \"Imprimir / Guardar como PDF\".");
  }
}

async function guardarComoPDF(nodo, nombreArchivo, formato) {
  if (!nodo) return;
  try {
    const canvas = await html2canvas(nodo, { scale: 3, backgroundColor: "#ffffff" });
    const imgData = canvas.toDataURL("image/png");
    const pxToMm = 25.4 / (96 * 3);
    const imgWidthMm = canvas.width * pxToMm;
    const imgHeightMm = canvas.height * pxToMm;

    let pdf;
    if (formato === "ticket") {
      pdf = new jsPDF({ unit: "mm", format: [imgWidthMm, imgHeightMm] });
      pdf.addImage(imgData, "PNG", 0, 0, imgWidthMm, imgHeightMm);
    } else {
      pdf = new jsPDF({ unit: "mm", format: "letter" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const drawWidth = pageWidth - 20;
      const drawHeight = (imgHeightMm * drawWidth) / imgWidthMm;
      pdf.addImage(imgData, "PNG", 10, 10, drawWidth, drawHeight);
    }
    pdf.save(nombreArchivo + ".pdf");
  } catch (e) {
    console.error("No se pudo generar el PDF:", e);
    alert("No se pudo generar el PDF. Prueba con \"Imprimir\" y elige \"Guardar como PDF\" en el diálogo.");
  }
}

function EtiquetaPreview({ producto, onClose }) {
  const barcodeRef = useRef(null);
  useEffect(() => {
    if (barcodeRef.current && producto?.codigo) {
      try {
        JsBarcode(barcodeRef.current, producto.codigo, { format: "CODE128", width: 1.3, height: 30, displayValue: true, fontSize: 9, margin: 2 });
      } catch (e) { console.error("No se pudo generar el código de barras de la etiqueta:", e); }
    }
  }, [producto]);

  if (!producto) return null;
  return (
    <div className="hw-modal-overlay" onClick={onClose}>
      <div className="hw-modal" style={{ maxWidth: 320 }} onClick={(e) => e.stopPropagation()}>
        <div className="hw-modal-head"><div className="hw-modal-title">Etiqueta para imprimir</div><button className="hw-close" onClick={onClose}><X size={18} /></button></div>
        {!producto.codigo ? (
          <div style={{ color: "var(--red)", fontSize: 13.5, padding: "10px 0" }}>Este producto no tiene un código asignado. Agrégale uno en Inventario primero.</div>
        ) : (
          <>
            <div className="hw-print-paper" style={{ border: "1px dashed #ccc", padding: 12, textAlign: "center", margin: "10px 0", width: "2in", boxSizing: "border-box" }}>
              <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 4, wordBreak: "break-word" }}>{producto.nombre}</div>
              <svg ref={barcodeRef}></svg>
            </div>
            <button className="hw-btn" style={{ width: "100%", justifyContent: "center" }} onClick={triggerPrintLabel}><Printer size={15} /> Imprimir etiqueta</button>
            <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 8, textAlign: "center" }}>
              En el diálogo de impresión, elige tu impresora Zebra. El tamaño ya está ajustado para etiqueta pequeña (2 x 1 pulgadas) — puedes cambiarlo ahí mismo si tu etiqueta es de otro tamaño.
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PrintPreview({ doc, onClose, negocio }) {
  const [formato, setFormato] = useState("carta");
  const paperRef = useRef(null);
  const printPaperRef = useRef(null);
  const qrRef = useRef(null);
  const printQrRef = useRef(null);

  useEffect(() => {
    if (qrRef.current && doc?.numero) {
      const contenido = `${negocio.nombre} | Comprobante: ${doc.numero} | Fecha: ${doc.fecha}`;
      QRCode.toCanvas(qrRef.current, contenido, { width: 100, margin: 1 }, (err) => {
        if (err) console.error("No se pudo generar el código QR:", err);
      });
    }
    if (printQrRef.current && doc?.numero) {
      const contenido = `${negocio.nombre} | Comprobante: ${doc.numero} | Fecha: ${doc.fecha}`;
      QRCode.toCanvas(printQrRef.current, contenido, { width: 110, margin: 1 }, (err) => {
        if (err) console.error("No se pudo generar el código QR de impresión:", err);
      });
    }
  }, [doc?.numero, formato]);

  if (!doc) return null;
  const totals = calcTotal(doc.items, doc.aplicaItbis);
  const esFactura = doc.tipo === "Factura";

  return (
    <div className="hw-modal-overlay" onClick={onClose}>
      <div className="hw-modal" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
        <div className="hw-modal-head">
          <div className="hw-modal-title">Vista previa · {esFactura ? "Factura" : "Cotización"}</div>
          <button className="hw-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="hw-print-tabs">
          <button className={"hw-print-tab" + (formato === "carta" ? " active" : "")} onClick={() => setFormato("carta")}>Formato Carta</button>
          <button className={"hw-print-tab" + (formato === "ticket" ? " active" : "")} onClick={() => setFormato("ticket")}>Formato Ticket</button>
        </div>

        <div className="hw-paper-wrap">
          {formato === "carta" ? (
            <div className="hw-print-paper hw-paper-carta" ref={paperRef}>
              <div className="hw-paper-h1">{negocio.nombre}</div>
              {negocio.eslogan && <div style={{ fontStyle: "italic", fontSize: 11.5, color: "#666" }}>{negocio.eslogan}</div>}
              <div>{negocio.direccion}</div>
              <div>Tel/WhatsApp: {negocio.telefono}</div>
              <div className="hw-paper-line" />
              <div style={{ fontWeight: 700 }}>{esFactura ? "FACTURA DE CONSUMO" : "COTIZACIÓN"}</div>
              <div>{esFactura ? "NCF: " : "No.: "}{doc.numero}</div>
              <div>Fecha: {doc.fecha}{formatearFechaHora(doc.creadoEn) ? ` · Procesado: ${formatearFechaHora(doc.creadoEn)}` : ""}</div>
              <div className="hw-paper-line" />
              <div><b>Cliente:</b> {doc.clienteNombre}</div>
              {doc.clienteNegocio && <div>{doc.clienteNegocio}</div>}
              {doc.clienteRnc && <div>RNC/Cédula: {doc.clienteRnc}</div>}
              <div className="hw-paper-line" />
              <table className="hw-paper-table" style={{ width: "100%" }}>
                <thead><tr style={{ textAlign: "left", fontWeight: 700 }}><td>Descripción</td><td>Cant.</td><td>Precio</td><td style={{ textAlign: "right" }}>Total</td></tr></thead>
                <tbody>
                  {doc.items.map((it, i) => (
                    <tr key={i}><td>{it.nombre}</td><td>{it.cantidad}</td><td>{money(it.precio)}</td><td style={{ textAlign: "right" }}>{money(it.cantidad * it.precio)}</td></tr>
                  ))}
                </tbody>
              </table>
              <div className="hw-paper-line" />
              <div className="hw-paper-total-row"><span>Subtotal</span><span>{money(totals.sub)}</span></div>
              <div className="hw-paper-total-row"><span>{doc.aplicaItbis === false ? "ITBIS (exento)" : "ITBIS (18%)"}</span><span>{money(totals.itbis)}</span></div>
              <div className="hw-paper-total-row grand"><span>Total</span><span>{money(totals.total)}</span></div>
              {esFactura && doc.metodo && <div style={{ marginTop: 6 }}>Método de pago: {doc.metodo}</div>}
              {!esFactura && <div style={{ marginTop: 6 }}>Validez de la cotización: 15 días</div>}
              <div className="hw-paper-line" />
              <div style={{ textAlign: "center", color: "#777" }}>¡Gracias por su preferencia!</div>
              <div style={{ textAlign: "center", marginTop: 8 }}><canvas ref={qrRef}></canvas></div>
            </div>
          ) : (
            <div className="hw-print-paper hw-paper-ticket" ref={paperRef}>
              <div style={{ textAlign: "center" }}>
                <div className="hw-paper-h1" style={{ fontSize: 12 }}>{negocio.nombre}</div>
                {negocio.eslogan && <div style={{ fontStyle: "italic", fontSize: 10.5, color: "#666" }}>{negocio.eslogan}</div>}
                <div>{negocio.direccion}</div>
                <div>{negocio.telefono}</div>
              </div>
              <div className="hw-paper-line" />
              <div>{esFactura ? "FACTURA CONSUMO" : "COTIZACIÓN"}</div>
              <div>{esFactura ? "NCF: " : "No.: "}{doc.numero}</div>
              <div>Fecha: {doc.fecha}{formatearFechaHora(doc.creadoEn) ? ` · Procesado: ${formatearFechaHora(doc.creadoEn)}` : ""}</div>
              <div>Cliente: {doc.clienteNombre}</div>
              <div className="hw-paper-line" />
              {doc.items.map((it, i) => (
                <div key={i} style={{ marginBottom: 4 }}>
                  <div>{it.nombre}</div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>{it.cantidad} x {money(it.precio)}</span>
                    <span>{money(it.cantidad * it.precio)}</span>
                  </div>
                </div>
              ))}
              <div className="hw-paper-line" />
              <div className="hw-paper-total-row"><span>Subtotal</span><span>{money(totals.sub)}</span></div>
              <div className="hw-paper-total-row"><span>{doc.aplicaItbis === false ? "ITBIS (exento)" : "ITBIS"}</span><span>{money(totals.itbis)}</span></div>
              <div className="hw-paper-total-row grand"><span>TOTAL</span><span>{money(totals.total)}</span></div>
              {esFactura && doc.metodo && <div style={{ marginTop: 6 }}>Pago: {doc.metodo}</div>}
              <div className="hw-paper-line" />
              <div style={{ textAlign: "center" }}>¡Gracias por su preferencia!</div>
              <div style={{ textAlign: "center", marginTop: 8 }}><canvas ref={qrRef}></canvas></div>
            </div>
          )}
        </div>

        {createPortal(
          <div id="hw-print-target">
            {formato === "carta" ? (
              <div className="hwp-page" ref={printPaperRef}>
                <div className="hwp-header">
                  <div>
                    <div className="hwp-brand">{negocio.nombre}</div>
                    {negocio.eslogan && <div className="hwp-slogan">{negocio.eslogan}</div>}
                    <div className="hwp-contact">{negocio.direccion}</div>
                    <div className="hwp-contact">Tel/WhatsApp: {negocio.telefono}</div>
                  </div>
                  <div className="hwp-doctype">
                    <div className="hwp-doctype-label">{esFactura ? "FACTURA DE CONSUMO" : "COTIZACIÓN"}</div>
                    <div className="hwp-doctype-num">{esFactura ? "NCF " : "No. "}{doc.numero}</div>
                    <div className="hwp-doctype-date">Fecha: {doc.fecha}</div>
                    {formatearFechaHora(doc.creadoEn) && <div className="hwp-doctype-date">Procesado: {formatearFechaHora(doc.creadoEn)}</div>}
                    {doc.atendidoPor && <div className="hwp-doctype-date">Atendido por: {doc.atendidoPor}</div>}
                  </div>
                </div>
                <div className="hwp-rule" />
                <div className="hwp-cliente">
                  <div><b>Cliente:</b> {doc.clienteNombre}</div>
                  <div className="hwp-cliente-grid">
                    {doc.clienteNegocio && <div className="hwp-cliente-sub">Negocio: {doc.clienteNegocio}</div>}
                    {doc.clienteRnc && <div className="hwp-cliente-sub">RNC/Cédula: {doc.clienteRnc}</div>}
                    {doc.clienteTelefono && <div className="hwp-cliente-sub">Teléfono: {doc.clienteTelefono}</div>}
                    {doc.clienteCorreo && <div className="hwp-cliente-sub">Correo: {doc.clienteCorreo}</div>}
                    {doc.clienteDireccion && <div className="hwp-cliente-sub" style={{ gridColumn: "1 / -1" }}>Dirección: {doc.clienteDireccion}</div>}
                  </div>
                </div>
                <table className="hwp-table">
                  <thead><tr><td>Descripción</td><td>Cant.</td><td>Precio</td><td style={{ textAlign: "right" }}>Total</td></tr></thead>
                  <tbody>
                    {doc.items.map((it, i) => (
                      <tr key={i}><td>{it.nombre}</td><td>{it.cantidad}</td><td>{money(it.precio)}</td><td style={{ textAlign: "right" }}>{money(it.cantidad * it.precio)}</td></tr>
                    ))}
                  </tbody>
                </table>
                <div className="hwp-bottom">
                  <div className="hwp-notes">
                    {esFactura && doc.metodo && <div>Método de pago: {doc.metodo}</div>}
                    {!esFactura && <div>Validez de la cotización: 15 días</div>}
                  </div>
                  <div className="hwp-totals">
                    <div className="hwp-total-row"><span>Subtotal</span><span>{money(totals.sub)}</span></div>
                    <div className="hwp-total-row"><span>{doc.aplicaItbis === false ? "ITBIS (exento)" : "ITBIS (18%)"}</span><span>{money(totals.itbis)}</span></div>
                    <div className="hwp-total-row grand"><span>Total</span><span>{money(totals.total)}</span></div>
                  </div>
                </div>
                <div className="hwp-footer">
                  <div className="hwp-thanks-line">¡Gracias por su preferencia!</div>
                  <div className="hwp-qr-wrap"><canvas ref={printQrRef}></canvas></div>
                  <div className="hwp-warranty">
                    <b>Importante:</b> la garantía de los equipos nuevos es de 2 años y la de los equipos refurbished es de 1 mes. El servicio de instalación cubre una garantía de 3 meses.
                    Ninguna garantía cubre picos eléctricos ni mala manipulación del equipo por el cliente o terceros. Si el equipo presenta alteraciones en el sello de garantía, esta no aplica.
                    Gracias por su comprensión.
                  </div>
                  <div className="hwp-footer-text">Documento generado por {negocio.nombre}</div>
                </div>
              </div>
            ) : (
              <div className="hwp-ticket" ref={printPaperRef}>
                <div className="hwp-t-h1">{negocio.nombre}</div>
                {negocio.eslogan && <div style={{ fontStyle: "italic", fontSize: 10.5, color: "#666", textAlign: "center" }}>{negocio.eslogan}</div>}
                <div style={{ textAlign: "center" }}>{negocio.direccion}</div>
                <div style={{ textAlign: "center" }}>{negocio.telefono}</div>
                <div className="hwp-t-line" />
                <div>{esFactura ? "FACTURA CONSUMO" : "COTIZACIÓN"}</div>
                <div>{esFactura ? "NCF: " : "No.: "}{doc.numero}</div>
                <div>Fecha: {doc.fecha}{formatearFechaHora(doc.creadoEn) ? ` · Procesado: ${formatearFechaHora(doc.creadoEn)}` : ""}</div>
                {doc.atendidoPor && <div>Atendido por: {doc.atendidoPor}</div>}
                <div>Cliente: {doc.clienteNombre}</div>
                {doc.clienteNegocio && <div>Negocio: {doc.clienteNegocio}</div>}
                {doc.clienteRnc && <div>RNC/Cédula: {doc.clienteRnc}</div>}
                {doc.clienteTelefono && <div>Tel: {doc.clienteTelefono}</div>}
                {doc.clienteCorreo && <div>Correo: {doc.clienteCorreo}</div>}
                {doc.clienteDireccion && <div>Dirección: {doc.clienteDireccion}</div>}
                <div className="hwp-t-line" />
                {doc.items.map((it, i) => (
                  <div key={i} style={{ marginBottom: 4 }}>
                    <div>{it.nombre}</div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>{it.cantidad} x {money(it.precio)}</span>
                      <span>{money(it.cantidad * it.precio)}</span>
                    </div>
                  </div>
                ))}
                <div className="hwp-t-line" />
                <div className="hwp-t-total"><span>Subtotal</span><span>{money(totals.sub)}</span></div>
                <div className="hwp-t-total"><span>{doc.aplicaItbis === false ? "ITBIS (exento)" : "ITBIS"}</span><span>{money(totals.itbis)}</span></div>
                <div className="hwp-t-total grand"><span>TOTAL</span><span>{money(totals.total)}</span></div>
                {esFactura && doc.metodo && <div style={{ marginTop: 6 }}>Pago: {doc.metodo}</div>}
                <div className="hwp-t-line" />
                <div style={{ textAlign: "center" }}>¡Gracias por su preferencia!</div>
                <div style={{ textAlign: "center", marginTop: 8 }}><canvas ref={printQrRef}></canvas></div>
                <div className="hwp-t-warranty">
                  <b>Importante:</b> garantía equipos nuevos 2 años, refurbished 1 mes. Instalación: 3 meses. No cubre picos eléctricos, mal manejo por el cliente/terceros ni sello de garantía alterado. Gracias por su comprensión.
                </div>
              </div>
            )}
          </div>,
          document.body
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <button className="hw-btn ghost" style={{ flex: 1, justifyContent: "center" }} onClick={() => guardarComoPDF(printPaperRef.current, `${esFactura ? "factura" : "cotizacion"}-${doc.numero}`, formato)}>
            <Download size={15} /> Guardar PDF
          </button>
          <button className="hw-btn" style={{ flex: 1, justifyContent: "center" }} onClick={() => triggerPrint(formato)}>
            <Printer size={15} /> Imprimir
          </button>
        </div>
        <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 8, textAlign: "center" }}>
          "Guardar PDF" descarga el ticket como PDF (ideal para enviar por WhatsApp). "Imprimir" abre el diálogo de tu impresora física.
        </div>
      </div>
    </div>
  );
}

function Facturacion({ facturas, setFacturas, clientes, productos, setProductos, negocio, miEmail }) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [printDoc, setPrintDoc] = useState(null);
  const [clienteId, setClienteId] = useState("");
  const [metodo, setMetodo] = useState("Efectivo");
  const [estadoPago, setEstadoPago] = useState("Pagada");
  const [aplicaItbis, setAplicaItbis] = useState(true);
  const [tipoComprobante, setTipoComprobante] = useState("Consumidor Final");
  const [ncfManualTexto, setNcfManualTexto] = useState("");
  const [items, setItems] = useState([{ nombre: "", cantidad: 1, precio: 0 }]);
  const totals = calcTotal(items.filter((i) => i.nombre), aplicaItbis);

  function abrirNueva() {
    setEditingId(null);
    setClienteId("");
    setMetodo("Efectivo");
    setEstadoPago("Pagada");
    setAplicaItbis(true);
    setTipoComprobante("Consumidor Final");
    setNcfManualTexto("");
    setItems([{ nombre: "", cantidad: 1, precio: 0 }]);
    setOpen(true);
  }

  function abrirEdicion(f) {
    setEditingId(f.id);
    setClienteId(f.clienteId || clientes.find((c) => c.nombre === f.clienteNombre)?.id || "");
    setMetodo(f.metodo);
    setEstadoPago(f.estado === "Pendiente" ? "Pendiente" : "Pagada");
    setAplicaItbis(f.aplicaItbis !== false);
    setTipoComprobante(f.tipoComprobante || "Consumidor Final");
    setNcfManualTexto(f.ncfManual ? f.ncf : "");
    setItems(f.items);
    setOpen(true);
  }

  function guardar() {
    const cliente = clientes.find((c) => c.id === clienteId);
    if (!cliente) { alert("Selecciona el cliente antes de guardar la factura."); return; }
    if (items.every((i) => !i.nombre)) { alert("Agrega al menos un producto o servicio."); return; }
    const esManual = tipoComprobante !== "Consumidor Final" && tipoComprobante !== "Factura de Consumo";
    if (esManual && !ncfManualTexto.trim()) { alert("Escribe el número de comprobante para este tipo de factura."); return; }
    if (editingId) {
      setFacturas(facturas.map((f) => (f.id === editingId ? {
        ...f, clienteId: cliente.id, clienteNombre: cliente.nombre, items: items.filter((i) => i.nombre), metodo,
        estado: f.estado === "Anulada" ? f.estado : estadoPago, aplicaItbis,
        tipoComprobante, ncfManual: esManual, ncf: esManual ? ncfManualTexto.trim() : f.ncf,
      } : f)));
    } else {
      const nueva = {
        id: uid(), ncf: esManual ? ncfManualTexto.trim() : nextNcf(facturas), clienteId: cliente.id, clienteNombre: cliente.nombre,
        fecha: new Date().toISOString().slice(0, 10), creadoEn: new Date().toISOString(), items: items.filter((i) => i.nombre), metodo, estado: estadoPago, abono: 0, aplicaItbis,
        tipoComprobante, ncfManual: esManual,
      };
      setFacturas([...facturas, nueva]);
    }
    setOpen(false);
    setEditingId(null);
  }

  function anular(id) {
    setFacturas(facturas.map((f) => (f.id === id ? { ...f, estado: "Anulada" } : f)));
  }

  function abrirImpresion(f) {
    const cliente = clientes.find((c) => c.id === f.clienteId);
    setPrintDoc({ tipo: "Factura", numero: f.ncf, fecha: f.fecha, clienteNombre: f.clienteNombre, clienteNegocio: cliente?.negocio, clienteRnc: cliente?.rnc, clienteTelefono: cliente?.telefono, clienteCorreo: cliente?.correo, clienteDireccion: cliente?.direccion, items: f.items, metodo: f.metodo, tipoComprobante: f.tipoComprobante, aplicaItbis: f.aplicaItbis, creadoEn: f.creadoEn, atendidoPor: nombreUsuario(miEmail) });
  }

  function whatsappFactura(f) {
    const cliente = clientes.find((c) => c.id === f.clienteId) || clientes.find((c) => c.nombre === f.clienteNombre);
    const total = calcTotal(f.items, f.aplicaItbis).total;
    const mensaje = `Hola ${f.clienteNombre}, le compartimos su factura ${f.ncf} de ${negocio.nombre}.\nFecha: ${f.fecha}\nTotal: ${money(total)}\nMétodo de pago: ${f.metodo}\n\n¡Gracias por su preferencia!`;
    enviarWhatsApp(cliente?.telefono, mensaje);
  }

  return (
    <div>
      <div className="hw-header">
        <div><div className="hw-title">Facturación</div><div className="hw-sub">{facturas.length} facturas registradas · Factura de Consumo (NCF B02)</div></div>
        <button className="hw-btn" onClick={abrirNueva}><Plus size={15} /> Nueva factura</button>
      </div>

      <div className="hw-panel">
        <table className="hw-table hw-t-facturas">
          <thead><tr><th>NCF</th><th>Cliente</th><th>Fecha</th><th>Método</th><th>Total</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            {facturas.slice().reverse().map((f) => {
              const t = calcTotal(f.items, f.aplicaItbis);
              return (
                <tr key={f.id}>
                  <td><span className="hw-ncf-stub">{f.ncf}</span></td>
                  <td>{f.clienteNombre}</td>
                  <td>{f.fecha}</td>
                  <td>{f.metodo}</td>
                  <td>{money(t.total)}</td>
                  <td><EstadoBadge estado={f.estado} /></td>
                  <td style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button className="hw-btn ghost small" onClick={() => abrirEdicion(f)}><Edit2 size={12} /> Editar</button>
                    <button className="hw-btn soft-blue small" onClick={() => abrirImpresion(f)}><Printer size={12} /> Imprimir</button>
                    <button className="hw-btn soft-green small" onClick={() => whatsappFactura(f)}><MessageCircle size={12} /> WhatsApp</button>
                    {f.estado !== "Anulada" && <button className="hw-btn soft-red small" onClick={() => anular(f.id)}>Anular</button>}
                  </td>
                </tr>
              );
            })}
            {facturas.length === 0 && <tr><td colSpan={7} className="hw-empty">Sin facturas todavía</td></tr>}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="hw-modal-overlay" onClick={() => setOpen(false)}>
          <div className="hw-modal" onClick={(e) => e.stopPropagation()}>
            <div className="hw-modal-head"><div className="hw-modal-title">{editingId ? "Editar factura " + facturas.find((f) => f.id === editingId)?.ncf : <>Nueva factura · próximo NCF <span className="hw-mono">{nextNcf(facturas)}</span></>}</div><button className="hw-close" onClick={() => setOpen(false)}><X size={18} /></button></div>
            <FieldRow label="Tipo de comprobante">
              <select className="hw-select" value={tipoComprobante} onChange={(e) => setTipoComprobante(e.target.value)}>
                <option>Consumidor Final</option>
                <option>Factura de Consumo</option>
                <option>Factura Electrónica (e-CF 32 · Consumo)</option>
                <option>Factura de Régimen Especial (e-CF 44)</option>
                <option>Factura Gubernamental (e-CF 45)</option>
              </select>
            </FieldRow>
            {tipoComprobante !== "Consumidor Final" && tipoComprobante !== "Factura de Consumo" && (
              <FieldRow label="Número de comprobante (e-NCF) *">
                <input className="hw-input" placeholder={
                  tipoComprobante.includes("44") ? "Ej. E440000000001" :
                  tipoComprobante.includes("45") ? "Ej. E450000000001" : "Ej. E320000000001"
                } value={ncfManualTexto} onChange={(e) => setNcfManualTexto(e.target.value)} />
                <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 4 }}>Este número lo genera tu sistema de facturación electrónica (aún no está integrado aquí) — escríbelo manualmente por ahora.</div>
              </FieldRow>
            )}
            <FieldRow label="Cliente *">
              <select className="hw-select" value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
                <option value="">Seleccionar cliente...</option>
                {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}{c.negocio ? " · " + c.negocio : ""}</option>)}
              </select>
            </FieldRow>
            <FieldRow label="Método de pago">
              <select className="hw-select" value={metodo} onChange={(e) => setMetodo(e.target.value)}>
                <option>Efectivo</option><option>Tarjeta</option><option>Transferencia</option>
              </select>
            </FieldRow>
            <FieldRow label="Estado de pago">
              <select className="hw-select" value={estadoPago} onChange={(e) => setEstadoPago(e.target.value)}>
                <option value="Pagada">Pagada (de contado)</option>
                <option value="Pendiente">Pendiente (a crédito)</option>
              </select>
            </FieldRow>
            <FieldRow label="ITBIS">
              <select className="hw-select" value={aplicaItbis ? "con" : "sin"} onChange={(e) => setAplicaItbis(e.target.value === "con")}>
                <option value="con">Con ITBIS (18%)</option>
                <option value="sin">Sin ITBIS (exento)</option>
              </select>
            </FieldRow>
            <FieldRow label="Productos / servicios"><ItemsEditor items={items} setItems={setItems} productos={productos} setProductos={setProductos} /></FieldRow>
            <div style={{ marginTop: 10 }}>
              <div className="hw-total-row"><span>Subtotal</span><span>{money(totals.sub)}</span></div>
              <div className="hw-total-row"><span>{aplicaItbis ? "ITBIS (18%)" : "ITBIS (exento)"}</span><span>{money(totals.itbis)}</span></div>
              <div className="hw-total-row grand"><span>Total</span><span>{money(totals.total)}</span></div>
            </div>
            <button className="hw-btn" style={{ width: "100%", justifyContent: "center", marginTop: 12 }} onClick={guardar}>{editingId ? "Actualizar factura" : "Generar factura"}</button>
          </div>
        </div>
      )}
      <PrintPreview doc={printDoc} onClose={() => setPrintDoc(null)} negocio={negocio} />
    </div>
  );
}

function nextCot(cotizaciones) {
  const nums = cotizaciones.map((c) => parseInt(c.numero.replace("COT-", ""), 10)).filter((n) => !isNaN(n));
  const max = nums.length ? Math.max(...nums) : 197;
  return "COT-" + String(max + 1).padStart(4, "0");
}

function Cotizaciones({ cotizaciones, setCotizaciones, clientes, productos, setProductos, setFacturas, setTab, negocio, miEmail }) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [printDoc, setPrintDoc] = useState(null);
  const [clienteId, setClienteId] = useState("");
  const [items, setItems] = useState([{ nombre: "", cantidad: 1, precio: 0 }]);
  const totals = calcTotal(items.filter((i) => i.nombre));

  function abrirNueva() {
    setEditingId(null);
    setClienteId("");
    setItems([{ nombre: "", cantidad: 1, precio: 0 }]);
    setOpen(true);
  }

  function abrirEdicion(c) {
    setEditingId(c.id);
    setClienteId(clientes.find((cl) => cl.nombre === c.clienteNombre)?.id || "");
    setItems(c.items);
    setOpen(true);
  }

  function guardar() {
    const cliente = clientes.find((c) => c.id === clienteId);
    if (!cliente) { alert("Selecciona el cliente antes de guardar la cotización."); return; }
    if (items.every((i) => !i.nombre)) { alert("Agrega al menos un producto o servicio."); return; }
    if (editingId) {
      setCotizaciones(cotizaciones.map((c) => (c.id === editingId ? { ...c, clienteNombre: cliente.nombre, items: items.filter((i) => i.nombre) } : c)));
    } else {
      setCotizaciones([...cotizaciones, {
        id: uid(), numero: nextCot(cotizaciones), clienteNombre: cliente.nombre,
        fecha: new Date().toISOString().slice(0, 10), creadoEn: new Date().toISOString(), items: items.filter((i) => i.nombre), estado: "Pendiente",
      }]);
    }
    setOpen(false);
    setEditingId(null);
  }

  function marcar(id, estado) {
    setCotizaciones(cotizaciones.map((c) => (c.id === id ? { ...c, estado } : c)));
  }

  function convertir(c) {
    setFacturas((prev) => [...prev, {
      id: uid(), ncf: nextNcf(prev), clienteId: null, clienteNombre: c.clienteNombre,
      fecha: new Date().toISOString().slice(0, 10), creadoEn: new Date().toISOString(), items: c.items, metodo: "Efectivo", estado: "Pagada", abono: 0,
    }]);
    marcar(c.id, "Aprobada");
    setTab("facturacion");
  }

  function abrirImpresion(c) {
    const cliente = clientes.find((cl) => cl.nombre === c.clienteNombre);
    setPrintDoc({ tipo: "Cotización", numero: c.numero, fecha: c.fecha, clienteNombre: c.clienteNombre, clienteNegocio: cliente?.negocio, clienteRnc: cliente?.rnc, clienteTelefono: cliente?.telefono, clienteCorreo: cliente?.correo, clienteDireccion: cliente?.direccion, items: c.items, creadoEn: c.creadoEn, atendidoPor: nombreUsuario(miEmail) });
  }

  function whatsappCotizacion(c) {
    const cliente = clientes.find((cl) => cl.nombre === c.clienteNombre);
    const total = calcTotal(c.items).total;
    const mensaje = `Hola ${c.clienteNombre}, le compartimos su cotización ${c.numero} de ${negocio.nombre}.\nFecha: ${c.fecha}\nTotal: ${money(total)}\nValidez: 15 días\n\nQuedamos atentos a su aprobación.`;
    enviarWhatsApp(cliente?.telefono, mensaje);
  }

  return (
    <div>
      <div className="hw-header">
        <div><div className="hw-title">Cotizaciones</div><div className="hw-sub">{cotizaciones.length} cotizaciones registradas</div></div>
        <button className="hw-btn" onClick={abrirNueva}><Plus size={15} /> Nueva cotización</button>
      </div>

      <div className="hw-panel">
        <table className="hw-table hw-t-cotizaciones">
          <thead><tr><th>No.</th><th>Cliente</th><th>Fecha</th><th>Total</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            {cotizaciones.slice().reverse().map((c) => {
              const t = calcTotal(c.items);
              return (
                <tr key={c.id}>
                  <td className="hw-mono">{c.numero}</td>
                  <td>{c.clienteNombre}</td>
                  <td>{c.fecha}</td>
                  <td>{money(t.total)}</td>
                  <td><EstadoBadge estado={c.estado} /></td>
                  <td style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button className="hw-btn ghost small" onClick={() => abrirEdicion(c)}><Edit2 size={12} /> Editar</button>
                    <button className="hw-btn soft-blue small" onClick={() => abrirImpresion(c)}><Printer size={12} /> Imprimir</button>
                    <button className="hw-btn soft-green small" onClick={() => whatsappCotizacion(c)}><MessageCircle size={12} /> WhatsApp</button>
                    {c.estado === "Pendiente" && (
                      <>
                        <button className="hw-btn soft-green small" onClick={() => convertir(c)}><Check size={12} /> Aprobar → Factura</button>
                        <button className="hw-btn soft-red small" onClick={() => marcar(c.id, "Rechazada")}>Rechazar</button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
            {cotizaciones.length === 0 && <tr><td colSpan={6} className="hw-empty">Sin cotizaciones todavía</td></tr>}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="hw-modal-overlay" onClick={() => setOpen(false)}>
          <div className="hw-modal" onClick={(e) => e.stopPropagation()}>
            <div className="hw-modal-head"><div className="hw-modal-title">{editingId ? "Editar cotización " + cotizaciones.find((c) => c.id === editingId)?.numero : "Nueva cotización · " + nextCot(cotizaciones)}</div><button className="hw-close" onClick={() => setOpen(false)}><X size={18} /></button></div>
            <FieldRow label="Cliente *">
              <select className="hw-select" value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
                <option value="">Seleccionar cliente...</option>
                {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}{c.negocio ? " · " + c.negocio : ""}</option>)}
              </select>
            </FieldRow>
            <FieldRow label="Productos / servicios"><ItemsEditor items={items} setItems={setItems} productos={productos} setProductos={setProductos} /></FieldRow>
            <div style={{ marginTop: 10 }}>
              <div className="hw-total-row"><span>Subtotal</span><span>{money(totals.sub)}</span></div>
              <div className="hw-total-row"><span>ITBIS (18%)</span><span>{money(totals.itbis)}</span></div>
              <div className="hw-total-row grand"><span>Total</span><span>{money(totals.total)}</span></div>
            </div>
            <button className="hw-btn" style={{ width: "100%", justifyContent: "center", marginTop: 12 }} onClick={guardar}>{editingId ? "Actualizar cotización" : "Generar cotización"}</button>
          </div>
        </div>
      )}
      <PrintPreview doc={printDoc} onClose={() => setPrintDoc(null)} negocio={negocio} />
    </div>
  );
}

const ESTADOS_RECEPCION = ["Recibido", "En diagnóstico", "En reparación", "Esperando repuesto", "Listo", "Entregado"];

function nextRec(recepciones) {
  const nums = recepciones.map((r) => parseInt(r.numero.replace("REC-", ""), 10)).filter((n) => !isNaN(n));
  const max = nums.length ? Math.max(...nums) : 30;
  return "REC-" + String(max + 1).padStart(4, "0");
}

function RecepcionEquipos({ recepciones, setRecepciones, clientes }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ clienteId: "", tipo: "", marcaModelo: "", serie: "", accesorios: "", falla: "", tecnico: "" });

  function crear() {
    const cliente = clientes.find((c) => c.id === form.clienteId);
    if (!cliente || !form.tipo.trim()) return;
    setRecepciones([...recepciones, {
      id: uid(), numero: nextRec(recepciones), clienteNombre: cliente.nombre, tipo: form.tipo, marcaModelo: form.marcaModelo,
      serie: form.serie, accesorios: form.accesorios, falla: form.falla, tecnico: form.tecnico, estado: "Recibido",
      fecha: new Date().toISOString().slice(0, 10),
    }]);
    setForm({ clienteId: "", tipo: "", marcaModelo: "", serie: "", accesorios: "", falla: "", tecnico: "" });
    setOpen(false);
  }

  function cambiarEstado(id, estado) {
    setRecepciones(recepciones.map((r) => (r.id === id ? { ...r, estado } : r)));
    if (selected?.id === id) setSelected({ ...selected, estado });
  }

  return (
    <div>
      <div className="hw-header">
        <div><div className="hw-title">Recepción de equipos</div><div className="hw-sub">{recepciones.length} equipos registrados para diagnóstico o reparación</div></div>
        <button className="hw-btn" onClick={() => setOpen(true)}><Plus size={15} /> Recibir equipo</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: selected ? "1.3fr 1fr" : "1fr", gap: 16 }}>
        <div className="hw-panel">
          <table className="hw-table hw-t-recepcion">
            <thead><tr><th>No.</th><th>Cliente</th><th>Equipo</th><th>Técnico</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {recepciones.slice().reverse().map((r) => (
                <tr key={r.id} style={{ cursor: "pointer" }} onClick={() => setSelected(r)}>
                  <td className="hw-mono">{r.numero}</td>
                  <td>{r.clienteNombre}</td>
                  <td>{r.tipo}<div className="hw-quick-meta">{r.marcaModelo}</div></td>
                  <td>{r.tecnico || "—"}</td>
                  <td><EstadoBadge estado={r.estado} /></td>
                  <td><button className="hw-btn soft-purple small" onClick={(e) => { e.stopPropagation(); setSelected(r); }}>Ver</button></td>
                </tr>
              ))}
              {recepciones.length === 0 && <tr><td colSpan={6} className="hw-empty">No hay equipos registrados</td></tr>}
            </tbody>
          </table>
        </div>

        {selected && (
          <div className="hw-panel">
            <div className="hw-panel-head">
              <div className="hw-panel-title">{selected.numero} · {selected.tipo}</div>
              <button className="hw-close" onClick={() => setSelected(null)}><X size={16} /></button>
            </div>
            <div style={{ padding: 18, fontSize: 13 }}>
              <p><b>Cliente:</b> {selected.clienteNombre}</p>
              <p><b>Marca/Modelo:</b> {selected.marcaModelo || "—"}</p>
              <p><b>Serie:</b> {selected.serie || "—"}</p>
              <p><b>Accesorios:</b> {selected.accesorios || "—"}</p>
              <p><b>Técnico asignado:</b> {selected.tecnico || "—"}</p>
              <p><b>Fecha recepción:</b> {selected.fecha}</p>
              {selected.falla && <p style={{ background: "var(--purple-soft)", padding: "8px 10px", borderRadius: 8, marginTop: 10 }}><b>Falla reportada:</b> {selected.falla}</p>}
              <div style={{ marginTop: 16 }}>
                <div className="hw-panel-title" style={{ marginBottom: 8 }}>Cambiar estado</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {ESTADOS_RECEPCION.map((e) => (
                    <button key={e} className={"hw-btn small " + (e === selected.estado ? "" : "ghost")} onClick={() => cambiarEstado(selected.id, e)}>{e}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {open && (
        <div className="hw-modal-overlay" onClick={() => setOpen(false)}>
          <div className="hw-modal" onClick={(e) => e.stopPropagation()}>
            <div className="hw-modal-head"><div className="hw-modal-title">Recibir equipo · {nextRec(recepciones)}</div><button className="hw-close" onClick={() => setOpen(false)}><X size={18} /></button></div>
            <FieldRow label="Cliente *">
              <select className="hw-select" value={form.clienteId} onChange={(e) => setForm({ ...form, clienteId: e.target.value })}>
                <option value="">Seleccionar cliente...</option>
                {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}{c.negocio ? " · " + c.negocio : ""}</option>)}
              </select>
            </FieldRow>
            <FieldRow label="Tipo de equipo *"><input className="hw-input" placeholder="Ej. Laptop, DVR, cámara IP..." value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} /></FieldRow>
            <FieldRow label="Marca / Modelo"><input className="hw-input" value={form.marcaModelo} onChange={(e) => setForm({ ...form, marcaModelo: e.target.value })} /></FieldRow>
            <FieldRow label="No. de serie"><input className="hw-input" value={form.serie} onChange={(e) => setForm({ ...form, serie: e.target.value })} /></FieldRow>
            <FieldRow label="Accesorios entregados"><input className="hw-input" value={form.accesorios} onChange={(e) => setForm({ ...form, accesorios: e.target.value })} /></FieldRow>
            <FieldRow label="Falla reportada"><textarea className="hw-input" rows={2} value={form.falla} onChange={(e) => setForm({ ...form, falla: e.target.value })} /></FieldRow>
            <FieldRow label="Técnico asignado"><input className="hw-input" value={form.tecnico} onChange={(e) => setForm({ ...form, tecnico: e.target.value })} /></FieldRow>
            <button className="hw-btn" style={{ width: "100%", justifyContent: "center", marginTop: 6 }} onClick={crear}>Registrar recepción</button>
          </div>
        </div>
      )}
    </div>
  );
}

function nextOt(ordenes) {
  const nums = ordenes.map((o) => parseInt(o.numero.replace("OT-", ""), 10)).filter((n) => !isNaN(n));
  const max = nums.length ? Math.max(...nums) : 70;
  return "OT-" + String(max + 1).padStart(4, "0");
}

function OrdenesTrabajo({ ordenes, setOrdenes, clientes }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ clienteId: "", tipo: "", direccion: "", descripcion: "", tecnico: "" });

  function crear() {
    const cliente = clientes.find((c) => c.id === form.clienteId);
    if (!cliente || !form.tipo) return;
    setOrdenes([...ordenes, {
      id: uid(), numero: nextOt(ordenes), clienteNombre: cliente.nombre, tipo: form.tipo, direccion: form.direccion,
      descripcion: form.descripcion, tecnico: form.tecnico, estado: "Agendada", fecha: new Date().toISOString().slice(0, 10),
    }]);
    setForm({ clienteId: "", tipo: "", direccion: "", descripcion: "", tecnico: "" });
    setOpen(false);
  }

  function cambiarEstado(id, estado) {
    setOrdenes(ordenes.map((o) => (o.id === id ? { ...o, estado } : o)));
    if (selected?.id === id) setSelected({ ...selected, estado });
  }

  return (
    <div>
      <div className="hw-header">
        <div><div className="hw-title">Órdenes de trabajo</div><div className="hw-sub">{ordenes.length} órdenes de instalación, desarrollo o soporte</div></div>
        <button className="hw-btn" onClick={() => setOpen(true)}><Plus size={15} /> Nueva orden</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: selected ? "1.3fr 1fr" : "1fr", gap: 16 }}>
        <div className="hw-panel">
          <table className="hw-table hw-t-ordenes">
            <thead><tr><th>No.</th><th>Cliente</th><th>Tipo de trabajo</th><th>Técnico</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {ordenes.slice().reverse().map((o) => (
                <tr key={o.id} style={{ cursor: "pointer" }} onClick={() => setSelected(o)}>
                  <td className="hw-mono">{o.numero}</td>
                  <td>{o.clienteNombre}</td>
                  <td>{o.tipo}</td>
                  <td>{o.tecnico || "—"}</td>
                  <td><EstadoBadge estado={o.estado} /></td>
                  <td><button className="hw-btn soft-jade small" onClick={(e) => { e.stopPropagation(); setSelected(o); }}>Ver</button></td>
                </tr>
              ))}
              {ordenes.length === 0 && <tr><td colSpan={6} className="hw-empty">No hay órdenes de trabajo registradas</td></tr>}
            </tbody>
          </table>
        </div>

        {selected && (
          <div className="hw-panel">
            <div className="hw-panel-head">
              <div className="hw-panel-title">{selected.numero} · {selected.tipo}</div>
              <button className="hw-close" onClick={() => setSelected(null)}><X size={16} /></button>
            </div>
            <div style={{ padding: 18, fontSize: 13 }}>
              <p><b>Cliente:</b> {selected.clienteNombre}</p>
              {selected.direccion && <p style={{ display: "flex", alignItems: "flex-start", gap: 6 }}><MapPin size={14} style={{ marginTop: 2, flexShrink: 0 }} /> {selected.direccion}</p>}
              <p><b>Técnico asignado:</b> {selected.tecnico || "—"}</p>
              <p><b>Fecha programada:</b> {selected.fecha}</p>
              {selected.descripcion && <p style={{ background: "var(--jade-soft)", padding: "8px 10px", borderRadius: 8, marginTop: 10 }}><b>Descripción del trabajo:</b> {selected.descripcion}</p>}
              <div style={{ marginTop: 16 }}>
                <div className="hw-panel-title" style={{ marginBottom: 8 }}>Cambiar estado</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {ESTADOS_ORDEN.map((e) => (
                    <button key={e} className={"hw-btn small " + (e === selected.estado ? "" : "ghost")} onClick={() => cambiarEstado(selected.id, e)}>{e}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {open && (
        <div className="hw-modal-overlay" onClick={() => setOpen(false)}>
          <div className="hw-modal" onClick={(e) => e.stopPropagation()}>
            <div className="hw-modal-head"><div className="hw-modal-title">Nueva orden · {nextOt(ordenes)}</div><button className="hw-close" onClick={() => setOpen(false)}><X size={18} /></button></div>
            <FieldRow label="Cliente *">
              <select className="hw-select" value={form.clienteId} onChange={(e) => setForm({ ...form, clienteId: e.target.value })}>
                <option value="">Seleccionar cliente...</option>
                {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}{c.negocio ? " · " + c.negocio : ""}</option>)}
              </select>
            </FieldRow>
            <FieldRow label="Tipo de trabajo *">
              <select className="hw-select" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                <option value="">Seleccionar...</option>
                {TIPOS_TRABAJO.map((t) => <option key={t}>{t}</option>)}
              </select>
            </FieldRow>
            <FieldRow label="Dirección del trabajo"><input className="hw-input" value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} /></FieldRow>
            <FieldRow label="Descripción"><textarea className="hw-input" rows={2} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} /></FieldRow>
            <FieldRow label="Técnico asignado"><input className="hw-input" value={form.tecnico} onChange={(e) => setForm({ ...form, tecnico: e.target.value })} /></FieldRow>
            <button className="hw-btn" style={{ width: "100%", justifyContent: "center", marginTop: 6 }} onClick={crear}>Crear orden de trabajo</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Caja({ sesiones, setSesiones, movimientos, setMovimientos, facturas, miEmail }) {
  const hoy = new Date().toISOString().slice(0, 10);
  const sesionAbierta = sesiones.find((s) => s.estado === "Abierta");
  const [montoApertura, setMontoApertura] = useState("");
  const [cerrando, setCerrando] = useState(false);
  const [montoContado, setMontoContado] = useState("");
  const [movTipo, setMovTipo] = useState("Entrada");
  const [movMonto, setMovMonto] = useState("");
  const [movDesc, setMovDesc] = useState("");

  const movSesion = sesionAbierta ? movimientos.filter((m) => m.sesionId === sesionAbierta.id) : [];
  const ventasEfectivo = sesionAbierta
    ? facturas.filter((f) => f.fecha === sesionAbierta.fecha && f.metodo === "Efectivo" && f.estado !== "Anulada").reduce((s, f) => s + calcTotal(f.items, f.aplicaItbis).total, 0)
    : 0;
  const entradas = movSesion.filter((m) => m.tipo === "Entrada").reduce((s, m) => s + Number(m.monto), 0);
  const salidas = movSesion.filter((m) => m.tipo !== "Entrada").reduce((s, m) => s + Number(m.monto), 0);
  const esperado = sesionAbierta ? Number(sesionAbierta.montoApertura || 0) + ventasEfectivo + entradas - salidas : 0;

  function abrirCaja() {
    setSesiones([...sesiones, { id: uid(), fecha: hoy, montoApertura: Number(montoApertura) || 0, estado: "Abierta", usuarioEmail: miEmail }]);
    setMontoApertura("");
  }
  function agregarMovimiento() {
    if (!sesionAbierta || !movMonto) return;
    setMovimientos([...movimientos, { id: uid(), sesionId: sesionAbierta.id, tipo: movTipo, monto: Number(movMonto) || 0, descripcion: movDesc, fechaHora: new Date().toISOString() }]);
    setMovMonto("");
    setMovDesc("");
  }
  function cerrarCaja() {
    const contado = Number(montoContado) || 0;
    setSesiones(sesiones.map((s) => (s.id === sesionAbierta.id ? { ...s, estado: "Cerrada", montoCierre: contado, montoEsperado: esperado, diferencia: contado - esperado } : s)));
    setCerrando(false);
    setMontoContado("");
  }

  return (
    <div>
      <div className="hw-header">
        <div><div className="hw-title">Caja</div><div className="hw-sub">{sesionAbierta ? "Caja abierta desde " + sesionAbierta.fecha : "No hay caja abierta"}</div></div>
        {!sesionAbierta && <button className="hw-btn" onClick={abrirCaja}><Plus size={15} /> Abrir caja</button>}
      </div>

      {sesionAbierta ? (
        <>
          <div className="hw-grid" style={{ marginBottom: 16 }}>
            <div className="hw-card">
              <div className="hw-kpi-top"><div className="hw-kpi-icon" style={{ background: "var(--green-soft)" }}><Banknote size={17} color="var(--green)" /></div></div>
              <div className="hw-kpi-label">Monto de apertura</div>
              <div className="hw-kpi-value">{money(sesionAbierta.montoApertura)}</div>
            </div>
            <div className="hw-card">
              <div className="hw-kpi-top"><div className="hw-kpi-icon" style={{ background: "var(--blue-soft)" }}><Wallet size={17} color="var(--blue)" /></div></div>
              <div className="hw-kpi-label">Ventas en efectivo hoy</div>
              <div className="hw-kpi-value">{money(ventasEfectivo)}</div>
            </div>
            <div className="hw-card">
              <div className="hw-kpi-top"><div className="hw-kpi-icon" style={{ background: "var(--accent-soft)" }}><Coins size={17} color="var(--accent2)" /></div></div>
              <div className="hw-kpi-label">Entradas − salidas manuales</div>
              <div className="hw-kpi-value">{money(entradas - salidas)}</div>
            </div>
            <div className="hw-card">
              <div className="hw-kpi-top"><div className="hw-kpi-icon" style={{ background: "var(--red-soft)" }}><ShieldAlert size={17} color="var(--red)" /></div></div>
              <div className="hw-kpi-label">Efectivo esperado</div>
              <div className="hw-kpi-value">{money(esperado)}</div>
            </div>
          </div>

          <div className="hw-panel" style={{ padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 10 }}>Registrar movimiento</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <select className="hw-select" value={movTipo} onChange={(e) => setMovTipo(e.target.value)} style={{ maxWidth: 140 }}>
                <option>Entrada</option><option>Salida</option><option>Gasto</option>
              </select>
              <input className="hw-input" type="number" placeholder="Monto" value={movMonto} onChange={(e) => setMovMonto(e.target.value)} style={{ maxWidth: 130 }} />
              <input className="hw-input" placeholder="Descripción" value={movDesc} onChange={(e) => setMovDesc(e.target.value)} style={{ flex: 1, minWidth: 160 }} />
              <button className="hw-btn" onClick={agregarMovimiento}><Plus size={14} /> Agregar</button>
            </div>
          </div>

          <div className="hw-panel" style={{ marginBottom: 16 }}>
            <table className="hw-table hw-t-cajamov">
              <thead><tr><th>Hora</th><th>Tipo</th><th>Monto</th><th>Descripción</th></tr></thead>
              <tbody>
                {movSesion.slice().reverse().map((m) => (
                  <tr key={m.id}>
                    <td>{new Date(m.fechaHora).toLocaleTimeString("es-DO", { hour: "2-digit", minute: "2-digit" })}</td>
                    <td>{m.tipo}</td>
                    <td>{money(m.monto)}</td>
                    <td>{m.descripcion}</td>
                  </tr>
                ))}
                {movSesion.length === 0 && <tr><td colSpan={4} className="hw-empty">Sin movimientos todavía</td></tr>}
              </tbody>
            </table>
          </div>

          <button className="hw-btn soft-red" onClick={() => setCerrando(true)}>Cerrar caja</button>
        </>
      ) : (
        <div className="hw-panel" style={{ padding: 16 }}>
          <FieldRow label="Monto de apertura (efectivo inicial)">
            <input className="hw-input" type="number" autoFocus value={montoApertura} onChange={(e) => setMontoApertura(e.target.value)} />
          </FieldRow>
        </div>
      )}

      <div className="hw-panel" style={{ marginTop: 20 }}>
        <div style={{ padding: "14px 16px", fontWeight: 600 }}>Historial de cajas</div>
        <table className="hw-table hw-t-cajahist">
          <thead><tr><th>Fecha</th><th>Apertura</th><th>Cierre</th><th>Esperado</th><th>Diferencia</th><th>Estado</th></tr></thead>
          <tbody>
            {sesiones.slice().reverse().map((s) => (
              <tr key={s.id}>
                <td>{s.fecha}</td>
                <td>{money(s.montoApertura)}</td>
                <td>{s.montoCierre != null ? money(s.montoCierre) : "—"}</td>
                <td>{s.montoEsperado != null ? money(s.montoEsperado) : "—"}</td>
                <td style={{ color: s.diferencia < 0 ? "var(--red)" : s.diferencia > 0 ? "var(--green)" : undefined, fontWeight: 600 }}>{s.diferencia != null ? money(s.diferencia) : "—"}</td>
                <td><EstadoBadge estado={s.estado} /></td>
              </tr>
            ))}
            {sesiones.length === 0 && <tr><td colSpan={6} className="hw-empty">Sin cajas registradas todavía</td></tr>}
          </tbody>
        </table>
      </div>

      {cerrando && (
        <div className="hw-modal-overlay" onClick={() => setCerrando(false)}>
          <div className="hw-modal" style={{ maxWidth: 360 }} onClick={(e) => e.stopPropagation()}>
            <div className="hw-modal-head"><div className="hw-modal-title">Cerrar caja</div><button className="hw-close" onClick={() => setCerrando(false)}><X size={18} /></button></div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 10 }}>Efectivo esperado: <b>{money(esperado)}</b></div>
            <FieldRow label="Efectivo contado real">
              <input className="hw-input" type="number" autoFocus value={montoContado} onChange={(e) => setMontoContado(e.target.value)} />
            </FieldRow>
            <button className="hw-btn" style={{ width: "100%", justifyContent: "center", marginTop: 10 }} onClick={cerrarCaja}>Confirmar cierre</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Inventario({ productos, setProductos }) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [form, setForm] = useState({ nombre: "", codigo: "", categoria: "", costo: 0, precio: 0, stock: 0, minimo: 2 });
  const [etiquetaProducto, setEtiquetaProducto] = useState(null);

  const filtrados = productos.filter((p) => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return true;
    return p.nombre?.toLowerCase().includes(q) || p.codigo?.toLowerCase().includes(q);
  });

  function abrirNuevo() {
    setEditingId(null);
    setForm({ nombre: "", codigo: "", categoria: "", costo: 0, precio: 0, stock: 0, minimo: 2 });
    setOpen(true);
  }
  function abrirEdicion(p) {
    setEditingId(p.id);
    setForm({ nombre: p.nombre, codigo: p.codigo || "", categoria: p.categoria || "", costo: p.costo || 0, precio: p.precio || 0, stock: p.stock || 0, minimo: p.minimo || 2 });
    setOpen(true);
  }

  function guardar() {
    if (!form.nombre.trim()) return;
    if (editingId) {
      setProductos(productos.map((p) => (p.id === editingId ? { ...p, ...form } : p)));
    } else {
      setProductos([...productos, { id: uid(), ...form }]);
    }
    setEditingId(null);
    setOpen(false);
  }

  function porCodigo(e) {
    if (e.key !== "Enter") return;
    const q = busqueda.trim().toLowerCase();
    const match = productos.find((p) => p.codigo?.toLowerCase() === q);
    if (match) { setBusqueda(""); abrirEdicion(match); }
  }

  return (
    <div>
      <div className="hw-header">
        <div><div className="hw-title">Inventario</div><div className="hw-sub">{productos.length} productos en catálogo</div></div>
        <button className="hw-btn" onClick={abrirNuevo}><Plus size={15} /> Nuevo producto</button>
      </div>
      <div className="hw-panel" style={{ padding: 12, marginBottom: 12 }}>
        <input className="hw-input" placeholder="Buscar por nombre o código... (o escanea con el lector y presiona Enter)" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} onKeyDown={porCodigo} />
      </div>
      <div className="hw-panel">
        <table className="hw-table hw-t-inventario">
          <thead><tr><th>Producto</th><th>Código</th><th>Categoría</th><th>Costo</th><th>Precio</th><th>Stock</th><th></th></tr></thead>
          <tbody>
            {filtrados.map((p) => (
              <tr key={p.id} className={p.stock <= p.minimo ? "hw-lowstock-row" : ""}>
                <td>{p.nombre}</td>
                <td className="hw-mono">{p.codigo || "—"}</td>
                <td><span className="hw-chip" style={{ background: (CAT_COLORS[p.categoria] || "#8B93A1") + "22", color: CAT_COLORS[p.categoria] || "#6B7280" }}>{p.categoria}</span></td>
                <td>{money(p.costo)}</td>
                <td>{money(p.precio)}</td>
                <td>{p.stock <= p.minimo ? <span style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--red)", fontWeight: 600 }}><AlertTriangle size={13} /> {p.stock}</span> : p.stock}</td>
                <td style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button className="hw-btn ghost small" onClick={() => abrirEdicion(p)}><Edit2 size={12} /> Editar</button>
                  <button className="hw-btn ghost small" onClick={() => setEtiquetaProducto(p)}><Printer size={12} /> Etiqueta</button>
                </td>
              </tr>
            ))}
            {filtrados.length === 0 && <tr><td colSpan={7} className="hw-empty">Sin productos encontrados</td></tr>}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="hw-modal-overlay" onClick={() => setOpen(false)}>
          <div className="hw-modal" onClick={(e) => e.stopPropagation()}>
            <div className="hw-modal-head"><div className="hw-modal-title">{editingId ? "Editar producto" : "Nuevo producto"}</div><button className="hw-close" onClick={() => setOpen(false)}><X size={18} /></button></div>
            <FieldRow label="Nombre *"><input className="hw-input" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></FieldRow>
            <FieldRow label="Código (barras o referencia)"><input className="hw-input" placeholder="Escanea aquí o escribe el código..." value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} /></FieldRow>
            <FieldRow label="Categoría">
              <select className="hw-select" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
                <option value="">Seleccionar...</option>
                <option>Cámaras</option><option>Acceso</option><option>Motores</option><option>Cerco eléctrico</option><option>Solar</option><option>Electrodomésticos</option><option>Eléctricos</option><option>Redes y cableado</option><option>Desarrollo / Software</option><option>Computación / Soporte técnico</option><option>Herramientas</option><option>Servicio de instalación y configuración</option><option>Otro</option>
              </select>
            </FieldRow>
            <FieldRow label="Costo"><input className="hw-input" type="number" value={form.costo} onChange={(e) => setForm({ ...form, costo: Number(e.target.value) })} /></FieldRow>
            <FieldRow label="Precio de venta"><input className="hw-input" type="number" value={form.precio} onChange={(e) => setForm({ ...form, precio: Number(e.target.value) })} /></FieldRow>
            <FieldRow label="Stock inicial"><input className="hw-input" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} /></FieldRow>
            <FieldRow label="Stock mínimo (alerta)"><input className="hw-input" type="number" value={form.minimo} onChange={(e) => setForm({ ...form, minimo: Number(e.target.value) })} /></FieldRow>
            <button className="hw-btn" style={{ width: "100%", justifyContent: "center", marginTop: 6 }} onClick={guardar}>{editingId ? "Actualizar producto" : "Guardar producto"}</button>
          </div>
        </div>
      )}
      <EtiquetaPreview producto={etiquetaProducto} onClose={() => setEtiquetaProducto(null)} />
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCargando(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nuevaSesion) => {
      setSession(nuevaSesion);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (cargando) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.6)", background: "#0c1420" }}>Cargando...</div>;
  }
  if (!session) return <Login />;
  return <Panel session={session} />;
}
