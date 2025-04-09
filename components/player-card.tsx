"use client"

import { useState } from "react"
import { Trash2, DollarSign, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Player {
  id: string
  name: string
  points: number
  currentBet: number
  loans: any[]
}

interface PlayerCardProps {
  player: Player
  isDealer: boolean
  onBetChange: (bet: number) => void
  onDeclareWinner: () => void
  onDeclarePlayerLost?: () => void
  onRemove?: () => void
}

export default function PlayerCard({
  player,
  isDealer,
  onBetChange,
  onDeclareWinner,
  onDeclarePlayerLost,
  onRemove,
}: PlayerCardProps) {
  const [betAmount, setBetAmount] = useState<string>(player.currentBet.toString())

  const handleBetChange = (value: string) => {
    setBetAmount(value)

    const numValue = Number.parseInt(value) || 0
    if (numValue >= 0 && numValue <= player.points) {
      onBetChange(numValue)
    }
  }

  const placeBet = () => {
    const bet = Number.parseInt(betAmount) || 0
    if (bet > player.points) {
      return // Cannot bet more than available points
    }
    onBetChange(bet)
  }

  return (
    <Card className={`${isDealer ? "bg-gray-800" : "bg-green-700"} text-white border-none shadow-md`}>
      <CardContent className="pt-4">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center">
            <h3 className="text-lg font-bold">{player.name}</h3>
            {isDealer && <span className="ml-2 text-xs bg-yellow-600 px-2 py-0.5 rounded-full">Dealer</span>}
          </div>
          <div className="text-lg font-bold">{player.points} pts</div>
        </div>

        {!isDealer && (
          <div className="mt-3">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={betAmount}
                onChange={(e) => handleBetChange(e.target.value)}
                min="0"
                max={player.points.toString()}
                className="bg-green-800 border-green-600 text-white"
                placeholder="Bet amount"
              />
              <Button
                variant="outline"
                size="sm"
                className="bg-yellow-600 hover:bg-yellow-500 text-white border-yellow-500"
                onClick={placeBet}
              >
                <DollarSign className="h-4 w-4 mr-1" />
                Bet
              </Button>
            </div>

            {player.currentBet > 0 && (
              <div className="mt-2 text-center bg-green-800 py-1 px-2 rounded-md">
                Current bet: <span className="font-bold">{player.currentBet}</span> points
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between pt-0 pb-4">
        {!isDealer && player.currentBet > 0 && (
          <>
            <Button
              variant="outline"
              size="sm"
              className="bg-green-600 hover:bg-green-500 text-white border-green-500"
              onClick={onDeclareWinner}
            >
              <Trophy className="h-4 w-4 mr-1" />
              Win
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="bg-red-700 hover:bg-red-600 text-white border-red-600"
              onClick={onDeclarePlayerLost}
            >
              Lost
            </Button>
          </>
        )}

        {!isDealer && onRemove && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="bg-red-700 hover:bg-red-600 text-white border-red-600 ml-auto"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove Player</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to remove {player.name} from the game? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onRemove}>Remove</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardFooter>
    </Card>
  )
}
