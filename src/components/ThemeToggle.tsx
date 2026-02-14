'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from './ThemeProvider'
import { cn } from '../lib/utils'

export function ThemeToggle({ className }: { className?: string }) {
    const { theme, setTheme } = useTheme()

    return (
        <button
            onClick={() => {
                const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
                const newTheme = isDark ? 'light' : 'dark'
                console.log('[ThemeToggle] Toggling theme. Current:', theme, 'New:', newTheme)
                setTheme(newTheme)
            }}
            className={cn(
                "p-2 rounded-lg transition-colors duration-200",
                "bg-gray-100 hover:bg-gray-200 text-gray-800",
                "dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200",
                className
            )}
            title="Toggle theme"
        >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" style={{ marginTop: '-20px' }} />
            <span className="sr-only">Toggle theme</span>
        </button>
    )
}
