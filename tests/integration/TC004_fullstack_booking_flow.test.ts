const BASE_URL = process.env.TEST_BASE_URL ?? "http://localhost:3000"

describe("TC004 Fullstack Booking Flow", () => {
  it("signs up, uses discovery to pick a lawyer id, creates and lists bookings", async () => {
    const email = `qa_book_${Date.now()}@example.com`
    const password = "QaPassword123!"

    const signupRes = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password, name: "QA Booking" }),
    })
    expect([200, 201]).toContain(signupRes.status)
    const signupJson = await signupRes.json()
    const token = signupJson.access_token as string
    expect(token).toContain("session_")

    const discoveryRes = await fetch(`${BASE_URL}/api/discovery`)
    expect(discoveryRes.status).toBe(200)
    const discovery = await discoveryRes.json()
    const lawyerId =
      process.env.QA_LAWYER_ID ||
      discovery.lawyers?.[0]?.user_id ||
      discovery.lawyers?.[0]?.id

    if (!lawyerId) {
      console.warn("No lawyer in discovery — skipping booking assertion")
      expect(signupJson.success).toBe(true)
      return
    }

    const when = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()

    const createRes = await fetch(`${BASE_URL}/api/booking`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        datetime: when,
        lawyerId,
        notes: "QA integration booking",
      }),
    })

    expect(createRes.status).toBe(201)

    const listRes = await fetch(`${BASE_URL}/api/booking`, {
      headers: { authorization: `Bearer ${token}` },
    })
    expect(listRes.status).toBe(200)
    const bookings = await listRes.json()
    expect(Array.isArray(bookings)).toBe(true)
  })
})
