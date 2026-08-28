import React, { useCallback, useEffect, useState } from "react";
import { API_BASE_URL } from "../../config";

function UltimaVentaLocal({ token }) {
  const [data, setData] = useState([]);
  const [dataOriginal, setDataOriginal] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hora, setHora] = useState("");
  const [filtro, setFiltro] = useState("Estado");

  // QA por defecto
  const [empresaId, setEmpresaId] = useState(1);

  /* CONSULTAR BACKEND */
  const cargar = useCallback(async (empresa) => {
    setLoading(true);
    setError("");

    try {
      const r = await fetch(
        `${API_BASE_URL}/ventas/estado-horario?empresa_id=${empresa}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (r.status === 401) {
        localStorage.clear();
        window.location.replace("/login");
        return;
      }

      const d = await r.json();

      if (r.status === 503) {
        setError(
          d.message ||
          "Servidor central no disponible."
        );

        setData([]);
        setDataOriginal([]);
        return;
      }

      if (!r.ok) {
        throw new Error(
          d.message ||
          "Error consultando estado"
        );
      }

      const registros =
        Array.isArray(d) ? d : [];

      const prioridad = {
        "Sin ventas hoy": 1,
        Critica: 2,
        "Demora leve": 3,
        "En horario": 4,
        Cerrado: 5,
      };

      registros.sort(
        (a, b) =>
          (prioridad[a.estado] ?? 99) -
          (prioridad[b.estado] ?? 99)
      );

      setDataOriginal(registros);

    } catch (err) {
      console.error(
        "Error consultando estado:",
        err
      );

      setError(
        err.message ||
        "Error consultando estado"
      );

      setData([]);
      setDataOriginal([]);

    } finally {
      setLoading(false);
    }
  }, [token]);

  /* CARGA INICIAL + CAMBIO EMPRESA */

  useEffect(() => {
    setData([]);
    setDataOriginal([]);

    cargar(empresaId);
  }, [empresaId,cargar]);

  /* AUTO REFRESH */

  useEffect(() => {
    const intervalo = setInterval(() => {
      cargar(empresaId);
    }, 500000);

    return () => clearInterval(intervalo);
  }, [empresaId,cargar]);

  /* FILTRO ESTADO */

  useEffect(() => {
    if (filtro === "Estado") {
      setData(dataOriginal);
      return;
    }

    setData(
      dataOriginal.filter(
        x => x.estado === filtro
      )
    );

  }, [filtro, dataOriginal]);

  /* COLOR ESTADO */

  const getBadge = (estado) => {
    if (estado === "En horario") {
      return "badge bg-success";
    }

    if (estado === "Demora leve") {
      return "badge bg-warning text-dark";
    }

    if (estado === "Sin ventas hoy") {
      return "badge bg-secondary";
    }

    if (estado === "Cerrado") {
      return "badge bg-dark";
    }

    return "badge bg-danger";
  };

  /* COLOR FILA */

  const getRowColor = (estado) => {
    if (estado === "Critica") {
      return "#ffd6d6";
    }

    if (estado === "Demora leve") {
      return "#fff4cc";
    }

    if (estado === "En horario") {
      return "#e6ffe6";
    }

    if (estado === "Cerrado") {
      return "#f8f9fa";
    }

    return "";
  };

  /* HORA ACTUAL */

  useEffect(() => {
    const actualizarHora = () => {
      const ahora = new Date();

      const horaChile = ahora.toLocaleString("es-CL", {
        timeZone: "America/Santiago",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

      setHora(horaChile);
    };

    actualizarHora();

    const intervalo = setInterval(
      actualizarHora,
      60000
    );

    return () => clearInterval(intervalo);

  }, []);

  return (
    <div className="container-fluid mt-0 p-0">

      {/* HEADER */}

      <div className="d-flex flex-wrap justify-content-between mb-2 gap-2 align-items-center">

        <h3 className="m-0">
          Monitor{" "}
          <span className="d-none d-md-inline">
            de Ventas
          </span>
        </h3>

        {/* EMPRESA */}

        <select
          value={empresaId}
          onChange={(e) =>
            setEmpresaId(
              Number(e.target.value)
            )
          }
          className="form-select w-auto"
          title="Empresa"
          disabled={loading}
        >
          <option value={1}>
            Tarragona
          </option>

          <option value={3}>
            Elemental - PS
          </option>
        </select>

        {/* FILTRO ESTADO */}

        <select
          value={filtro}
          onChange={(e) =>
            setFiltro(e.target.value)
          }
          className="form-select w-auto"
          title="Estado de Ventas"
        >
          <option value="Estado">
            Todos
          </option>

          <option value="En horario">
            En horario
          </option>

          <option value="Demora leve">
            Demora leve
          </option>

          <option value="Critica">
            Critica
          </option>

          <option value="Sin ventas hoy">
            Sin ventas hoy
          </option>

          <option value="Cerrado">
            Cerrado Hoy
          </option>
        </select>

        {/* ACTUALIZAR */}

        <button
          className="btn btn-primary"
          onClick={() => cargar(empresaId)}
          disabled={loading}
          title="Actualizar Ventas"
        >
          🔄

          <span className="d-none d-md-inline ms-1">
            Actualizar
          </span>
        </button>

        {/* HORA */}

        <div className="d-flex justify-content-center align-items-center">

          <span className="d-none d-md-inline ms-1">
            HORA:
          </span>

          <input
            className="divhora"
            type="text"
            name="HoraActual"
            value={hora}
            readOnly
            style={{
              width: "70px",
              textAlign: "center",
              border: "none",
              fontWeight: "bold",
            }}
          />

        </div>

      </div>

      {/* PROGRESO */}

      {loading && (
        <div className="progress mb-2">

          <div
            className="progress-bar progress-bar-striped progress-bar-animated"
            style={{
              width: "100%",
            }}
          >
            Consultando servidor...
          </div>

        </div>
      )}

      {/* ERROR */}

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      {/* TABLA */}

      <div
        style={{
          maxHeight: 500,
          overflowY: "auto",
        }}
      >

        <table className="table table-bordered table-sm">

          <thead
            className="sticky-top bg-white shadow-sm"
            style={{
              zIndex: 1,
            }}
          >

            <tr className="table-secondary text-center">

              <th>
                <span className="d-none d-md-inline">
                  Nombre{" "}
                </span>
                Local
              </th>

              <th
                className="d-none d-md-table-cell"
                style={{
                  width: 200,
                }}
              >
                Última Venta
              </th>

              <th
                style={{
                  width: 100,
                }}
              >
                Minutos
              </th>

              <th
                style={{
                  width: 150,
                }}
              >
                Estado
              </th>

            </tr>

          </thead>

          <tbody>

            {data.length === 0 &&
              !loading && (

                <tr>
                  <td
                    colSpan="4"
                    className="text-center text-muted"
                  >
                    Sin datos
                  </td>
                </tr>

              )}

            {data.map((l) => (

              <tr
                key={
                  l.connection_id ??
                  `${empresaId}-${l.codLocal}`
                }
                style={{
                  background:
                    getRowColor(
                      l.estado
                    ),
                }}
              >

                <td>
                  {l.nombreLocal}
                </td>

                <td className="d-none d-md-table-cell">
                  {l.ultimaFecha
                    ? l.ultimaFecha.replace(
                        "T",
                        " "
                      )
                    : "-"}
                </td>

                <td>
                  {l.minutos ?? "-"}
                </td>

                <td className="text-center">

                  <span
                    className={
                      getBadge(
                        l.estado
                      )
                    }
                  >
                    {l.estado}
                  </span>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}

export default UltimaVentaLocal;