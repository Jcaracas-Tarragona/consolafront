import { useMemo, useState } from "react";
import { Badge, Form, InputGroup, Row, Col, Table } from "react-bootstrap";

export default function VendorsTable({ data = [] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("TODOS");

  const badgeAccion = (accion) => {
    switch (accion) {
      case "CREATE":
        return <Badge bg="success">Crear</Badge>;
      case "UPDATE":
        return (
          <Badge bg="warning" text="dark">
            Actualizar
          </Badge>
        );
      case "DEACTIVATE":
        return <Badge bg="danger">Desactivar</Badge>;
      case "SIN_CAMBIOS":
        return <Badge bg="secondary">Sin cambios</Badge>;
      default:
        return (
          <Badge bg="light" text="dark">
            {accion}
          </Badge>
        );
    }

  };

  const badgeCambio = (cambio) => {
    switch (cambio) {
      case "LOCAL":
        return (
          <Badge bg="primary" className="me-1">
            Local
          </Badge>
        );

      case "PERFIL":
        return (
          <Badge bg="info" className="me-1">
            Perfil
          </Badge>
        );

      case "ESTADO":
        return (
          <Badge bg="dark" className="me-1">
            Estado
          </Badge>
        );

      default:
        return (
          <Badge bg="secondary" className="me-1">
            {cambio}
          </Badge>
        );
    }
  };

  const registros = useMemo(() => {
    return data.filter(v => {
      const texto =
        `${v.cuil} ${v.nombre}`.toLowerCase();

      const cumpleBusqueda =
        texto.includes(search.toLowerCase());

      const cumpleFiltro =
        filter === "TODOS" ||
        v.accion === filter;

      return cumpleBusqueda && cumpleFiltro;
    });
  }, [data, search, filter]);

  return (
    <>
      <Row className="mb-3">
        <Col md={6}>
          <InputGroup>
            <InputGroup.Text>
              <i className="bi bi-search"></i>
            </InputGroup.Text>
            <Form.Control placeholder="Buscar por documento o nombre..." value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />
          </InputGroup>
        </Col>
        <Col md={3}>
          <Form.Select value={filter} onChange={(e) =>
              setFilter(e.target.value)
            }>
            <option value="TODOS">Todas las acciones</option>
            <option value="CREATE">Crear</option>
            <option value="UPDATE">Actualizar</option>
            <option value="DEACTIVATE">Desactivar</option>
            <option value="SIN_CAMBIOS">Sin cambios</option>
          </Form.Select>
        </Col>
        <Col md={3} className="d-flex align-items-center justify-content-end" >
          <strong>
            {registros.length}
            {" "}registros
          </strong>
        </Col>
      </Row>
      <div className="border rounded" style={{ maxHeight: "550px", overflowY: "auto" }} >
        <Table hover bordered responsive size="sm" className="mb-0 align-middle small" style={{ fontSize: "0.80rem" }} >
          <thead className="table-light sticky-top" style={{ zIndex: 1 }} >
            <tr>
              <th style={{ width: 100 }}>
                Documento
              </th>
              <th>
                Nombre
              </th>
              <th style={{ width: 120 }}>
                Perfil
              </th>
              <th style={{ width: 190 }}>
                Local
              </th>

              <th style={{ width: 140 }}>
                Acción
              </th>

              <th style={{ width: 160 }}>
                Cambios
              </th>

            </tr>

          </thead>

          <tbody>

            {registros.length === 0 && (

              <tr>
                <td colSpan={6} className="text-center text-muted py-4" >
                  No existen registros para mostrar.
                </td>
              </tr>
            )}
            {registros.map((v, index) => (
              <tr key={index}>
                <td>
                  {v.cuil}
                </td>
                <td className="py-1" title={v.nombre} 
                  style={{ maxWidth: "220px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} >
                  {v.nombre}
                </td>
                <td>
                  {v.perfil}
                </td>
                <td title={v.localNombre} 
                  style={{ maxWidth: "220px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {v.localNombre}
                </td>
                <td>
                  {badgeAccion(v.accion)}
                </td>
                <td>
                  {v.cambios?.length
                    ? v.cambios.map((c, i) => (
                        <span key={i}>
                          {badgeCambio(c)}
                        </span>
                      ))
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </>
  );
}