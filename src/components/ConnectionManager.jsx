import React, { useEffect, useState, useCallback, useMemo } from "react";
import { API_BASE_URL } from "../config"; 
import { apiFetch } from "./utils/api";
import Select from "react-select";

function ConnectionManager({ token }) {
  const [connections, setConnections] = useState([]);
  const [selected, setSelected] = useState("");
  const [message, setMessage] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [connectedId, setConnectedId] = useState(localStorage.getItem("connectedConnectionId") || "");
  // 🧩 Formulario de nueva conexión / edición
  const [editing, setEditing] = useState(null);
  const [empresas, setEmpresas] = useState([]);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(2);
  const [form, setForm] = useState({ empresa_id: 2, name: "", host: "", codLocal: "" });
  
  const user = JSON.parse(localStorage.getItem("authUser") || "{}");
  const isAdmin = user.role === "Admin" || user.role === "N2";
  

  // 🔹 Cargar Empresa
  async function cargarEmpresas() {
    const res = await fetch(`${API_BASE_URL}/empresas`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const data = await res.json();
    setEmpresas(data);
  }

  // ✅ Definir fetchConnections con useCallback
  const fetchConnections = useCallback(async () => {
    try {
      const data = await apiFetch("/connections");
  
      // ordenar por codLocal si existe
      const sorted = [...data].sort((a, b) => {
        if (a.codLocal && b.codLocal) {
          if (!isNaN(a.codLocal) && !isNaN(b.codLocal)) return Number(a.codLocal) - Number(b.codLocal);
          return String(a.codLocal).localeCompare(String(b.codLocal));
        }
        return a.id - b.id;
      });
      setConnections(sorted);
  
    } catch (err) {
      setMessage("❌ No se pudieron cargar las conexiones");
    }
  }, []);

  const filteredConnections = useMemo(() => {
      return connections.filter(c =>
          Number(c.empresa_id) === Number(empresaSeleccionada)
      );
  }, [connections, empresaSeleccionada]);

  // ✅ useEffect solo depende de fetchConnections
  useEffect(() => {
    cargarEmpresas();
    console.log(empresaSeleccionada);
    
    fetchConnections();
  }, [fetchConnections]);
  

  // 🔹 Probar conexión
  const handleTestConnection = async (id) => {
    setMessage("⏳ Probando conexión...");
    try {
      const res = await fetch(`${API_BASE_URL}/connections/test/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMessage(data.message || (data.success ? "Conexión OK" : "Error"));

      if (data.success) {
        const connection = connections.find((c) => String(c.id) === String(id));
        if (connection) {
          localStorage.setItem("connectedConnectionId", id);
          localStorage.setItem("connectedConnectionName", connection.name || "");
          localStorage.setItem("connectionStatus", "OK");
          localStorage.setItem("codLocal",  connection.codLocal);
          setConnectedId(String(id));
          window.dispatchEvent(new Event("storage"));
        }
      } else {
        localStorage.removeItem("connectedConnectionId");
        localStorage.removeItem("connectedConnectionName");
        localStorage.removeItem("connectionStatus");
        setConnectedId("");
        window.dispatchEvent(new Event("storage"));
      }
    } catch {
      setMessage("❌ Error al intentar conectar");
    }
  };

  // 🔍 Buscar por CodLocal en BD interna
  const checkCodLocal = async (value) => {
    setForm((prev) => ({ ...prev, codLocal: value }));

    if (!value) {
      setEditing(false);
      setForm({ name: "", host: "", codLocal: "" });
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/connections/by-codlocal/${value}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.id) {
          // ✅ Existe conexión → modo edición
          setEditing(true);
          setForm({
            name: data.name || "",
            host: data.host || "",
            codLocal: data.codLocal || value,
            id: data.id,
          });
        } else {
          // ❌ No existe → modo agregar
          setEditing(false);
          setForm({ name: "", host: "", codLocal: value });
        }
      }
    } catch (err) {
      console.error("Error al verificar CodLocal", err);
    }
  };

  // ➕ Crear nueva conexión
  const addConnection = async () => {
    // ✅ Validar campos obligatorios antes de enviar
    if (!form.name.trim() || !form.host.trim() || !form.codLocal.trim()) {
      setMessage("Todos los campos son obligatorios.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/connections`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setMessage(data.message || "Conexión agregada");
      setForm({ name: "", host: "", codLocal: "" });
      setEditing(false);
      await fetchConnections(); // 🔄 Actualiza la lista del select
      window.dispatchEvent(new Event("storage"));
    } catch (err) {
      setMessage("❌ Error al agregar conexión");
    }
  };

  // 💾 Actualizar conexión existente
  const updateConnection = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/connections/${form.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setMessage(data.message || "Conexión actualizada");
      setEditing(false);
      setForm({ name: "", host: "", codLocal: "" });
      await fetchConnections(); // 🔄 Actualiza la lista del select
      window.dispatchEvent(new Event("storage"));
    } catch (err) {
      setMessage("❌ Error al actualizar conexión");
    }
  };

  // 🗑️ Eliminar conexión
  const deleteConnection = async () => {
    if (!window.confirm("¿Seguro que deseas eliminar esta conexión?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/connections/${form.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMessage(data.message || "Conexión eliminada");
      setEditing(false);
      setForm({ name: "", host: "", codLocal: "" });
      await fetchConnections(); // 🔄 Actualiza la lista del select
      window.dispatchEvent(new Event("storage"));
    } catch (err) {
      setMessage("❌ Error al eliminar conexión");
    }
  };

  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      setMessage("");
    }, 10000);

    return () => clearTimeout(timer);
  }, [message]);

  return (
    <div className="card p-4 shadow-sm">
      <h4 className="mb-3">Gestión de Conexiones</h4>

      <div className="d-flex gap-4 align-items-center">
        <label className="form-label fw-bold">Empresa:</label>
          <Select className="flex-grow-1 w-25"
            value={
                empresas
                    .map(emp => ({
                        value: emp.id,
                        label: emp.nombre
                    }))
                    .find(opt => opt.value === empresaSeleccionada)
            }
            options={empresas.map(emp => ({
                value: emp.id,
                label: emp.nombre
            }))}
            onChange={(opt) => {
                setEmpresaSeleccionada(opt.value);
                setForm(prev => ({
                    ...prev,
                    empresa_id: opt.value
                }));
                setSelected("");
            }}
          />

          <Select className="flex-grow-1 w-75"
            options={filteredConnections.map(c => ({
              value: c.id,
              label: `${c.codLocal ? `${c.codLocal} — ` : ""}${c.name} (${c.host})`
            }))}
            placeholder="Selecciona local o escribe para buscar..."
            value={filteredConnections
              .map(c => ({
                value: c.id,
                label: `${c.codLocal ? `${c.codLocal} — ` : ""}${c.name} (${c.host})`
              }))
              .find(opt => opt.value === selected) || null}
            onChange={(opt) => {
              const id = opt?.value;
              setSelected(id);

              localStorage.setItem("connectedConnectionId", "");
              localStorage.setItem("connectedConnectionName", "");
              localStorage.setItem("connectionStatus", "PENDING");
              window.dispatchEvent(new Event("storage"));

              if (id) handleTestConnection(id);
            }}
          />
      </div>

      {message && (
        <div
          className={`alert mt-2 ${
            message.includes("OK")
              ? "alert-success"
              : message.includes("⏳")
              ? "alert-info"
              : "alert-warning"
          }`}
        >
          {message}
        </div>
        
      )}



      <hr />
      <h5>{editing ? "Editar conexión" : "Nueva conexión"}</h5>

      {/* 🆕 Formulario de Nueva Conexión */}
      <div className="pt-1 mt-1">
        <div className="d-flex gap-2">
          <input
            type="text"
            className="form-control"
            required
            placeholder="Cod Local"
            value={form.codLocal}
            onChange={(e) => checkCodLocal(e.target.value)}
          />
          <input
            type="text"
            className="form-control"
            required
            placeholder="Nombre"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            type="text"
            className="form-control"
            required
            placeholder="Host"
            value={form.host}
            onChange={(e) => setForm({ ...form, host: e.target.value })}
          />

          {!editing ? (
            // NUEVA CONEXIÓN — solo admin puede crear
            isAdmin && (
              <button className="btn btn-success" onClick={addConnection} title="Guardar Nuevo Local">
                ➕ 
              </button>
            )
          ) : (
            <>
              {/* Guardar — siempre disponible */}
              <button className="btn btn-warning" onClick={updateConnection} title="Actualizar Local">
                💾 
              </button>

              {/* Eliminar — solo admin */}
              {isAdmin && (
                <button className="btn btn-danger" onClick={deleteConnection} title="Eliminar Local">
                  🗑️ 
                </button>
              )}
            </>
          )}

        </div>
      </div>
      
    </div>
  );
}

export default ConnectionManager;
