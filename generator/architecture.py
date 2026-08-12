"""
The entire repo shape as data, not imperative code. creator.py walks this
dict recursively: a dict value is a directory, a string value is a file's
content, None is an empty placeholder file. Add a new folder anywhere by
adding one entry here — nothing else in the generator changes.
"""
import templates as t

GITKEEP = t.GITKEEP


def module_stub(name: str, extra: dict | None = None) -> dict:
    """One backend module: its own controller/service/dto folder, matching
    the 'own DTOs, own service layer, never reach into another module's
    repository' rule from §5 Stage 1 — this is what makes Stage 2 a copy,
    not a rewrite."""
    base = {
        f"{name}.module.ts": f"// {name} module — wires controller + service, exported for AppModule\n",
        f"{name}.controller.ts": f"// {name} HTTP routes live here, thin — delegate to {name}.service.ts\n",
        f"{name}.service.ts": f"// {name} business logic — the only place allowed to touch this module's Prisma models\n",
        "dto": {".gitkeep": GITKEEP},
    }
    if extra:
        base.update(extra)
    return base


ARCHITECTURE = {
    "README.md": t.ROOT_README,
    ".gitignore": t.ROOT_GITIGNORE,
    ".env.example": t.ENV_EXAMPLE,

    "docs": {
        "api-contract.md": t.API_CONTRACT_MD,
        "architecture-decisions": {".gitkeep": GITKEEP},
        "runbooks": {".gitkeep": GITKEEP},
    },

    # frontend/ already exists in this repo (the Lovable-generated UI) —
    # the generator only fills in gaps, never touches what's there.
    "frontend": {
        "src": {
            "components": {".gitkeep": GITKEEP},
            "pages": {".gitkeep": GITKEEP},
            "hooks": {".gitkeep": GITKEEP},
            "lib": {
                "api-client.ts": (
                    "// Thin fetch wrapper around /api/v1/* — every call goes through\n"
                    "// TanStack Query so caching/retries/optimistic updates are free.\n"
                    "// Swaps zero code when the backend moves from monolith to gateway.\n"
                    "export const API_BASE = import.meta.env.VITE_API_BASE ?? '/api/v1';\n"
                ),
            },
        },
    },

    "backend": {
        "package.json": t.BACKEND_PACKAGE_JSON,
        "tsconfig.json": t.BACKEND_TSCONFIG,
        "prisma": {
            "schema.prisma": t.PRISMA_SCHEMA,
            "migrations": {".gitkeep": GITKEEP},
        },
        "src": {
            "main.ts": t.BACKEND_MAIN_TS,
            "app.module.ts": t.BACKEND_APP_MODULE_TS,
            "prisma": {
                "prisma.module.ts": "// exports PrismaService app-wide\n",
                "prisma.service.ts": (
                    "import { Injectable, OnModuleInit } from '@nestjs/common';\n"
                    "import { PrismaClient } from '@prisma/client';\n\n"
                    "@Injectable()\n"
                    "export class PrismaService extends PrismaClient implements OnModuleInit {\n"
                    "  async onModuleInit() { await this.$connect(); }\n"
                    "}\n"
                ),
            },
            "modules": {
                # Stage 1 is fully implemented (not stubs) — dto/ folders below
                # list the real Zod DTO files that ship with each module.
                "auth": module_stub("auth", {
                    "dto": {"signup.dto.ts": "// real implementation — do not run scaffold.py --overwrite on this file\n"},
                    "strategies": {".gitkeep": GITKEEP},
                }),
                "users": module_stub("users", {
                    "dto": {"update-profile.dto.ts": "// real implementation — do not run scaffold.py --overwrite on this file\n"},
                }),
                "trips": module_stub("trips", {
                    "dto": {"trip.dto.ts": "// real implementation — do not run scaffold.py --overwrite on this file\n"},
                }),
                "itinerary": module_stub("itinerary", {
                    "dto": {"stop.dto.ts": "// real implementation — do not run scaffold.py --overwrite on this file\n"},
                }),
                "recommendations": module_stub("recommendations", {
                    "recommendations.service.ts": t.RECOMMENDATIONS_SERVICE_TS,
                    "dto": {"recommendation.dto.ts": "// real implementation — do not run scaffold.py --overwrite on this file\n"},
                }),
                "budget": module_stub("budget"),
                "notifications": module_stub("notifications"),
                "realtime": {
                    "realtime.module.ts": "// exports RealtimeGateway for presence + live comments\n",
                    "realtime.gateway.ts": t.REALTIME_GATEWAY_TS,
                },
            },
            "common": {
                "guards": {".gitkeep": GITKEEP},
                "interceptors": {
                    "idempotency.interceptor.ts": (
                        "// Honors the Idempotency-Key header on mutating endpoints (§7) —\n"
                        "// required for Stage 4 retry-with-backoff safety.\n"
                    ),
                },
                "filters": {".gitkeep": GITKEEP},
            },
        },
        "test": {".gitkeep": GITKEEP},
    },

    # Stage 2 targets — empty until the monolith modules above are split out.
    "services": {
        "users-service": {".gitkeep": GITKEEP},
        "itinerary-service": {".gitkeep": GITKEEP},
        "recommendations-service": {".gitkeep": GITKEEP},
        "gateway": {".gitkeep": GITKEEP},
    },

    "shared": {
        "contracts": {
            "package.json": t.CONTRACTS_PACKAGE_JSON,
            "src": {
                "index.ts": t.CONTRACTS_INDEX_TS,
            },
        },
    },

    "infrastructure": {
        "terraform": {".gitkeep": GITKEEP},
        "environments": {
            "staging": {".gitkeep": GITKEEP},
            "production": {".gitkeep": GITKEEP},
        },
    },

    "docker": {
        "docker-compose.yml": t.DOCKER_COMPOSE,
        "backend.Dockerfile": t.BACKEND_DOCKERFILE,
        "frontend.Dockerfile": t.FRONTEND_DOCKERFILE,
    },

    "kubernetes": {
        "helm": {".gitkeep": GITKEEP},
        "manifests": {
            "backend-deployment.yaml": t.K8S_DEPLOYMENT,
            "recommendations-hpa.yaml": t.K8S_HPA,
        },
    },

    ".github": {
        "workflows": {
            "ci.yml": t.GH_ACTIONS_CI,
        },
    },

    "scripts": {
        "dev.sh": t.DEV_SCRIPT_SH,
        "setup.sh": t.SETUP_SCRIPT_SH,
    },
}
