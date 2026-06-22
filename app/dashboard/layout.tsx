import type React from "react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            if (!localStorage.getItem('user')) {
              window.location.href = '/login';
            }
          `,
        }}
      />
      {children}
    </>
  )
}
