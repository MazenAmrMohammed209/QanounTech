const BASE_URL = process.env.TEST_BASE_URL ?? "http://localhost:3000"

describe("TC007 UI Loading/Error/Empty States", () => {
  it("renders key pages without 5xx", async () => {
    const pages = ["/", "/login", "/signup", "/discovery", "/consultations"]
    for (const page of pages) {
      const res = await fetch(`${BASE_URL}${page}`)
      expect(res.status).toBeLessThan(500)
    }
  })
})
