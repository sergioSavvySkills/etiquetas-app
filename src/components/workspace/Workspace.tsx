"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getSector } from "@/lib/matriz";
import {
  construirRequisitos,
  estadoVacio,
  requisitosExcluidos,
  resumir,
  tipoDocumento,
  type AccionMensaje,
  type Atributos,
  type Documento,
  type EstadoItem,
  type EstadoRequisito,
  type Mensaje,
} from "@/lib/workspace";
import { DEMO_USUARIO } from "@/lib/demo";
import { cargarEscenario, type EscenarioId } from "@/lib/escenarios";
import TopBar from "@/components/workspace/TopBar";
import RequisitosPanel from "@/components/workspace/RequisitosPanel";
import ChatPanel from "@/components/workspace/ChatPanel";
import { DetalleDocumento, DetalleRequisito } from "@/components/workspace/DetallePanel";
import EtiquetaPreview from "@/components/workspace/EtiquetaPreview";
import type { Guardado } from "@/components/workspace/Editores";
import { IconChat, IconList, IconTag } from "@/components/workspace/icons";

type Vista =
  | { tipo: "etiqueta" }
  | { tipo: "requisito"; id: string; editar?: boolean }
  | { tipo: "documento"; id: string };

type PanelMovil = "requisitos" | "chat" | "detalle";

const ahora = () => new Date().toISOString();
const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export default function Workspace({ escenario = "en_curso" }: { escenario?: EscenarioId }) {
  const [inicial] = useState(() => cargarEscenario(escenario));
  const [nombreProducto, setNombreProducto] = useState(inicial.producto.nombre);
  const [sectorId, setSectorId] = useState(inicial.producto.sectorId);
  const [certificaciones, setCertificaciones] = useState<string[]>(inicial.producto.certificaciones);
  const [atributos, setAtributos] = useState<Atributos>(inicial.atributos);
  const [estados, setEstados] = useState<Record<string, EstadoItem>>(inicial.estados);
  const [documentos, setDocumentos] = useState<Record<string, Documento>>(() =>
    Object.fromEntries(inicial.documentos.map((d) => [d.id, d])),
  );
  const [mensajes, setMensajes] = useState<Mensaje[]>(inicial.mensajes);
  const [vista, setVista] = useState<Vista>({ tipo: "etiqueta" });
  const [lateralAbierto, setLateralAbierto] = useState(false);
  const [panelMovil, setPanelMovil] = useState<PanelMovil>("chat");
  const [borrador, setBorrador] = useState("");
  const temporizadores = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const t = temporizadores.current;
    return () => t.forEach(clearTimeout);
  }, []);

  const requisitos = useMemo(
    () => construirRequisitos(sectorId, certificaciones, atributos),
    [sectorId, certificaciones, atributos],
  );
  const excluidos = useMemo(
    () => requisitosExcluidos(sectorId, certificaciones, atributos),
    [sectorId, certificaciones, atributos],
  );
  const resumen = useMemo(() => resumir(requisitos, estados), [requisitos, estados]);
  const sector = getSector(sectorId);

  const requisitoActivo =
    vista.tipo === "requisito" ? requisitos.find((r) => r.id === vista.id) : undefined;
  const documentoActivo = vista.tipo === "documento" ? documentos[vista.id] : undefined;

  /* ---------------- navegación ---------------- */

  const verRequisito = useCallback((id: string, editar = false) => {
    setVista({ tipo: "requisito", id, editar });
    setLateralAbierto(true);
    setPanelMovil("detalle");
  }, []);

  const verDocumento = useCallback((id: string) => {
    setVista({ tipo: "documento", id });
    setLateralAbierto(true);
    setPanelMovil("detalle");
  }, []);

  const verEtiqueta = useCallback(() => {
    setVista({ tipo: "etiqueta" });
    setLateralAbierto(true);
    setPanelMovil("detalle");
  }, []);

  const cerrarLateral = useCallback(() => {
    setVista({ tipo: "etiqueta" });
    setLateralAbierto(false);
    setPanelMovil("chat");
  }, []);

  /* ---------------- estado de requisitos ---------------- */

  const actualizar = useCallback(
    (id: string, cambio: (item: EstadoItem) => EstadoItem) =>
      setEstados((e) => ({ ...e, [id]: cambio(e[id] ?? estadoVacio()) })),
    [],
  );

  const firma = () => ({ por: DEMO_USUARIO.nombre, fecha: ahora() });

  /** Cambio de estado hecho por la persona. «no_aplica» lleva su firma; el resto la pierde. */
  const cambiarEstado = (id: string, estado: EstadoRequisito, nota?: string) =>
    actualizar(id, (it) => ({
      ...it,
      estado,
      nota,
      aprobacion: estado === "no_aplica" || estado === "aprobado" ? firma() : undefined,
    }));

  /** Dato introducido a mano por la persona: queda aprobado directamente, con su firma. */
  const guardarDato = (id: string, etiqueta: string, valor: string, porAsistente = false) =>
    actualizar(id, (it) => ({
      ...it,
      estado: porAsistente ? "verificado" : "aprobado",
      aprobacion: porAsistente ? undefined : firma(),
      nota: undefined,
      datos: [...it.datos.filter((d) => d.etiqueta !== etiqueta), { etiqueta, valor }],
    }));

  /** Guardado desde un editor tipado: decisión humana, queda aprobado con firma. */
  const guardarDesdeEditor = (id: string, g: Guardado) => {
    actualizar(id, (it) => ({
      ...it,
      estado: "aprobado",
      nota: undefined,
      aprobacion: firma(),
      datos: g.datos,
      estructura: g.estructura ?? it.estructura,
    }));
    if (id === "denominacion") {
      const nombre = g.datos.find((d) => d.etiqueta === "Nombre comercial")?.valor;
      if (nombre) setNombreProducto(nombre);
    }
  };

  const aprobar = (id: string) =>
    actualizar(id, (it) => ({ ...it, estado: "aprobado", nota: undefined, aprobacion: firma() }));

  const rechazar = (id: string, motivo: string) =>
    actualizar(id, (it) => ({
      ...it,
      estado: "incidencia",
      aprobacion: undefined,
      nota: `Rechazado por ${DEMO_USUARIO.nombre}: ${motivo}`,
    }));

  const retirarAprobacion = (id: string) =>
    actualizar(id, (it) => ({ ...it, estado: "verificado", aprobacion: undefined }));

  /* ---------------- chat ---------------- */

  const añadirMensaje = (m: Omit<Mensaje, "id" | "hora">) =>
    setMensajes((l) => [...l, { ...m, id: uid(), hora: ahora() }]);

  const responderConRetardo = (construir: () => Omit<Mensaje, "id" | "hora">, ms = 900) => {
    const idTemp = uid();
    setMensajes((l) => [
      ...l,
      { id: idTemp, autor: "asistente", texto: "", hora: ahora(), escribiendo: true },
    ]);
    const t = setTimeout(() => {
      const m = construir();
      setMensajes((l) => l.map((x) => (x.id === idTemp ? { ...x, ...m, escribiendo: false, hora: ahora() } : x)));
    }, ms);
    temporizadores.current.push(t);
  };

  const crearDocumentos = (ficheros: File[]): Documento[] =>
    ficheros.map((f) => ({
      id: uid(),
      nombre: f.name,
      tipo: tipoDocumento(f.name),
      tamano: f.size,
      subidoEn: ahora(),
      legible: true,
      extractos: [],
      resumen: "Documento recibido. El análisis automático se conecta en la siguiente fase.",
    }));

  const pendientesParaDocumento = () =>
    requisitos.filter((r) => {
      const e = estados[r.id]?.estado ?? "pendiente";
      return e === "pendiente" || e === "incidencia";
    });

  const enviar = (texto: string, ficheros: File[]) => {
    const nuevos = crearDocumentos(ficheros);
    if (nuevos.length) {
      setDocumentos((d) => ({ ...d, ...Object.fromEntries(nuevos.map((x) => [x.id, x])) }));
    }
    añadirMensaje({
      autor: "usuario",
      texto: texto || (nuevos.length === 1 ? "Te adjunto este documento." : "Te adjunto estos documentos."),
      adjuntos: nuevos.map((d) => d.id),
    });

    // Heurísticas sencillas para que la demo responda a datos escritos.
    const afectados: string[] = [];
    const rgseaa = texto.match(/\b\d{2}\.\d{4,6}\/[A-Z]{1,3}\b/i);
    const sinRgseaa = rgseaa ? texto.replace(rgseaa[0], " ") : texto;
    const lote = sinRgseaa.match(/\bL\s?-?\d{2,}[\w-]*/i);
    const ean = sinRgseaa.match(/\b\d{13}\b/);
    if (rgseaa && requisitos.some((r) => r.id === "registro_sanitario")) {
      guardarDato("registro_sanitario", "Nº RGSEAA", rgseaa[0].toUpperCase(), true);
      afectados.push("registro_sanitario");
    }
    if (lote && requisitos.some((r) => r.id === "lote")) {
      guardarDato("lote", "Lote", lote[0].toUpperCase().replace(/\s/g, ""), true);
      afectados.push("lote");
    }
    if (ean && requisitos.some((r) => r.id === "ean")) {
      guardarDato("ean", "EAN-13", ean[0], true);
      afectados.push("ean");
    }
    if (!nombreProducto && texto.trim() && !rgseaa && !lote && !ean) {
      // Primer mensaje de un producto nuevo: lo tomamos como descripción y proponemos el nombre.
      const candidato = texto
        .split(/[.,;\n]/)[0]
        .replace(/^(es|son)\s+(una?|el|la|unos?|unas?)\s+/i, "")
        .replace(/\s+(en|con)\s+(tarro|bote|bolsa|lata|envase|botella|frasco|caja|bandeja|formato)\b.*$/i, "")
        .trim();
      if (candidato) {
        const nombre = candidato.charAt(0).toUpperCase() + candidato.slice(1);
        setNombreProducto(nombre);
        guardarDato("denominacion", "Nombre comercial", nombre, true);
        afectados.push("denominacion");
      }
    }

    if (nuevos.length) {
      const candidatos = pendientesParaDocumento().slice(0, 4);
      nuevos.forEach((doc, i) => {
        responderConRetardo(
          () => ({
            autor: "asistente",
            texto: `He recibido «${doc.nombre}». ¿Qué requisito cubre? Elige uno y lo analizo.`,
            acciones: candidatos.map((r) => ({
              etiqueta: r.titulo,
              documentoId: doc.id,
              requisitoId: r.id,
            })),
          }),
          800 + i * 400,
        );
      });
      return;
    }

    responderConRetardo(() => {
      if (afectados.length) {
        const nombres = afectados
          .map((id) => requisitos.find((r) => r.id === id)?.titulo)
          .filter(Boolean);
        const pendientes = requisitos.filter(
          (r) =>
            r.obligatoria &&
            !afectados.includes(r.id) &&
            !["verificado", "no_aplica"].includes(estados[r.id]?.estado ?? "pendiente"),
        );
        return {
          autor: "asistente",
          texto: `Anotado: ${nombres.join(" y ")} ${nombres.length === 1 ? "queda" : "quedan"} por confirmar; apruébalo desde su ficha.${
            pendientes.length
              ? ` Aún faltan ${pendientes.length} ${pendientes.length === 1 ? "obligatorio" : "obligatorios"}: ${pendientes
                  .slice(0, 3)
                  .map((r) => r.titulo.toLowerCase())
                  .join(", ")}${pendientes.length > 3 ? "…" : "."}`
              : " Ya tienes todos los obligatorios cubiertos."
          }`,
          requisitosRef: afectados,
        };
      }
      return {
        autor: "asistente",
        texto:
          "Lo tengo en cuenta. En esta versión solo está la interfaz: el análisis automático de textos y documentos se conecta en la siguiente fase. Si quieres probar el flujo, adjunta un fichero o escribe un nº RGSEAA (p. ej. 21.012345/SE), un lote (L2026-014) o un EAN de 13 dígitos.",
      };
    });
  };

  const vincular = (a: AccionMensaje) => {
    const doc = documentos[a.documentoId];
    const req = requisitos.find((r) => r.id === a.requisitoId);
    if (!doc || !req) return;
    setMensajes((l) => l.map((m) => (m.acciones?.some((x) => x.documentoId === a.documentoId) ? { ...m, acciones: undefined } : m)));
    actualizar(req.id, (it) => ({
      ...it,
      estado: "analizando",
      nota: `Leyendo «${doc.nombre}»…`,
      documentoIds: Array.from(new Set([...it.documentoIds, doc.id])),
    }));
    añadirMensaje({
      autor: "asistente",
      texto: `Analizando «${doc.nombre}» para ${req.titulo}…`,
      requisitosRef: [req.id],
    });
    const t = setTimeout(() => {
      actualizar(req.id, (it) => ({
        ...it,
        estado: "verificado",
        nota: undefined,
        datos: it.datos.length ? it.datos : [{ etiqueta: "Fuente", valor: doc.nombre }],
      }));
      añadirMensaje({
        autor: "asistente",
        texto: `Listo: «${doc.nombre}» cubre ${req.titulo}. Queda por confirmar: revisa los datos en su ficha y apruébalo (análisis simulado en esta versión).`,
        requisitosRef: [req.id],
      });
    }, 1600);
    temporizadores.current.push(t);
  };

  const adjuntarARequisito = (requisitoId: string, ficheros: File[]) => {
    const nuevos = crearDocumentos(ficheros);
    setDocumentos((d) => ({ ...d, ...Object.fromEntries(nuevos.map((x) => [x.id, x])) }));
    añadirMensaje({
      autor: "usuario",
      texto: `Documento para ${requisitos.find((r) => r.id === requisitoId)?.titulo ?? "el requisito"}.`,
      adjuntos: nuevos.map((d) => d.id),
    });
    nuevos.forEach((doc) => vincular({ etiqueta: "", documentoId: doc.id, requisitoId }));
  };

  const preguntar = (texto: string) => {
    setBorrador(texto);
    setPanelMovil("chat");
  };

  const sugerencias = useMemo(() => {
    const s: string[] = [];
    if (!mensajes.some((m) => m.autor === "usuario")) {
      return [
        "Es una mermelada artesanal de fresa en tarro de 250 g, a temperatura ambiente",
        "¿Qué documentos necesito para empezar?",
      ];
    }
    if (estados.registro_sanitario?.estado === "pendiente") s.push("El RGSEAA es 21.012345/SE");
    if (estados.lote?.estado === "pendiente") s.push("El lote es L2026-014");
    if (estados.lab_microbiologico?.estado === "incidencia") s.push("Introduzco a mano el microbiológico");
    if (estados.conservacion?.estado !== "verificado") s.push("Sugiere condiciones de conservación");
    return s.slice(0, 3);
  }, [estados, mensajes]);

  const toggleCert = (id: string) =>
    setCertificaciones((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));

  /* ---------------- render ---------------- */

  const lateral =
    requisitoActivo ? (
      <DetalleRequisito
        requisito={requisitoActivo}
        item={estados[requisitoActivo.id] ?? estadoVacio()}
        documentos={documentos}
        onCerrar={cerrarLateral}
        key={`${requisitoActivo.id}-${vista.tipo === "requisito" && vista.editar ? "e" : "v"}`}
        editarInicial={vista.tipo === "requisito" && Boolean(vista.editar)}
        onEstado={(e, nota) => cambiarEstado(requisitoActivo.id, e, nota)}
        onGuardar={(g) => guardarDesdeEditor(requisitoActivo.id, g)}
        onAprobar={() => aprobar(requisitoActivo.id)}
        onRechazar={(motivo) => rechazar(requisitoActivo.id, motivo)}
        onRetirarAprobacion={() => retirarAprobacion(requisitoActivo.id)}
        usuario={DEMO_USUARIO}
        onAdjuntar={(f) => adjuntarARequisito(requisitoActivo.id, f)}
        onPreguntar={preguntar}
        onVerDocumento={verDocumento}
      />
    ) : documentoActivo ? (
      <DetalleDocumento
        doc={documentoActivo}
        cubre={requisitos.filter((r) => estados[r.id]?.documentoIds.includes(documentoActivo.id))}
        estados={estados}
        onCerrar={cerrarLateral}
        onVerRequisito={verRequisito}
      />
    ) : (
      <EtiquetaPreview
        nombreProducto={nombreProducto}
        requisitos={requisitos}
        estados={estados}
        resumen={resumen}
        onVerRequisito={verRequisito}
        onEditarRequisito={(id) => verRequisito(id, true)}
        onAprobar={aprobar}
      />
    );

  return (
    <div className="flex h-dvh flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
      <TopBar
        nombreProducto={nombreProducto}
        cliente={inicial.producto.cliente}
        escenario={escenario}
        onEditarNombre={() => verRequisito("denominacion", true)}
        sectorId={sectorId}
        certificaciones={certificaciones}
        resumen={resumen}
        usuario={DEMO_USUARIO}
        onSector={setSectorId}
        onToggleCert={toggleCert}
        onVerEtiqueta={verEtiqueta}
      />

      <div className="relative grid min-h-0 flex-1 lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)_400px]">
        {/* Izquierda: requisitos */}
        <div
          className={`min-h-0 border-r border-zinc-200 dark:border-zinc-800 ${
            panelMovil === "requisitos" ? "flex" : "hidden"
          } lg:flex`}
        >
          <RequisitosPanel
            requisitos={requisitos}
            estados={estados}
            resumen={resumen}
            excluidos={excluidos}
            atributos={atributos}
            onAtributos={setAtributos}
            seleccionado={vista.tipo === "requisito" ? vista.id : null}
            onSeleccionar={verRequisito}
            normativa={sector?.normativaBase ?? ["Reg. (UE) 1169/2011"]}
          />
        </div>

        {/* Centro: chat */}
        <div className={`min-h-0 ${panelMovil === "chat" ? "flex" : "hidden"} lg:flex`}>
          <div className="min-h-0 w-full">
            <ChatPanel
              mensajes={mensajes}
              documentos={documentos}
              requisitos={requisitos}
              estados={estados}
              borrador={borrador}
              onBorrador={setBorrador}
              sugerencias={sugerencias}
              onEnviar={enviar}
              onAccion={vincular}
              onVerDocumento={verDocumento}
              onVerRequisito={verRequisito}
            />
          </div>
        </div>

        {/* Derecha: detalle / documento / etiqueta (columna fija en xl) */}
        <div
          className={`min-h-0 border-l border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 ${
            panelMovil === "detalle" ? "flex" : "hidden"
          } lg:hidden xl:flex`}
        >
          <div className="min-h-0 w-full">{lateral}</div>
        </div>

        {/* Derecha como cajón deslizante en lg (sin sitio para tres columnas) */}
        {lateralAbierto ? (
          <div className="hidden lg:block xl:hidden">
            <button
              type="button"
              aria-label="Cerrar panel"
              onClick={cerrarLateral}
              className="absolute inset-0 z-20 bg-zinc-900/20 backdrop-blur-[1px]"
            />
            <div className="absolute inset-y-0 right-0 z-30 w-[420px] border-l border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
              {lateral}
            </div>
          </div>
        ) : null}
      </div>

      {/* Navegación móvil */}
      <nav className="grid shrink-0 grid-cols-3 border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 lg:hidden">
        {(
          [
            ["requisitos", "Requisitos", <IconList key="l" className="h-4 w-4" />, `${resumen.cubiertos}/${resumen.total}`],
            ["chat", "Chat", <IconChat key="c" className="h-4 w-4" />, null],
            ["detalle", vista.tipo === "etiqueta" ? "Etiqueta" : "Detalle", <IconTag key="t" className="h-4 w-4" />, null],
          ] as [PanelMovil, string, React.ReactNode, string | null][]
        ).map(([id, nombre, icono, extra]) => (
          <button
            key={id}
            type="button"
            onClick={() => setPanelMovil(id)}
            className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
              panelMovil === id
                ? "text-zinc-900 dark:text-zinc-50"
                : "text-zinc-400"
            }`}
          >
            {icono}
            <span>
              {nombre}
              {extra ? <span className="ml-1 text-zinc-400">{extra}</span> : null}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}
