/*const colors = [
  [255, 255, 255, 0],
  [255, 0, 0, 255],
  [0, 255, 0, 255],
  [0, 0, 255, 255],
  [255, 0, 255, 255],
  [0, 255, 255, 255],
  [255, 255, 0, 255],
];*/

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
#101820`

const funkyfuture = `#ab1f65
#ff4f69
#ff8142
#ffda45
#3368dc
#49e7ec
#2b0f54
#fff7f8`;
*/

const startingWidth = 12,
  startingHeight = 16,
  widthIncreaseStep = 2,
  heightIncreaseStep = 2,
  depthIncreaseStep = 50,
  baseUpgradeCost = 1024;

const uWider = 0,
  uDeeper = 1,
  uMult = 2,
  uRowF = 3,
  uRowR = 4,
  uColF = 5,
  uColR = 6,
  uGlu = 7,
  uInbF = 8,
  uInbD = 9,
  uInbP = 10,
  uDeep = 11,
  uFrF = 12,
  uFrD = 13,
  uEnrF = 14,
  uEnrP = 15;

const upgradeConf = [
  {
    text: (n) =>
      `Wider work area [${startingWidth + n * widthIncreaseStep}] => [${
        startingWidth + (n + 1) * widthIncreaseStep
      }]`,
  },
  {
    text: (n) =>
      `Deeper work area [${startingHeight + n * heightIncreaseStep}] => [${
        startingHeight + (n + 1) * heightIncreaseStep
      }]`,
  },
  { text: (n) => `Income multiplier [*${n + 1}] => [*${n + 2}]` },
  { text: (n) => `[-] Row bonuses frequency *[${n}] => *[${n + 1}]` },
  { text: (n) => `[-] Row bonuses range [${n + 1}] m => [${n + 2}] m` },
  { text: (n) => `[|] Column bonuses frequency [*${n}] => [*${n + 1}]` },
  { text: (n) => `[|] Column bonuses range [${n + 1}] m => [${n + 2}] m` },
  {
    text: (n) =>
      `<span class="rainbow">Glubinium</span> deposits [*${n}] => [*${n + 1}]`,
  },
  {
    text: (n) =>
      `[$] Income multiplier bonuses frequency [*${n}] => [*${n + 1}]`,
  },
  {
    text: (n) =>
      `[$] Income multiplier bonuses duration [${n + 2}] turns => [${
        n + 3
      }] turns`,
  },
  {
    text: (n) =>
      `[$] Income multiplier bonuses power [*${n + 2}] => [*${n + 3}]`,
  },
  {
    text: (n) =>
      `Start deeper [${n * depthIncreaseStep}] m => [${
        (n + 1) * depthIncreaseStep
      }] m`,
  },
  { text: (n) => `[x] Freeze time bonuses frequency [*${n}] => [*${n + 1}]` },
  {
    text: (n) =>
      `[x] Freeze time bonuses duration [${n + 1}] => [${n + 2}] turns`,
  },
  { text: (n) => `[?] Enrichment bonuses frequency [*${n}] => [*${n + 1}]` },
  { text: (n) => `[?] Enrichment bonuses power [*${n + 1}] => [*${n + 2}]` },
];

const brow = 200,
  bcol = 201,
  bmul = 202,
  bfreeze = 203,
  benrich = 204;
const bonuses = 200;
const lastBonus = 204;

const bonusSymbols = {
  [brow]: "-",
  [bcol]: "|",
  [bmul]: "$",
  [bfreeze]: "x",
  [benrich]: "?",
};

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
#FF004D
#FF00AA`;

const colors = [
  [255, 255, 255, 0],
  ...piko8.split("\n").map((s) => hexToRGB(s)),
];

const captured = 100;
const frameMargin = 1.5;
const colorsNumber = colors.length;
const glubinium = colorsNumber;

//const price = colors.map((c, i) => (i < 4 ? 1 : 2 ** (i - 3)));
const price = [
  1,
  1,
  1,
  2,
  5,
  10,
  20,
  50,
  100,
  200,
  500,
  1000,
  2000,
  5000,
  10000,
  100000,
];

let maxWidth = 1024;
let maxHeight = 1024;
let maxScale = 32;

const bonusBackground = [32, 32, 32, 255];

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

function upgradeCost(unlock, tier) {
  return baseUpgradeCost * (unlock + 1) * 2 ** tier;
}

function unlockUpgradeCost(unlock) {
  return baseUpgradeCost * (unlock * unlock);
}

class Career {
  money = 0;
  moneySpent = 0;
  startingDepth = 0;
  upgrades: number[] = upgradeConf.map((_) => 0);

  constructor() {
    this.load();
    this.render();
  }

  reset(){
    this.money = 0;
    this.moneySpent = 0;
    this.startingDepth = 0;
    this.upgrades = upgradeConf.map((_) => 0);  
    this.render();
  }

  /*startingDepth(){
    return this.upgrades[uDeep] * 50;
  }*/

  save() {
    localStorage.floodFillMiner = JSON.stringify(this);
  }

  load() {
    Object.assign(this, JSON.parse(localStorage.floodFillMiner || "{}"));
  }

  fieldWidth() {
    return startingWidth + this.upgrades[uWider] * widthIncreaseStep;
  }

  fieldHeight() {
    return startingWidth + this.upgrades[uDeeper] * widthIncreaseStep;
  }

  colSize() {
    return this.upgrades[uColR] + 1;
  }

  rowSize() {
    return this.upgrades[uRowR] + 1;
  }

  unlockUnlocked(u) {
    return this.moneySpent >= unlockUpgradeCost(u);
  }

  multiplier() {
    return 1 + this.upgrades[uMult];
  }

  bonusMultiplier() {
    return 2 + this.upgrades[uInbP];
  }

  multiplierDuration() {
    return 2 + this.upgrades[uInbD];
  }

  freezeDuration() {
    return 1 + this.upgrades[uFrD];
  }

  enrichChance() {
    return 1 - 0.95 ** this.upgrades[uEnrP];
  }

  bonusFrequency(bonus: number) {
    let upgrade = [uRowF, uColF, uInbF, uFrF, uEnrF][bonus - bonuses];
    return 0.002 * this.upgrades[upgrade];
  }

  glubiniumChance(depth: number) {
    return depth / 1000000 * this.upgrades[uGlu];
  }

  doUpgrade(u: number) {
    this.upgrades[u]++;
    let cost = upgradeCost(u, this.upgrades[u]);
    this.money -= cost;
    this.moneySpent += cost;
    this.render();
    this.save();
  }

  render() {
    let upgrades = upgradeConf
      .map((u, i) => {
        let price = upgradeCost(i, this.upgrades[i] + 1);
        return this.unlockUnlocked(i)
          ? `<div>${u.text(this.upgrades[i] || 0)}</div><button ${
              this.money < price ? "disabled" : ""
            } id="upgrade:${i}">$${price}</button>`
          : `<div>Spend $${unlockUpgradeCost(i)} to unlock</div><div></div>`;
      })
      .join("");
    let t = `Have: $[${this.money}] Spent:$[${this.moneySpent}]
    <div id="upgrades">${upgrades}</div><button id="newGame">New Game</button>
    from <select name="depth" id="depth">
      ${[...new Array(this.upgrades[uDeep]+1)].map((_,i)=>`<option ${this.startingDepth == i*50?"selected":""} value="${i*50}">${i*50} m</option>`).join("")}
    </select>    
    
    `.replace(
      /\[([*0-9]+)\]/g,
      "<em>$1</em>"
    );
    document.getElementById("outro").innerHTML = t;
  }
}

class Field {
  career: Career;
  w: number;
  h: number;
  cells: number[] = [];
  lastColor = 1;
  depth = 0;
  scale = 16;
  money = 0;
  turn = 0;
  alive = true;
  freeze = 0;
  multiplier = 0;

  depthCellChances: number[][] = [];

  save(){
    let o = {};
    Object.assign(o, this);
    delete o["career"];
    localStorage.floodFillMinerField = JSON.stringify(o);
  }

  load(){
    if(!localStorage.floodFillMinerField)
        return;
    let o = JSON.parse(localStorage.floodFillMinerField);
    Object.assign(this, o);
    this.updateStatus();
  }

  constructor(career: Career) {
    this.career = career;
    this.w = career.fieldWidth();
    this.h = career.fieldHeight();

    this.depthCellChances[0] = balance(
      [...new Array(colorsNumber)].map((n, i) => (i < 4 ? 1 : 0))
    );

    for (let depth = 1; depth < this.h * 2; depth++) {
      this.addDepthCellChances();
    }

    let startingDepth = Number(this.career.startingDepth);
    if(startingDepth>0){
      this.scrollTo(startingDepth)
    }

    this.cells = [...new Array(this.w * this.h)].map((v, i) =>
      i < this.w ? captured : this.randomCellColor(i)
    );
    this.play(this.lastColor);


    this.updateScale();
    this.updateStatus();
  }

  addDepthCellChances() {
    let depth = this.depthCellChances.length;
    this.depthCellChances[depth] = [...this.depthCellChances[depth - 1]];
    let increasing = Math.min(
      colorsNumber - 1,
      1 + ~~(Math.random()**2 * colorsNumber)
    );
    if (depth * Math.random() * 8 > increasing ** 2.5)
      this.depthCellChances[depth][increasing] += 0.03;
    else this.depthCellChances[depth][increasing] *= 0.3;
    this.depthCellChances[depth][glubinium-1] = this.career.glubiniumChance(
      depth
    );
    this.depthCellChances[depth] = balance(this.depthCellChances[depth]);
    //console.log(depth, this.depthCellChances[depth]);
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
    for(let bonus = bonuses; bonus<=lastBonus; bonus++){
      if(this.career.bonusFrequency(bonus)> Math.random()){
        return bonus;
      }
    }
    return Math.min(colorsNumber, color);
  }

  draw(C: HTMLCanvasElement, ifPlay?: [number, number], t?: number) {
    const cx = C.getContext("2d");

    let wbc: number[] = [];

    let capturePossible = false,
      playColor: number;

    if (ifPlay != null) {
      playColor = this.at(...ifPlay);
      wbc = this.willBeCapturedXY(ifPlay);
      if (wbc.length > 0) {
        capturePossible = true;
      }
    }

    let captureColor: number[], capturedColor: number[];

    colors[glubinium] = [
      ~~(Math.sin(t / 100) * 40 + 225),
      ~~(Math.sin(t / 87) * 40 + 225),
      ~~(Math.sin(t / 59) * 40 + 225),
      255,
    ];

    if (capturePossible && t != null) {
      captureColor =
        playColor < bonuses
          ? [...(colors[playColor] || [0, 0, 0, 255])]
          : [...colors[this.lastColor]];
      capturedColor = [...captureColor];
      captureColor[3] = ~~(Math.sin(t / 100) * 40 + 225);
      capturedColor[3] = ~~(Math.sin(t / 100) * 20 + 225);
    } else {
      capturedColor = captureColor = [...colors[this.lastColor]];
      capturedColor[3] = ~~(Math.sin(t / 100) * 20 + 225);
    }

    let id = cx.getImageData(0, 0, this.w, this.h);
    let pixels = id.data;

    let letters = document.getElementById("letters");
    letters.innerHTML = "";
    letters.style.fontSize = `${this.scale / 2}px`;

    for (let i = 0; i < this.cells.length; i++) {
      if (this.cells[i] >= bonuses) {
        letters.innerHTML += `<div class="letter" style="left:${
          ((i % this.w) + 0.27) * this.scale
        }px;color:rgb(${Math.sin(t / 100) * 32 + 128},${
          Math.sin(t / 57) * 32 + 128
        },${Math.sin(t / 112) * 32 + 128});top:${
          (~~(i / this.w) + 0.3) * this.scale
        }px">${bonusSymbols[this.cells[i]]}</div>`;
      }
      pixels.set(
        this.cells[i] == captured
          ? capturedColor
          : wbc.includes(i)
          ? captureColor
          : colors[this.cells[i]] || bonusBackground,
        i * 4
      );
    }

    cx.putImageData(id, 0, 0);

    let frame = document.getElementById("frame");
    if(this.freeze && !this.multiplier)
      frame.style.borderColor = "#0000ff"
    if(!this.freeze && this.multiplier)
      frame.style.borderColor = "#ffff00"
    if(this.freeze && this.multiplier)
      frame.style.borderColor = "#ff00ff"
    if(!this.freeze && !this.multiplier)
      frame.style.borderColor = "#fff1e8"

    //cx.clearRect(0,0,C.width, C.height);
    //cx.drawImage(this.canvas, 0, 0);
    let shift = -(this.depth - ~~this.depth) * this.scale;
    letters.style.top = `${shift}px`;
    C.style.top = `${shift}px`;
  }

  at(x: number, y: number) {
    return this.cells[x + y * this.w];
  }

  play(color: number) {
    let wbc = this.willBeCaptured(color);
    if (wbc.length > 0) {
      this.money += this.areaPrice(wbc);
      for (let cell of wbc) {
        if (this.cells[cell] == bmul)
          this.multiplier += this.career.multiplierDuration();
        if (this.cells[cell] == bfreeze)
          this.freeze += this.career.freezeDuration();
        if (this.cells[cell] == benrich) {
          for (let i in this.cells) {
            if (
              this.cells[i] < glubinium - 2 &&
              this.career.enrichChance() > Math.random()
            ) {
              this.cells[i]++;
            }
          }
        }
        this.cells[cell] = captured;
      }
      if (color <= glubinium) this.lastColor = color;
      let newDeepmost = this.depth;
      if (this.multiplier > 0) {
        this.multiplier--;
      }
      if (this.freeze > 0) {
        this.freeze--;
      } else {
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
      }
      this.checkGameOver();
      if (color == benrich) {
        this.freeze++;
        this.multiplier++;
        return this.play(this.lastColor);
      }
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
    let money = wbc
      .map((i) => price[this.cells[i]-1] || 0)
      .reduce((a, b) => a + b, 0);
    money *= this.totalMultiplier();
    return money;
  }

  totalMultiplier(){
    let m = this.career.multiplier();
    if (this.multiplier) {
      m *= this.career.bonusMultiplier();
    }
    return m;
  }

  willBeCaptured(color, q: number[] = []) {
    if (color == null || color == captured) return [];
    q = [
      ...this.cells
        .map((c, i) => [c, i])
        .filter(([c, i]) => c == captured)
        .map(([c, i]) => i),
      ...q,
    ];
    let nbd = [-1, 1, this.w, -this.w];
    let wbc = [];
    while (q.length > 0) {
      let at = q.pop();
      for (let n of nbd) {
        if ((n == -1 && at % this.w == 0) || (n == 1 && (at + 1) % this.w == 0))
          continue;
        let newAt = at + n;
        if (
          this.cells[newAt] == color &&
          !q.includes(newAt) &&
          !wbc.includes(newAt)
        ) {
          wbc.push(newAt);
          if (this.cells[newAt] < bonuses) q.push(newAt);
        }
      }
    }
    if (color >= bonuses) {
      let bc = [];
      for (let at of wbc) {
        switch (color) {
          case brow:
            for (
              let i = -this.career.rowSize();
              i <= this.career.rowSize();
              i++
            ) {
              let nnAt = at + i;
              if (~~(nnAt / this.w) == ~~(at / this.w) && !bc.includes(nnAt)) {
                bc.push(nnAt);
              }
            }
            break;
          case bcol:
            for (
              let i = -this.career.colSize();
              i <= this.career.colSize();
              i++
            ) {
              let nnAt = at + i * this.w;
              if (nnAt in this.cells && !bc.includes(nnAt)) {
                bc.push(nnAt);
              }
            }
            break;
          default:
            bc.push(at);
        }
      }
      //debugger;
      wbc = [
        ...new Set([...bc, ...this.willBeCaptured(this.lastColor, bc), ...wbc]),
      ];
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
    document.getElementById("title").innerHTML = this.alive
      ? `
      $${this.money + projectedIncome} |
      ${this.depth.toFixed(1)} m |
       turn ${this.turn}
      ${
        this.multiplier
          ? ` | $*${this.career.bonusMultiplier()} ${this.multiplier} turns`
          : ``
      }
      ${this.freeze ? ` | freeze ${this.freeze} turns` : ``}
    `
      : ``;

    let text = document.getElementById("text");
    text.innerHTML = colors
      .slice(1)
      .map(
        (c, i) =>
          `<span ${
            i + 1 == glubinium
              ? `class="rainbow"`
              : `style="color:rgb(${c[0]},${c[1]},${c[2]})"`
          }>${price[i] * this.totalMultiplier()}</span> `
      )
      .join("");
    
  }
}

window.onload = () => {
  //let field = new Field(24, 24);

  let field: Field;

  let career = new Career();

  let mouseOver = null;

  window.addEventListener("resize", () => {
    if (field != null) field.updateScale();
  });

  const C: HTMLCanvasElement = document.getElementById(
    "C"
  ) as HTMLCanvasElement;


  C.addEventListener("mousemove", (e) => {
    if (field == null) return;
    let [x, y] = [~~(e.offsetX / field.scale), ~~(e.offsetY / field.scale)];
    mouseOver = [x, y];
    let wbc = field.willBeCapturedXY([x, y]);
    field.updateStatus(field.areaPrice(wbc));
  });

  C.addEventListener("click", (e) => {
    if (field == null) return;
    let [x, y] = [~~(e.offsetX / field.scale), ~~(e.offsetY / field.scale)];
    field.play(field.at(x, y));
    field.save();
    if (!field.alive) {
      debrief();
    }
    field.draw(C);
  });

  C.addEventListener("mouseleave", (e) => {
    mouseOver = null;
  });

  let t = 0;
  const frameLength = 50;

  career.render();

  function debrief() {
    career.money += field.money;
    document.getElementById("outroFrame").style.visibility = "visible";
    document.getElementById("fieldFrame").style.opacity = "0.5";
    field.alive = false;
    field.updateStatus();
    career.render();
    career.save();
    delete localStorage.floodFillMinerField;
  }

  function newGame() {
    field = new Field(career);
    field.draw(C);
    document.getElementById("fieldFrame").style.visibility = "visible";
    document.getElementById("fieldFrame").style.opacity = "1";
    document.getElementById("outroFrame").style.visibility = "hidden";
  }

  document.addEventListener("click", (e) => {
    if (e.target instanceof HTMLButtonElement) {
      let id = e.target.id;
      if (id.substr(0, 7) == "newGame") {
        newGame();
      }
      if (id.substr(0, 7) == "upgrade") {
        career.doUpgrade(Number(id.substr(8)));
      }
      if(id=="resetProgress" && e.shiftKey){
        career.reset();
      }
      if(id=="exit"){
        debrief();
      }
    }
  });

  let lastLetters = ""

  document.addEventListener("keydown", e=>{
    lastLetters += e.code[3];
    while(lastLetters.length>8)
      lastLetters = lastLetters.substr(1)    
    if(lastLetters == "GIBMONEY"){
      career.money = Math.max(career.money, 5000000) * 2;
      career.render();
      career.save();
    }

    if(e.key == "Escape"){
      if(!field || !field.alive){
        newGame();
      }
    }

  })

  document.addEventListener("change", e=>{
    if(e.target instanceof HTMLSelectElement && e.target.id == "depth"){
      career.startingDepth = Number(e.target.value);
      career.render();
      career.save();
    }
  })

  if(localStorage.floodFillMinerField){
    newGame();
    field.load();
  }

  window.setInterval(() => {
    t += frameLength;
    if (field != null) field.draw(C, mouseOver, t);
  }, frameLength);
};
