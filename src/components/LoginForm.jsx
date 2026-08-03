// src/components/LoginForm.jsx

import React, { useState } from "react";
import { API_BASE_URL } from "../config";
import "./Login.css";

function LoginForm({ onLogin }) {

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {

    e.preventDefault();

    setError("");
    setLoading(true);

    try {

      const res = await fetch(`${API_BASE_URL}/auth/login`, {

        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          username,
          password
        })

      });

      if (!res.ok)
        throw new Error();

      const data = await res.json();

      localStorage.setItem("authToken", data.token);
      localStorage.setItem("authUser", data.user);

      onLogin(data.token, data.user);

    } catch {

      setError("Usuario o contraseña incorrectos.");

    } finally {

      setLoading(false);

    }

  };

  return (

    <div className="login-page">

      <div className="login-overlay">

        <div className="login-card">

          <h2 className="login-title">

            Bienvenido

          </h2>

          <p className="login-subtitle">

            Ingrese sus credenciales para acceder al sistema

          </p>

          <form onSubmit={handleSubmit}>

            <div className="form-floating mb-3">

              <input

                id="username"

                type="text"

                className="form-control login-input"

                placeholder="Usuario"

                autoComplete="username"

                value={username}

                onChange={(e) =>
                  setUsername(e.target.value)
                }

                required

              />

              <label htmlFor="username">

                <i className="bi bi-person-fill me-2"></i>

                Usuario

              </label>

            </div>

            <div className="form-floating mb-4">

              <input

                id="password"

                type="password"

                className="form-control login-input"

                placeholder="Contraseña"

                autoComplete="current-password"

                value={password}

                onChange={(e) =>
                  setPassword(e.target.value)
                }

                required

              />

              <label htmlFor="password">

                <i className="bi bi-lock-fill me-2"></i>

                Contraseña

              </label>

            </div>

            {error && (

              <div className="alert alert-danger py-2">

                <i className="bi bi-exclamation-circle-fill me-2"></i>

                {error}

              </div>

            )}

            <button

              type="submit"

              className="btn login-btn w-100"

              disabled={loading}

            >

              {loading ? (

                <>

                  <span
                    className="spinner-border spinner-border-sm me-2"
                  />

                  Ingresando...

                </>

              ) : (

                <>

                  <i className="bi bi-box-arrow-in-right me-2"></i>

                  Ingresar

                </>

              )}

            </button>

          </form>

        </div>

      </div>

    </div>

  );

}

export default LoginForm;