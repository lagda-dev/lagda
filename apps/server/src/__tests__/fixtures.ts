import { vi } from "vitest"
import type { TokenClaims } from "@lagda/auth-contract"
import type { TokenVerifier } from "../middleware/authContext"
import type { Page } from "../infrastructure/pagination"
import type { ApiDependencies } from "../routes/v1/dependencies"
import type {
  AssignmentRecord,
  AuditEventRecord,
  DepartmentRecord,
  DeploymentRecord,
  EmployeeRecord,
  EntityRecord,
  OrganizationRecord,
  Repository,
  RoleRecord,
  SyncEnqueuer,
  SyncRunRecord,
  TemplateRecord,
} from "../repositories/types"

// Shared test fixtures: a fully-mocked repository, a deterministic token verifier, and claim
// factories per role. Handlers and middleware are exercised against these so no live DB or auth
// service is needed (§testability).

export const ORG_ID = "org-1"
export const USER_ID = "user-1"

const emptyPage = <TItem>(): Page<TItem> => ({ data: [] as TItem[], nextCursor: null })

// A sync run the mock returns from create/get/cancel.
export const sampleSyncRun: SyncRunRecord = {
  id: "sync-1",
  organizationId: ORG_ID,
  status: "pending",
  templateId: null,
  counts: {},
  createdAt: "2026-01-01T00:00:00.000Z",
}

// Build a repository whose every method is a vitest mock returning empty/sample data by default.
// Tests override individual methods with `.mockResolvedValueOnce(...)` as needed.
export const createMockRepository = (): Repository => ({
  listOrganizations: vi.fn(async (): Promise<Page<OrganizationRecord>> => emptyPage()),
  getOrganization: vi.fn(async (): Promise<OrganizationRecord | null> => null),
  listEntities: vi.fn(async (): Promise<Page<EntityRecord>> => emptyPage()),
  getEntity: vi.fn(async (): Promise<EntityRecord | null> => null),
  listEmployees: vi.fn(async (): Promise<Page<EmployeeRecord>> => emptyPage()),
  getEmployee: vi.fn(async (): Promise<EmployeeRecord | null> => null),
  listTemplates: vi.fn(async (): Promise<Page<TemplateRecord>> => emptyPage()),
  getTemplate: vi.fn(async (): Promise<TemplateRecord | null> => null),
  listAssignments: vi.fn(async (): Promise<Page<AssignmentRecord>> => emptyPage()),
  getAssignment: vi.fn(async (): Promise<AssignmentRecord | null> => null),
  listDepartments: vi.fn(async (): Promise<Page<DepartmentRecord>> => emptyPage()),
  listRoles: vi.fn(async (): Promise<Page<RoleRecord>> => emptyPage()),
  listAuditEvents: vi.fn(async (): Promise<Page<AuditEventRecord>> => emptyPage()),
  listSyncRuns: vi.fn(async (): Promise<Page<SyncRunRecord>> => emptyPage()),
  getSyncRun: vi.fn(async (): Promise<SyncRunRecord | null> => null),
  createSyncRun: vi.fn(async (): Promise<SyncRunRecord> => sampleSyncRun),
  cancelSyncRun: vi.fn(async (): Promise<SyncRunRecord | null> => sampleSyncRun),
  listDeployments: vi.fn(async (): Promise<Page<DeploymentRecord>> => emptyPage()),
})

// A spyable enqueuer that records the directory-sync requests it receives.
export const createMockEnqueuer = (): SyncEnqueuer => ({
  enqueueDirectorySync: vi.fn(async () => undefined),
})

// Claims for a given role with the full scope set, so a test can opt a token into any scope.
export const claimsFor = (role: TokenClaims["role"]): TokenClaims => ({
  sub: USER_ID,
  orgId: ORG_ID,
  role,
  scopes: ["syncs:write", "syncs:read", "directory:read"],
})

// A verifier that always resolves the same claims — i.e. a valid token bearing `role`.
export const verifierFor = (role: TokenClaims["role"]): TokenVerifier => vi.fn(async () => claimsFor(role))

// A verifier that rejects — i.e. an invalid/expired token.
export const rejectingVerifier = (): TokenVerifier => vi.fn(async () => Promise.reject(new Error("bad signature")))

// Assemble the API dependencies a test app needs, with overridable parts.
export const buildDeps = (overrides: Partial<ApiDependencies> = {}): ApiDependencies => ({
  repository: overrides.repository ?? createMockRepository(),
  enqueuer: overrides.enqueuer ?? createMockEnqueuer(),
  verifyToken: overrides.verifyToken ?? verifierFor("owner"),
  logger: overrides.logger,
})

// The Authorization header value carrying an arbitrary opaque token; the mock verifier ignores its
// contents and decides validity itself.
export const bearer = (token = "test-token"): { authorization: string } => ({ authorization: `Bearer ${token}` })
