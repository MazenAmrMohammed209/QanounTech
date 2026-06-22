import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"
import { loadEnvConfig } from "@next/env"

const projectDir = process.cwd()
loadEnvConfig(projectDir)

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing Supabase URL or Key in environment vars.")
  process.exit(1)
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_KEY, { db: { schema: "next_auth" } })

const USERS = [
  {
    name: "Test User",
    email: "testuser@example.com",
    role: "client",
    passwordRaw: "StrongPass123!"
  },
  {
    name: "Test Client",
    email: "testclient@example.com",
    role: "client",
    passwordRaw: "TestPass123!"
  },
  {
    name: "Test Client 2",
    email: "testclient_record@example.com",
    role: "client",
    passwordRaw: "TestPass123!"
  },
  {
    name: "Test Lawyer",
    email: "lawyer@example.com",
    role: "lawyer",
    passwordRaw: "LawyerPass123!"
  },
  {
    name: "Test Office",
    email: "office@example.com",
    role: "office",
    passwordRaw: "OfficePass123!"
  }
]

async function seed() {
  console.log("Seeding test users into next_auth.users...");
  for (const user of USERS) {
    const hashedPassword = await bcrypt.hash(user.passwordRaw, 12);
    
    const { data: existing } = await supabaseAdmin.from("users").select("id").eq("email", user.email).single();
    if (existing) {
       console.log(`User ${user.email} already exists, updating password and role...`);
       const { error } = await supabaseAdmin.from("users").update({ password: hashedPassword, role: user.role }).eq("id", existing.id);
       if (error) console.error("Error updating:", error);
    } else {
       console.log(`Inserting ${user.email}...`);
       const { error } = await supabaseAdmin.from("users").insert({
         name: user.name,
         email: user.email,
         password: hashedPassword,
         role: user.role
       });
       if (error) console.error("Error inserting:", error);
    }
  }
  console.log("Seeding complete!");
}

seed().catch(console.error);
