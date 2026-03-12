/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

/**
 * Group selection bounding box.
 *
 * When 2+ shapes are focused, draws a single shared dashed frame with
 * 8 resize handles (corners + edges) and 1 rotate handle (above top-center).
 * When 0-1 shape is focused, the canvas is empty and per-shape handles take over.
 *
 * Coordinate convention:
 *   - page logical coords: position.x / position.y from mouse events
 *   - screen coords:  (logical + page.x) * page.scaleX
 */

const HANDLE_D     = 8;   // resize handle square side (screen px)
const HANDLE_HIT_R = 10;  // hit-test radius (screen px)
const ROT_OFFSET   = 24;  // rotate handle: px above the top-center
const BOX_COLOR    = '#7c6ff7'; // --accent purple
const FILL_COLOR   = '#ffffff';
const STROKE_COLOR = '#7c6ff7';

/** Cursor to use for each handle name. */
const HANDLE_CURSORS = {
  NW:     'nwse-resize',
  SE:     'nwse-resize',
  NE:     'nesw-resize',
  SW:     'nesw-resize',
  N:      'ns-resize',
  S:      'ns-resize',
  E:      'ew-resize',
  W:      'ew-resize',
  rotate: 'pointer',
};

const groupBox = (page) => {
  const self = {};

  // ─── canvas ───────────────────────────────────────────────────────────────
  const canvas = document.createElement('canvas');
  canvas.style.cssText =
    'position:absolute;top:0;left:0;pointer-events:none;z-index:20;';
  self.canvas = canvas;

  // ─── state ────────────────────────────────────────────────────────────────
  let _shapes     = [];   // currently focused, serializable shapes
  let _origBounds = null; // group AABB at drag start — immutable during drag
  let _origGroupCX = 0;
  let _origGroupCY = 0;
  let _dragging   = false;
  let _origShapes = [];   // per-shape snapshot at drag start
  let _startPos   = null; // logical {x,y} at drag start
  let _startAngle = 0;    // angle at drag start (rotate only)

  // Persistent display state — survives individual drag operations.
  // Reset only when selection changes (update() is called).
  let _displayBounds = null;  // reference AABB for display (logical coords)
  let _displayAngle  = 0;     // accumulated rotation of the display box (degrees)
  let _origDisplayAngle = 0;  // _displayAngle at the start of the current rotate drag

  /** Which handle is active — set by page.js before calling onMouseDown */
  self.activeHandle = null;

  // ─── helpers ──────────────────────────────────────────────────────────────
  const computeBounds = (shapes) => {
    if (!shapes.length) return null;
    let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
    shapes.forEach(s => {
      const f = s.getShapeFrame
        ? s.getShapeFrame()
        : {x1: s.x, y1: s.y, x2: s.x + s.width, y2: s.y + s.height};
      if (f.x1 < x1) x1 = f.x1;
      if (f.y1 < y1) y1 = f.y1;
      if (f.x2 > x2) x2 = f.x2;
      if (f.y2 > y2) y2 = f.y2;
    });
    return (x1 < Infinity) ? {x1, y1, x2, y2} : null;
  };

  const toScreen = (lx, ly) => ({
    x: (lx + page.x) * page.scaleX,
    y: (ly + page.y) * page.scaleY,
  });

  /** Rotate logical point (lx, ly) around (lcx, lcy) by angleDeg degrees. */
  const rotL = (lx, ly, lcx, lcy, angleDeg) => {
    if (angleDeg === 0) return {x: lx, y: ly};
    const rad = angleDeg * Math.PI / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const dx  = lx - lcx;
    const dy  = ly - lcy;
    return {x: lcx + dx * cos - dy * sin, y: lcy + dx * sin + dy * cos};
  };

  /**
   * Compute screen positions for all 9 handles of bounds b rotated by angle.
   * Returns {NW, N, NE, E, SE, S, SW, W, rotate} each as {x, y} screen coords.
   */
  const handlePositions = (b, angle) => {
    const lcx = (b.x1 + b.x2) / 2;
    const lcy = (b.y1 + b.y2) / 2;
    const a   = angle || 0;

    const rot = (lx, ly) => {
      const p = rotL(lx, ly, lcx, lcy, a);
      return toScreen(p.x, p.y);
    };

    const N      = rot(lcx, b.y1);
    const rotRad = a * Math.PI / 180;

    return {
      NW:     rot(b.x1, b.y1),
      N,
      NE:     rot(b.x2, b.y1),
      E:      rot(b.x2, lcy),
      SE:     rot(b.x2, b.y2),
      S:      rot(lcx, b.y2),
      SW:     rot(b.x1, b.y2),
      W:      rot(b.x1, lcy),
      // Rotate handle: ROT_OFFSET screen-px "above" N in the rotated direction
      rotate: {
        x: N.x - Math.sin(rotRad) * ROT_OFFSET,
        y: N.y - Math.cos(rotRad) * ROT_OFFSET,
      },
    };
  };

  // ─── public API ───────────────────────────────────────────────────────────
  self.isActive = () => _shapes.length >= 2;

  /** Return the CSS cursor string for a given handle name. */
  self.getHandleCursor = (handle) => HANDLE_CURSORS[handle] || 'default';

  /** Called when selection changes. shapes = current focused shapes array. */
  self.update = (shapes) => {
    _shapes = (shapes || []).filter(s => s.serializable !== false);
    // Reset display state so the box re-aligns to the new selection.
    _displayBounds = null;
    _displayAngle  = 0;
    self.draw();
  };

  /** Redraw from current display state (called on pan/zoom/interact). */
  self.draw = () => {
    const container = canvas.parentNode;
    const w = container ? container.clientWidth  : 0;
    const h = container ? container.clientHeight : 0;
    canvas.width  = w;
    canvas.height = h;
    if (!w || !h) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);

    if (_shapes.length < 2) return;

    // Freeze display bounds on first draw (or after reset).
    const b = _displayBounds || computeBounds(_shapes);
    if (!b) return;
    if (!_displayBounds) _displayBounds = {...b};

    const angle  = _displayAngle;
    const lcx    = (b.x1 + b.x2) / 2;
    const lcy    = (b.y1 + b.y2) / 2;
    const rotRad = angle * Math.PI / 180;

    const rotS = (lx, ly) => {
      const p = rotL(lx, ly, lcx, lcy, angle);
      return toScreen(p.x, p.y);
    };

    // ── Rotated bounding frame ─────────────────────────────────────────────
    const tl = rotS(b.x1, b.y1);
    const tr = rotS(b.x2, b.y1);
    const br = rotS(b.x2, b.y2);
    const bl = rotS(b.x1, b.y2);

    ctx.save();
    ctx.strokeStyle = BOX_COLOR;
    ctx.lineWidth   = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(tl.x, tl.y);
    ctx.lineTo(tr.x, tr.y);
    ctx.lineTo(br.x, br.y);
    ctx.lineTo(bl.x, bl.y);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    // ── Handles ───────────────────────────────────────────────────────────
    const handles = handlePositions(b, angle);
    const N = handles.N;

    Object.entries(handles).forEach(([name, pos]) => {
      ctx.save();
      ctx.fillStyle   = FILL_COLOR;
      ctx.strokeStyle = STROKE_COLOR;
      ctx.lineWidth   = 1.5;
      ctx.setLineDash([]);
      if (name === 'rotate') {
        // Connecting line from N handle to rotate handle
        ctx.beginPath();
        ctx.strokeStyle = BOX_COLOR;
        ctx.moveTo(N.x, N.y);
        // Touch the near edge of the circle (in the direction toward N)
        ctx.lineTo(
          pos.x + Math.sin(rotRad) * (HANDLE_D / 2),
          pos.y + Math.cos(rotRad) * (HANDLE_D / 2),
        );
        ctx.stroke();
        // Circle
        ctx.fillStyle   = FILL_COLOR;
        ctx.strokeStyle = STROKE_COLOR;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, HANDLE_D / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else {
        // Square handle
        ctx.fillRect(  pos.x - HANDLE_D / 2, pos.y - HANDLE_D / 2, HANDLE_D, HANDLE_D);
        ctx.strokeRect(pos.x - HANDLE_D / 2, pos.y - HANDLE_D / 2, HANDLE_D, HANDLE_D);
      }
      ctx.restore();
    });
  };

  /**
   * Hit-test in logical coords.
   * Returns handle name ('NW','N',...,'rotate') or null.
   */
  self.findHandle = (lx, ly) => {
    if (!self.isActive()) return null;
    const b = _displayBounds || computeBounds(_shapes);
    if (!b) return null;
    const {x: sx, y: sy} = toScreen(lx, ly);
    const handles = handlePositions(b, _displayAngle);
    for (const [name, pos] of Object.entries(handles)) {
      const d = Math.hypot(sx - pos.x, sy - pos.y);
      if (d <= HANDLE_HIT_R) return name;
    }
    return null;
  };

  // Pseudo-shape interface for page event dispatch
  self.rotatePosition = (_pos) => {};
  self.isTypeof = (type) => type === 'groupBox';
  self.isInConfig = () => false; // prevents default shape drag logic

  self.onMouseDown = (position) => {
    _dragging = true;
    _startPos = {x: position.x, y: position.y};

    // Use display bounds as the operation reference.
    const b = _displayBounds || computeBounds(_shapes);
    _origBounds = b ? {...b} : null;
    if (!_displayBounds && b) _displayBounds = {...b};
    if (!_origBounds) return;

    _origGroupCX = (_origBounds.x1 + _origBounds.x2) / 2;
    _origGroupCY = (_origBounds.y1 + _origBounds.y2) / 2;

    _origShapes = _shapes.map(s => ({
      shape:        s,
      x:            s.x,
      y:            s.y,
      width:        s.width,
      height:       s.height,
      rotateDegree: s.rotateDegree || 0,
      cx:           s.x + s.width  / 2,
      cy:           s.y + s.height / 2,
    }));

    if (self.activeHandle === 'rotate') {
      _origDisplayAngle = _displayAngle;
      _startAngle = Math.atan2(
        position.y - _origGroupCY,
        position.x - _origGroupCX,
      ) * 180 / Math.PI;
    }
  };

  self.onMouseDrag = (position) => {
    if (!_dragging || !_origBounds || !_origShapes.length) return;
    if (self.activeHandle === 'rotate') {
      _doRotate(position);
      page.cursor = 'pointer'; // keep rotate cursor visible during drag
    } else if (self.activeHandle) {
      _doResize(position);
    }
    self.draw();
  };

  self.onMouseUp = async (_pos) => {
    _dragging = false;
    if (self.activeHandle !== 'rotate') {
      // After resize: recompute display bounds from new shape positions and reset rotation.
      _displayBounds = computeBounds(_shapes);
      _displayAngle  = 0;
    }
    // After rotation: keep _displayAngle and _displayBounds so the box stays rotated
    // until the user deselects and re-selects (triggering update()).
    _origShapes = [];
    self.draw();
    _shapes.forEach(s => s.invalidateAlone?.());
  };

  // ─── resize ───────────────────────────────────────────────────────────────
  const _doResize = (position) => {
    const ob    = _origBounds;
    const origW = ob.x2 - ob.x1;
    const origH = ob.y2 - ob.y1;
    if (origW < 1 || origH < 1) return;

    const dx = position.x - _startPos.x;
    const dy = position.y - _startPos.y;

    let nx1 = ob.x1, ny1 = ob.y1, nx2 = ob.x2, ny2 = ob.y2;
    const h = self.activeHandle;
    if (h === 'NW' || h === 'W'  || h === 'SW') nx1 = ob.x1 + dx;
    if (h === 'NE' || h === 'E'  || h === 'SE') nx2 = ob.x2 + dx;
    if (h === 'NW' || h === 'N'  || h === 'NE') ny1 = ob.y1 + dy;
    if (h === 'SW' || h === 'S'  || h === 'SE') ny2 = ob.y2 + dy;

    const newW = nx2 - nx1;
    const newH = ny2 - ny1;
    if (newW < 4 || newH < 4) return; // prevent collapse

    const scaleX = newW / origW;
    const scaleY = newH / origH;

    _origShapes.forEach(({shape, cx, cy, width, height}) => {
      const relCX = cx     - ob.x1;
      const relCY = cy     - ob.y1;
      const newCX = nx1    + relCX * scaleX;
      const newCY = ny1    + relCY * scaleY;
      const nw    = Math.max(1, width  * scaleX);
      const nh    = Math.max(1, height * scaleY);
      shape.moveTo(newCX - nw / 2, newCY - nh / 2);
      shape.resize(nw, nh);
    });
    // Keep display bounds in sync with the resize so the frame follows in real-time.
    _displayBounds = {x1: nx1, y1: ny1, x2: nx2, y2: ny2};
  };

  // ─── rotate ───────────────────────────────────────────────────────────────
  const _doRotate = (position) => {
    const gcx = _origGroupCX;
    const gcy = _origGroupCY;
    const curAngle = Math.atan2(position.y - gcy, position.x - gcx) * 180 / Math.PI;
    // Snap to 10° steps (matches per-shape rotate connector)
    const dA    = Math.round((curAngle - _startAngle) / 10) * 10;
    const dARad = dA * Math.PI / 180;
    const cosA  = Math.cos(dARad);
    const sinA  = Math.sin(dARad);

    // Update display angle so the box follows the rotation visually.
    _displayAngle = _origDisplayAngle + dA;

    _origShapes.forEach(({shape, cx, cy, rotateDegree}) => {
      const dx    = cx - gcx;
      const dy    = cy - gcy;
      const newCX = gcx + dx * cosA - dy * sinA;
      const newCY = gcy + dx * sinA + dy * cosA;
      shape.moveTo(newCX - shape.width / 2, newCY - shape.height / 2);
      shape.rotateDegree = ((rotateDegree + dA) % 360 + 360) % 360;
    });
  };

  return self;
};

export {groupBox};
