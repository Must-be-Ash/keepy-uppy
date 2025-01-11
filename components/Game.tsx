"use client"

import React, { useRef, useEffect, useState } from 'react'
import { Ball } from '../Ball'
import { Cursor } from '../Cursor'

const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 600

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ballRef = useRef<Ball>()
  const cursorRef = useRef<Cursor>()
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)

  // Remove cursorVelocityRef since it's not being used
  const lastCursorPosRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Initialize game objects only once
    if (!ballRef.current) {
      ballRef.current = new Ball(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 20)
    }
    if (!cursorRef.current) {
      cursorRef.current = new Cursor(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 40)
    }

    const ball = ballRef.current
    const cursor = cursorRef.current

    let animationFrameId: number

    const render = () => {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      ball.update()

      // Collision detection
      const dx = cursor.x - ball.x
      const dy = cursor.y - ball.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < cursor.radius + ball.radius) {
        // Calculate cursor velocity
        const cursorVx = cursor.x - lastCursorPosRef.current.x
        const cursorVy = cursor.y - lastCursorPosRef.current.y
        
        // Calculate base velocity from hit angle
        const angle = Math.atan2(dy, dx)
        const baseSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy)
        const newSpeed = Math.max(baseSpeed, 8)

        // Add cursor velocity to the bounce, with less emphasis on upward movement
        const cursorSpeed = Math.sqrt(cursorVx * cursorVx + cursorVy * cursorVy)
        const kickBoost = Math.min(cursorSpeed * 0.3, 10) // Reduced multiplier and cap
        
        // Less vertical boost for upward cursor movement
        const verticalBoost = cursorVy < 0 ? kickBoost * 1.2 : kickBoost // Reduced multiplier

        const randomAngle = angle + (Math.random() - 0.5) * 0.3
        ball.vx = -Math.cos(randomAngle) * newSpeed + cursorVx * 0.5 // Reduced velocity influence
        ball.vy = -Math.sin(randomAngle) * newSpeed + cursorVy * 0.5 - verticalBoost // Reduced velocity influence

        // Prevent multiple collisions
        ball.y = cursor.y - cursor.radius - ball.radius

        setScore(prevScore => prevScore + 1)
      }

      // Update last cursor position
      lastCursorPosRef.current = { x: cursor.x, y: cursor.y }

      // Move the game over logic outside of render to use the latest score
      if (ball.y - ball.radius > CANVAS_HEIGHT) {
        setGameOver(true)
        ball.reset(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
        setScore(0)
      }

      ball.draw(ctx)
      cursor.draw(ctx)

      animationFrameId = requestAnimationFrame(render)
    }

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect()
      cursor.x = e.clientX - rect.left
      cursor.y = e.clientY - rect.top
    })

    render()

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, []) // We can keep this empty since we're using refs

  // Handle high score updates separately
  useEffect(() => {
    if (gameOver) {
      setHighScore(prevHighScore => Math.max(prevHighScore, score))
    }
  }, [gameOver, score])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-4">Keepy Uppy</h1>
      <div className="bg-white p-4 rounded-lg shadow-md">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border border-gray-300 cursor-none"
        />
        <div className="mt-4 text-center">
          {gameOver && (
            <p className="text-xl text-red-500 mb-2">Game Over!</p>
          )}
          <p className="text-xl">Score: {score}</p>
          <p className="text-xl">High Score: {highScore}</p>
        </div>
      </div>
    </div>
  )
}

