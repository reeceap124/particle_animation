const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')
const parent = document.getElementById('backgroundWrapper');
canvas.width = parent.offsetWidth
canvas.height = parent.offsetHeight

let particlesArray
// Grid divided by .5 minDistance (any two particles in same, top, bot, left right automatically get connected. check distances for corners)
// a: [{x,y},{x,y}],b: [{x,y}],c: [{x,y},{x,y},{x,y}]
//

class Grid {
    constructor(width, height, cellSize) {
        this.cellSize = cellSize
        this.numCol = Math.ceil(width / cellSize)
        this.numRow = Math.ceil(height/cellSize)

        this.cells = []

        for (let x = 0; x < this.numCol; x++){
            this.cells[x] = []
            for (let y = 0; y < this.numRow; y++) {
                this.cells[x][y] = []
            }
        }
    }
    add(particle) {
        let col = Math.floor( particle.x / this.cellSize);
        let row = Math.floor( particle.y / this.cellSize);
      
        this.cells[col][row].push(particle)
        particle.gridCell = {col, row}
    }
    removeParticle(particle) {
        let {col, row} = particle.gridCell
        let cell = this.cells[col][row];
        let index = cell.indexOf(particle)
        cell.splice(index, 1)
      }
}

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
    
    update () {
        if (this.x > canvas.width || this.x < 0) {
            this.directionX = -this.directionX
        }
        if (this.y > canvas.height || this.y < 0) {
            this.directionY = - this.directionY
        }

        this.x += this.directionX
        this.y += this.directionY
        this.draw()
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
        particlesArray.push(new Particle(x,y,directionX,directionY,size,color))
    }
}

function distanceBetweenPoints(a, b) {
    // euclidian distance between two points
    return Math.sqrt(Math.pow((b.x - a.x), 2) + Math.pow((b.y - a.y), 2));
}
// TODO: update to use spatial hashing or quadtree to make more efficient. Okay for the limited particles right now.
function connect() {
    
    for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a; b < particlesArray.length; b++) {

            if (a !== b) {
                let distance = distanceBetweenPoints(particlesArray[a], particlesArray[b])
                const minDistance = 150 // picked based on preference. Seems to be a good fit at multiple screen sizes.
                const maxOpacity = .7
                if (distance < minDistance) {
                    const opacity = 1-(distance / minDistance) // increase opacity as points get closer
                    ctx.strokeStyle = `rgba(137, 221, 247,${Math.min(maxOpacity, opacity)})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                    ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                    ctx.stroke();
                }
            }
        }
    }
}

function animate () {
    requestAnimationFrame(animate)
    ctx.clearRect(0,0,canvas.width,canvas.height)
    for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update()
    }
    connect()
}

window.addEventListener('resize', () => {
    // prevent weirdness when resizing
    canvas.width = parent.offsetWidth
    canvas.height = parent.offsetHeight
    init()
})

init()
animate()
