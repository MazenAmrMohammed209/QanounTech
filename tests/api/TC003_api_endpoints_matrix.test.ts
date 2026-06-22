const BASE_URL = process.env.TEST_BASE_URL ?? "http://localhost:3000"

/** Real App Router paths (no bracket segments in URLs). */
const endpoints = [
  "/api/auth/session",
  "/api/auth",
  "/api/auth/login",
  "/api/auth/signup",
  "/api/booking",
  "/api/booking/00000000-0000-4000-8000-000000000001",
  "/api/client",
  "/api/client/00000000-0000-4000-8000-000000000002",
  "/api/consultations",
  "/api/dashboard",
  "/api/discovery",
  "/api/profiles",
  "/api/profiles/me",
  "/api/profiles/lawyer/00000000-0000-4000-8000-000000000003",
  "/api/select-role",
]

describe("TC003 API Endpoint Matrix", () => {
  it("returns an expected HTTP status for GET probes (unauthenticated)", async () => {
    for (const path of endpoints) {
      const url = `${BASE_URL}${path}`
      const res = await fetch(url)
      expect([200, 204, 400, 401, 403, 404, 405]).toContain(res.status)
    }
  })
})
