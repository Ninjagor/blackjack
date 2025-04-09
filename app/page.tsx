import { Suspense } from "react"
import BlackjackScorekeeper from "@/components/blackjack-scorekeeper"

export default function Home() {
  return (
    <main className="min-h-screen p-4 md:p-6 bg-green-900">
      <Suspense fallback={<div className="text-white">Loading...</div>}>
        <BlackjackScorekeeper />
      </Suspense>
    </main>
  )
}
