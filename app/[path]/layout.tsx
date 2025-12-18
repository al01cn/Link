import { ThemeProvider } from '@/lib/ThemeContext'
import { LanguageProvider } from '@/lib/LanguageContext'

export default function PathLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        {children}
      </LanguageProvider>
    </ThemeProvider>
  )
}