// Keyboard + mouse input. Tracks held keys, fresh presses, and the last click
// position in canvas coordinates. The game polls this every frame.
export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.pressed = new Set(); // keys pressed since the last frame's consume
    this.mouseX = 0;
    this.mouseY = 0;
    this.clicked = null; // {x, y} of the latest click, consumed by the game
    this.canvas = canvas;
    this._onKeyDown = (e) => {
      if (e.repeat) return;
      this.keys.add(e.code);
      this.pressed.add(e.code);
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
    };
    this._onKeyUp = (e) => this.keys.delete(e.code);
    this._onMouseMove = (e) => {
      const r = canvas.getBoundingClientRect();
      this.mouseX = ((e.clientX - r.left) / r.width) * canvas.width;
      this.mouseY = ((e.clientY - r.top) / r.height) * canvas.height;
    };
    this._onClick = (e) => {
      this._onMouseMove(e);
      this.clicked = { x: this.mouseX, y: this.mouseY };
    };
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    canvas.addEventListener('mousemove', this._onMouseMove);
    canvas.addEventListener('click', this._onClick);
  }

  down(code) {
    return this.keys.has(code);
  }

  // True once for the frame after the key went down.
  wasPressed(code) {
    return this.pressed.has(code);
  }

  // Movement vector from WASD / arrows, normalised.
  moveVector() {
    let x = 0;
    let y = 0;
    if (this.down('KeyA') || this.down('ArrowLeft')) x -= 1;
    if (this.down('KeyD') || this.down('ArrowRight')) x += 1;
    if (this.down('KeyW') || this.down('ArrowUp')) y -= 1;
    if (this.down('KeyS') || this.down('ArrowDown')) y += 1;
    if (x !== 0 && y !== 0) {
      const n = Math.hypot(x, y);
      x /= n;
      y /= n;
    }
    return { x, y };
  }

  endFrame() {
    this.pressed.clear();
    this.clicked = null;
  }
}
