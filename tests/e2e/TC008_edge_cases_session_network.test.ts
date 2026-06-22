const BASE_URL = process.env.TEST_BASE_URL ?? "http://localhost:3000"

describe("TC008 Edge Cases", () => {
  it("returns 404 for unknown API route", async () => {
    const notFound = await fetch(`${BASE_URL}/api/not-exists`)
    expect(notFound.status).toBe(404)
  })

  it("fails fast when connecting to a closed local port", async () => {
    let rejected = false
    try {
      await fetch("http://127.0.0.1:59999/", { signal: AbortSignal.timeout(2000) })
    } catch {
      rejected = true
    }
    expect(rejected).toBe(true)
  })
})
