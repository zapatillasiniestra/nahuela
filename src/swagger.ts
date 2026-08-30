import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",

    info: {
      title: "Nahuela",
      version: "1.0.0",
      description:
        "Open-source infrastructure for auditable, provider-agnostic AI-powered onboarding and regulated decision systems.",
    },

    servers: [
      {
        url: "http://localhost:3000",
      },
      {
        url: "https://fintech-onboarding-system.onrender.com",
      },
    ],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },

    paths: {
      "/applications": {
        post: {
          tags: ["Applications"],
          summary: "Create a new onboarding application",
          description:
            "Creates an application and runs identity verification, compliance checks, and AI assessment.",
          security: [
            {
              bearerAuth: [],
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["full_name", "email"],
                  properties: {
                    full_name: {
                      type: "string",
                      example: "Test User",
                    },
                    email: {
                      type: "string",
                      format: "email",
                      example: "test@example.com",
                    },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: "Application created",
            },
            400: {
              description:
                "Validation or identity verification error",
            },
            401: {
              description: "Authentication required",
            },
          },
        },
      },

      "/applications/{id}/identity": {
        get: {
          tags: ["Applications"],
          summary: "Get identity verification results",
          description:
            "Returns identity verification records for an application.",
          security: [
            {
              bearerAuth: [],
            },
          ],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              description: "Application ID",
              schema: {
                type: "integer",
              },
            },
          ],
          responses: {
            200: {
              description: "Identity verification results",
              content: {
                "application/json": {
                  example: [
                    {
                      id: 8,
                      application_id: 75,
                      provider: "mock",
                      verified: true,
                      confidence: "0.99",
                      decision: "approved",
                      reasons: [],
                      external_id: "mock-123",
                      created_at:
                        "2026-08-20T17:52:55.832Z",
                    },
                  ],
                },
              },
            },
            400: {
              description: "Invalid application ID",
            },
            401: {
              description: "Authentication required",
            },
            403: {
              description: "Forbidden",
            },
            404: {
              description: "Application not found",
            },
          },
        },
      },

      "/applications/{id}/compliance": {
        get: {
          tags: ["Applications"],
          summary: "Get compliance check results",
          description:
            "Returns compliance checks performed for an application.",
          security: [
            {
              bearerAuth: [],
            },
          ],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              description: "Application ID",
              schema: {
                type: "integer",
              },
            },
          ],
          responses: {
            200: {
              description: "Compliance check results",
              content: {
                "application/json": {
                  example: [
                    {
                      id: 19,
                      application_id: 75,
                      provider: "local",
                      decision: "clear",
                      reasons: [],
                      external_id: "local-75",
                      created_at:
                        "2026-08-20T17:52:55.832Z",
                    },
                  ],
                },
              },
            },
            400: {
              description: "Invalid application ID",
            },
            401: {
              description: "Authentication required",
            },
            403: {
              description: "Forbidden",
            },
            404: {
              description: "Application not found",
            },
          },
        },
      },

      "/applications/{id}/decision-history": {
        get: {
          tags: ["Applications"],
          summary: "Get application decision history",
          description:
            "Returns identity verification, compliance checks, AI assessments, audit events, and audit-chain verification.",
          security: [
            {
              bearerAuth: [],
            },
          ],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              description: "Application ID",
              schema: {
                type: "integer",
              },
            },
          ],
          responses: {
            200: {
              description:
                "Complete onboarding decision history",
              content: {
                "application/json": {
                  example: {
                    applicationId: 75,

                    identity: [
                      {
                        id: 8,
                        application_id: 75,
                        provider: "mock",
                        verified: true,
                        confidence: "0.99",
                        decision: "approved",
                        reasons: [],
                        external_id: "mock-123",
                        created_at:
                          "2026-08-20T17:52:55.832Z",
                      },
                    ],

                    compliance: [
                      {
                        id: 19,
                        application_id: 75,
                        provider: "local",
                        decision: "clear",
                        reasons: [],
                        external_id: "local-75",
                        created_at:
                          "2026-08-20T17:52:55.832Z",
                      },
                    ],

                    aiAssessments: [
                      {
                        id: 119,
                        application_id: 75,
                        risk_level: "low",
                        decision: "approved",
                        reasons: [
                          "No significant risk indicators detected.",
                        ],
                        model: "mock",
                        created_at:
                          "2026-08-20T17:52:55.832Z",
                      },
                    ],

                    auditVerification: {
                      valid: true,
                      events: 4,
                    },
                  },
                },
              },
            },

            400: {
              description: "Invalid application ID",
            },

            401: {
              description: "Authentication required",
            },

            403: {
              description: "Forbidden",
            },

            404: {
              description: "Application not found",
            },
          },
        },
      },

      "/applications/{id}/ai-audit": {
        get: {
          tags: ["Audit"],
          summary: "Get application audit events",
          description:
            "Returns the complete audit event chain for an application.",
          security: [
            {
              bearerAuth: [],
            },
          ],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              description: "Application ID",
              schema: {
                type: "integer",
              },
            },
          ],
          responses: {
            200: {
              description: "Audit events",
              content: {
                "application/json": {
                  example: [
                    {
                      id: 185,
                      application_id: 75,
                      event_type:
                        "identity.verification.completed",
                      provider: "mock",
                      model: "none",
                      model_version: null,
                      input_hash:
                        "2f47e16883678ac7560a7e76414739bed0d177877db57eef2e37281b427967d8",
                      decision: "approved",
                      risk_level: "not_applicable",
                      reasons: [],
                      output_hash:
                        "ace9ef5130af6b4d3e3ad1b01f1b9319fd5a4766bda700c6feff0cbb41f2dac6",
                      previous_event_hash: null,
                      event_hash:
                        "c3180539ab34926c0daed707962e3511a1b29921ce106407b6fd094251356171",
                      hash_algorithm: "SHA-256",
                      created_at:
                        "2026-08-20T17:52:55.832Z",
                    },
                  ],
                },
              },
            },
            400: {
              description: "Invalid application ID",
            },
            401: {
              description: "Authentication required",
            },
            403: {
              description: "Forbidden",
            },
            404: {
              description: "Application not found",
            },
          },
        },
      },

      "/applications/{id}/audit/verify": {
        get: {
          tags: ["Audit"],
          summary: "Verify the application's audit chain",
          description:
            "Cryptographically verifies the integrity and chaining of all audit events.",
          security: [
            {
              bearerAuth: [],
            },
          ],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              description: "Application ID",
              schema: {
                type: "integer",
              },
            },
          ],
          responses: {
            200: {
              description:
                "Audit chain verification result",
              content: {
                "application/json": {
                  example: {
                    valid: true,
                    events: 4,
                  },
                },
              },
            },
            400: {
              description: "Invalid application ID",
            },
            401: {
              description: "Authentication required",
            },
            403: {
              description: "Forbidden",
            },
            404: {
              description: "Application not found",
            },
          },
        },
      },
      "/health": {
        get: {
          tags: ["System"],
          summary: "Check service health",
          description:
            "checks application availability and database connectivity",
          responses: {
            200: {
              description: "Service is healthy",
              content: {
                "application/json": {
                  example: {
                    status: "ok",
                    database: "connected",
                    uptime: 123.45,
                    timestamp: "2026-08-21T16:40:00.000Z",
                    version: "1.0.0",
                  },
                },
              },
            },
            500: {
              description: "Service or database unavailable",
            },
          },
        },
      },
      "/applications/onboarding": {
        post: {
          tags: ["Applications"],
          summary: "Run complete onboarding workflow",
          description:
            "Runs identity verification, compliance checks, AI assessment and audit verification, returning a normalized onboarding result.",
          security: [
            {
              bearerAuth: [],
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["full_name", "email"],
                  properties: {
                    full_name: {
                      type: "string",
                      example: "Test User",
                    },
                    email: {
                      type: "string",
                      format: "email",
                      example: "test@example.com",
                    },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: "Onboarding completed",
            },
            400: {
              description: "Invalid onboarding request",
            },
            401: {
              description: "Authentication required",
            },
          },
        },
      },
    },
  },

  apis: [
    "./src/routes/*.ts",
    "./src/controllers/*.ts",
    "./src/types/*.ts",
  ],
};

export default swaggerJsdoc(options);