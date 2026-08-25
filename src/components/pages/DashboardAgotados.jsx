import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../../config";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import * as XLSX from "xlsx";
import { Dropdown } from "react-bootstrap";
import DatePicker from "react-datepicker";

function DashboardAgotados({ token }) {

  const getYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d; // ✅ Date real
  };

  const [limit, setLimit] = useState(10);
  const [data, setData] = useState({
    productos: [],
    locales: [],
    detalle: [],
    dias: []
  });
  const [rango, setRango] = useState([getYesterday(), getYesterday()]);
  const [startDate, endDate] = rango;

  const [loading, setLoading] = useState(false);
  
  const formatDate = (date) => {
    if (!date || !(date instanceof Date)) return null;
    return date.toLocaleDateString("sv-SE"); // ✅ sin problemas de zona horaria
  };

  const cargar = async () => {
    if (!startDate || !endDate) {
        console.warn("Fechas incompletas");
        return;
    }
    setLoading(true);

    const desde = formatDate(startDate);
    const hasta = formatDate(endDate);
    
    try {
      const qs = `?date_from=${desde}&date_to=${hasta}&limit=${limit}`;
      const res = await fetch(`${API_BASE_URL}/reports/productosagotados${qs}`, 
        { headers: { Authorization: `Bearer ${token}`}, 
        });

       if (!res.ok) {
      console.error("Error HTTP:", res.status);
      return;
    }

    const d = await res.json();
    
    setData({
      productos: d.productos || [],
      locales: d.locales || [],
      detalle: d.detalle || [],
      dias: d.dias || []
    });

    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (!startDate || !endDate) return;
    cargar();
  }, [endDate, limit]);

  // 📊 KPIs
  const totalAgotados = data.detalle.length;
  const productosUnicos = new Set(data.detalle.map(d => d.producto)).size;
  const localesUnicos = new Set(data.detalle.map(d => d.local)).size;

  const getColor = (valor) => {
    if (valor >= 10) return "#dc3545"; // rojo (crítico)
    if (valor >= 5) return "#ffc107"; // amarillo (medio)
    return "#28a745"; // verde (bajo)
  };

  // 📥 Excel
  const exportarExcel = () => {
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(data.productos),
      "Productos"
    );

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(data.locales),
      "Locales"
    );

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(data.detalle),
      "Detalle"
    );

    XLSX.writeFile(wb, `ProductosAgotados.xlsx`);
  };

  const getColorDia = (valor) => {
    if (valor >= 50) return "#dc3545"; // crítico
    if (valor >= 20) return "#ffc107"; // medio
    return "#28a745"; // bajo
  };

  const isMobile = window.innerWidth < 768;

  return (
    <div className="container-fluid p-2">

      <h4 className="mb-2">Dashboard Agotados</h4>

      {/* 🔥 FILTROS */}
      <div className="d-flex gap-2 mb-2 flex-wrap justify-content-between align-items-center">
        <div className="w-75 datePicker" style={{ maxWidth: 250 }} title="Seleccionar Rango de fechas">
            <DatePicker
                selectsRange={true}
                startDate={startDate}
                endDate={endDate}
                onChange={(update) => setRango(update)}
                className="form-control"
                dateFormat="yyyy-MM-dd"
                withPortal={isMobile}                // 🔥 clave
                popperPlacement={isMobile ? "bottom-start" : "auto"}
            />
        </div>

        <div className="d-flex align-items-center gap-2 justify-content-end">
            {/* 🔥 Filtro limit */}
            <Dropdown>
                <Dropdown.Toggle variant="outline-primary">
                    Top {limit}
                </Dropdown.Toggle>

                <Dropdown.Menu>
                    {[5, 10, 15, 20].map((val) => (
                    <Dropdown.Item key={val} onClick={() => setLimit(val)}>
                        Top {val}
                    </Dropdown.Item>
                    ))}
                </Dropdown.Menu>
            </Dropdown>

            <button onClick={exportarExcel} className="btn btn-success">
            <span className="d-none d-md-inline ms-1">Exportar</span>Excel
            </button>
        </div>
      </div>

      {/* 🔥 KPIs */}
      <div className="row mb-2">

        <div className="col-md-4 mb-2">
          <div className="card p-3 shadow-sm d-flex flex-row align-items-center gap-3">
            <h6>Total Agotados:</h6>
            <h3>{totalAgotados}</h3>
          </div>
        </div>

        <div className="col-md-4 mb-2">
          <div className="card p-3 shadow-sm d-flex flex-row align-items-center gap-3">
            <h6>Productos Afectados:</h6>
            <h3>{productosUnicos}</h3>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card p-3 shadow-sm d-flex flex-row align-items-center gap-3">
            <h6>Locales Afectados:</h6>
            <h3>{localesUnicos}</h3>
          </div>
        </div>

      </div>

      {/* 🔥 GRÁFICOS */}
      <div className="row">

        <div className="col-md-12 mb-2">
          <div className="card p-3 shadow-sm">
            <h6>Top Productos Agotados</h6>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.productos}>
                <XAxis dataKey="producto" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="cantidad">
                    {data.productos.map((entry, index) => (
                    <Cell key={index} fill={getColor(entry.cantidad)} />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-md-6 mb-2">
          <div className="card p-3 shadow-sm">
            <h6>Locales con más Agotados</h6>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.locales}>
                <XAxis dataKey="local" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="cantidad">
                    {data.productos.map((entry, index) => (
                    <Cell key={index} fill={getColor(entry.cantidad)} />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="col-md-6 mb-2">
          <div className="card p-3 shadow-sm">
                <strong>Agotados por día de la semana</strong>
            

            <div style={{ width: "50%", height: 300 }}>
                <ResponsiveContainer>
                <BarChart data={data.dias}>
                    <XAxis dataKey="dia" />
                    <YAxis />
                    <Tooltip />

                    <Bar dataKey="cantidad">
                    {data.dias?.map((entry, index) => (
                        <Cell key={index} fill={getColorDia(entry.cantidad)} />
                    ))}
                    </Bar>

                </BarChart>
                </ResponsiveContainer>
            </div>
            </div>
        </div>

      </div>

      {/* 🔥 DETALLE */}
      <div className="card shadow-sm mt-2">

        <div className="card-header">
          <h6 className="mb-0">Detalle</h6>
        </div>

        <div style={{ maxHeight: 400, overflowY: "auto" }}>
          <table className="table table-sm table-hover mb-0">

            <thead className="table-light">
              <tr>
                <th>Producto</th>
                <th>Local</th>
                <th>Fecha</th>
              </tr>
            </thead>

            <tbody>
                { data.detalle.length === 0 ? (
                    <tr>
                    <td colSpan="6" className="text-center">No hay registrados</td>
                    </tr>
                ) : (
                    data.detalle.map((d, i) => (
                        <tr key={i}>
                        <td>{d.producto}</td>
                        <td>{d.local}</td>
                        <td>{new Date(d.fecha).toLocaleString("es-CL")}</td>
                        </tr>
                    ))
                )}
            </tbody>

          </table>
        </div>

      </div>

      {loading && <div className="mt-3">Cargando...</div>}

    </div>
  );
}

export default DashboardAgotados;