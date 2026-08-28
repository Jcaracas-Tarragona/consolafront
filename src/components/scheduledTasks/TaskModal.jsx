import { useCallback, useEffect, useState } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import { API_BASE_URL } from "../../config";

const dias = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 7, label: "Domingo" }
];

export default function TaskModal({show,onClose,refresh,task,token}) {

  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    activo: true,
    visible: true,
    requiere_confirmacion: false,
    dia_activar: "",
    dia_desactivar: "",
    omitir_proxima_desactivacion: false
  });
  const [nuevoArticulo, setNuevoArticulo] = useState("");
  const [articulos, setArticulos] = useState([]);

  const cargarTask = useCallback(async (id) => {
    try {
      const res = await fetch( `${API_BASE_URL}/scheduled-tasks/tarea/${id}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || "Error cargando la tarea"
        );
      }

      setForm({
        nombre: data.nombre,
        descripcion: data.descripcion ?? "",
        activo: data.activo,
        visible: data.visible,
        requiere_confirmacion: data.requiere_confirmacion,
        dia_activar: data.dia_activar,
        dia_desactivar: data.dia_desactivar,
        omitir_proxima_desactivacion:
          data.omitir_proxima_desactivacion
      });

      setArticulos(
        data.articulos?.length
          ? data.articulos.map(x => x.codigo_articulo)
          : []
      );

    } catch (err) {
      console.error("Error cargando tarea:", err);
    }
  }, [token]);


  /* CARGAR / LIMPIAR MODAL */

  useEffect(() => {
    if (!show) return;

    if (task) {
      cargarTask(task.id);
      return;
    }

    setForm({
      nombre: "",
      descripcion: "",
      activo: true,
      visible: true,
      requiere_confirmacion: false,
      dia_activar: "",
      dia_desactivar: "",
      omitir_proxima_desactivacion: false
    });

    setArticulos([]);

  }, [show, task, cargarTask]);

  function onChange(e) {

    const { name, value, checked, type } = e.target;

    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox"
        ? checked
        : value
    }));

  }

  /*function cambiarArticulo(index, value) {

    const copia = [...articulos];

    copia[index] = value;

    setArticulos(copia);

  }*/

function agregarArticulo() {

  const codigo = nuevoArticulo.trim();

  if (!codigo) return;

  if (!/^\d+$/.test(codigo)) {
    alert("Ingrese un código de artículo válido.");
    return;
  }

  if (articulos.includes(codigo)) {
    alert("El artículo ya fue agregado.");
    return;
  }

  setArticulos(prev => [...prev, codigo]);
  setNuevoArticulo("");

}

  function eliminarArticulo(index) {

    setArticulos(prev =>
      prev.filter((_, i) => i !== index)
    );

  }

  async function guardar() {

    try {

      const payload = {
        ...form,
        articulos: articulos.filter(x => x !== "")
      };

      const url = task
        ? `${API_BASE_URL}/scheduled-tasks/${task.id}`
        : `${API_BASE_URL}/scheduled-tasks`;

      const method = task
        ? "PUT"
        : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error("Error guardando");
      }

      refresh();

      onClose();

    } catch (err) {

      console.error(err);

      alert("No fue posible guardar.");

    }

  }

  return (

    <Modal show={show} onHide={onClose} size="lg" centered >
      <Modal.Header closeButton>
        <Modal.Title>
          {task ? "Editar tarea" : "Nueva tarea"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row>
          <Col md={8}>
            <Form.Group className="mb-3">
              <Form.Control name="nombre" value={form.nombre} onChange={onChange} placeholder="Nombre de la Tarea"/>
            </Form.Group>
          </Col>
        </Row>
        <Form.Group className="mb-3">
          <Form.Control as="textarea" rows={2} name="descripcion" value={form.descripcion}
            onChange={onChange} placeholder="Descripción"/>
        </Form.Group>

        <Row>
          <Col md={4} className="d-flex align-items-center me-2">
            <Form.Label className="me-2">
              Activar
            </Form.Label>
            <Form.Select name="dia_activar" value={form.dia_activar} onChange={onChange} >
              <option value="">
                Seleccione Día
              </option>
              {dias.map(d => (
                <option key={d.value} value={d.value} >
                  {d.label}
                </option>
              ))}
            </Form.Select>
          </Col>

          <Col md={4} className="d-flex align-items-center">
            <Form.Label className="me-2">
              Desactivar
            </Form.Label>
            <Form.Select name="dia_desactivar" value={form.dia_desactivar} onChange={onChange} >
              <option value="">
                Seleccione Día
              </option>
              {dias.map(d => (
                <option key={d.value} value={d.value} >
                  {d.label}
                </option>
              ))}
            </Form.Select>
          </Col>
        </Row>

        <hr />

        <Form.Check label="Producto Visible" name="visible" checked={form.visible}
          onChange={onChange} title="Marque si quiere que el producto sea visible en el local" />

        <Form.Check label="Requiere confirmación" name="requiere_confirmacion" checked={form.requiere_confirmacion}
          onChange={onChange} title="Tarea no se ejecuta automaticamente, requiere ejecución manual"
        />

        <hr />
        <Row className="align-items-center mb-3">

          <Col xs="auto">
            <Form.Label className="mb-0">
              Artículo
            </Form.Label>
          </Col>

          <Col xs="auto">
            <Form.Control
              style={{ width: "140px" }}
              value={nuevoArticulo}
              placeholder="Código"
              onChange={(e) => setNuevoArticulo(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  agregarArticulo();
                }
              }}
            />
          </Col>
            <Col xs="auto">
              <Button onClick={agregarArticulo}>
                <i className="bi bi-plus-lg"></i>
              </Button>
            </Col>
        </Row>

        <div className="d-flex flex-wrap gap-2 mb-2">
          {articulos.map((codigo, index) => (
            <div key={index} className="badge bg-primary d-flex align-items-center px-3 py-2"
            style={{ fontSize: "0.95rem" }} >
              <span>{codigo}</span>
              <Button variant="link" className="text-white p-0 ms-2"
                style={{ textDecoration: "none", fontSize: "1rem", lineHeight: 1 }}
                onClick={() => eliminarArticulo(index)} >
                <i className="bi bi-x-lg"></i>
              </Button>
            </div>
          ))}
        </div>


      </Modal.Body>
      <Modal.Footer>

        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>

        <Button onClick={guardar} >
          Guardar
        </Button>

      </Modal.Footer>
    </Modal>
  );
}