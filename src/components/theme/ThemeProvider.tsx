import { createContext, useContext, useEffect, useState } from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes/dist/types"

const ThemeProviderContext = createContext<{
  theme: string | undefined
  setTheme: (theme: string) => void
} | undefined>(undefined)

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)
  
  if (context === undefined) {
    // Fallback to next-themes useTheme if our context is not available
    // This import is dynamic to avoid issues during SSR
    const { useTheme: useNextTheme } = require("next-themes")
    return useNextTheme()
  }
  
  return context
}
