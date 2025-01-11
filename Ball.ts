export class Ball {
  x: number
  y: number
  radius: number
  vx: number
  vy: number

  constructor(x: number, y: number, radius: number) {
    this.x = x
    this.y = y
    this.radius = radius
    this.vx = Math.random() * 4 - 2 // Random initial horizontal velocity
    this.vy = -5 // Initial upward velocity
  }

  update() {
    this.x += this.vx
    this.y += this.vy
    this.vy += 0.2 // gravity

    // Add drag to make movement more natural
    this.vx *= 0.99
    this.vy *= 0.99

    // Bounce off walls with energy loss
    if (this.x - this.radius < 0) {
      this.x = this.radius
      this.vx = -this.vx * 0.8
    } else if (this.x + this.radius > 800) {
      this.x = 800 - this.radius
      this.vx = -this.vx * 0.8
    }

    // Bounce off ceiling with energy loss
    if (this.y - this.radius < 0) {
      this.y = this.radius
      this.vy = -this.vy * 0.8
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save()
    ctx.font = `${this.radius * 2}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('⚽️', this.x, this.y)
    ctx.restore()
  }

  reset(x: number, y: number) {
    this.x = x
    this.y = y
    this.vx = Math.random() * 4 - 2
    this.vy = -5
  }
}

