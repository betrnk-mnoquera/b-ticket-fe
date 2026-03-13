import "./globals.css"
import { ToastProvider } from "@/components/ui/Toast"
import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout"

export const metadata = {
  title: "B-Ticket Admin",
  description: "B-Ticket Admin Dashboard",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <AuthenticatedLayout>
            {children}
          </AuthenticatedLayout>
        </ToastProvider>
      </body>
    </html>
  )
}
