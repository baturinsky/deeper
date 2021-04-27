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
  var uMult = 2;
  var uRowF = 3;
  var uRowR = 4;
  var uColF = 5;
  var uColR = 6;
  var uGlu = 7;
  var uInbF = 8;
  var uInbD = 9;
  var uInbP = 10;
  var uDeep = 11;
  var uFrF = 12;
  var uFrD = 13;
  var uEnrF = 14;
  var uEnrP = 15;
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
      text: (n) => `[$] Income multiplier bonuses frequency [*${n}] => [*${n + 1}]`
    },
    {
      text: (n) => `[$] Income multiplier bonuses duration [${n + 2}] turns => [${n + 3}] turns`
    },
    {
      text: (n) => `[$] Income multiplier bonuses power [*${n + 2}] => [*${n + 3}]`
    },
    {
      text: (n) => `Start deeper [${n * depthIncreaseStep}] m => [${(n + 1) * depthIncreaseStep}] m`
    },
    {text: (n) => `[x] Freeze time bonuses frequency [*${n}] => [*${n + 1}]`},
    {
      text: (n) => `[x] Freeze time bonuses duration [${n + 1}] => [${n + 2}] turns`
    },
    {text: (n) => `[?] Enrichment bonuses frequency [*${n}] => [*${n + 1}]`},
    {text: (n) => `[?] Enrichment bonuses power [*${n + 1}] => [*${n + 2}]`}
  ];
  var brow = 200;
  var bcol = 201;
  var bmul = 202;
  var bfreeze = 203;
  var benrich = 204;
  var bonuses = 200;
  var lastBonus = 204;
  var bonusSymbols = {
    [brow]: "-",
    [bcol]: "|",
    [bmul]: "$",
    [bfreeze]: "x",
    [benrich]: "?"
  };
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
#FF00AA`;
  var hexColors = ["#FFF", ...piko8.split("\n")];
  var colors = [
    [255, 255, 255, 0],
    ...piko8.split("\n").map((s) => hexToRGB(s))
  ];
  var captured = 100;
  var frameMargin = 1.5;
  var colorsNumber = colors.length;
  var glubinium = colorsNumber;
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
  var bonusBackground = [32, 32, 32, 255];
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
    return baseUpgradeCost * (unlock + 1) * (unlock == uFrF || unlock == uFrD ? 4 : 2) ** tier;
  }
  function unlockUpgradeCost(unlock) {
    return baseUpgradeCost * (unlock * unlock);
  }
  var Career = class {
    constructor() {
      this.money = 0;
      this.moneySpent = 0;
      this.startingDepth = 0;
      this.upgrades = upgradeConf.map((_) => 0);
      this.load();
      this.render();
    }
    reset() {
      this.money = 0;
      this.moneySpent = 0;
      this.startingDepth = 0;
      this.upgrades = upgradeConf.map((_) => 0);
      this.render();
    }
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
      return 1 - 0.9 ** this.upgrades[uEnrP];
    }
    bonusFrequency(bonus) {
      let upgrade = [uRowF, uColF, uInbF, uFrF, uEnrF][bonus - bonuses];
      return 2e-3 * this.upgrades[upgrade];
    }
    glubiniumChance(depth) {
      return depth / 1e6 * this.upgrades[uGlu];
    }
    doUpgrade(u) {
      this.upgrades[u]++;
      let cost = upgradeCost(u, this.upgrades[u]);
      this.money -= cost;
      this.moneySpent += cost;
      this.render();
      this.save();
    }
    render() {
      let upgrades = upgradeConf.map((u, i) => {
        let price2 = upgradeCost(i, this.upgrades[i] + 1);
        return this.unlockUnlocked(i) ? `<div>${u.text(this.upgrades[i] || 0)}</div><button ${this.money < price2 ? "disabled" : ""} id="upgrade:${i}">$${price2}</button>` : `<div>Spend $${unlockUpgradeCost(i)} to unlock</div><div></div>`;
      }).join("");
      let t = `Have: $[${this.money}] Spent:$[${this.moneySpent}]
    <div id="upgrades">${upgrades}</div><button id="newGame">New Game</button>
    from <select name="depth" id="depth">
      ${[...new Array(this.upgrades[uDeep] + 1)].map((_, i) => `<option ${this.startingDepth == i * 50 ? "selected" : ""} value="${i * 50}">${i * 50} m</option>`).join("")}
    </select>    
    
    `.replace(/\[([*0-9]+)\]/g, "<em>$1</em>");
      document.getElementById("outro").innerHTML = t;
    }
  };
  var Field = class {
    constructor(career) {
      this.cells = [];
      this.lastColor = 1;
      this.depth = 0;
      this.scale = 16;
      this.money = 0;
      this.turn = 0;
      this.alive = true;
      this.freeze = 0;
      this.multiplier = 0;
      this.depthCellChances = [];
      this.career = career;
      this.w = career.fieldWidth();
      this.h = career.fieldHeight();
      this.depthCellChances[0] = balance([...new Array(colorsNumber)].map((n, i) => i < 5 ? 1 : 0));
      for (let depth = 1; depth < this.h * 2; depth++) {
        this.addDepthCellChances();
      }
      let startingDepth = Number(this.career.startingDepth);
      if (startingDepth > 0) {
        this.scrollTo(startingDepth);
      }
      this.cells = [...new Array(this.w * this.h)].map((v, i) => i < this.w ? captured : this.randomCellColor(i));
      this.play(this.lastColor);
      this.updateScale();
      this.updateStatus();
    }
    save() {
      let o = {};
      Object.assign(o, this);
      this.career.save();
      delete o["career"];
      localStorage.floodFillMinerField = JSON.stringify(o);
    }
    load() {
      if (!localStorage.floodFillMinerField)
        return;
      let o = JSON.parse(localStorage.floodFillMinerField);
      Object.assign(this, o);
      this.updateStatus();
    }
    addDepthCellChances() {
      let depth = this.depthCellChances.length;
      this.depthCellChances[depth] = [...this.depthCellChances[depth - 1]];
      let increasing = Math.min(colorsNumber - 1, 1 + ~~(Math.random() ** 2 * colorsNumber));
      if (depth * Math.random() * 8 > increasing ** 2.5)
        this.depthCellChances[depth][increasing] += 0.05;
      else
        this.depthCellChances[depth][increasing] *= 0.3;
      this.depthCellChances[depth][glubinium - 1] = this.career.glubiniumChance(depth);
      this.depthCellChances[depth] = balance(this.depthCellChances[depth]);
    }
    updateScale() {
      let maxWidth = window.innerWidth * 0.8;
      let maxHeight = window.innerHeight * 0.9;
      this.scale = Math.min(maxWidth / this.w, maxHeight / this.h, maxScale);
      const C = document.getElementById("C");
      C.width = this.w * this.scale;
      C.style.width = `${this.w * this.scale}px`;
      C.height = this.h * this.scale;
      C.style.height = `${this.h * this.scale}px`;
      const frame = document.getElementById("frame");
      frame.style.height = `${(this.h - frameMargin) * this.scale}px`;
    }
    randomCellColor(i) {
      let depth = ~~this.depth + ~~(i / this.w);
      let color = 1 + weightedRandom(this.depthCellChances[~~depth], () => Math.random());
      for (let bonus = bonuses; bonus <= lastBonus; bonus++) {
        if (this.career.bonusFrequency(bonus) > Math.random()) {
          return bonus;
        }
      }
      return Math.min(colorsNumber, color);
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
      colors[glubinium] = [
        ~~(Math.sin(t / 200) * 80 + 125),
        ~~(Math.sin(t / 277) * 80 + 125),
        ~~(Math.sin(t / 335) * 80 + 125),
        255
      ];
      if (capturePossible && t != null) {
        captureColor = playColor < bonuses ? [...colors[playColor] || [0, 0, 0, 255]] : [...colors[this.lastColor]];
        capturedColor = [...captureColor];
        captureColor[3] = ~~(Math.sin(t / 100) * 40 + 225);
        capturedColor[3] = ~~(Math.sin(t / 100) * 20 + 225);
      } else {
        capturedColor = captureColor = [...colors[this.lastColor]];
        capturedColor[3] = ~~(Math.sin(t / 100) * 20 + 225);
      }
      let letters = document.getElementById("letters");
      letters.innerHTML = "";
      letters.style.fontSize = `${this.scale / 2}px`;
      cx.clearRect(0, 0, this.w * this.scale, this.h * this.scale);
      for (let i = 0; i < this.cells.length; i++) {
        if (this.cells[i] >= bonuses) {
          letters.innerHTML += `<div class="letter" style="left:${(i % this.w + 0.27) * this.scale}px;color:rgb(${Math.sin(t / 100) * 32 + 128},${Math.sin(t / 57) * 32 + 128},${Math.sin(t / 112) * 32 + 128});top:${(~~(i / this.w) + 0.3) * this.scale}px">${bonusSymbols[this.cells[i]]}</div>`;
        }
        let color = this.cells[i] == captured ? capturedColor : wbc.includes(i) ? captureColor : colors[this.cells[i]] || bonusBackground;
        cx.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},${color[3] / 255})`;
        cx.fillRect(i % this.w * this.scale, ~~(i / this.w) * this.scale, this.scale, this.scale);
      }
      let frame = document.getElementById("frame");
      if (this.freeze && !this.multiplier)
        frame.style.borderColor = "#0000ff";
      if (!this.freeze && this.multiplier)
        frame.style.borderColor = "#ffff00";
      if (this.freeze && this.multiplier)
        frame.style.borderColor = "#ff00ff";
      if (!this.freeze && !this.multiplier)
        frame.style.borderColor = "#fff1e8";
      let shift = -(this.depth - ~~this.depth) * this.scale;
      letters.style.top = `${shift}px`;
      C.style.top = `${shift}px`;
    }
    at(x, y) {
      return this.cells[x + y * this.w];
    }
    makeParticle(cell) {
      let p = document.createElement("div");
      p.className = "particle";
      p.innerHTML = "$";
      p.style.left = `${this.scale * (cell % this.w + Math.random() * 0.8)}px`;
      p.style.top = `${this.scale * (~~(cell / this.w) - 2 + Math.random() * 0.8)}px`;
      p.style.color = hexColors[this.cells[cell]];
      p.style.fontSize = `${10 + (price[this.cells[cell]] * this.totalMultiplier()) ** 0.3}px`;
      let frame = document.getElementById("frame");
      frame.insertBefore(p, frame.firstChild);
      setTimeout(() => p.remove(), 1e3);
    }
    play(color) {
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
              if (this.cells[i] < glubinium - 2 && this.career.enrichChance() > Math.random()) {
                this.cells[i]++;
              }
            }
          }
          this.makeParticle(cell);
          this.cells[cell] = captured;
        }
        if (color <= glubinium)
          this.lastColor = color;
        let newDeepmost = this.depth;
        if (this.multiplier > 0) {
          this.multiplier--;
        }
        if (this.freeze > 0) {
          this.freeze--;
        } else {
          let newDeepmost2 = this.depth + ~~(Math.max(...wbc) / this.w);
          if (newDeepmost2) {
            let newDepth = Math.max(newDeepmost2 - this.h / 2, this.depth + (this.turn < 3 ? 0 : 1 + this.turn * 0.02));
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
    areaPrice(wbc) {
      let money = wbc.map((i) => price[this.cells[i] - 1] || 0).reduce((a, b) => a + b, 0);
      money *= this.totalMultiplier();
      return money;
    }
    totalMultiplier() {
      let m = this.career.multiplier();
      if (this.multiplier) {
        m *= this.career.bonusMultiplier();
      }
      return m;
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
              for (let i = -this.career.rowSize(); i <= this.career.rowSize(); i++) {
                let nnAt = at + i;
                if (~~(nnAt / this.w) == ~~(at / this.w) && !bc.includes(nnAt)) {
                  bc.push(nnAt);
                }
              }
              break;
            case bcol:
              for (let i = -this.career.colSize(); i <= this.career.colSize(); i++) {
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
      document.getElementById("title").innerHTML = this.alive ? `
      $${this.money + projectedIncome} |
      ${this.depth.toFixed(1)} m |
       turn ${this.turn}
      ${this.multiplier ? ` | $*${this.career.bonusMultiplier()} ${this.multiplier} turns` : ``}
      ${this.freeze ? ` | freeze ${this.freeze} turns` : ``}
    ` : ``;
      let text = document.getElementById("text");
      text.innerHTML = colors.slice(1).map((c, i) => `<span ${i + 1 == glubinium ? `class="rainbow"` : `style="color:rgb(${c[0]},${c[1]},${c[2]})"`}>${price[i] * this.totalMultiplier()}</span> `).join("");
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
        if (id == "resetProgress" && e.shiftKey) {
          career.reset();
        }
        if (id == "exit") {
          debrief();
        }
      }
    });
    let lastLetters = "";
    document.addEventListener("keydown", (e) => {
      lastLetters += e.code[3];
      while (lastLetters.length > 8)
        lastLetters = lastLetters.substr(1);
      if (lastLetters == "GIBMONEY") {
        career.money = Math.max(career.money, 5e6) * 2;
        career.render();
        career.save();
      }
      if (e.key == "Escape") {
        if (!field || !field.alive) {
          newGame();
        }
      }
    });
    document.addEventListener("change", (e) => {
      if (e.target instanceof HTMLSelectElement && e.target.id == "depth") {
        career.startingDepth = Number(e.target.value);
        career.render();
        career.save();
      }
    });
    if (localStorage.floodFillMinerField) {
      newGame();
      field.load();
    }
    window.setInterval(() => {
      t += frameLength;
      if (field != null)
        field.draw(C, mouseOver, t);
    }, frameLength);
  };
})();
