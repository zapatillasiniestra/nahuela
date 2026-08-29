import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiFetch } from "../api";
import DocumentVerificationForm from "../components/DocumentVerificationForm";

interface ComplianceReport {
  applicationId: number;
  status: string;
  identity: {
    verified: boolean;
    provider: string;
    decision: string;
  } | null;
  document: {
    type: string;
    status: string;
    provider: string;
    fileName: string;
  } | null;
  compliance: {
    decision: string;
    provider: string;
    reasons: string[];
  } | null;
  aiAssessment: {
    decision: string;
    riskLevel: string | null;
    reasons: string[];
    model: string;
  } | null;
  audit: {
    valid: boolean;
    events: number;
  };
}

interface DecisionHistory {
  applicationId: number;
  identity: any[];
  documents: any[];
  compliance: any[];
  aiAssessments: any[];
  auditEvents: any[];
  auditVerification: {
    valid: boolean;
    events: number;
  };
}

interface OnboardingDecision {
  applicationId: number;
  status: string;
  identity: {
    verified: boolean;
    provider: string;
  };
  compliance: {
    decision: string;
    provider: string;
  };
  aiAssessment: {
    decision: string;
    riskLevel: string | null;
  };
  audit: {
    valid: boolean;
    events: number;
  };
}

export default function ApplicationPage() {
  const { id } = useParams();

  const [data, setData] =
    useState<DecisionHistory | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

    const [loadingOnboarding, setLoadingOnboarding] =
    useState(false);

    const [onboardingDecision, setOnboardingDecision] =
    useState<OnboardingDecision | null>(null);

    const [report, setReport] =
    useState<ComplianceReport | null>(null);

    const [loadingReport, setLoadingReport] =
    useState(false);

    const [application, setApplication] =
    useState<any>(null);
    
    const [updatingStatus, setUpdatingStatus] =
    useState(false);

    useEffect(() => {
    async function load() {
      try {
        const applicationResult = await apiFetch(
        `/applications/${id}`
        );

        setApplication(applicationResult);
        const result = await apiFetch(
          `/applications/${id}/decision-history`
        );

        setData(result);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load application"
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

    async function getOnboardingDecision() {
    if (!id) return;

    setLoadingOnboarding(true);
    setError("");

    try {
        const result = await apiFetch(
        `/applications/${id}/onboarding`
        );

        setOnboardingDecision(result);
    } catch (error) {
        setError(
        error instanceof Error
            ? error.message
            : "Failed to load onboarding decision"
        );
    } finally {
        setLoadingOnboarding(false);
    }
    }

    async function loadReport() {
        if (!id) return;

        setLoadingReport(true);
        setError("");

        try {
            const result = await apiFetch(
            `/applications/${id}/report`
            );

            setReport(result);
        } catch (error) {
            setError(
            error instanceof Error
                ? error.message
                : "Failed to load compliance report"
            );
        } finally {
            setLoadingReport(false);
        }
        }

    async function updateApplicationStatus(
  status: "under_review" | "approved" | "rejected"
) {
  if (!id) return;

  setUpdatingStatus(true);
  setError("");

  try {
    await apiFetch(`/applications/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });

    const applicationResult = await apiFetch(
      `/applications/${id}`
    );

    const historyResult = await apiFetch(
      `/applications/${id}/decision-history`
    );

    setApplication(applicationResult);
    setData(historyResult);

  } catch (error) {
    setError(
      error instanceof Error
        ? error.message
        : "Failed to update application status"
    );
  } finally {
    setUpdatingStatus(false);
  }
}

  if (loading) {
    return (
      <main className="content">
        Loading...
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

  if (!data) return null;

  const identityVerified =
    data.identity.length > 0;

  const documentsVerified =
    data.documents.length > 0;

  const complianceClear =
    data.compliance.length > 0;

  const aiCompleted =
    data.aiAssessments.length > 0;

  const aiAssessment =
    data.aiAssessments[0];

  return (
    <main className="dashboard">
      <header className="topbar">
        <strong>Nahuela</strong>

        <Link to="/applications">
          ← Applications
        </Link>
      </header>

      <section className="content">

        <div className="application-heading">
          <div>
            <p className="eyebrow">
              ONBOARDING APPLICATION
            </p>

            <h1>
              Application #{data.applicationId}
            </h1>
          </div>

          <div className="application-actions">

            <div className="application-status">
            <span>Status</span>

            <strong className={`status status-${application.status}`}>
                {application.status.replace("_", " ").toUpperCase()}
            </strong>
            </div>

            <div className="decision-badge">
              {aiAssessment?.decision === "approved"
                ? "APPROVED"
                : "PENDING"}
            </div>

        <button
            className="primary-button"
            onClick={getOnboardingDecision}
            disabled={loadingOnboarding}
            >
            {loadingOnboarding
                ? "Loading..."
                : "View onboarding decision"}
        </button>

        <button
            className="primary-button"
            onClick={loadReport}
            disabled={loadingReport}
            >
            {loadingReport
                ? "Loading..."
                : "View compliance report"}
        </button>

          </div>
        </div>

<div className="review-actions">

    {application.status === "pending" && (
        <button
        className="secondary-button"
        onClick={() =>
            updateApplicationStatus("under_review")
        }
        disabled={updatingStatus}
        >
        Start review
        </button>
    )}

    {application.status === "under_review" && (
        <>
        <button
            className="primary-button"
            onClick={() =>
            updateApplicationStatus("approved")
            }
            disabled={updatingStatus}
        >
            Approve
        </button>

        <button
            className="danger-button"
            onClick={() =>
            updateApplicationStatus("rejected")
            }
            disabled={updatingStatus}
        >
            Reject
        </button>
        </>
    )}

    </div>

{onboardingDecision && (
  <section className="panel onboarding-result">
    <div className="panel-heading">
      <div>
        <h2>Final onboarding decision</h2>
        <p>
          Consolidated result from the onboarding checks.
        </p>
      </div>

      <span
        className={
          onboardingDecision.status === "approved"
            ? "decision-badge"
            : "decision-badge decision-rejected"
        }
      >
        {onboardingDecision.status.toUpperCase()}
      </span>
    </div>

    <div className="decision-grid">

      <div>
        <span>Identity</span>
        <strong>
          {onboardingDecision.identity.verified
            ? "✓ Verified"
            : "✕ Not verified"}
        </strong>
        <small>
          Provider:{" "}
          {onboardingDecision.identity.provider}
        </small>
      </div>

      <div>
        <span>Compliance</span>
        <strong>
          {onboardingDecision.compliance.decision}
        </strong>
        <small>
          Provider:{" "}
          {onboardingDecision.compliance.provider}
        </small>
      </div>

      <div>
        <span>AI Assessment</span>
        <strong>
          {onboardingDecision.aiAssessment.decision}
        </strong>
        <small>
          Risk:{" "}
          {onboardingDecision.aiAssessment.riskLevel ??
            "Not assessed"}
        </small>
      </div>

      <div>
        <span>Audit Integrity</span>
        <strong>
          {onboardingDecision.audit.valid
            ? "✓ Valid"
            : "✕ Invalid"}
        </strong>
        <small>
          {onboardingDecision.audit.events} audit events
        </small>
      </div>

    </div>
  </section>
)}
        <div className="cards">

          <div className="card">
            <span>Identity</span>

            <strong>
              {identityVerified
                ? "✓ Verified"
                : "— Not verified"}
            </strong>
          </div>

          <div className="card">
            <span>Documents</span>

            <strong>
              {documentsVerified
                ? "✓ Verified"
                : "— Not submitted"}
            </strong>
          </div>

          <div className="card">
            <span>Compliance</span>

            <strong>
              {complianceClear
                ? "✓ Clear"
                : "— Pending"}
            </strong>
          </div>

          <div className="card">
            <span>AI Assessment</span>

            <strong>
              {aiCompleted
                ? `✓ ${aiAssessment?.decision}`
                : "— Pending"}
            </strong>

            {aiAssessment?.riskLevel && (
              <small>
                Risk: {aiAssessment.riskLevel}
              </small>
            )}
          </div>

          <div className="card">
            <span>Audit Chain</span>

            <strong>
              {data.auditVerification.valid
                ? "✓ Valid"
                : "✕ Invalid"}
            </strong>
          </div>

          <div className="card">
            <span>Audit Events</span>

            <strong>
              {data.auditVerification.events}
            </strong>
          </div>

        </div>

        {documentsVerified ? (

          <section className="panel">

            <div className="panel-heading">
              <div>
                <h2>Documents</h2>

                <p>
                  Verified identity documents.
                </p>
              </div>
            </div>

            {data.documents.map((document) => (
              <div
                className="document-row"
                key={document.id}
              >

                <div>
                  <strong>
                    {document.documentType}
                  </strong>

                  <small>
                    {document.fileName}
                  </small>
                </div>

                <div>
                  <span className="status status-approved">
                    {document.status}
                  </span>
                </div>

                <div>
                  <small>
                    Provider: {document.provider}
                  </small>
                </div>

              </div>
            ))}

          </section>

        ) : (

          <DocumentVerificationForm
            applicationId={data.applicationId}
            onVerified={() =>
              window.location.reload()
            }
          />

        )}

        {report && (
            <section className="panel">
                <div className="panel-heading">
                <div>
                    <h2>Compliance report</h2>
                    <p>
                    Consolidated onboarding assessment.
                    </p>
                </div>

                <span className="decision-badge">
                    {report.status.toUpperCase()}
                </span>
                </div>

                <div className="decision-grid">

                <div>
                    <span>Identity</span>
                    <strong>
                    {report.identity?.verified
                        ? "✓ Verified"
                        : "✕ Not verified"}
                    </strong>
                    <small>
                    Provider: {report.identity?.provider}
                    </small>
                </div>

                <div>
                    <span>Document</span>
                    <strong>
                    {report.document?.status ?? "Not submitted"}
                    </strong>
                    <small>
                    {report.document?.fileName}
                    </small>
                </div>

                <div>
                    <span>Compliance</span>
                    <strong>
                    {report.compliance?.decision ?? "Pending"}
                    </strong>
                    <small>
                    Provider: {report.compliance?.provider}
                    </small>
                </div>

                <div>
                    <span>AI Assessment</span>
                    <strong>
                    {report.aiAssessment?.decision ?? "Pending"}
                    </strong>
                    <small>
                    Risk: {report.aiAssessment?.riskLevel ?? "N/A"}
                    </small>
                </div>

                <div>
                    <span>Audit</span>
                    <strong>
                    {report.audit.valid
                        ? "✓ Valid"
                        : "✕ Invalid"}
                    </strong>
                    <small>
                    {report.audit.events} events
                    </small>
                </div>

                </div>

                {report.aiAssessment?.reasons?.length ? (
                <div className="report-reasons">
                    <h3>AI assessment reasons</h3>

                    <ul>
                    {report.aiAssessment.reasons.map(
                        (reason, index) => (
                        <li key={index}>{reason}</li>
                        )
                    )}
                    </ul>
                </div>
                ) : null}

            </section>
            )}

<section className="panel">
  <div className="panel-heading">
    <div>
      <h2>Audit timeline</h2>
      <p>
        Immutable record of onboarding events and decisions.
      </p>
    </div>

    <span
      className={
        data.auditVerification.valid
          ? "status status-approved"
          : "status status-rejected"
      }
    >
      {data.auditVerification.valid
        ? "✓ VERIFIED"
        : "✕ INVALID"}
    </span>
  </div>

  <div className="timeline">
    {data.auditEvents.map((event) => (
      <div
        className="timeline-item"
        key={event.id}
      >
        <div className="timeline-content">
          <strong>
            {event.event_type}
          </strong>

          <small>
            {new Date(
              event.created_at
            ).toLocaleString()}
          </small>

          <small>
            Provider: {event.provider}
          </small>
        </div>

        <div className="timeline-meta">
          <span className="timeline-decision">
            {event.decision}
          </span>

          {event.risk_level !== "not_applicable" && (
            <small>
              Risk: {event.risk_level}
            </small>
          )}
        </div>
      </div>
    ))}
  </div>

  <div className="audit-summary">
    <strong>
      Audit integrity
    </strong>

    <span>
      {data.auditVerification.events} events · SHA-256
    </span>
  </div>
</section>

      </section>
    </main>
  );
}