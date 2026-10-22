import React from 'react'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  // Note: if user is not logged in, but on login page, page handles itself
  // For protected admin pages:
  if (!session) {
    // If we're inside /admin (except /admin/login), let login page pass
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-row">
      <AdminSidebar session={session} />
      <div className="grow flex flex-col min-h-screen overflow-x-hidden bg-slate-950">
        <main className="p-6 sm:p-8 grow">{children}</main>
      </div>
    </div>
  )
}
