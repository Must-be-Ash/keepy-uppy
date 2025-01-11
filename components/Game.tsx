"use client"

import React, { useRef, useEffect, useState } from 'react'
import { Ball } from '../Ball'
import { Cursor } from '../Cursor'
import { ScoreEffect } from '../ScoreEffect'

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ballRef = useRef<Ball>()
  const cursorRef = useRef<Cursor>()
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })

  // Remove cursorVelocityRef since it's not being used
  const lastCursorPosRef = useRef({ x: 0, y: 0 })
  const scoreEffectsRef = useRef<ScoreEffect[]>([])

  // Update dimensions function to handle portrait mode for mobile
  const updateDimensions = () => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth
      const height = window.innerHeight
      const isMobile = width <= 768 // Standard mobile breakpoint

      if (isMobile) {
        // For mobile, use full width and leave more space for UI
        setDimensions({
          width: width,
          height: height - 120 // Increased space for header and score
        })
      } else {
        // For desktop, keep original dimensions
        setDimensions({
          width: Math.min(width, 800),
          height: Math.min(height - 100, 600)
        })
      }
    }
  }

  // Add effect to handle window resize
  useEffect(() => {
    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Initialize game objects with current dimensions
    if (!ballRef.current) {
      ballRef.current = new Ball(dimensions.width / 2, dimensions.height / 2, 
        Math.min(dimensions.width, dimensions.height) * 0.033) // Responsive ball size
    }
    if (!cursorRef.current) {
      cursorRef.current = new Cursor(dimensions.width / 2, dimensions.height / 2, 
        Math.min(dimensions.width, dimensions.height) * 0.067) // Responsive cursor size
    }

    const ball = ballRef.current
    const cursor = cursorRef.current

    // Handle both mouse and touch events
    const handlePointerMove = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect()
      cursor.x = clientX - rect.left
      cursor.y = clientY - rect.top
    }

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault()
      handlePointerMove(e.clientX, e.clientY)
    }

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      const touch = e.touches[0]
      handlePointerMove(touch.clientX, touch.clientY)
    }

    // Add touch event listeners
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
    canvas.addEventListener('touchstart', handleTouchMove, { passive: false })

    let animationFrameId: number

    const render = () => {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height)

      // Update ball with current dimensions
      ball.updateBounds(dimensions.width, dimensions.height)
      const collisionPoint = ball.update()
      if (collisionPoint) {
        const margin = 30
        const x = collisionPoint.x === 0 ? margin : 
                 collisionPoint.x === dimensions.width ? dimensions.width - margin : 
                 collisionPoint.x
        const y = collisionPoint.y === 0 ? margin : collisionPoint.y

        scoreEffectsRef.current.push(
          new ScoreEffect(
            x, 
            y, 
            `+${collisionPoint.points}`, // Just show the points
            collisionPoint.points > 5 ? "#ff4d4d" : "#22c55e"
          )
        )
        setScore(prevScore => prevScore + collisionPoint.points)
      }

      // Update and draw score effects
      scoreEffectsRef.current = scoreEffectsRef.current.filter(effect => {
        const isAlive = effect.update()
        if (isAlive) {
          effect.draw(ctx)
        }
        return isAlive
      })

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

        // Handle shoe hit sequence
        ball.hitWithShoe()
        setScore(prevScore => prevScore + 1)

        // Prevent multiple collisions
        ball.y = cursor.y - cursor.radius - ball.radius
      }

      // Update last cursor position
      lastCursorPosRef.current = { x: cursor.x, y: cursor.y }

      // Update game over condition with current height
      if (ball.y - ball.radius > dimensions.height) {
        setGameOver(true)
        ball.reset(dimensions.width / 2, dimensions.height / 2)
        setScore(0)
      }

      ball.draw(ctx)
      cursor.draw(ctx)

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animationFrameId)
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('touchmove', handleTouchMove)
      canvas.removeEventListener('touchstart', handleTouchMove)
    }
  }, [dimensions]) // Add dimensions to dependencies

  // Handle high score updates separately
  useEffect(() => {
    if (gameOver) {
      setHighScore(prevHighScore => Math.max(prevHighScore, score))
    }
  }, [gameOver, score])

  return (
    <div className={`${
      dimensions.width <= 768 
        ? "fixed inset-0 flex flex-col items-center bg-gray-100 overflow-hidden" 
        : "flex flex-col items-center justify-center min-h-screen bg-gray-100"
    }`}>
      <h1 className={`font-bold ${
        dimensions.width <= 768 
          ? "text-2xl my-2"
          : "text-3xl mb-4"
      }`}>Keepy Uppy</h1>
      <div className={
        dimensions.width <= 768
          ? "flex-1 w-full flex flex-col items-center"
          : "bg-white p-4 rounded-lg shadow-md"
      }>
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          className={`cursor-none touch-none ${
            dimensions.width <= 768
              ? "border-0"
              : "border border-gray-300"
          }`}
        />
        <div className={
          dimensions.width <= 768
            ? "w-full bg-white px-4 py-2"
            : "mt-4 text-center"
        }>
          {gameOver && (
            <p className={`text-red-500 ${
              dimensions.width <= 768
                ? "text-lg text-center"
                : "text-xl mb-2"
            }`}>Game Over!</p>
          )}
          <div className={
            dimensions.width <= 768
              ? "flex justify-between max-w-md mx-auto"
              : "space-y-1"
          }>
            <p className="text-lg md:text-xl">Score: {score}</p>
            <p className="text-lg md:text-xl">High Score: {highScore}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

