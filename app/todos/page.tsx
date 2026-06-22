import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function Page() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: todos } = await supabase.from('todos').select()

  return (
    <div className="p-8 max-w-xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">قائمة المهام (Todos)</h1>
      <ul className="list-disc pr-6 space-y-2">
        {todos?.map((todo) => (
          <li key={todo.id} className="text-lg">{todo.name}</li>
        ))}
      </ul>
      {(!todos || todos.length === 0) && (
        <p className="text-muted-foreground">لا توجد مهام حالياً.</p>
      )}
    </div>
  )
}
