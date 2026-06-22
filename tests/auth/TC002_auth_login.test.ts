const BASE_URL = process.env.TEST_BASE_URL ?? "http://localhost:3000"

describe("TC002 Authentication Login", () => {
  it("signs up then logs in with the same credentials", async () => {
    const email = `qa_login_${Date.now()}@example.com`
    const password = "QaPassword123!"

    const signupRes = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password, name: "QA Login" }),
    })
    expect([200, 201]).toContain(signupRes.status)

    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    })

    expect(loginRes.status).toBe(200)
    const body = await loginRes.json()
    expect(body.success).toBe(true)
    expect(body.access_token).toContain("session_")
    expect(body.token).toBe(body.access_token)
  })

  it("rejects incorrect credentials", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "wrong@example.com", password: "wrong-pass" }),
    })

    expect(res.status).toBe(401)
  })
})
