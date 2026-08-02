import React, {useState,useEffect} from "react";
import { Navbar, Nav, Container, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";


function MyNavbar({ user, onLogout, token }) {
  const [notificaciones, setNotificaciones] = useState([]);
  const [count, setCount] = useState(0);
  const [show, setShow] = useState(false);
  const navigate = useNavigate();
  const role = user?.role;

  const handleLogout = () => {
    onLogout();
    navigate("/");
  };



  const cargarNotificaciones = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/notificaciones`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("❌ Error backend:", text);
        return;
      }

      const data = await res.json();
      
      setNotificaciones(data); // 👈 reemplaza, no acumula
      setCount(data.length);   // 👈 correcto

    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (role !== "Admin") return;
    cargarNotificaciones();

    const interval = setInterval(() => {
      cargarNotificaciones();
    }, 500000);

    return () => clearInterval(interval);

  }, [role]);

  const marcarYRedirigir = async (notif) => {
    try {
      const res = await fetch(`${API_BASE_URL}/notificaciones/leido/${notif.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("❌ Error backend:", text);
        return;
      }

      cargarNotificaciones(); // 🔥 refresca la lista después de marcar como leído
      // Redirigir si existe una URL
      if (notif.url?.startsWith("/")) {
        navigate(notif.url);
      } else {
        navigate("/admin", {
          state: {
            tab: notif.url
          }
        });
      }

      setShow(false);

    } catch (err) {
      console.error(err);
    }
  };

  const [expanded, setExpanded] = useState(false);

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="shadow-sm" style={{ zIndex: 1050 }}
      expanded={expanded} onToggle={() => setExpanded(!expanded)} sticky="top">
      <Container fluid>

        <Navbar.Brand onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
          <img src="T.png" alt="Logo" style={{ height: "28px", marginRight: "8px" }} />
          Manager Crack
        </Navbar.Brand>

        {/* 🔥 HAMBURGUESA */}
        <Navbar.Toggle aria-controls="navbarNav" />

        {/* 🔥 CONTENIDO COLAPSABLE */}
        <Navbar.Collapse id="navbarNav">
          <Nav className="me-auto">

            {role !== "Comercial" && role !== "Zonal" && role !== "RRHH" && (
              <Nav.Link onClick={() => {navigate("/"); setExpanded(false); }}>
                Panel de Gestión
              </Nav.Link>
            )}

            {role === "Admin" && (
              <Nav.Link onClick={() => {navigate("/admin"); setExpanded(false); }}>
                Administración
              </Nav.Link>
            )}

            {(role === "Admin" || role === "Comercial" || role === "Zonal") && (
              <Nav.Link onClick={() => {navigate("/menu-locales"); setExpanded(false); }}>
                Menú Local
              </Nav.Link>
            )}
            {(role === "Admin" || role === "RRHH") && (
              <Nav.Link onClick={() => {navigate("/vendedores"); setExpanded(false); }}>
                Ingreso Vendedores
              </Nav.Link>
            )}

          </Nav>

          <div className="d-flex align-items-center gap-2">
            <span className="text-light">
              {user?.full_name} ({user?.role})
            </span>
            <div className="position-relative">
              <i className="bi bi-bell" style={{ fontSize: "18px", color: count > 0 ? "red" : "gray"}}
                title={ count > 0 ? "Notificaciones Pendientes" : "Sin Notificaciones"} onClick={() => setShow(!show)}></i>

              {notificaciones.some(n => !n.leido) && (
                <span className="badge bg-danger position-absolute top-0 start-100 translate-middle">
                  {count}
                </span>
              )}

              {/* 🔥 Popup */}
                {show && (
                  <div style={{ position: "absolute", right: 0, top: "30px", width: "300px", background: "#fff",
                      border: "1px solid #ddd", borderRadius: "8px", boxShadow: "0px 4px 10px rgba(0,0,0,0.1)",
                      zIndex: 1000 }} >
                    {notificaciones.length === 0 ? (
                      <div className="p-2 text-center">Sin notificaciones</div>
                    ) : (
                      notificaciones.map((n) => (
                        <div key={n.id} onClick={() => {
                            if (user?.role === "Admin") {
                              marcarYRedirigir(n);
                            }
                          }} style={{ padding: "10px", borderBottom: "1px solid #eee", cursor: "pointer" }} >
                          <div style={{ fontSize: "12px" }}>{n.contenido}</div>
                        </div>
                      ))
                    )}
                  </div>
                )}
            </div>
            <Button variant="outline-light" size="sm" onClick={handleLogout}>
              Cerrar sesión
            </Button>
          </div>
        </Navbar.Collapse>

      </Container>
    </Navbar>
  );
}

export default MyNavbar;