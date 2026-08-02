import { Card, Col, Row } from "react-bootstrap";

export default function ImportSummary({ summary }) {

  if (!summary) return null;

  return (

    <Card className="border-0 bg-light mb-3">

      <Card.Body>

        <Row className="text-center">

          <Col md={3} className="mb-3 mb-md-0">

            <div className="fs-3 fw-bold text-primary">

              {summary.procesados ?? 0}

            </div>

            <div className="text-muted">

              Registros procesados

            </div>

          </Col>

          <Col md={3} className="mb-3 mb-md-0">

            <div className="fs-3 fw-bold text-success">

              {summary.creados ?? 0}

            </div>

            <div className="text-muted">

              Nuevos

            </div>

          </Col>

          <Col md={3} className="mb-3 mb-md-0">

            <div className="fs-3 fw-bold text-warning">

              {summary.actualizados ?? 0}

            </div>

            <div className="text-muted">

              Actualizados

            </div>

          </Col>

          <Col md={3}>

            <div className="fs-3 fw-bold text-danger">

              {summary.desactivados ?? 0}

            </div>

            <div className="text-muted">

              Inactivos

            </div>

          </Col>

        </Row>

      </Card.Body>

    </Card>

  );

}