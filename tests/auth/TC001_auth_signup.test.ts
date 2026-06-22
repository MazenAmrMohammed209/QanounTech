const BASE_URL = process.env.TEST_BASE_URL ?? "http://localhost:3000"

describe("TC001 Authentication Signup", () => {
  it("creates user with valid payload", async () => {
    const email = `qa_signup_${Date.now()}@example.com`
    const res = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password: "QaPass123!", name: "QA User" }),
    })

    expect([200, 201]).toContain(res.status)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.user?.email).toBe(email)
    expect(body.access_token).toContain("session_")
  })

  it("rejects invalid signup payload", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "bad-email", password: "" }),
    })

    expect([400, 422]).toContain(res.status)
  })
})
