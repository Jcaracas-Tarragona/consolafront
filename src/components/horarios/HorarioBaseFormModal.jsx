import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../../config";

const DIAS = [
  { id: 1, label: "Lunes" },
  { id: 2, label: "Martes" },
  { id: 3, label: "Miércoles" },
  { id: 4, label: "Jueves" },
  { id: 5, label: "Viernes" },
  { id: 6, label: "Sábado" },
  { id: 7, label: "Domingo" }
];

export default function HorarioBaseFormModal({
  token,
  show,
  onClose,
  onSaved,
  localReemplazo = null
}) {
  const [locales, setLocales] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState("");
  const [selectedLocales, setSelectedLocales] = useState([]);
  const [dias, setDias] = useState([]);
  const [horaApertura, setHoraApertura] = useState("");
  const [horaCierre, setHoraCierre] = useState("");
  const [activo, setActivo] = useState(true);
  const [cerrado, setCerrado] = useState(false);
  const [loading, setLoading] = useState(false);

  /* CARGAR EMPRESAS */
  useEffect(() => {
    if (!show || localReemplazo) return;

    const cargarEmpresas = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/empresas`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.status === 401) {
          alert("Su sesión ha expirado. Debe volver a iniciar sesión.");
          localStorage.clear();
          window.location.replace("/login");
          return;
        }

        if (!res.ok) throw new Error("Error obteniendo empresas");

        const data = await res.json();
        setEmpresas(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error cargando empresas:", err);
        setEmpresas([]);
      }
    };

    cargarEmpresas();
  }, [show, token, localReemplazo]);

  /* CARGAR LOCALES */
  useEffect(() => {
    if (!show) return;

    const cargarLocales = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/connections`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.status === 401) {
          alert("Su sesión ha expirado. Debe volver a iniciar sesión.");
          localStorage.clear();
          window.location.replace("/login");
          return;
        }

        if (!res.ok) throw new Error("Error obteniendo locales");

        const data = await res.json();
        setLocales(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error cargando locales:", err);
        setLocales([]);
      }
    };

    cargarLocales();
  }, [show, token]);

  /* MODO REEMPLAZO */
  useEffect(() => {
    if (localReemplazo?.connection_id) {
      setSelectedLocales([Number(localReemplazo.connection_id)]);
    } else {
      setSelectedLocales([]);
    }
  }, [localReemplazo]);

  /* LIMPIAR FORMULARIO CUANDO ABRE */
  useEffect(() => {
    if (!show) return;

    setDias([]);
    setHoraApertura("");
    setHoraCierre("");
    setActivo(true);
    setCerrado(false);

    if (!localReemplazo) {
      setEmpresaSeleccionada("");
      setSelectedLocales([]);
    }
  }, [show, localReemplazo]);

  /* LOCALES DE LA EMPRESA SELECCIONADA */
  const localesFiltrados = localReemplazo
  ? locales.filter(local => Number(local.id) === Number(localReemplazo.connection_id))
  : empresaSeleccionada
    ? locales
        .filter(local => Number(local.empresa_id) === Number(empresaSeleccionada))
        .sort((a, b) => Number(a.codLocal) - Number(b.codLocal))
    : [];

  const toggleLocal = (connectionId) => {
    if (localReemplazo) return;

    const id = Number(connectionId);

    setSelectedLocales(prev =>
      prev.includes(id)
        ? prev.filter(localId => localId !== id)
        : [...prev, id]
    );
  };

  const toggleDia = (dia) => {
    setDias(prev =>
      prev.includes(dia)
        ? prev.filter(d => d !== dia)
        : [...prev, dia]
    );
  };

  const toggleAllLocales = () => {
    if (localReemplazo || !empresaSeleccionada) return;

    const idsEmpresa = localesFiltrados.map(local => Number(local.id));

    if (selectedLocales.length === idsEmpresa.length) {
      setSelectedLocales([]);
    } else {
      setSelectedLocales(idsEmpresa);
    }
  };

  const handleEmpresaChange = (e) => {
    setEmpresaSeleccionada(e.target.value);
    setSelectedLocales([]);
  };

  /* GUARDAR */
  const handleSubmit = async () => {
    if (!localReemplazo && !empresaSeleccionada) {
      alert("Debe seleccionar una empresa.");
      return;
    }

    if (!dias.length) {
      alert("Debe seleccionar al menos un día.");
      return;
    }

    if (!selectedLocales.length) {
      alert("Debe seleccionar al menos un local.");
      return;
    }

    if (!cerrado && (!horaApertura || !horaCierre || horaApertura >= horaCierre)) {
      alert("Debe ingresar horas válidas.");
      return;
    }

    setLoading(true);

    try {
      let res;

      if (localReemplazo) {
        const connectionId = Number(localReemplazo.connection_id);

        if (!connectionId) {
          throw new Error("No se encontró el identificador del local.");
        }

        res = await fetch(`${API_BASE_URL}/horarios-base/replace/${connectionId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            dias,
            hora_apertura: cerrado ? null : horaApertura,
            hora_cierre: cerrado ? null : horaCierre,
            activo,
            cerrado
          })
        });
      } else {
        res = await fetch(`${API_BASE_URL}/horarios-base/bulk`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            locales: selectedLocales,
            dias,
            hora_apertura: cerrado ? null : horaApertura,
            hora_cierre: cerrado ? null : horaCierre,
            activo,
            cerrado
          })
        });
      }

      if (res.status === 401) {
        alert("Su sesión ha expirado. Debe volver a iniciar sesión.");
        localStorage.clear();
        window.location.replace("/login");
        return;
      }

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || result.message || "Error guardando horarios.");
      }

      onSaved();
      onClose();
    } catch (err) {
      console.error("Error guardando horarios:", err);
      alert(err.message || "Error guardando horarios.");
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal show d-block bg-dark bg-opacity-50">
      <div className="modal-dialog modal-lg">
        <div className="modal-content">

          <div className="modal-header">
            <h5 className="modal-title">
              {localReemplazo
                ? `🔁 Reemplazar Horario Base – ${localReemplazo.local_nombre}`
                : "➕ Nuevo Horario Base"}
            </h5>

            <button type="button" className="btn-close" onClick={onClose} />
          </div>

          <div className="modal-body">

            {/* DÍAS */}
            <div className="mb-3">
              <label className="form-label fw-bold">Días de la Semana</label>

              <div className="d-flex flex-wrap gap-2">
                {DIAS.map(d => (
                  <button key={d.id} type="button"
                    className={`btn btn-sm ${dias.includes(d.id) ? "btn-primary" : "btn-outline-secondary"}`}
                    onClick={() => toggleDia(d.id)}>
                    {d.label}
                  </button>
                ))}

                <div className="form-check m-auto col">
                  <input id="cerrado" type="checkbox" className="form-check-input"
                    checked={cerrado}
                    onChange={e => setCerrado(e.target.checked)} />

                  <label className="form-check-label" htmlFor="cerrado">
                    <span className="d-none d-md-inline ms-1">Local</span> Cerrado
                  </label>
                </div>
              </div>
            </div>

            {/* HORAS */}
            {!cerrado && (
              <div className="row mb-3">
                <div className="d-flex justify-content-start gap-3 align-items-center">
                  <label className="form-label mb-0" title="Horario de Apertura">
                    <span className="d-none d-md-inline ms-1">Hora</span> Apertura:
                  </label>

                  <input type="time" className="form-control w-25"
                    value={horaApertura}
                    onChange={e => setHoraApertura(e.target.value)} />

                  <label className="form-label mb-0" title="Horario de cierre">
                    <span className="d-none d-md-inline ms-1">Hora</span> Cierre:
                  </label>

                  <input type="time" className="form-control w-25"
                    value={horaCierre}
                    onChange={e => setHoraCierre(e.target.value)} />
                </div>
              </div>
            )}

            {/* EMPRESA + SELECCIONAR TODOS */}
            {!localReemplazo && (
              <div className="d-flex align-items-end gap-3 mb-3">

                <div className="flex-grow-2">
                  <select className="form-select"
                    value={empresaSeleccionada}
                    onChange={handleEmpresaChange}>
                    <option value="">Seleccionar Empresa</option>

                    {empresas.map(empresa => (
                      <option key={empresa.id} value={empresa.id}>
                        {empresa.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-check mb-2">
                  <input id="todosLocales" className="form-check-input" type="checkbox"
                    checked={localesFiltrados.length > 0 && selectedLocales.length === localesFiltrados.length}
                    disabled={!empresaSeleccionada || localesFiltrados.length === 0}
                    onChange={toggleAllLocales} />

                  <label className="form-check-label fw-bold" htmlFor="todosLocales">
                    Seleccionar Todos
                  </label>
                </div>

              </div>
            )}
            <div className="mb-3">
              <div className="border rounded p-2" style={{ maxHeight: 200, overflowY: "auto" }}>

                {!localReemplazo && !empresaSeleccionada ? (
                  <div className="text-muted text-center py-3">
                    Seleccione una empresa para mostrar sus locales.
                  </div>
                ) : localesFiltrados.length === 0 ? (
                  <div className="text-muted text-center py-3">
                    No hay locales disponibles.
                  </div>
                ) : (
                  localesFiltrados.map(local => {
                    const connectionId = Number(local.id);
                    const seleccionado = selectedLocales.includes(connectionId);

                    return (
                      <div className="form-check" key={connectionId}>
                        <input id={`local-${connectionId}`} className="form-check-input" type="checkbox"
                          checked={seleccionado}
                          disabled={!!localReemplazo}
                          onChange={() => toggleLocal(connectionId)} />

                        <label className="form-check-label" htmlFor={`local-${connectionId}`}>
                          {local.codLocal ? `${local.codLocal} - ` : ""}
                          {local.name ?? `Local ${local.codLocal}`}
                        </label>
                      </div>
                    );
                  })
                )}

              </div>
            </div>

          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}>
              Cancelar
            </button>

            <button type="button" className="btn btn-primary"
              disabled={loading}
              onClick={handleSubmit}>
              {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}