class Projectile {
  constructor(position, velocity) {
    this.position = position;
    this.width = 3;   // menor
    this.height = 10; // menor
    this.velocity = velocity;

    // animação 
    this.frame = 0;
    this.frameCounter = 0;
    this.frameInterval = 6; // quantos updates até trocar de cor 
    this.frames = 2;
  }

  draw(ctx) {
    // efeito de brilho mais forte
    ctx.save();
    ctx.shadowBlur = 12;
    ctx.shadowColor = "rgba(255,140,0,0.9)"; // laranja forte com brilho

    
    if (this.frame === 0) {
      ctx.fillStyle = "#ff8c00";
      ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
    } else {

      ctx.fillStyle = "#ffd54f";
      const cx = this.position.x + this.width / 2;
      const cy = this.position.y + this.height / 2;
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(this.width, this.height) * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  update() {
    // mover
    this.position.y += this.velocity;

    // atualizar animação 
    this.frameCounter++;
    if (this.frameCounter >= this.frameInterval) {
      this.frame = (this.frame + 1) % this.frames;
      this.frameCounter = 0;
    }
  }
}

export default Projectile;