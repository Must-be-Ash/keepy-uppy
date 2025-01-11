if (distance < cursor.radius + ball.radius) {
  // Calculate cursor velocity
  const cursorVx = cursor.x - lastCursorPosRef.current.x
  const cursorVy = cursor.y - lastCursorPosRef.current.y
  
  // Calculate base velocity from hit angle
  const angle = Math.atan2(dy, dx)
  const baseSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy)
  const newSpeed = Math.max(baseSpeed, 4) // Reduced from 6

  // Reduce cursor influence even more
  const cursorSpeed = Math.sqrt(cursorVx * cursorVx + cursorVy * cursorVy)
  const kickBoost = Math.min(cursorSpeed * 0.15, 6) // Reduced from 0.2 and 8
  
  const verticalBoost = cursorVy < 0 ? kickBoost * 1.05 : kickBoost // Reduced multiplier

  const randomAngle = angle + (Math.random() - 0.5) * 0.15 // Reduced randomness
  ball.vx = -Math.cos(randomAngle) * newSpeed + cursorVx * 0.2 // Reduced from 0.3
  ball.vy = -Math.sin(randomAngle) * newSpeed + cursorVy * 0.2 - verticalBoost // Reduced from 0.3
} 