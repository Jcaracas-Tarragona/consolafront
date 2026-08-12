import { useEffect, useState, useCallback } from "react";
import HorarioBaseFormModal from "./HorarioBaseFormModal";
import HorarioEspecialModal from "./HorarioEspecialModal";
import Pagination from "../common/Pagination";
import { API_BASE_URL } from "../../config";
import MobileActions from "../utils/MobileActions";

export default function HorariosBasePage({ token }) {
  const [horarios, setHorarios] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingHorario, setEditingHorario] = useState(null);
  const [showEspecialModal, setShowEspecialModal] = useState(false);
  const [horarioEspecial, setHorarioEspecial] = useState(null);
  const [searchLocal, setSearchLocal] = useState("");

  const limit = 10;

  /* ===============================
     Cargar horarios base (AGRUPADOS)
  =============================== */
  const fetchHorarios = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page, limit });

      if (searchLocal.trim()) {
            params.append("search", searchLocal.trim());
        }
    
      const res = await fetch(`${API_BASE_URL}/horarios-base?${params}`, {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!res.ok) {
        console.error("❌ Error cargando horarios base");
        return;
      }

      const data = await res.json();
      
      setHorarios(Array.isArray(data.items) ? data.items : []);
      setTotal(data.total || 0);
      

    } catch (err) {
      console.error("❌ Error inesperado", err);
    }
  }, [page, searchLocal, token]);

  useEffect(() => {
    fetchHorarios();
  }, [fetchHorarios]);

  const exportarExcel = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/horarios-base/export/excel`,{
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!response.ok) throw new Error("Error exportando");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "horarios.xlsx";
      a.click();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("No se pudo exportar el Excel");
    }
  };

  /* ===============================
     Render
  =============================== */
  return (
    <div className="cardpad card p-3 shadow-sm ">

      <div className="d-flex justify-content-between align-items-center mb-2 gap-2 mlocalfilter">
        <h4 className="mb-0">Horarios Base</h4>
        <div className="d-flex gap-2 justify-content-end" >
            <input type="text" className="form-control m-0" placeholder="Buscar local..."
              value={searchLocal} onChange={(e) => {
                setSearchLocal(e.target.value);
                setPage(1); // reset página
            }} style={{ width: "220px" }} />

            <button className="btn btn-success" onClick={exportarExcel} title="Exportar Excel">
              <i className="bi bi-file-earmark-excel"></i>{" "}
              <span className="d-none d-md-inline ms-1">Exportar</span>
            </button>
            <button className="btn btn-primary m-0" title="Asignar nuevo horario" onClick={() => {
                setEditingHorario(null);      // 👈 creación normal
                setShowModal(true);
              }}
            > ➕ <span className="d-none d-md-inline ms-1">Nuevo Horario </span>
            </button>
        </div>        
      </div>
      <div style={{ maxHeight: 500, overflowY: "auto" }}>
      <table className="table table-bordered table-hover table-sm align-middle">
        <thead className="table-light sticky-top" style={{ zIndex: 1 }}>
          <tr className="text-center table-secondary">
            <th><span className="d-none d-md-inline ms-1">Nombre </span>Local</th>
            <th className="d-none d-md-table-cell">Días</th>
            <th className="d-none d-md-table-cell">Apertura - Cierre</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {horarios.length === 0 ? (
            <tr>
              <td colSpan="4" className="text-center">
                No hay horarios registrados
              </td>
            </tr>
          ) : (
            horarios.map((local) => (
              <tr key={local.codlocal}>
                <td><strong>{local.local_nombre}</strong>
                <div className="d-md-none text-muted small text-left" style={{ width: "100%" }}>
                  {local.horarios.map((h, i) => (
                    <div key={i}>
                      {h.dias} - {h.cerrado ? "CERRADO" : `${h.horario}`}
                    </div>
                  ))}
                </div>
              </td>

                <td className="d-none d-md-table-cell">
                  {local.horarios.map((h, i) => (
                    <div key={i}>
                      {h.dias}
                    </div>
                  ))}
                </td>

                <td className="d-none d-md-table-cell">
                  {local.horarios.map((h, i) => (
                    <div key={i}>
                      {h.cerrado
                            ? "CERRADO"
                            : `${h.horario}`}
                    </div>
                  ))}
                </td>

                <td className="text-center">
                  <div className="d-none d-md-flex gap-2 justify-content-center ">
                    <button className="btn btn-sm btn-outline-primary" title="Reemplazar Horario" onClick={() => {
                        setEditingHorario({
                          codlocal: local.codlocal,
                          local_nombre: local.local_nombre
                        });
                        setShowModal(true);
                      }}>🔁 
                    </button>

                    <button className="btn btn-sm btn-outline-warning " title="Asignar Horario Especial"
                      onClick={() => {
                        setHorarioEspecial({
                          codlocal: local.codlocal,
                          local_nombre: local.local_nombre
                        });
                        setShowEspecialModal(true);
                      }}
                    > ⏰
                    </button>

                  </div>
                  {/* MOBILE */}
                  <MobileActions
                    actions={[
                      {
                        label: "Reemplazar Horario",
                        icon: "🔁",
                        onClick: () => {
                          setEditingHorario({
                            codlocal: local.codlocal,
                            local_nombre: local.local_nombre
                          });
                          setShowModal(true);
                        }
                      },
                      {
                        label: "Asignar Horario Especial",
                        icon: "⏰",
                        onClick: () => {
                          setHorarioEspecial({
                            codlocal: local.codlocal,
                            local_nombre: local.local_nombre
                          });
                          setShowEspecialModal(true);
                        }
                      }
                    ]}
                  />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>  
      <Pagination
        page={page}
        total={total}
        limit={limit}
        onPageChange={setPage}
      />

      {showModal && (
        <HorarioBaseFormModal
          token={token}
          localReemplazo={editingHorario} // 👈 null = nuevo | objeto = reemplazo
          show={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingHorario(null);
          }}
          onSaved={fetchHorarios}
        />
      )}

      {showEspecialModal && (
        <HorarioEspecialModal
          token={token}
          data={horarioEspecial}
          onClose={() => setShowEspecialModal(false)}
          onSaved={fetchHorarios}
        />
      )}
        
    </div>
  );
}
