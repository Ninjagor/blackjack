"use client"

import { useState, useEffect } from "react"
import { Plus, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import PlayerCard from "./player-card"
import LoanManager from "./loan-manager"

// Define types
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

interface GameHistory {
  id: string
  timestamp: Date
  winner: string
  losers: string[]
  amount: number
}

export default function BlackjackScorekeeper() {
  const { toast } = useToast()
  const [players, setPlayers] = useState<Player[]>([])
  const [dealer, setDealer] = useState<Player>({
    id: "dealer",
    name: "Dealer",
    points: 1000,
    currentBet: 0,
    loans: [],
  })
  const [newPlayerName, setNewPlayerName] = useState("")
  const [newPlayerPoints, setNewPlayerPoints] = useState(100)
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([])
  const [activeTab, setActiveTab] = useState("game")
  // Update the state to include a round counter
  const [roundCounter, setRoundCounter] = useState(0)

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedPlayers = localStorage.getItem("blackjack-players")
    const savedDealer = localStorage.getItem("blackjack-dealer")
    const savedHistory = localStorage.getItem("blackjack-history")

    if (savedPlayers) setPlayers(JSON.parse(savedPlayers))
    if (savedDealer) setDealer(JSON.parse(savedDealer))
    if (savedHistory) setGameHistory(JSON.parse(savedHistory))
  }, [])

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("blackjack-players", JSON.stringify(players))
    localStorage.setItem("blackjack-dealer", JSON.stringify(dealer))
    localStorage.setItem("blackjack-history", JSON.stringify(gameHistory))
  }, [players, dealer, gameHistory])

  const addPlayer = () => {
    if (!newPlayerName.trim()) {
      toast({
        title: "Error",
        description: "Player name cannot be empty",
        variant: "destructive",
      })
      return
    }

    const newPlayer: Player = {
      id: Date.now().toString(),
      name: newPlayerName,
      points: newPlayerPoints,
      currentBet: 0,
      loans: [],
    }

    setPlayers([...players, newPlayer])
    setNewPlayerName("")
    setNewPlayerPoints(100)

    toast({
      title: "Player Added",
      description: `${newPlayerName} has joined the game with ${newPlayerPoints} points`,
    })
  }

  const updatePlayerBet = (playerId: string, bet: number) => {
    setPlayers(players.map((player) => (player.id === playerId ? { ...player, currentBet: bet } : player)))
  }

  // Replace the declareWinner function with this improved version
  const declareWinner = (winnerId: string) => {
    // Find the winner
    const winner = winnerId === "dealer" ? dealer : players.find((p) => p.id === winnerId)

    if (!winner) return

    // Calculate total bet amount from all players (excluding the winner)
    const totalBetFromOthers = players
      .filter((p) => p.id !== winnerId)
      .reduce((sum, player) => sum + player.currentBet, 0)

    // Update winner's points - they get all bets from other players but keep their own bet
    if (winnerId === "dealer") {
      setDealer({
        ...dealer,
        points: dealer.points + totalBetFromOthers,
        currentBet: 0,
      })
    } else {
      setPlayers(
        players.map((player) =>
          player.id === winnerId ? { ...player, points: player.points + totalBetFromOthers, currentBet: 0 } : player,
        ),
      )
    }

    // Update losers' points - they lose their bet
    setPlayers(
      players.map((player) =>
        player.id !== winnerId ? { ...player, points: player.points - player.currentBet, currentBet: 0 } : player,
      ),
    )

    // Add to game history
    const newHistory: GameHistory = {
      id: Date.now().toString(),
      timestamp: new Date(),
      winner: winner.name,
      losers: players.filter((p) => p.id !== winnerId).map((p) => p.name),
      amount: totalBetFromOthers,
    }

    setGameHistory([newHistory, ...gameHistory])

    // Increment round counter
    setRoundCounter((prev) => prev + 1)

    toast({
      title: "Winner Declared",
      description: `${winner.name} won ${totalBetFromOthers} points!`,
    })
  }

  // Add a new function to handle player losses
  const declarePlayerLost = (playerId: string) => {
    const player = players.find((p) => p.id === playerId)
    if (!player || player.currentBet <= 0) return

    // Player loses their bet to the dealer
    setDealer({
      ...dealer,
      points: dealer.points + player.currentBet,
    })

    // Update player's points and reset bet
    setPlayers(players.map((p) => (p.id === playerId ? { ...p, points: p.points - p.currentBet, currentBet: 0 } : p)))

    toast({
      title: "Player Lost",
      description: `${player.name} lost ${player.currentBet} points to the dealer`,
    })
  }

  const resetGame = () => {
    // Reset all bets but keep points
    setPlayers(players.map((player) => ({ ...player, currentBet: 0 })))

    toast({
      title: "Game Reset",
      description: "All bets have been reset",
    })
  }

  // Update the addLoan function to use rounds instead of dates
  const addLoan = (from: string, to: string, amount: number, interest: number, dueInRounds: number) => {
    const newLoan: Loan = {
      id: Date.now().toString(),
      amount,
      interest,
      dueInRounds,
      dueRound: roundCounter + dueInRounds,
      from,
      to,
      paid: false,
    }

    // Update lender's points
    if (from === "dealer") {
      setDealer({
        ...dealer,
        points: dealer.points - amount,
        loans: [...dealer.loans, newLoan],
      })
    } else {
      setPlayers(
        players.map((player) =>
          player.id === from
            ? {
                ...player,
                points: player.points - amount,
                loans: [...player.loans, newLoan],
              }
            : player,
        ),
      )
    }

    // Update borrower's points
    if (to === "dealer") {
      setDealer({
        ...dealer,
        points: dealer.points + amount,
        loans: [...dealer.loans, newLoan],
      })
    } else {
      setPlayers(
        players.map((player) =>
          player.id === to
            ? {
                ...player,
                points: player.points + amount,
                loans: [...player.loans, newLoan],
              }
            : player,
        ),
      )
    }

    toast({
      title: "Loan Created",
      description: `Loan of ${amount} points created with ${interest}% interest, due in ${dueInRounds} rounds`,
    })
  }

  const repayLoan = (loanId: string, fromId: string, toId: string, amount: number) => {
    // Update lender's points and loan status
    if (toId === "dealer") {
      setDealer({
        ...dealer,
        points: dealer.points + amount,
        loans: dealer.loans.map((loan) => (loan.id === loanId ? { ...loan, paid: true } : loan)),
      })
    } else {
      setPlayers(
        players.map((player) =>
          player.id === toId
            ? {
                ...player,
                points: player.points + amount,
                loans: player.loans.map((loan) => (loan.id === loanId ? { ...loan, paid: true } : loan)),
              }
            : player,
        ),
      )
    }

    // Update borrower's points
    if (fromId === "dealer") {
      setDealer({
        ...dealer,
        points: dealer.points - amount,
      })
    } else {
      setPlayers(
        players.map((player) => (player.id === fromId ? { ...player, points: player.points - amount } : player)),
      )
    }

    toast({
      title: "Loan Repaid",
      description: `Loan of ${amount} points has been repaid`,
    })
  }

  const removePlayer = (playerId: string) => {
    setPlayers(players.filter((player) => player.id !== playerId))

    toast({
      title: "Player Removed",
      description: "Player has been removed from the game",
    })
  }

  return (
    <div className="container mx-auto max-w-md">
      <Card className="bg-green-800 text-white border-none shadow-lg mb-4">
        <CardHeader className="pb-2">
          <h1 className="text-2xl font-bold text-center">Blackjack Scorekeeper</h1>
          <div className="text-center text-sm">Round: {roundCounter}</div>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="game">Game</TabsTrigger>
          <TabsTrigger value="loans">Loans</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="game" className="space-y-4">
          {/* Dealer Card */}
          <PlayerCard player={dealer} isDealer={true} onBetChange={(bet) => {}} onDeclareWinner={() => {}} />

          {/* Player Cards */}
          {players.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              isDealer={false}
              onBetChange={(bet) => updatePlayerBet(player.id, bet)}
              onDeclareWinner={() => declareWinner(player.id)}
              onDeclarePlayerLost={() => declarePlayerLost(player.id)}
              onRemove={() => removePlayer(player.id)}
            />
          ))}

          {/* Game Controls */}
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              className="flex-1 bg-green-700 hover:bg-green-600 text-white border-green-600"
              onClick={() => declareWinner("dealer")}
            >
              Dealer Wins
            </Button>
            <Button
              variant="outline"
              className="flex-1 bg-red-700 hover:bg-red-600 text-white border-red-600"
              onClick={resetGame}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset Bets
            </Button>
            {players.map((player) => (
              <Button
                key={player.id}
                variant="outline"
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
                onClick={() => declarePlayerLost(player.id)}
              >
                {player.name} Lost
              </Button>
            ))}
          </div>

          {/* Add Player Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Add Player
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Player</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    placeholder="Enter player name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="points">Starting Points</Label>
                  <Input
                    id="points"
                    type="number"
                    value={newPlayerPoints}
                    onChange={(e) => setNewPlayerPoints(Number(e.target.value))}
                    min={1}
                  />
                </div>
              </div>
              <Button onClick={addPlayer}>Add Player</Button>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="loans">
          <LoanManager
            dealer={dealer}
            players={players}
            currentRound={roundCounter}
            onCreateLoan={addLoan}
            onRepayLoan={repayLoan}
          />
        </TabsContent>

        <TabsContent value="history">
          <Card className="bg-green-800 text-white border-none shadow-lg">
            <CardHeader className="pb-2">
              <h2 className="text-xl font-bold">Game History</h2>
            </CardHeader>
            <CardContent>
              {gameHistory.length === 0 ? (
                <p className="text-center text-gray-300">No games played yet</p>
              ) : (
                <div className="space-y-3">
                  {gameHistory.map((game) => (
                    <div key={game.id} className="bg-green-700 p-3 rounded-md">
                      <div className="flex justify-between items-center">
                        <span className="font-bold">{game.winner} won</span>
                        <span className="text-sm opacity-80">{new Date(game.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <div className="text-sm mt-1">Amount: {game.amount} points</div>
                      <div className="text-xs mt-1 text-gray-300">Losers: {game.losers.join(", ")}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
