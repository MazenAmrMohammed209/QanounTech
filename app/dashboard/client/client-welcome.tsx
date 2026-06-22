"use client"

import { useEffect, useState } from "react"

export function ClientWelcome() {
  const [userName, setUserName] = useState("المستخدم")

  useEffect(() => {
    try {
      const userStr = localStorage.getItem("user")
      if (userStr) {
        const userObj = JSON.parse(userStr)
        const rawName = userObj?.name
        const emailName = userObj?.email?.split("@")[0]
        
        setUserName(rawName || emailName || "المستخدم")
      }
    } catch (err) {
      console.error("Failed to parse user session", err)
    }
  }, [])

  return (
    <div>
      <h1 className="text-3xl font-bold text-foreground">مرحباً {userName}</h1>
      <p className="text-muted-foreground mt-1">إليك آخر مستجدات قضاياك</p>
    </div>
  )
}
