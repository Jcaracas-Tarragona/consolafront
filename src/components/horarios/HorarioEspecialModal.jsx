import { useEffect, useState } from "react";
import { API_BASE_URL } from "../../config";

export default function HorarioEspecialModal({ token, data, onClose, onSaved }) {
  const [form, setForm] = useState({
    connection_id: "",
    fecha: "",
    hora_apertura: "",
    hora_cierre: "",
    cerrado: false,
    motivo: ""
  });

  const [dato, setDato] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!data) return;

    setForm({
      connection_id: data.connection_id ?? "",
      fecha: "",
      hora_apertura: "",
      hora_cierre: "",
      cerrado: false,
      motivo: ""
    });
  }, [data]);

  const fetchData = async () => {
    if (!data?.connection_id) return;

    try {
      const res = await fetch(
        `${API_BASE_URL}/horarios-especiales/he/${data.connection_id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (res.status === 401) {
        alert("Su sesión ha expirado. Debe volver a iniciar sesión.");
        localStorage.clear();
        window.location.replace("/login");
        return;
      }

      if (!res.ok) {
        throw new Error("Error obteniendo horarios especiales.");
      }

      const json = await res.json();
      setDato(Array.isArray(json) ? json : []);
    } catch (err) {
      console.error("Error cargando horarios especiales:", err);
      setDato([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, [data?.connection_id]);

  const submit = async () => {
    if (!form.connection_id) {
      alert("No se pudo identificar el local.");
      return;
    }

    if (!form.fecha) {
      alert("Debe seleccionar una fecha.");
      return;
    }

    if (!form.cerrado) {
      if (!form.hora_apertura || !form.hora_cierre || form.hora_apertura >= form.hora_cierre) {
        alert("Debe ingresar un horario válido.");
        return;
      }
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/horarios-especiales`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...form,
          hora_apertura: form.cerrado ? null : form.hora_apertura,
          hora_cierre: form.cerrado ? null : form.hora_cierre
        })
      });

      if (res.status === 401) {
        alert("Su sesión ha expirado. Debe volver a iniciar sesión.");
        localStorage.clear();
        window.location.replace("/login");
        return;
      }

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Error guardando horario especial.");
      }

      alert("Horario especial guardado correctamente.");

      await fetchData();

      setForm(prev => ({
        ...prev,
        fecha: "",
        hora_apertura: "",
        hora_cierre: "",
        cerrado: false,
        motivo: ""
      }));

      onSaved?.();

    } catch (err) {
      console.error("Error guardando horario especial:", err);
      alert(err.message || "Error guardando horario especial.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal show d-block bg-dark bg-opacity-50">
      <div className="modal d-block">
        <div className="modal-dialog">
          <div className="modal-content">

            <div className="modal-header">
              <h4>Horario Especial - {data?.local_nombre}</h4>
              <button className="btn-close" onClick={onClose} />
            </div>

            <div className="modal-body">

              <div className="row mb-2">
                <div className="col">
                  <input type="date" className="form-control mb-0"
                    value={form.fecha}
                    title="Seleccionar fecha"
                    onChange={e => setForm({ ...form, fecha: e.target.value })} />
                </div>

                <div className="form-check m-auto col">
                  <input type="checkbox" className="form-check-input"
                    checked={form.cerrado}
                    onChange={e => setForm({ ...form, cerrado: e.target.checked })} />

                  <label className="form-check-label">Local cerrado</label>
                </div>
              </div>

              {!form.cerrado && (
                <div className="row mb-2">
                  <div className="d-flex flex-row col align-items-center gap-2">
                    <label className="form-label mb-0">Apertura:</label>
                    <input type="time" className="form-control mb-0"
                      value={form.hora_apertura}
                      onChange={e => setForm({ ...form, hora_apertura: e.target.value })} />
                  </div>

                  <div className="d-flex flex-row col align-items-center gap-2">
                    <label className="form-label mb-0">Cierre:</label>
                    <input type="time" className="form-control mb-0"
                      value={form.hora_cierre}
                      onChange={e => setForm({ ...form, hora_cierre: e.target.value })} />
                  </div>
                </div>
              )}

              <input className="form-control"
                placeholder="Motivo"
                value={form.motivo || ""}
                onChange={e => setForm({ ...form, motivo: e.target.value })} />

            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={onClose} disabled={loading}>
                Cancelar
              </button>

              <button className="btn btn-primary" onClick={submit} disabled={loading}>
                {loading ? "Guardando..." : "Guardar"}
              </button>
            </div>

            <div key={dato?.[0]?.connection_id} className="mb-2 p-3 pt-0">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Horario</th>
                    <th>Motivo</th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {dato?.[0]?.especiales?.map(h => (
                    <tr key={h.id}>
                      <td>{new Date(h.fecha).toISOString().split("T")[0]}</td>

                      <td>
                        {h.cerrado
                          ? "CERRADO"
                          : `${h.hora_apertura?.slice(0, 5)} - ${h.hora_cierre?.slice(0, 5)}`}
                      </td>

                      <td>{h.motivo}</td>
                      <td></td>
                    </tr>
                  ))}

                  {!dato?.[0]?.especiales?.length && (
                    <tr>
                      <td colSpan="4" className="text-center text-muted">
                        No existen horarios especiales registrados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}