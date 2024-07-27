const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')
const parent = document.getElementById('backgroundWrapper');
canvas.width = parent.offsetWidth
canvas.height = parent.offsetHeight

let particlesArray
let grid

class Particle {
  constructor(x, y, directionX, directionY, size, color) {
      this.x = x
      this.y = y
      this.directionX = directionX
      this.directionY = directionY
      this.size = size
      this.color = color
      this.gridCell = {col:null, row:null}
  }
  draw () {
      ctx.beginPath()
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false)
      ctx.fillStyle = this.color
      ctx.fill()
  }

  connect() {
      const neighbors = grid.getNeighbors(this)
      if (!neighbors.length) {return}
      for (let b = 0; b < neighbors.length; b++) {
          const n = neighbors[b]
          let distance = distanceBetweenPoints(this, n)
          const minDistance = 125 // picked based on preference. Seems to be a good fit at multiple screen sizes.
          const maxOpacity = .7
          if (distance < minDistance) {
              const opacity = 1-(distance / minDistance) // increase opacity as points get closer
              ctx.strokeStyle = `rgba(137, 221, 247,${Math.min(maxOpacity, opacity)})`;
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(this.x, this.y);
              ctx.lineTo(n.x, n.y);
              ctx.stroke();
          }
      }
  }
  
  update () {
      if (this.x > canvas.width || this.x < 0) {
          this.directionX = -this.directionX
      }
      if (this.y > canvas.height || this.y < 0) {
          this.directionY = - this.directionY
      }

      this.x += this.directionX
      this.y += this.directionY
      grid.updateParticle(this)
      this.draw()
  }

}

class Grid {
    constructor(h, w, size) {
        this.cellSize = size;
        this.numCol = Math.ceil(w / size);
        this.numRow = Math.ceil(h / size);
        this.cells = [];

        for (let i = 0; i < this.numCol; i++) {
            this.cells[i] = []
            for (let j = 0; j < this.numRow; j++) {
                this.cells[i][j] = []
            }
        }
    }
    addParticle(particle){
        let col_idx = Math.max(Math.floor( particle.x / this.cellSize), 0);
        let row_idx = Math.max(Math.floor( particle.y / this.cellSize), 0);
      
        this.cells[col_idx][row_idx].push(particle)
        particle.gridCell = { col: col_idx, row: row_idx }
    }
    removeParticle(particle) {
        let { col: col_idx, row: row_idx } = particle.gridCell
        let cell = this.cells[col_idx][row_idx];
        let arr_idx = cell.indexOf(particle);
        cell.splice(arr_idx, 1);
    }
    updateParticle(particle) {
        this.removeParticle(particle)
        this.addParticle(particle)
    }
    getNeighbors(particle) {
        const {col, row} = particle.gridCell
        let top_left = [
          Math.max(col - 1, 0),
          Math.max(row -1, 0),
        ]
      
        let bottom_right = [
          Math.min(col + 1, this.numCol),
          Math.floor(row + 1, this.numRow),
        ]
      
        let neighbors = []
        for (let i = top_left[0]; i <= bottom_right[0]; i++) {
          for (let j = top_left[1]; j <= bottom_right[1]; j++) {
            if (i < 0 || j < 0 || i >= this.numCol || j >= this.numRow) continue
            let c = this.cells[i][j]
            for(let p of c){
              // don't add the particle itself
              if(p != particle) neighbors.push(p)
            }
          }
        }
      
        return neighbors
      }
}


function getDirection (min = .1, max = .35) {
  // random direction and speed between min/max
  // range in speed allows groups to break up a little more over time
  const random = Math.random() * (max - min) + min
  return Math.random() < 0.5 ? random : -(random)
}

function init (min = 20, max = 40) {
  particlesArray = []
  grid = new Grid(canvas.height, canvas.width, 75) // 75 is half of the minDistance we use in connect, should maximize number of valid connections
  // use width of canvas to determine number of particles within min/max
  let numberOfParticles  = Math.max(min,Math.min(max,(canvas.width / 30))) // 30 is a guess/check of what felt right across a variety of widths
  
  for (let i = 0; i < numberOfParticles; i++) {
      let size = 3 
      // random location with a bit of buffer to prevent getting stuck in a wall
      let x = (Math.random() * ((canvas.width - size * 2) - (size * 2)) + size *2)
      let y = (Math.random() * ((canvas.height - size * 2) - (size * 2)) + size *2)
      let directionX = getDirection()
      let directionY = getDirection()
      let color = 'rgba(137, 221, 247, .7)'
      const p = new Particle(x,y,directionX,directionY,size,color)
      particlesArray.push(p)
      grid.addParticle(p)
  }
}

function distanceBetweenPoints(a, b) {
  // euclidian distance between two points
  return Math.sqrt(Math.pow((b.x - a.x), 2) + Math.pow((b.y - a.y), 2));
}

function animate () {
  requestAnimationFrame(animate)
  ctx.clearRect(0,0,canvas.width,canvas.height)
  for (let i = 0; i < particlesArray.length; i++) {
      particlesArray[i].update()
  }
  for (let i = 0; i < particlesArray.length; i++) {
      particlesArray[i].connect()
  }
}

window.addEventListener('resize', () => {
  // prevent weirdness when resizing
  canvas.width = parent.offsetWidth
  canvas.height = parent.offsetHeight
  init()
})

init()
animate()
