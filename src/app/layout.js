import "./globals.css"
import Sidebar from "@/components/layout/Sidebar"
import { ToastProvider } from "@/components/ui/Toast"

export const metadata = {
  title: "B-Ticket Admin",
  description: "B-Ticket Admin Dashboard",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-[280px] p-8">
              {children}
            </main>
          </div>
        </ToastProvider>
      </body>
    </html>
  )
}
