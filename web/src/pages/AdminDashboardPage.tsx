import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api";

interface Stats {
  pending: number;
  under_review: number;
  approved: number;
  rejected: number;
  approvalRate: number;
}

interface Application {
  id: number;
  full_name: string;
  email: string;
  status:
    | "pending"
    | "under_review"
    | "approved"
    | "rejected";
  created_at: string;
}

interface ApplicationsResponse {
  data: Application[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}

interface User {
  role: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats] =
    useState<Stats | null>(null);

  const [applications, setApplications] =
    useState<Application[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [user, setUser] =
    useState<User | null>(null);

  useEffect(() => {
    const token =
      localStorage.getItem("accessToken");

    if (!token) return;

    try {
      const payload = JSON.parse(
        atob(token.split(".")[1])
      );

      setUser({
        role: payload.role,
      });
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);

        const [
          statsResult,
          applicationsResult,
        ] = await Promise.all([
          apiFetch("/applications/stats"),

          apiFetch(
            "/applications?status=under_review&page=1&limit=10"
          ),
        ]);

        setStats(statsResult);

        const result =
          applicationsResult as ApplicationsResponse;

        setApplications(result.data);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load dashboard"
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <main className="content">
        Loading dashboard...
      </main>
    );
  }

  if (error) {
    return (
      <main className="content">
        <div className="error">
          {error}
        </div>
      </main>
    );
  }

  return (
    <main className="dashboard">

      <header className="topbar">

        <strong>Nahuela</strong>

        <nav>
          <Link to="/applications">
            Applications
          </Link>

          {user?.role === "admin" && (
            <Link to="/admin">
              Admin
            </Link>
          )}
        </nav>

      </header>

      <section className="content">

        <div className="application-heading">

          <div>
            <p className="eyebrow">
              ADMINISTRATION
            </p>

            <h1>
              Dashboard
            </h1>

            <p>
              Monitor onboarding activity
              and review applications.
            </p>
          </div>

        </div>

        {stats && (
          <div className="cards">

            <div className="card">
              <span>
                Total applications
              </span>

              <strong>
                {stats.pending +
                  stats.under_review +
                  stats.approved +
                  stats.rejected}
              </strong>
            </div>

            <div className="card">
              <span>
                Pending
              </span>

              <strong>
                {stats.pending}
              </strong>
            </div>

            <div className="card">
              <span>
                Under review
              </span>

              <strong>
                {stats.under_review}
              </strong>
            </div>

            <div className="card">
              <span>
                Approved
              </span>

              <strong>
                {stats.approved}
              </strong>
            </div>

            <div className="card">
              <span>
                Rejected
              </span>

              <strong>
                {stats.rejected}
              </strong>
            </div>

            <div className="card">
              <span>
                Approval rate
              </span>

              <strong>
                {stats.approvalRate.toFixed(1)}%
              </strong>
            </div>

          </div>
        )}

        <section className="panel">

          <div className="panel-heading">

            <div>
              <h2>
                Applications requiring review
              </h2>

              <p>
                Applications waiting for a
                human decision.
              </p>
            </div>

            <Link to="/applications">
              View all
            </Link>

          </div>

          {applications.length === 0 ? (
            <p>
              No applications require review.
            </p>
          ) : (
            <div className="application-list">

              {applications.map(
                (application) => (
                  <Link
                    key={application.id}
                    to={`/applications/${application.id}`}
                    className="application-row"
                  >

                    <div>
                      <strong>
                        #{application.id}{" "}
                        {application.full_name}
                      </strong>

                      <small>
                        {application.email}
                      </small>
                    </div>

                    <span className="status status-under_review">
                      Under review
                    </span>

                    <small>
                      {new Date(
                        application.created_at
                      ).toLocaleDateString()}
                    </small>

                  </Link>
                )
              )}

            </div>
          )}

        </section>

      </section>

    </main>
  );
}