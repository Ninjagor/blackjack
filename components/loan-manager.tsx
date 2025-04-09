"use client"

import { useState } from "react"
import { DollarSign, Clock, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Player {
  id: string
  name: string
  points: number
  currentBet: number
  loans: Loan[]
}

// Update the Loan interface to use rounds instead of dates
interface Loan {
  id: string
  amount: number
  interest: number
  dueInRounds: number
  dueRound: number
  from: string
  to: string
  paid: boolean
}

// Update the LoanManagerProps interface
interface LoanManagerProps {
  dealer: Player
  players: Player[]
  currentRound: number
  onCreateLoan: (from: string, to: string, amount: number, interest: number, dueInRounds: number) => void
  onRepayLoan: (loanId: string, fromId: string, toId: string, amount: number) => void
}

// Update the component parameters to include currentRound
export default function LoanManager({ dealer, players, currentRound, onCreateLoan, onRepayLoan }: LoanManagerProps) {
  const [loanFrom, setLoanFrom] = useState("")
  const [loanTo, setLoanTo] = useState("")
  const [loanAmount, setLoanAmount] = useState(50)
  const [interestRate, setInterestRate] = useState(10)
  const [dueInRounds, setDueInRounds] = useState(5)
  const [activeTab, setActiveTab] = useState("active")

  const allPlayers = [dealer, ...players]

  // Get all loans across all players
  const allLoans = allPlayers.flatMap((player) =>
    player.loans.map((loan) => ({
      ...loan,
      fromName: allPlayers.find((p) => p.id === loan.from)?.name || "Unknown",
      toName: allPlayers.find((p) => p.id === loan.to)?.name || "Unknown",
    })),
  )

  // Filter out duplicate loans (since both lender and borrower have the same loan)
  const uniqueLoans = allLoans.filter((loan, index, self) => index === self.findIndex((l) => l.id === loan.id))

  const activeLoans = uniqueLoans.filter((loan) => !loan.paid)
  const paidLoans = uniqueLoans.filter((loan) => loan.paid)

  // Update handleCreateLoan to use rounds instead of dates
  const handleCreateLoan = () => {
    if (!loanFrom || !loanTo || loanFrom === loanTo) return

    const fromPlayer = allPlayers.find((p) => p.id === loanFrom)
    if (!fromPlayer || fromPlayer.points < loanAmount) return

    onCreateLoan(loanFrom, loanTo, loanAmount, interestRate, dueInRounds)

    // Reset form
    setLoanAmount(50)
    setInterestRate(10)
    setDueInRounds(5)
  }

  const handleRepayLoan = (loan: any) => {
    const totalAmount = loan.amount + (loan.amount * loan.interest) / 100
    onRepayLoan(loan.id, loan.to, loan.from, totalAmount)
  }

  const calculateTotalWithInterest = (amount: number, interest: number) => {
    return amount + (amount * interest) / 100
  }

  // Replace isLoanOverdue function to check rounds instead of dates
  const isLoanOverdue = (dueRound: number) => {
    return dueRound < currentRound
  }

  return (
    <div className="space-y-4">
      <Card className="bg-green-800 text-white border-none shadow-lg">
        <CardHeader className="pb-2">
          <h2 className="text-xl font-bold">Loan Manager</h2>
        </CardHeader>
        <CardContent>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full">
                <DollarSign className="h-4 w-4 mr-2" />
                Create New Loan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Loan</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="from">Lender (From)</Label>
                  <Select value={loanFrom} onValueChange={setLoanFrom}>
                    <SelectTrigger id="from">
                      <SelectValue placeholder="Select lender" />
                    </SelectTrigger>
                    <SelectContent>
                      {allPlayers.map((player) => (
                        <SelectItem key={`from-${player.id}`} value={player.id}>
                          {player.name} ({player.points} pts)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="to">Borrower (To)</Label>
                  <Select value={loanTo} onValueChange={setLoanTo}>
                    <SelectTrigger id="to">
                      <SelectValue placeholder="Select borrower" />
                    </SelectTrigger>
                    <SelectContent>
                      {allPlayers.map((player) => (
                        <SelectItem key={`to-${player.id}`} value={player.id} disabled={player.id === loanFrom}>
                          {player.name} ({player.points} pts)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="amount">Loan Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(Number(e.target.value))}
                    min={1}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="interest">Interest Rate (%)</Label>
                  <Input
                    id="interest"
                    type="number"
                    value={interestRate}
                    onChange={(e) => setInterestRate(Number(e.target.value))}
                    min={0}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="dueInRounds">Due in (Rounds)</Label>
                  <Input
                    id="dueInRounds"
                    type="number"
                    value={dueInRounds}
                    onChange={(e) => setDueInRounds(Number(e.target.value))}
                    min={1}
                  />
                </div>

                {loanFrom && loanTo && loanAmount > 0 && (
                  <div className="bg-green-100 text-green-800 p-2 rounded-md text-sm">
                    Total to repay: {calculateTotalWithInterest(loanAmount, interestRate)} points
                  </div>
                )}
              </div>
              <Button onClick={handleCreateLoan}>Create Loan</Button>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active">Active Loans</TabsTrigger>
          <TabsTrigger value="paid">Paid Loans</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {activeLoans.length === 0 ? (
            <Card className="bg-green-800 text-white border-none shadow-lg">
              <CardContent className="pt-6 pb-4 text-center">No active loans</CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {activeLoans.map((loan) => (
                <Card
                  key={loan.id}
                  className={`${isLoanOverdue(loan.dueRound) ? "bg-red-800" : "bg-green-700"} text-white border-none shadow-md`}
                >
                  <CardContent className="pt-4 pb-4">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-1">
                        <span className="font-bold">{loan.fromName}</span>
                        <ArrowRight className="h-4 w-4" />
                        <span className="font-bold">{loan.toName}</span>
                      </div>
                      <div className="text-sm">{loan.amount} pts</div>
                    </div>

                    <div className="flex justify-between text-xs mt-2">
                      <div className="flex items-center">
                        <DollarSign className="h-3 w-3 mr-1" />
                        {interestRate}% interest
                      </div>

                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        Due: Round {loan.dueRound}
                        {isLoanOverdue(loan.dueRound) && (
                          <span className="ml-1 bg-red-600 px-1 rounded text-xs">Overdue</span>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 flex justify-between items-center">
                      <div className="text-sm">
                        Repay:{" "}
                        <span className="font-bold">{calculateTotalWithInterest(loan.amount, loan.interest)}</span> pts
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-green-600 hover:bg-green-500 text-white border-green-500"
                        onClick={() => handleRepayLoan(loan)}
                      >
                        Repay Loan
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="paid">
          {paidLoans.length === 0 ? (
            <Card className="bg-green-800 text-white border-none shadow-lg">
              <CardContent className="pt-6 pb-4 text-center">No paid loans</CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {paidLoans.map((loan) => (
                <Card key={loan.id} className="bg-gray-700 text-white border-none shadow-md opacity-80">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-1">
                        <span className="font-bold">{loan.fromName}</span>
                        <ArrowRight className="h-4 w-4" />
                        <span className="font-bold">{loan.toName}</span>
                      </div>
                      <div className="text-sm">{loan.amount} pts</div>
                    </div>

                    <div className="flex justify-between text-xs mt-2">
                      <div className="flex items-center">
                        <DollarSign className="h-3 w-3 mr-1" />
                        {loan.interest}% interest
                      </div>

                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        Due: Round {loan.dueRound}
                      </div>
                    </div>

                    <div className="mt-3 flex justify-between items-center">
                      <div className="text-sm">
                        Repaid:{" "}
                        <span className="font-bold">{calculateTotalWithInterest(loan.amount, loan.interest)}</span> pts
                      </div>
                      <span className="text-xs bg-green-600 px-2 py-0.5 rounded-full">Paid</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
