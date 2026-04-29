"use client"

import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface HeaderProps {
  title: string
  merchantName: string
  unreadCount?: number
}

export function Header({ title, merchantName, unreadCount = 0 }: HeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      <h1 className="text-lg font-semibold text-foreground">{title}</h1>

      <div className="flex items-center gap-3">
        <Link href="/notifications">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
            {merchantName.charAt(0).toUpperCase()}
          </div>
          <span className="hidden text-sm font-medium sm:block">{merchantName}</span>
        </div>
      </div>
    </header>
  )
}
