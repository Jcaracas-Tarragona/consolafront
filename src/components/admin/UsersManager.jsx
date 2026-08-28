// src/components/UsersManager.jsx
import React, { useCallback, useEffect, useState } from "react";
import { API_BASE_URL } from "../../config"; 
import AsignarZonalModal from "./AsignarZonalModal";
import MobileActions from "../utils/MobileActions";

const ROLES = ["Admin","N1","N2","Local","Comercial","Zonal","RRHH","Gerente"];

function UsersManager({ token }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);//verificar
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ username: "", password: "", full_name: "", email: "", role: "N2" });
  const [message, setMessage] = useState("");
  const [showModalAsignar, setShowModalAsignar] = useState(false);
  const [user, setUser] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/users`, 
        { method: "GET", headers: 
          { Authorization: `Bearer ${token} `}, 
        });
      const data = await res.json();
  
      if (data.success) setUsers(data.data || []);
      else setMessage("Error cargando usuarios");
    } catch (err) {
      setMessage(`Error de conexión: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [token]); // ✅ no dependencias porque obtienes token dentro de apiFetch
  
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openCreate = () => {
    setEditing(null);
    setForm({ username: "", password: "", full_name: "", email: "", role: "N2" });
    setShowModal(true);
  };

  const openEdit = (u) => {
    setEditing(u.id);
    setForm({ username: u.username, password: "", full_name: u.full_name || "", email: u.email || "", role: u.role || "N2" });
    setShowModal(true);
  };

  const save = async (e) => {
    e?.preventDefault();
    try {
      const url = editing ? `${API_BASE_URL}/users/${editing}` : `${API_BASE_URL}/users`;
      const method = editing ? "PUT" : "POST";
      const body = { ...form };
      if (!editing && !form.password) return setMessage("Password requerido al crear usuario");
      if (editing && !form.password) delete body.password;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type":"application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!data.success) return setMessage(data.message || "Error");
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      setMessage("Error al guardar");
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Eliminar usuario?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!data.success) return setMessage(data.message || "Error");
      fetchUsers();
    } catch (err) { setMessage("Error al eliminar"); }
  };

  

  return (
    <div className="card shadow-sm">
      <div className="card-header d-flex justify-content-between align-items-center gap-2 px-2">
        <h5 className="mb-0">Administración de Usuarios</h5>
        <div>
          <button className="btn btn-sm btn-success m-0" onClick={openCreate}>Nuevo <span className="d-none d-md-inline ms-1">Usuario</span></button>
          </div>
      </div>


      {message && <div className="alert alert-info">{message}</div>}
      <div className="card-body p-0">
        <div style={{ maxHeight: 500, overflowY: "auto" }}>
          <table className="table table-hover table-sm mb-0">
            <thead className="sticky-top bg-white shadow-sm">
              <tr className="table-secondary ">
                <th className="align-items-center">User</th><th>Nombre</th><th>Role</th><th className="text-center">Acción</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>{u.username}</td>
                  <td>{u.full_name}</td>
                  <td>{u.role}</td>
                  <td className="text-center">
                    <div className="d-flex justify-content-center align-items-center">

                      {/* 🔹 DESKTOP */}
                      <div className="d-none d-md-flex gap-2">

                        <button className="btn btn-sm btn-outline-primary" onClick={() => openEdit(u)} >
                          <i className="bi bi-pencil"></i>
                          <span className="ms-1">Editar</span>
                        </button>

                        <button className="btn btn-sm btn-outline-danger" onClick={() => remove(u.id)} >
                          <i className="bi bi-trash"></i>
                          <span className="ms-1">Eliminar</span>
                        </button>

                        <button className="btn btn-sm btn-outline-info" onClick={() => {
                            setUser(u.id); setShowModalAsignar(true);
                          }} >
                          <i className="bi bi-geo-alt"></i>
                          <span className="ms-1">Asignar</span>
                        </button>

                      </div>

                      {/* MOBILE */}
                      <MobileActions
                        actions={[
                          {
                            label: "Editar",
                            icon: "bi bi-pencil",
                            onClick: () => openEdit(u),
                          },
                          {
                            label: "Eliminar",
                            icon: "bi bi-trash text-danger",
                            onClick: () => remove(u.id),
                          },
                          {
                            label: "Asignar Local",
                            icon: "bi bi-geo-alt text-primary",
                            onClick: () => {
                              setUser(u.id);
                              setShowModalAsignar(true);
                            },
                          },
                        ]}
                      />

                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="modal show d-block" tabIndex="-1">
            <div className="modal-dialog">
              <form className="modal-content" onSubmit={save}>
                <div className="modal-header">
                  <h5 className="modal-title">{editing ? "Editar usuario" : "Nuevo usuario"}</h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="d-flex flex-row mb-2 align-items-center gap-2">
                    <label className="form-label mb-0 w-25">Usuario:</label>
                    <input className="form-control" value={form.username} onChange={(e) => setForm({...form, username: e.target.value})} required />
                  </div>
                  <div className="d-flex flex-row mb-2 align-items-center gap-2">
                    <label className="form-label mb-0 w-25">{editing ? "Cambiar contraseña (opcional)" : "Contraseña"}</label>
                    <input type="password" className="form-control" value={form.password} onChange={(e)=> setForm({...form, password: e.target.value})} />
                  </div>
                  <div className="d-flex flex-row mb-2 align-items-center gap-2">
                    <label className="form-label mb-0 w-25">Nombre:</label>
                    <input className="form-control" value={form.full_name} onChange={(e)=> setForm({...form, full_name: e.target.value})} />
                  </div>
                  <div className="d-flex flex-row mb-2 align-items-center gap-2">
                    <label className="form-label mb-0 w-25">Email:</label>
                    <input type="email" className="form-control" value={form.email} onChange={(e)=> setForm({...form, email: e.target.value})} />
                  </div>
                  <div className="d-flex flex-row mb-2 align-items-center gap-2">
                    <label className="form-label mb-0 w-25">Role:</label>
                    <select className="form-select" value={form.role} onChange={(e)=> setForm({...form, role: e.target.value})}>
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary">{editing ? "Guardar cambios" : "Crear"}</button>
                </div>
              </form>
            </div>
          </div>
      )}

      {showModalAsignar && (
        <AsignarZonalModal 
          token={token} 
          dataUser={user}
          onClose={() => {setShowModalAsignar(false); setUser(null);}} 
          onSaved={fetchUsers}
        />
      )}
      </div>
    </div>
  );
}

export default UsersManager;
