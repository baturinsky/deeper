/*const colors = [
  [255, 255, 255, 0],
  [255, 0, 0, 255],
  [0, 255, 0, 255],
  [0, 0, 255, 255],
  [255, 0, 255, 255],
  [0, 255, 255, 255],
  [255, 255, 0, 255],
];*/

function hexToRGB(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
        255,
      ]
    : null;
}

/*const retrocal8 = `#6eb8a8
#2a584f
#74a33f
#fcffc0
#c6505a
#2f142f
#774448
#ee9c5d`;

const MATRIAX8C = `#f0f0dc
#fac800
#10c840
#00a0c8
#d24040
#a0694b
#736464
#101820`*/

const funkyfuture = `#ab1f65
#ff4f69
#ff8142
#ffda45
#3368dc
#49e7ec
#2b0f54
#fff7f8`;

const colors = [
  [255, 255, 255, 0],
  ...funkyfuture.split("\n").map((s) => hexToRGB(s)),
];

const captured = 100;

class Field {
  w: number;
  h: number;
  cells: number[] = [];
  canvas: HTMLCanvasElement;
  cx: CanvasRenderingContext2D;
  lastColor = 1;

  constructor(w = 8, h = 16) {
    this.w = w;
    this.h = h;
    this.cells = [...new Array(w * h)].map((v, i) =>
      i < w ? captured : ~~(1 + Math.random() * 6)
    );
    this.play(this.lastColor);

    this.canvas = document.createElement("canvas");
    this.canvas.width = w;
    this.canvas.height = h;
    this.cx = this.canvas.getContext("2d");
  }

  draw(C: HTMLCanvasElement, ifPlay?: [number, number], captureAlpha = 255) {    
    let highlight:number;

    let wbc:number[] = []; 

    let capturePossible = false;

    if(ifPlay != null){
      wbc = this.willBeCapturedXY(ifPlay);
      if(wbc.length > 0){
        capturePossible = true;
      }
    }

    let captureColor:number[];

    if(capturePossible){
      captureColor = [...colors[this.at(...ifPlay)]];
      captureColor[3] = captureAlpha;
    } else {
      captureColor = colors[this.lastColor];
    }

    let id = this.cx.getImageData(0, 0, this.w, this.h);
    let pixels = id.data;
    for (let i = 0; i < this.cells.length; i++) {
      pixels.set(
        (this.cells[i] == captured || wbc.includes(i))
          ? captureColor
          : colors[this.cells[i]],
        i * 4
      );
    }
    this.cx.putImageData(id, 0, 0);

    const ctx = C.getContext("2d");
    ctx.clearRect(0,0,C.width, C.height);
    ctx.drawImage(this.canvas, 0, 0);
  }

  at(x: number, y: number) {
    return this.cells[x + y * this.w];
  }

  play(color: number) {
    for (let cell of this.willBeCaptured(color)) this.cells[cell] = captured;
    this.lastColor = color;
  }

  willBeCapturedXY([x,y]) {
    let color = this.at(x,y);
    let wbc = this.willBeCaptured(color);
    if(!wbc.includes(x + y*this.w)){
      wbc = [];
    }
    return wbc;
  }

  willBeCaptured(color) {
    if (color == null || color == captured) return [];
    let q = this.cells
      .map((c, i) => [c, i])
      .filter(([c, i]) => c == captured)
      .map(([c, i]) => i);
    let nbd = [-1, 1, this.w, -this.w];
    let wbc = [];
    while (q.length > 0) {
      let at = q.pop();
      for (let n of nbd) {
        if (
          this.cells[at + n] == color &&
          !q.includes(at + n) &&
          !wbc.includes(at + n)
        ) {
          q.push(at + n);
          wbc.push(at + n);
        }
      }
    }
    return wbc;
  }
}

window.onload = () => {
  let field = new Field();
  const scale = 32;

  const C: HTMLCanvasElement = document.getElementById(
    "C"
  ) as HTMLCanvasElement;
  C.width = field.w;
  C.style.width = `${field.w * scale}px`;
  C.height = field.h;
  C.style.height = `${field.h * scale}px`;

  let mouseOver = null;

  C.addEventListener("mousemove", (e) => {
    let [x, y] = [~~(e.offsetX / scale), ~~(e.offsetY / scale)];
    mouseOver = [x, y];
    //field.draw(C, mouseOver);
  });

  C.addEventListener("click", (e) => {
    let [x, y] = [~~(e.offsetX / scale), ~~(e.offsetY / scale)];
    field.play(field.at(x, y));
    field.draw(C);
  });

  C.addEventListener("mouseleave", (e) =>{
    mouseOver = null;
  })

  field.draw(C);

  let t = 0;
  const frameLength = 50;

  window.setInterval(()=>{
    t += frameLength;
    field.draw(C, mouseOver, ~~(Math.sin(t/100)*20 + 235));
  }, frameLength)
};
