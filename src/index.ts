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

const piko8 = `#5F574F
#AB5236
#83769C
#1D2B53
#7E2553
#FF77A8
#008751
#C2C3C7
#FFF1E8
#FFA300
#FFEC27
#00E436
#29ADFF
#FF004D`;

const colors = [
  [255, 255, 255, 0],
  ...piko8.split("\n").map((s) => hexToRGB(s)),
];

const price = colors.map((c, i) => (i < 4 ? 1 : 2 ** (i - 3)));

const captured = 100;
const frameMargin = 1.5;
const colorsNumber = 14;

let maxWidth = 1024;
let maxHeight = 1024;
let maxScale = 32;

function weightedRandom(a: number[], rng: () => number) {
  let sum = a.reduce((x, y) => x + y);
  let roll = rng() * sum - a[0];
  let i = 0;
  while (roll >= 0) roll -= a[++i];
  return i;
}

function balance(a: number[]) {
  let sum = a.reduce((x, y) => x + y, 0);
  return a.map((v) => v / sum);
}

class Field {
  w: number;
  h: number;
  cells: number[] = [];
  lastColor = 1;
  depth = 0;
  scale = 16;
  money = 0;
  turn = 0;
  alive = true;

  depthCellChances: number[][] = [];

  addDepthCellChances() {
    let depth = this.depthCellChances.length;
    this.depthCellChances[depth] = [...this.depthCellChances[depth - 1]];
    let increasing = Math.min(
      colorsNumber - 1,
      1 + ~~(Math.random() * colorsNumber)
    );
    if (depth * Math.random() * 8 > increasing ** 2.5)
      this.depthCellChances[depth][increasing] += 0.03;
    else this.depthCellChances[depth][increasing] *= 0.3;
    this.depthCellChances[depth] = balance(this.depthCellChances[depth]);
    //console.log(depth, this.depthCellChances[depth]);
  }

  constructor(w, h) {
    this.w = w;
    this.h = h;

    this.depthCellChances[0] = balance(
      [...new Array(colorsNumber)].map((n, i) => (i < 4 ? 1 : 0))
    );

    for (let depth = 1; depth < this.h * 2; depth++) {
      this.addDepthCellChances();
    }

    this.cells = [...new Array(w * h)].map((v, i) =>
      i < w ? captured : this.randomCellColor(i)
    );
    this.play(this.lastColor);

    this.updateScale();
    this.updateStatus();

    /*this.canvas = document.createElement("canvas");
    this.canvas.width = w;
    this.canvas.height = h;
    this.cx = this.canvas.getContext("2d");*/
  }

  updateScale() {
    let maxWidth = window.innerWidth * 0.8;
    let maxHeight = window.innerHeight * 0.9;
    this.scale = Math.min(maxWidth / this.w, maxHeight / this.h, maxScale);

    const C: HTMLCanvasElement = document.getElementById(
      "C"
    ) as HTMLCanvasElement;
    C.width = this.w;
    C.style.width = `${this.w * this.scale}px`;
    C.height = this.h;
    C.style.height = `${this.h * this.scale}px`;

    const frame = document.getElementById("frame");
    frame.style.height = `${(this.h - frameMargin) * this.scale}px`;
  }

  randomCellColor(i: number) {
    let depth = ~~this.depth + ~~(i / this.w);
    let color =
      1 + weightedRandom(this.depthCellChances[~~depth], () => Math.random());
    if (Math.random() < 0.01) {
      return 200;
    } else {
      return Math.min(colorsNumber, color);
    }
  }

  draw(C: HTMLCanvasElement, ifPlay?: [number, number], t?: number) {
    const cx = C.getContext("2d");

    let wbc: number[] = [];

    let capturePossible = false;

    if (ifPlay != null) {
      wbc = this.willBeCapturedXY(ifPlay);
      if (wbc.length > 0) {
        capturePossible = true;
      }
    }

    let captureColor: number[], capturedColor: number[];

    if (capturePossible && t != null) {
      captureColor = [...colors[this.at(...ifPlay)]];
      capturedColor = [...captureColor];
      captureColor[3] = ~~(Math.sin(t / 100) * 40 + 225);
      capturedColor[3] = ~~(Math.sin(t / 100) * 20 + 225);
    } else {
      capturedColor = captureColor = [...colors[this.lastColor]];
      capturedColor[3] = ~~(Math.sin(t / 100) * 20 + 225);
    }

    let id = cx.getImageData(0, 0, this.w, this.h);
    let pixels = id.data;

    let letters = document.getElementById('letters')
    letters.innerHTML = "";
    letters.style.fontSize = `${this.scale/2}px`;

    for (let i = 0; i < this.cells.length; i++) {
      if (this.cells[i] >= 200) {
        letters.innerHTML += `<div class="letter" style="left:${(i%this.w+0.27)*this.scale}px;top:${(~~(i/this.w)+0.3)*this.scale}px">+</div>`
      } 
      pixels.set(
        this.cells[i] == captured
          ? capturedColor
          : wbc.includes(i)
          ? captureColor
          : colors[this.cells[i]] || [0, 0, 0, 255],
        i * 4
      );
    }

    cx.putImageData(id, 0, 0);

    //cx.clearRect(0,0,C.width, C.height);
    //cx.drawImage(this.canvas, 0, 0);
    letters.style.top = `${-(this.depth - ~~this.depth) * this.scale}px`;
  }

  at(x: number, y: number) {
    return this.cells[x + y * this.w];
  }

  play(color: number) {
    let wbc = this.willBeCaptured(color);
    if (wbc.length > 0) {
      this.money += this.areaPrice(wbc);
      for (let cell of this.willBeCaptured(color)) {
        this.cells[cell] = captured;
      }
      this.lastColor = color;
      let newDeepmost = this.depth + ~~(Math.max(...wbc) / this.w);
      if (newDeepmost) {
        let newDepth = Math.max(
          newDeepmost - this.h / 2,
          this.depth + 0.5 + this.turn * 0.02
        );
        this.scrollTo(newDepth);
        this.updateStatus();
      }
      this.turn++;
      this.checkGameOver();
      return newDeepmost;
    } else {
      return 0;
    }
  }

  checkGameOver() {
    this.alive = this.cells.find((v) => v == captured) != null;
  }

  willBeCapturedXY([x, y]) {
    let color = this.at(x, y);
    let wbc = this.willBeCaptured(color);
    if (!wbc.includes(x + y * this.w)) {
      wbc = [];
    }
    return wbc;
  }

  areaPrice(wbc: number[]) {
    return wbc.map((i) => price[this.cells[i]] || 0).reduce((a, b) => a + b, 0);
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
          (n == -1 && at % this.w == 0) ||
          (n == -1 && (at + 1) % this.w == 0)
        )
          continue;
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

  scrollTo(toDepth: number) {
    if (toDepth <= this.depth) return;
    let newLayers = ~~toDepth - ~~this.depth;
    this.cells = this.cells.slice(this.w * newLayers);
    for (let i = 0; i < newLayers; i++) this.addDepthCellChances();
    for (let i = 0; i < newLayers * this.w; i++) {
      this.cells.push(this.randomCellColor(this.cells.length));
    }
    this.depth = toDepth;
  }

  updateStatus(projectedIncome = 0) {
    document.getElementById("title").innerHTML = `$${
      this.money + projectedIncome
    } | ${this.depth.toFixed(1)} m | turn ${this.turn} ${
      this.alive ? "" : " | DEAD"
    }`;
  }
}

window.onload = () => {
  let field = new Field(24, 24);

  let mouseOver = null;

  window.addEventListener("resize", () => {
    field.updateScale();
  });

  const C: HTMLCanvasElement = document.getElementById(
    "C"
  ) as HTMLCanvasElement;

  let text = document.getElementById("text");
  text.innerHTML = colors
    .slice(1)
    .map(
      (c, i) =>
        `<span style="color:rgb(${c[0]},${c[1]},${c[2]})">${
          price[i + 1]
        }</span> `
    )
    .join("");

  C.addEventListener("mousemove", (e) => {
    let [x, y] = [~~(e.offsetX / field.scale), ~~(e.offsetY / field.scale)];
    mouseOver = [x, y];
    let wbc = field.willBeCapturedXY([x, y]);
    field.updateStatus(field.areaPrice(wbc));
  });

  C.addEventListener("click", (e) => {
    let [x, y] = [~~(e.offsetX / field.scale), ~~(e.offsetY / field.scale)];
    field.play(field.at(x, y));
    field.draw(C);
  });

  C.addEventListener("mouseleave", (e) => {
    mouseOver = null;
  });

  field.draw(C);

  let t = 0;
  const frameLength = 50;

  window.setInterval(() => {
    t += frameLength;
    field.draw(C, mouseOver, t);
  }, frameLength);
};
