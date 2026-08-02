import { useEffect, useRef, useState } from "react";
import { Form, InputGroup, Alert } from "react-bootstrap";

export default function UploadExcel({ file, setFile, setIsValidFile }) {

  const [message, setMessage] = useState("");
  const [variant, setVariant] = useState("success");
  const inputRef = useRef(null);

  useEffect(() => {
    if (!file && inputRef.current) {
      inputRef.current.value = "";
      setMessage("");
    }
  }, [file]);

  function seleccionarArchivo(e) {

    const selectedFile = e.target.files[0];

    if (!selectedFile) {
      setFile(null);
      setIsValidFile(false);
      setMessage("");
      return;
    }

    const extension = selectedFile.name
      .split(".")
      .pop()
      .toLowerCase();

    if (!["xlsx", "xls"].includes(extension)) {

      setFile(null);
      setIsValidFile(false);

      setVariant("danger");
      setMessage("El archivo seleccionado no corresponde a un archivo Excel válido.");

      e.target.value = "";

      return;
    }

    setFile(selectedFile);
    setIsValidFile(true);

    setVariant("success");
    setMessage("Archivo válido. Listo para importar.");

  }

  return (

    <>

      <Form.Group>
        <Form.Label className="fw-semibold">
          Archivo Excel
        </Form.Label>
        <InputGroup>
          <Form.Control
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={seleccionarArchivo}
          />
        </InputGroup>
      </Form.Group>

      {file && (

        <div className="mt-3">

          <div className="d-flex align-items-center">

            <i className="bi bi-file-earmark-excel-fill text-success me-2 fs-4"></i>

            <div>

              <div className="fw-semibold">
                {file.name}
              </div>

              <small className="text-muted">
                {(file.size / 1024).toFixed(1)} KB
              </small>

            </div>

          </div>

        </div>

      )}

      {message && (

        <Alert
          variant={variant}
          className="mt-3 mb-0"
        >

          {variant === "success"
            ? <i className="bi bi-check-circle-fill me-2"></i>
            : <i className="bi bi-exclamation-triangle-fill me-2"></i>
          }

          {message}

        </Alert>

      )}

    </>

  );

}