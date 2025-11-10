import React, { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
const API_AUDIENCE = import.meta.env.VITE_AUTH0_AUDIENCE;

function App() {
  const {
    isAuthenticated,
    isLoading,
    loginWithRedirect,
    logout,
    getAccessTokenSilently,
    user,
    error: authError,
  } = useAuth0();

  const [movies, setMovies] = useState([]);
  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    nota: "",
    diretor: "",
  });
  const [loadingMovies, setLoadingMovies] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Pega access token da API
  const getApiToken = async () => {
    const token = await getAccessTokenSilently(
      API_AUDIENCE
        ? {
            authorizationParams: {
              audience: API_AUDIENCE,
            },
          }
        : undefined
    );
    return token;
  };

  // Buscar filmes
  const fetchMovies = async () => {
    if (!isAuthenticated) return;

    try {
      setLoadingMovies(true);
      setError(null);

      const token = await getApiToken();

      const res = await fetch(`${API_BASE_URL}/movies`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error("Não autorizado para listar filmes.");
        }
        throw new Error(`Erro ao buscar filmes (${res.status})`);
      }

      const data = await res.json();
      setMovies(data);
    } catch (err) {
      setError(err.message || "Erro ao carregar filmes.");
    } finally {
      setLoadingMovies(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchMovies();
    } else {
      setMovies([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Controle dos inputs
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "nota") {
      const num = value === "" ? "" : Number(value);
      if (num !== "" && (Number.isNaN(num) || num < 0 || num > 5)) {
        return; // ignora inválido
      }
      setForm((prev) => ({ ...prev, nota: num }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Submit do form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (
      !form.nome.trim() ||
      !form.descricao.trim() ||
      !form.diretor.trim() ||
      form.nota === ""
    ) {
      setError("Preencha todos os campos.");
      return;
    }

    try {
      setSubmitting(true);
      const token = await getApiToken();

      const body = {
        nome: form.nome.trim(),
        descricao: form.descricao.trim(),
        diretor: form.diretor.trim(),
        nota: Number(form.nota),
      };

      const res = await fetch(`${API_BASE_URL}/movies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        let msg = `Erro ao cadastrar filme (${res.status})`;
        try {
          const data = await res.json();
          msg = data?.erro || data?.message || msg;
        } catch (_) {}
        throw new Error(msg);
      }

      const saved = await res.json();
      setMovies((prev) => [...prev, saved]);

      setForm({
        nome: "",
        descricao: "",
        nota: "",
        diretor: "",
      });

      setSuccess("Filme cadastrado com sucesso!");
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError(err.message || "Erro ao cadastrar filme.");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete
  const handleDelete = async (id) => {
    if (!id) return;
    const ok = window.confirm("Deseja realmente excluir este filme?");
    if (!ok) return;

    try {
      setError(null);
      const token = await getApiToken();

      const res = await fetch(`${API_BASE_URL}/movies/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok && res.status !== 204) {
        throw new Error(`Erro ao excluir filme (${res.status})`);
      }

      setMovies((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      setError(err.message || "Erro ao excluir filme.");
    }
  };

  // Estados de auth
  if (isLoading) {
    return (
      <div className="page">
        <div className="container">
          <p className="muted">Carregando autenticação...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="page">
        <div className="container">
          <p className="alert alert-error">
            Erro de autenticação: {authError.message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <header className="header">
          <div>
            <h1>🎬 Cadastro de Filmes</h1>
            <p>CRUD protegido com Auth0 + Spring Boot.</p>
          </div>

          <div className="auth-box">
            {isAuthenticated && user ? (
              <>
                <span className="user-label">
                  Logado como <strong>{user.name || user.email}</strong>
                </span>
                <button
                  className="outline-btn"
                  onClick={() =>
                    logout({
                      logoutParams: { returnTo: window.location.origin },
                    })
                  }
                >
                  Sair
                </button>
              </>
            ) : (
              <button
                className="primary-btn"
                onClick={() => loginWithRedirect()}
              >
                Entrar com Auth0
              </button>
            )}
          </div>
        </header>

        {!isAuthenticated ? (
          <section className="card">
            <p className="muted">
              Faça login para cadastrar, listar e excluir filmes.
            </p>
          </section>
        ) : (
          <>
            <section className="card">
              <h2>Novo Filme</h2>
              <form onSubmit={handleSubmit} className="form">
                <div className="field">
                  <label htmlFor="nome">Nome</label>
                  <input
                    id="nome"
                    name="nome"
                    type="text"
                    value={form.nome}
                    onChange={handleChange}
                    placeholder="Ex: A Origem"
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="diretor">Diretor</label>
                  <input
                    id="diretor"
                    name="diretor"
                    type="text"
                    value={form.diretor}
                    onChange={handleChange}
                    placeholder="Ex: Christopher Nolan"
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="nota">Nota (0 a 5)</label>
                  <input
                    id="nota"
                    name="nota"
                    type="number"
                    min="0"
                    max="5"
                    step="1"
                    value={form.nota}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="field field-full">
                  <label htmlFor="descricao">Descrição</label>
                  <textarea
                    id="descricao"
                    name="descricao"
                    value={form.descricao}
                    onChange={handleChange}
                    placeholder="Sinopse do filme..."
                    required
                  />
                </div>

                <div className="actions">
                  <button type="submit" disabled={submitting}>
                    {submitting ? "Salvando..." : "Cadastrar Filme"}
                  </button>
                </div>
              </form>

              {error && <div className="alert alert-error">{error}</div>}
              {success && (
                <div className="alert alert-success">{success}</div>
              )}
            </section>

            <section className="card">
              <div className="table-header">
                <h2>Filmes Cadastrados</h2>
                <button
                  className="refresh-btn"
                  onClick={fetchMovies}
                  disabled={loadingMovies}
                >
                  {loadingMovies ? "Atualizando..." : "Recarregar"}
                </button>
              </div>

              {loadingMovies && movies.length === 0 ? (
                <p className="muted">Carregando filmes...</p>
              ) : movies.length === 0 ? (
                <p className="muted">Nenhum filme cadastrado ainda.</p>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Nome</th>
                        <th>Diretor</th>
                        <th>Nota</th>
                        <th>Descrição</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {movies.map((movie) => (
                        <tr key={movie.id}>
                          <td>{movie.id}</td>
                          <td>{movie.nome}</td>
                          <td>{movie.diretor}</td>
                          <td>{movie.nota}</td>
                          <td className="desc-cell">
                            {movie.descricao}
                          </td>
                          <td>
                            <button
                              className="delete-btn"
                              onClick={() => handleDelete(movie.id)}
                            >
                              Excluir
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
