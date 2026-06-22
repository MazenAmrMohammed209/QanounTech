const BASE_URL = process.env.TEST_BASE_URL ?? "http://localhost:3000"

describe("TC005 Protected Routes and Roles", () => {
  it("blocks unauthenticated dashboard access", async () => {
    const res = await fetch(`${BASE_URL}/api/dashboard`)
    expect(res.status).toBe(401)
  })

  it("rejects malformed bearer token", async () => {
    const res = await fetch(`${BASE_URL}/api/dashboard`, {
      headers: { authorization: "Bearer invalid.jwt.token" },
    })
    expect(res.status).toBe(401)
  })

  it("rejects tampered session cookie value passed as bearer", async () => {
    const res = await fetch(`${BASE_URL}/api/dashboard`, {
      headers: { authorization: "Bearer session_not-a-real-uuid" },
    })
    expect(res.status).toBe(401)
  })
})
