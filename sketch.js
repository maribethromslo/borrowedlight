// Borrowed Light — "one bright star" experience, v2
// Ambient starfield you drift through; Greta Gerwig's star pulses
// brighter than the rest. Hover her to open her constellation —
// category hubs (Film, Literature, Music) one ring out, individual
// influences a ring past that. Click any node to pin its card open;
// hover still gives a quick preview without clicking.

// Type system — self-hosted via style.css @font-face, see fonts/ folder.
const FONT_DISPLAY = "Anton";
const FONT_SERIF = "Playfair Display";
const FONT_SCRIPT = "Caveat";
const FONT_MONO = "IBM Plex Mono";
const FONT_BODY = "Inter";

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

const SIDEBAR_W = 250; // left chrome reserves this much width

let starLayers = [];
let particles = [];

let hoveredNode = null;
let selectedNode = null;    // set by clicking a node; persists the card open
let revealProgress = 0;     // 0 = hidden constellation, 1 = fully revealed

const GERWIG_ID = 0;

const NAV_ITEMS = [
  { label: "Constellation", active: true },
  { label: "Films", active: false },
  { label: "Notes", active: false },
  { label: "Collections", active: false },
  { label: "Timeline", active: false },
  { label: "Related Directors", active: false }
];

function preload() {
  for (let node of nodes) {
    if (node.photo) node.img = loadImage(node.photo);
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  noStroke();
  textFont(FONT_BODY);

  starLayers = [
    makeStarLayer(140, 0.35, 0.6, 1.3),
    makeStarLayer(110, 0.7,  1.0, 2.0),
    makeStarLayer(70,  1.2,  1.6, 2.8)
  ];

  for (let i = 0; i < 70; i++) {
    particles.push({
      x: random(width), y: random(height),
      size: random(2, 5), speed: random(0.1, 0.35)
    });
  }

  computeLayout();
}

function makeStarLayer(count, parallax, minSize, maxSize) {
  let stars = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: random(width), y: random(height),
      size: random(minSize, maxSize),
      brightness: random(70, 255),
      twinkleSpeed: random(0.01, 0.04),
      phase: random(TWO_PI)
    });
  }
  return { stars, parallax };
}

// ---------------------------------------------------------
// LAYOUT — computed from data.js relationships, not hardcoded.
// Gerwig at the constellation's center (offset right of the sidebar),
// hubs one ring out at fixed angles, each hub's people spread across
// an arc facing outward from Gerwig.
// ---------------------------------------------------------
function computeLayout() {
  let cx = SIDEBAR_W + (width - SIDEBAR_W) / 2;
  let cy = height / 2;
  let R1 = min(220, (height - 160) * 0.32);   // Gerwig -> hub
  let R2 = min(130, (height - 160) * 0.2);    // hub -> person

  const hubAngles = { 1: -50, 2: -150, 3: 130 }; // Film, Literature, Music

  for (let n of nodes) {
    if (n.type === "director") {
      n.x = cx; n.y = cy;
    } else if (n.type === "hub") {
      n.angle = hubAngles[n.id];
      let a = radians(n.angle);
      n.x = cx + cos(a) * R1;
      n.y = cy + sin(a) * R1;
    }
  }

  let hubs = nodes.filter(n => n.type === "hub");
  for (let hub of hubs) {
    let children = nodes.filter(n => n.hubId === hub.id);
    let spread = min(140, children.length * 34);
    let startAngle = hub.angle - spread / 2;
    children.forEach((child, i) => {
      let a = children.length === 1
        ? hub.angle
        : startAngle + (spread * i) / (children.length - 1);
      let rad = radians(a);
      child.x = hub.x + cos(rad) * R2;
      child.y = hub.y + sin(rad) * R2;
    });
  }
}

function draw() {
  drawBackdrop();
  updateReveal();

  drawStarLayers();
  drawGrain();
  drawParticles();

  drawConstellation();

  drawVignette();
  drawSidebarShade();
  drawSidebar();
  drawDetailPanel();

  cursor(hoveredNode ? HAND : ARROW);
}

// ---------------------------------------------------------
// BACKDROP
// ---------------------------------------------------------
function drawBackdrop() {
  let ctx = drawingContext;
  let base = ctx.createRadialGradient(
    width * 0.5, height * 0.42, 0,
    width * 0.5, height * 0.42, max(width, height) * 0.75
  );
  base.addColorStop(0, "#12142a");
  base.addColorStop(1, "#07080f");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, width, height);
  drawNebulaGlows();
}

function drawNebulaGlows() {
  let ctx = drawingContext;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const glows = [
    { rgb: "232,68,126", bx: 0.26, by: 0.30, r: 0.5,  speed: 0.00035, amp: 45 },
    { rgb: "79,216,196",  bx: 0.74, by: 0.62, r: 0.45, speed: 0.00050, amp: 55 },
    { rgb: "232,163,58",  bx: 0.55, by: 0.80, r: 0.42, speed: 0.00042, amp: 40 }
  ];
  for (let g of glows) {
    let cx = width * g.bx + sin(frameCount * g.speed) * g.amp;
    let cy = height * g.by + cos(frameCount * g.speed * 1.3) * g.amp;
    let rad = min(width, height) * g.r;
    let grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
    grad.addColorStop(0, `rgba(${g.rgb},0.09)`);
    grad.addColorStop(1, `rgba(${g.rgb},0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.restore();
}

// ---------------------------------------------------------
// STARFIELD / GRAIN / PARTICLES / VIGNETTE
// ---------------------------------------------------------
function drawStarLayers() {
  noStroke();
  let driftX = sin(frameCount * 0.0006) * 10;
  let driftY = cos(frameCount * 0.0005) * 8;
  let mouseOffsetX = (mouseX - width / 2) * 0.05;
  let mouseOffsetY = (mouseY - height / 2) * 0.05;

  for (let layer of starLayers) {
    let ox = driftX * layer.parallax + mouseOffsetX * layer.parallax;
    let oy = driftY * layer.parallax + mouseOffsetY * layer.parallax;
    for (let s of layer.stars) {
      let glow = s.brightness + sin(frameCount * s.twinkleSpeed + s.phase) * 55;
      fill(255, constrain(glow, 0, 255));
      let x = ((s.x + ox) % width + width) % width;
      let y = ((s.y + oy) % height + height) % height;
      circle(x, y, s.size);
    }
  }
}

function drawGrain() {
  noStroke();
  for (let i = 0; i < 110; i++) {
    fill(255, random(3, 12));
    rect(random(width), random(height), 1, 1);
  }
}

function drawParticles() {
  noStroke();
  fill(255, 35);
  for (let p of particles) {
    circle(p.x, p.y, p.size);
    p.y -= p.speed;
    if (p.y < 0) { p.y = height; p.x = random(width); }
  }
}

function drawVignette() {
  let ctx = drawingContext;
  let g = ctx.createRadialGradient(
    width / 2, height / 2, min(width, height) * 0.25,
    width / 2, height / 2, max(width, height) * 0.7
  );
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,0.55)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);
}

// a soft dark gradient behind the sidebar so its text stays legible
// over the starfield without needing an opaque panel
function drawSidebarShade() {
  let ctx = drawingContext;
  let g = ctx.createLinearGradient(0, 0, SIDEBAR_W + 40, 0);
  g.addColorStop(0, "rgba(5,6,14,0.55)");
  g.addColorStop(1, "rgba(5,6,14,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, SIDEBAR_W + 40, height);
}

// ---------------------------------------------------------
// REVEAL STATE / INPUT
// ---------------------------------------------------------
function updateReveal() {
  hoveredNode = getNodeUnderMouse();
  let openable = hoveredNode && hoveredNode.type !== "influence" || (hoveredNode && hoveredNode.type === "influence" && revealProgress > 0.35);
  let target = (selectedNode || openable) ? 1 : 0;
  revealProgress = lerp(revealProgress, target, 0.08);
}

function getNodeUnderMouse() {
  for (let node of nodes) {
    if (node.type === "hub" && revealProgress < 0.05) continue;
    if (node.type === "influence" && revealProgress < 0.35) continue;

    let scale = node.type === "director" ? 1 : max(revealProgress, 0.3);
    let hitRadius = (node.size * scale) / 2 + 12;

    if (dist(mouseX, mouseY, node.x, node.y) < hitRadius) return node;
  }
  return null;
}

function mousePressed() {
  // clicking the detail panel's close button clears the selection
  if (selectedNode && isOverPanelClose(mouseX, mouseY)) {
    selectedNode = null;
    return;
  }
  let clicked = getNodeUnderMouse();
  if (clicked) {
    selectedNode = (selectedNode && selectedNode.id === clicked.id) ? null : clicked;
  } else {
    selectedNode = null;
  }
}

// ---------------------------------------------------------
// CONSTELLATION
// ---------------------------------------------------------
function drawConstellation() {
  let gerwig = nodes[GERWIG_ID];

  drawOrbitRings(gerwig.x, gerwig.y);
  drawSunburst(gerwig.x, gerwig.y);
  drawEdges();

  noStroke();

  // Gerwig — always visible, always the brightest thing on screen
  let gerwigActive = (hoveredNode && hoveredNode.id === GERWIG_ID) || (selectedNode && selectedNode.id === GERWIG_ID);
  let gerwigSize = gerwig.size + (gerwigActive ? 6 : 0);
  starGlyph(gerwig.x, gerwig.y, gerwigSize, gerwig.color, true, 1);
  drawMedallion(gerwig.x, gerwig.y, gerwigSize * 0.62, gerwig, 1);
  drawArcName(gerwig.name.toUpperCase(), gerwig.x, gerwig.y, gerwigSize * 0.62 + 20);

  // hubs bloom in first
  for (let hub of nodes.filter(n => n.type === "hub")) {
    if (revealProgress <= 0.02) continue;
    let isActive = (hoveredNode && hoveredNode.id === hub.id) || (selectedNode && selectedNode.id === hub.id);
    let size = hub.size * revealProgress + (isActive ? 4 : 0);
    starGlyph(hub.x, hub.y, size, hub.color, isActive, revealProgress);
    drawHubIcon(hub, size, revealProgress);
  }

  // people bloom in just after their hub
  let leafProgress = constrain((revealProgress - 0.25) / 0.75, 0, 1);
  if (leafProgress > 0.02) {
    for (let node of nodes.filter(n => n.type === "influence")) {
      let isActive = (hoveredNode && hoveredNode.id === node.id) || (selectedNode && selectedNode.id === node.id);
      let size = node.size * leafProgress + (isActive ? 4 : 0);
      starGlyph(node.x, node.y, size, node.color, isActive, leafProgress);
      if (leafProgress > 0.5) {
        let medAlpha = constrain((leafProgress - 0.5) / 0.4, 0, 1);
        drawMedallion(node.x, node.y, size * 0.62, node, medAlpha);
      }
    }
  }

  drawLabels(leafProgress);
}

function drawEdges() {
  if (revealProgress <= 0.02) return;

  for (let edge of edges) {
    let a = nodes[edge[0]];
    let b = nodes[edge[1]];
    let isLeafEdge = a.type === "influence" || b.type === "influence";
    let localProgress = isLeafEdge ? constrain((revealProgress - 0.25) / 0.75, 0, 1) : revealProgress;
    if (localProgress <= 0.01) continue;

    let ex = lerp(a.x, b.x, localProgress);
    let ey = lerp(a.y, b.y, localProgress);
    drawDottedLine(a.x, a.y, ex, ey, localProgress);
  }
}

// a dotted connector with small star waypoints, instead of a plain
// solid line — closer to the fine constellation linework in the ref
function drawDottedLine(x1, y1, x2, y2, alphaMul) {
  let d = dist(x1, y1, x2, y2);
  if (d < 1) return;
  let step = 9;
  let count = floor(d / step);

  stroke(255, 60 * alphaMul);
  strokeWeight(1);
  line(x1, y1, x2, y2);

  noStroke();
  for (let i = 0; i <= count; i++) {
    let t = i / count;
    let x = lerp(x1, x2, t);
    let y = lerp(y1, y2, t);
    if (i % 3 === 0) {
      fill(255, 200 * alphaMul);
      circle(x, y, 1.6);
    }
  }
}

function starGlyph(x, y, size, col, isBright, alphaMul) {
  let pulse = size + sin(frameCount * 0.05 + x * 0.02) * (isBright ? 3 : 1.5);
  drawingContext.shadowBlur = isBright ? 45 : 24;
  drawingContext.shadowColor = col;
  fill(col);
  drawingContext.globalAlpha = alphaMul;
  circle(x, y, pulse);
  drawingContext.globalAlpha = 1;
  drawingContext.shadowBlur = 0;
}

// a hub's icon sits directly on its star (no photo — hubs are
// categories, not people)
function drawHubIcon(hub, size, alphaMul) {
  drawingContext.globalAlpha = alphaMul;
  push();
  translate(hub.x, hub.y);
  stroke(9, 10, 20, 230);
  strokeWeight(1.4);
  fill(9, 10, 20, 220);
  drawIcon(hub.icon, size * 0.32);
  pop();
  drawingContext.globalAlpha = 1;
}

function drawMedallion(x, y, radius, node, alpha) {
  if (radius < 6 || alpha <= 0.01) return;
  let ctx = drawingContext;
  ctx.save();
  ctx.globalAlpha = alpha;

  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TWO_PI);
  ctx.clip();
  if (node.img) {
    image(node.img, x - radius, y - radius, radius * 2, radius * 2);
  } else {
    let c = color(node.color);
    let grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
    grad.addColorStop(0, `rgba(${red(c)},${green(c)},${blue(c)},0.5)`);
    grad.addColorStop(1, "rgba(8,9,18,0.92)");
    ctx.fillStyle = grad;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  ctx.restore();

  noFill();
  stroke(node.color);
  strokeWeight(1.3);
  circle(x, y, radius * 2);

  let tickOffset = (node.id * 41) % 360;
  strokeWeight(1);
  for (let i = 0; i < 16; i++) {
    let a = radians(tickOffset + i * (360 / 16));
    let r1 = radius + 2;
    let r2 = radius + (i % 4 === 0 ? 6 : 3);
    line(x + cos(a) * r1, y + sin(a) * r1, x + cos(a) * r2, y + sin(a) * r2);
  }

  if (!node.img) {
    push();
    translate(x, y);
    drawIcon(node.icon, radius * 0.5);
    pop();
  }
  ctx.restore();
}

function drawIcon(type, s) {
  noFill();
  stroke(255, 235);
  strokeWeight(1.2);

  if (type === "film") {
    circle(0, 0, s * 1.5);
    noStroke();
    fill(255, 235);
    for (let i = 0; i < 3; i++) {
      let a = i * TWO_PI / 3 + HALF_PI;
      circle(cos(a) * s * 0.5, sin(a) * s * 0.5, s * 0.35);
    }
  } else if (type === "book") {
    line(0, -s * 0.7, 0, s * 0.7);
    beginShape();
    vertex(0, -s * 0.6);
    quadraticVertex(-s * 1.1, -s * 0.5, -s * 1.05, s * 0.6);
    vertex(0, s * 0.65);
    endShape();
    beginShape();
    vertex(0, -s * 0.6);
    quadraticVertex(s * 1.1, -s * 0.5, s * 1.05, s * 0.6);
    vertex(0, s * 0.65);
    endShape();
  } else if (type === "music") {
    noStroke();
    fill(255, 235);
    ellipse(-s * 0.35, s * 0.55, s * 0.7, s * 0.5);
    noFill();
    stroke(255, 235);
    strokeWeight(1.2);
    line(0, s * 0.55, 0, -s * 0.9);
    line(0, -s * 0.9, s * 0.7, -s * 0.55);
  } else if (type === "director") {
    let r = s * 1.05;
    viewfinderCorner(-r, -r, 1, 1);
    viewfinderCorner(r, -r, -1, 1);
    viewfinderCorner(-r, r, 1, -1);
    viewfinderCorner(r, r, -1, -1);
  }
}

function viewfinderCorner(x, y, dx, dy) {
  let len = 6;
  line(x, y, x + len * dx, y);
  line(x, y, x, y + len * dy);
}

function drawSunburst(x, y) {
  let baseAlpha = 0.05 + 0.35 * revealProgress;
  let innerR = 20;
  let outerR = 150 + 60 * revealProgress;
  let rot = frameCount * 0.0008;
  let rays = 40;
  stroke(232, 163, 58, 255 * baseAlpha);
  strokeWeight(1);
  for (let i = 0; i < rays; i++) {
    let a = rot + (i / rays) * TWO_PI;
    line(x + cos(a) * innerR, y + sin(a) * innerR, x + cos(a) * outerR, y + sin(a) * outerR);
  }
  noStroke();
}

function drawOrbitRings(x, y) {
  if (revealProgress <= 0.02) return;
  push();
  translate(x, y);
  noFill();
  strokeWeight(1);
  for (let i = 0; i < 2; i++) {
    push();
    rotate(frameCount * 0.0012 * (i % 2 === 0 ? 1 : -1) + i * 0.6);
    stroke(232, 68, 126, 75 * revealProgress);
    let rx = 115 + i * 55;
    let ry = rx * 0.82;
    ellipse(0, 0, rx * 2, ry * 2);
    pop();
  }
  pop();
}

// Gerwig's name, arced along the top of her portrait ring
function drawArcName(str, cx, cy, radius) {
  drawingContext.shadowBlur = 0;
  textFont(FONT_DISPLAY);
  textSize(13);
  textAlign(CENTER, CENTER);

  let totalArc = min(150, str.length * 13);
  let startAngle = -90 - totalArc / 2;
  let stepAngle = str.length > 1 ? totalArc / (str.length - 1) : 0;

  for (let i = 0; i < str.length; i++) {
    let a = radians(startAngle + i * stepAngle);
    let x = cx + cos(a) * radius;
    let y = cy + sin(a) * radius;
    push();
    translate(x, y);
    rotate(a + HALF_PI);
    stroke(6, 7, 16, 220);
    strokeWeight(2.5);
    fill(255, 92, 168);
    text(str[i], 0, 0);
    pop();
  }
  noStroke();
}

function drawLabels(leafProgress) {
  drawingContext.shadowBlur = 0;
  textAlign(CENTER);
  textFont(FONT_DISPLAY);

  for (let hub of nodes.filter(n => n.type === "hub")) {
    if (revealProgress < 0.1) continue;
    textSize(13);
    drawOutlinedText(hub.name.toUpperCase(), hub.x, hub.y - hub.size * revealProgress - 14, 235 * revealProgress);
  }

  for (let node of nodes.filter(n => n.type === "influence")) {
    if (leafProgress < 0.15) continue;
    textSize(12);
    drawOutlinedText(node.name.toUpperCase(), node.x, node.y + node.size * leafProgress + 18, 220 * leafProgress);
  }
}

function drawOutlinedText(str, x, y, alpha) {
  drawingContext.shadowBlur = 0;
  stroke(6, 7, 16, alpha * 0.95);
  strokeWeight(3);
  fill(255, alpha);
  text(str, x, y);
  noStroke();
}

// ---------------------------------------------------------
// SIDEBAR — wordmark, director info, nav, controls
// ---------------------------------------------------------
function drawSidebar() {
  drawingContext.shadowBlur = 0;
  let x = 26;
  let y = 26;

  drawSunburstIcon(x + 9, y + 9, 9);
  textFont(FONT_DISPLAY);
  textSize(19);
  textAlign(LEFT, TOP);
  fill(245, 236, 217, 235);
  text("BORROWED LIGHT", x + 26, y - 3);

  textFont(FONT_MONO);
  textSize(9.5);
  fill(180, 178, 200, 210);
  text("A CONSTELLATION OF INFLUENCE", x + 26, y + 20);

  y += 64;
  textFont(FONT_MONO);
  textSize(10);
  fill(150, 150, 175, 200);
  text("DIRECTOR", x, y);

  y += 20;
  textFont(FONT_DISPLAY);
  textSize(22);
  fill(255);
  text("GRETA GERWIG", x, y);

  y += 26;
  textFont(FONT_BODY);
  textSize(12);
  fill(180, 178, 200, 200);
  text("Filmmaker", x, y);

  // nav list
  y += 46;
  textFont(FONT_MONO);
  textSize(12);
  for (let item of NAV_ITEMS) {
    let dotColor = item.active ? color(255, 92, 168) : color(120, 120, 140, 150);
    noStroke();
    fill(dotColor);
    circle(x + 3, y + 6, 6);
    fill(item.active ? 255 : 130, item.active ? 255 : 130, item.active ? 255 : 150, item.active ? 235 : 140);
    text(item.label.toUpperCase(), x + 16, y);
    y += 24;
  }

  // controls hint, honest about what's actually implemented right now
  y += 26;
  textFont(FONT_MONO);
  textSize(10);
  fill(140, 140, 160, 190);
  text("HOVER a star to preview", x, y);
  y += 17;
  text("CLICK to pin it open", x, y);
}

function drawSunburstIcon(cx, cy, r) {
  stroke(230, 195, 119, 235);
  strokeWeight(1.2);
  for (let i = 0; i < 8; i++) {
    let a = radians(i * 45);
    line(cx + cos(a) * r * 0.4, cy + sin(a) * r * 0.4, cx + cos(a) * r, cy + sin(a) * r);
  }
  noStroke();
}

// ---------------------------------------------------------
// DETAIL PANEL — top right, ticket-stub card, opens on
// hover (preview) or click (pinned open with a close button)
// ---------------------------------------------------------
function panelGeometry() {
  let boxW = min(360, width - SIDEBAR_W - 60);
  let boxX = width - boxW - 26;
  let boxH = 150;
  let boxY = height - boxH - 26;
  return { boxX, boxY, boxW, boxH };
}

function isOverPanelClose(mx, my) {
  if (!selectedNode) return false;
  let { boxX, boxY, boxW } = panelGeometry();
  let cx = boxX + boxW - 20, cy = boxY + 18;
  return dist(mx, my, cx, cy) < 12;
}

function drawDetailPanel() {
  let node = selectedNode || (revealProgress > 0.5 ? hoveredNode : null) || (revealProgress > 0.5 ? nodes[GERWIG_ID] : null);
  let alphaMul = constrain((revealProgress - 0.2) / 0.3, 0, 1);
  if (!node || alphaMul <= 0.01) return;

  let ctx = drawingContext;
  let { boxX, boxY, boxW, boxH } = panelGeometry();

  let grad = ctx.createLinearGradient(boxX, boxY, boxX, boxY + boxH);
  grad.addColorStop(0, `rgba(239,226,194,${0.97 * alphaMul})`);
  grad.addColorStop(1, `rgba(227,211,170,${0.97 * alphaMul})`);
  ctx.fillStyle = grad;
  roundRectPath(ctx, boxX, boxY, boxW, boxH, 10);
  ctx.fill();

  ctx.save();
  roundRectPath(ctx, boxX, boxY, boxW, boxH, 10);
  ctx.clip();
  noStroke();
  for (let i = 0; i < 90; i++) {
    fill(90, 70, 40, random(4, 14) * alphaMul);
    rect(boxX + random(boxW), boxY + random(boxH), 1, 1);
  }
  ctx.restore();

  ctx.fillStyle = `rgba(7,8,15,${alphaMul})`;
  ctx.beginPath(); ctx.arc(boxX, boxY + boxH / 2, 8, 0, TWO_PI); ctx.fill();
  ctx.beginPath(); ctx.arc(boxX + boxW, boxY + boxH / 2, 8, 0, TWO_PI); ctx.fill();

  ctx.strokeStyle = `rgba(0,0,0,${0.18 * alphaMul})`;
  ctx.lineWidth = 1.2;
  roundRectPath(ctx, boxX, boxY, boxW, boxH, 10);
  ctx.stroke();

  let medX = boxX + 56;
  let medY = boxY + boxH / 2;
  drawMedallion(medX, medY, 34, node, alphaMul);

  ctx.strokeStyle = `rgba(0,0,0,${0.15 * alphaMul})`;
  ctx.setLineDash([2, 3]);
  ctx.beginPath();
  ctx.moveTo(boxX + 98, boxY + 14);
  ctx.lineTo(boxX + 98, boxY + boxH - 14);
  ctx.stroke();
  ctx.setLineDash([]);

  let textX = boxX + 114;

  noStroke();
  textFont(FONT_SERIF);
  textAlign(LEFT, TOP);
  fill(120, 90, 30, 150 * alphaMul);
  textSize(13);
  text(ROMAN[node.id % ROMAN.length], boxX + 16, boxY + 8);

  textFont(FONT_MONO);
  textAlign(LEFT, TOP);
  fill(node.color);
  textSize(11);
  text((node.category || node.type || "").toUpperCase(), textX, boxY + 16);

  textFont(FONT_DISPLAY);
  fill(30, 26, 18, 255 * alphaMul);
  textSize(20);
  text(node.name.toUpperCase(), textX, boxY + 32);

  textFont(FONT_SERIF);
  fill(50, 44, 30, 220 * alphaMul);
  textSize(13);
  textStyle(ITALIC);
  text(node.note || "", textX, boxY + 62, boxX + boxW - textX - 16, boxH - 78);
  textStyle(NORMAL);

  // close button — only meaningful once the panel is actually pinned
  if (selectedNode) {
    let closeX = boxX + boxW - 20, closeY = boxY + 18;
    stroke(90, 70, 40, 200 * alphaMul);
    strokeWeight(1.4);
    let s = 5;
    line(closeX - s, closeY - s, closeX + s, closeY + s);
    line(closeX - s, closeY + s, closeX + s, closeY - s);
    noStroke();
  }
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  computeLayout();
}
