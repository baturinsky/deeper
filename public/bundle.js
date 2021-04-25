(() => {
  // src/index.ts
  var startingWidth = 12;
  var startingHeight = 16;
  var widthIncreaseStep = 2;
  var heightIncreaseStep = 2;
  var depthIncreaseStep = 50;
  var baseUpgradeCost = 1024;
  var uWider = 0;
  var uDeeper = 1;
  var upgradeConf = [
    {
      text: (n) => `Wider work area [${startingWidth + n * widthIncreaseStep}] => [${startingWidth + (n + 1) * widthIncreaseStep}]`
    },
    {
      text: (n) => `Deeper work area [${startingHeight + n * heightIncreaseStep}] => [${startingHeight + (n + 1) * heightIncreaseStep}]`
    },
    {text: (n) => `Income multiplier [*${n + 1}] => [*${n + 2}]`},
    {text: (n) => `[-] Row bonuses frequency *[${n}] => *[${n + 1}]`},
    {text: (n) => `[-] Row bonuses range [${n + 1}] m => [${n + 2}] m`},
    {text: (n) => `[|] Column bonuses frequency [*${n}] => [*${n + 1}]`},
    {text: (n) => `[|] Column bonuses range [${n + 1}] m => [${n + 2}] m`},
    {
      text: (n) => `<span class="rainbow">Glubinium</span> deposits [*${n}] => [*${n + 1}]`
    },
    {
      text: (n) => `[$] Income miltiplier bonuses frequency [*${n}] => [*${n + 1}]`
    },
    {
      text: (n) => `[$] Income multiplier bonuses duration [${n + 1}] turns => [${n + 2}] turns`
    },
    {
      text: (n) => `[$] Income multiplier bonuses power [*${n + 1}] => [*${n + 2}] turns`
    },
    {
      text: (n) => `Start deeper [${n * depthIncreaseStep}] m => [${(n + 1) * depthIncreaseStep}] m`
    },
    {text: (n) => `[x] Freeze bonuses frequency [*${n}] => [*${n + 1}]`},
    {text: (n) => `[x] Freeze bonuses duration [${n + 1}] => [${n + 2}] turns`},
    {text: (n) => `[?] Enrichment bonuses frequency [*${n}] => [*${n + 1}]`},
    {text: (n) => `[?] Enrichment bonuses power [*${n + 1}] => [*${n + 2}]`}
  ];
  var brow = 200;
  var bonuses = 200;
  function hexToRGB(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16),
      255
    ] : null;
  }
  var piko8 = `#5F574F
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
#AAAAAA`;
  var colors = [
    [255, 255, 255, 0],
    ...piko8.split("\n").map((s) => hexToRGB(s))
  ];
  var captured = 100;
  var frameMargin = 1.5;
  var colorsNumber = colors.length;
  var glubinium = colorsNumber - 1;
  var price = [
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
    1e3,
    2e3,
    5e3,
    1e4,
    1e5
  ];
  var maxScale = 32;
  function weightedRandom(a, rng) {
    let sum = a.reduce((x, y) => x + y);
    let roll = rng() * sum - a[0];
    let i = 0;
    while (roll >= 0)
      roll -= a[++i];
    return i;
  }
  function balance(a) {
    let sum = a.reduce((x, y) => x + y, 0);
    return a.map((v) => v / sum);
  }
  function upgradeCost(unlock, tier) {
    return baseUpgradeCost * (unlock + 1) * 2 ** tier;
  }
  function unlockUpgradeCost(unlock) {
    return baseUpgradeCost * (unlock * unlock);
  }
  var Career = class {
    constructor() {
      this.money = 1e4;
      this.moneySpent = 0;
      this.upgrades = upgradeConf.map((_) => 0);
    }
    fieldWidth() {
      return startingWidth + this.upgrades[uWider] * widthIncreaseStep;
    }
    fieldHeight() {
      return startingWidth + this.upgrades[uDeeper] * widthIncreaseStep;
    }
    unlockUnlocked(u) {
      return this.moneySpent >= unlockUpgradeCost(u);
    }
    render() {
      let upgrades = upgradeConf.map((u, i) => {
        let price2 = upgradeCost(i, this.upgrades[i] + 1);
        return this.unlockUnlocked(i) ? `<div>${u.text(this.upgrades[i] || 0)}</div><button ${this.money < price2 ? "disabled" : ""} id="upgrade:${i}">$${price2}</button>` : `<div>Spend $${unlockUpgradeCost(i)} to unlock</div><div></div>`;
      }).join("");
      let t = `Have: $[${this.money}] Spent:$[${this.moneySpent}]
    <div id="upgrades">${upgrades}</div><button id="newGame">New Game</button>`.replace(/\[([*0-9]+)\]/g, "<em>$1</em>");
      document.getElementById("outro").innerHTML = t;
    }
  };
  var Field = class {
    constructor(w, h) {
      this.cells = [];
      this.lastColor = 1;
      this.depth = 0;
      this.scale = 16;
      this.money = 0;
      this.turn = 0;
      this.alive = true;
      this.depthCellChances = [];
      this.w = w;
      this.h = h;
      this.depthCellChances[0] = balance([...new Array(colorsNumber)].map((n, i) => i < 4 ? 1 : 0));
      for (let depth = 1; depth < this.h * 2; depth++) {
        this.addDepthCellChances();
      }
      this.cells = [...new Array(w * h)].map((v, i) => i < w ? captured : this.randomCellColor(i));
      this.play(this.lastColor);
      this.updateScale();
      this.updateStatus();
    }
    addDepthCellChances() {
      let depth = this.depthCellChances.length;
      this.depthCellChances[depth] = [...this.depthCellChances[depth - 1]];
      let increasing = Math.min(colorsNumber - 1, 1 + ~~(Math.random() * colorsNumber));
      if (depth * Math.random() * 8 > increasing ** 2.5)
        this.depthCellChances[depth][increasing] += 0.03;
      else
        this.depthCellChances[depth][increasing] *= 0.3;
      this.depthCellChances[depth] = balance(this.depthCellChances[depth]);
    }
    updateScale() {
      let maxWidth = window.innerWidth * 0.8;
      let maxHeight = window.innerHeight * 0.9;
      this.scale = Math.min(maxWidth / this.w, maxHeight / this.h, maxScale);
      const C = document.getElementById("C");
      C.width = this.w;
      C.style.width = `${this.w * this.scale}px`;
      C.height = this.h;
      C.style.height = `${this.h * this.scale}px`;
      const frame = document.getElementById("frame");
      frame.style.height = `${(this.h - frameMargin) * this.scale}px`;
    }
    randomCellColor(i) {
      let depth = ~~this.depth + ~~(i / this.w);
      let color = 1 + weightedRandom(this.depthCellChances[~~depth], () => Math.random());
      if (Math.random() < 0.1) {
        return brow;
      } else {
        return Math.min(colorsNumber, color);
      }
    }
    draw(C, ifPlay, t) {
      const cx = C.getContext("2d");
      let wbc = [];
      let capturePossible = false, playColor;
      if (ifPlay != null) {
        playColor = this.at(...ifPlay);
        wbc = this.willBeCapturedXY(ifPlay);
        if (wbc.length > 0) {
          capturePossible = true;
        }
      }
      let captureColor, capturedColor;
      if (capturePossible && t != null) {
        captureColor = playColor < bonuses ? [...colors[playColor] || [0, 0, 0, 255]] : [...colors[this.lastColor]];
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
          letters.innerHTML += `<div class="letter" style="left:${(i % this.w + 0.27) * this.scale}px;top:${(~~(i / this.w) + 0.3) * this.scale}px">-</div>`;
        }
        pixels.set(this.cells[i] == captured ? capturedColor : wbc.includes(i) ? captureColor : colors[this.cells[i]] || [0, 0, 0, 255], i * 4);
      }
      cx.putImageData(id, 0, 0);
      let shift = -(this.depth - ~~this.depth) * this.scale;
      letters.style.top = `${shift}px`;
      C.style.top = `${shift}px`;
    }
    at(x, y) {
      return this.cells[x + y * this.w];
    }
    play(color) {
      let wbc = this.willBeCaptured(color);
      if (wbc.length > 0) {
        this.money += this.areaPrice(wbc);
        for (let cell of this.willBeCaptured(color)) {
          this.cells[cell] = captured;
        }
        if (color < bonuses)
          this.lastColor = color;
        let newDeepmost = this.depth + ~~(Math.max(...wbc) / this.w);
        if (newDeepmost) {
          let newDepth = Math.max(newDeepmost - this.h / 2, this.depth + 0.5 + this.turn * 0.02);
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
    areaPrice(wbc) {
      return wbc.map((i) => price[this.cells[i]] || 0).reduce((a, b) => a + b, 0);
    }
    willBeCaptured(color, q = []) {
      if (color == null || color == captured)
        return [];
      q = [
        ...this.cells.map((c, i) => [c, i]).filter(([c, i]) => c == captured).map(([c, i]) => i),
        ...q
      ];
      let nbd = [-1, 1, this.w, -this.w];
      let wbc = [];
      while (q.length > 0) {
        let at = q.pop();
        for (let n of nbd) {
          if (n == -1 && at % this.w == 0 || n == 1 && (at + 1) % this.w == 0)
            continue;
          let newAt = at + n;
          if (this.cells[newAt] == color && !q.includes(newAt) && !wbc.includes(newAt)) {
            wbc.push(newAt);
            if (this.cells[newAt] < bonuses)
              q.push(newAt);
          }
        }
      }
      if (color >= bonuses) {
        let bc = [];
        for (let at of wbc) {
          switch (color) {
            case brow:
              for (let i = -3; i <= 3; i++) {
                let nnAt = at + i;
                if (~~(nnAt / this.w) == ~~(at / this.w) && !bc.includes(nnAt)) {
                  bc.push(nnAt);
                }
              }
              break;
          }
        }
        wbc = [
          ...new Set([...bc, ...this.willBeCaptured(this.lastColor, bc), ...wbc])
        ];
      }
      return wbc;
    }
    scrollTo(toDepth) {
      if (toDepth <= this.depth)
        return;
      let newLayers = ~~toDepth - ~~this.depth;
      this.cells = this.cells.slice(this.w * newLayers);
      for (let i = 0; i < newLayers; i++)
        this.addDepthCellChances();
      for (let i = 0; i < newLayers * this.w; i++) {
        this.cells.push(this.randomCellColor(this.cells.length));
      }
      this.depth = toDepth;
    }
    updateStatus(projectedIncome = 0) {
      document.getElementById("title").innerHTML = this.alive ? `$${this.money + projectedIncome} | ${this.depth.toFixed(1)} m | turn ${this.turn}
    }` : ``;
    }
  };
  window.onload = () => {
    let field;
    let career = new Career();
    let mouseOver = null;
    window.addEventListener("resize", () => {
      if (field != null)
        field.updateScale();
    });
    const C = document.getElementById("C");
    let text = document.getElementById("text");
    text.innerHTML = colors.slice(1).map((c, i) => `<span ${i + 1 == glubinium ? `class="rainbow"` : `style="color:rgb(${c[0]},${c[1]},${c[2]})"`}>${price[i + 1]}</span> `).join("");
    C.addEventListener("mousemove", (e) => {
      if (field == null)
        return;
      let [x, y] = [~~(e.offsetX / field.scale), ~~(e.offsetY / field.scale)];
      mouseOver = [x, y];
      let wbc = field.willBeCapturedXY([x, y]);
      field.updateStatus(field.areaPrice(wbc));
    });
    C.addEventListener("click", (e) => {
      if (field == null)
        return;
      let [x, y] = [~~(e.offsetX / field.scale), ~~(e.offsetY / field.scale)];
      field.play(field.at(x, y));
      if (!field.alive) {
        debugger;
        career.money += field.money;
        document.getElementById("outroFrame").style.visibility = "visible";
        career.render();
      }
      field.draw(C);
    });
    C.addEventListener("mouseleave", (e) => {
      mouseOver = null;
    });
    let t = 0;
    const frameLength = 50;
    career.render();
    function newGame() {
      field = new Field(career.fieldWidth(), career.fieldHeight());
      field.draw(C);
      document.getElementById("fieldFrame").style.visibility = "visible";
      document.getElementById("outroFrame").style.visibility = "hidden";
    }
    function doUpgrade(u) {
      career.upgrades[u]++;
      let cost = upgradeCost(u, career.upgrades[u]);
      career.money -= cost;
      career.moneySpent += cost;
      career.render();
    }
    document.addEventListener("click", (e) => {
      if (e.target instanceof HTMLButtonElement) {
        let id = e.target.id;
        if (id.substr(0, 7) == "newGame") {
          newGame();
        }
        if (id.substr(0, 7) == "upgrade") {
          doUpgrade(Number(id.substr(8)));
        }
      }
    });
    window.setInterval(() => {
      t += frameLength;
      if (field != null)
        field.draw(C, mouseOver, t);
    }, frameLength);
  };
})();
