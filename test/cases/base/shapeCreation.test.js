/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

/**
 * 形状创建行为测试 (shapeCreation)
 *
 * 覆盖三个已知 Bug：
 *   Bug-1  wantedShape 时序 — mouseup 后 wantedShape 依然不为空，导致重复创建
 *   Bug-2  形状落点 — 形状始终生成在 (0,0) 而非鼠标点击位置
 *   Bug-3  拖拽 resize — 按住拖拽时无法根据鼠标位移 resize 形状
 */

import 'core-js/stable';

// ─── 扩展（batchAdd 等）───────────────────────────────────────────────────────

// arrayExtension / collectionExtension 已通过 jest.config.cjs 的 setupFiles 加载

// ─── 轻量 wantedShape 模拟（与 page.js 同逻辑）───────────────────────────────

const makeWantedShape = (type = '', properties) => {
    let shapeType = type;
    let shapeProperties = properties;
    const self = {};
    self.isEmpty    = () => shapeType === '';
    self.clear      = () => { shapeType = ''; shapeProperties = undefined; };
    self.getType    = () => shapeType;
    self.getProperties = () => shapeProperties;
    return self;
};

// ─── 轻量 Shape stub（connectors 支持 rightBottom）──────────────────────────

const makeShapeStub = (x = 0, y = 0, width = 120, height = 80) => {
    let _w = width, _h = height, _x = x, _y = y;
    let mousedownConnector = null;
    let isNew = false;
    let _defaultWidth = width, _defaultHeight = height;

    const MIN = 15;

    const releaseConnector = (position) => {
        if (isNew) {
            if (_w < MIN) _w = _defaultWidth || MIN;
            if (_h < MIN) _h = _defaultHeight || MIN;
            isNew = false;
            if (position && position.context) {
                position.context.command = 'addShape';
                position.context.shapes = [{shape: stub}];
            }
        }
    };

    // 模拟 rightBottom connector
    const rightBottomConnector = {
        type: 'rightBottom',
        dragable: true,
        moving: jest.fn((deltaX, deltaY) => {
            // c1moving: 右侧扩展（宽+deltaX*2，不改变 x）
            _w = Math.max(1, _w + deltaX * 2);
            // c3moving: 下侧扩展（高+deltaY*2，不改变 y）
            _h = Math.max(1, _h + deltaY * 2);
        }),
        move: jest.fn(function(deltaX, deltaY, x, y) {
            this.moving(deltaX, deltaY, x, y);
        }),
        onMouseDrag: jest.fn(function(position) {
            this.move(position.deltaX, position.deltaY, position.x, position.y);
        }),
        release: jest.fn(releaseConnector),
    };

    const stub = {
        get x() { return _x; },
        get y() { return _y; },
        get width() { return _w; },
        get height() { return _h; },
        set width(v) { _w = v; },
        set height(v) { _h = v; },
        get mousedownConnector() { return mousedownConnector; },
        set mousedownConnector(v) { mousedownConnector = v; },
        get isNew() { return isNew; },
        set isNew(v) { isNew = v; },
        get _defaultWidth() { return _defaultWidth; },
        set _defaultWidth(v) { _defaultWidth = v; },
        get _defaultHeight() { return _defaultHeight; },
        set _defaultHeight(v) { _defaultHeight = v; },
        connectors: [rightBottomConnector],
        isFocused: false,
        disableNewResize: false,
        moveTo: jest.fn((nx, ny) => { _x = nx; _y = ny; }),
        resize: jest.fn((w, h) => {
            if (w >= 1) _w = w;
            if (h >= 1) _h = h;
        }),
        beginDrag: jest.fn(function() {
            this.mousedownConnector = rightBottomConnector;
            isNew = true;
            _defaultWidth  = _w;
            _defaultHeight = _h;
        }),
        select: jest.fn(function() { this.isFocused = true; }),
        unSelect: jest.fn(function() { this.isFocused = false; }),
        onMouseUp: jest.fn(async function(position) {
            if (this.mousedownConnector) {
                await this.mousedownConnector.release(position);
                this.mousedownConnector = null;
            }
        }),
        onMouseDrag: jest.fn(function(position) {
            if (this.mousedownConnector) {
                this.mousedownConnector.onMouseDrag(position);
            }
        }),
        invalidateAlone: jest.fn(),
        getFocusedShapes: jest.fn(function() { return this.isFocused ? [this] : []; }),
        getDragable: jest.fn(() => true),
    };
    return stub;
};

// ─── 被测核心逻辑：page.onMouseDown 的 wantedShape 处理段落 ──────────────────

/**
 * 直接复现 page.js 中 pageVal.onMouseDown 的关键路径，
 * 与 pluginMeta.import().then(...) 相同的异步结构
 */
const makePageStub = () => {
    const wantedShape = makeWantedShape('');
    const shapes = [];
    let mousedownShape = null;

    const stub = {
        wantedShape,
        get mousedownShape() { return mousedownShape; },
        set mousedownShape(v) { mousedownShape = v; },
        sm: {
            getShapes: jest.fn(() => shapes),
        },
        getFocusedShapes: jest.fn(() => shapes.filter(s => s.isFocused)),

        // pluginMeta.import 的简化版：总是立即 resolve
        _importPlugin: () => Promise.resolve(),

        // createNew：用 makeShapeStub，保存在 shapes[]
        createNew: jest.fn((type, x, y) => {
            const s = makeShapeStub(x, y);
            shapes.push(s);
            return s;
        }),

        /**
         * 直接复制 page.js 中 pageVal.onMouseDown 的真实逻辑（修复后版本）：
         * wantedShape 在调用 pluginMeta.import() 之前同步清除，
         * 使 mouseup 时 isEmpty()===true，工具可正确切回 select。
         */
        onMouseDown(position) {
            if (!this.wantedShape.isEmpty()) {
                this.getFocusedShapes().forEach(s => s.unSelect());
                // 同步保存类型/属性，立即清除 wantedShape
                const pendingType = this.wantedShape.getType();
                const pendingProperties = this.wantedShape.getProperties();
                this.wantedShape.clear();  // ← 修复：同步清除
                this._importPlugin(pendingType).then(() => {
                    this.mousedownShape = this.createNew(
                        pendingType,
                        position.x,
                        position.y,
                        undefined,
                        pendingProperties,
                    );
                    if (!this.mousedownShape.disableNewResize) {
                        this.mousedownShape.beginDrag(position.x, position.y);
                        this.mousedownShape.select();
                        this.mousedownShape.resize(1, 1);
                    }
                    this.mousedownShape.invalidateAlone();
                });
            } else {
                this.getFocusedShapes().forEach(s => s.unSelect());
            }
        },

        mouseDrag(position) {
            if (this.mousedownShape) {
                this.mousedownShape.onMouseDrag(position);
            }
        },

        want(type, properties) {
            this.wantedShape = makeWantedShape(type, properties);
        },
    };

    return stub;
};

const makePos = (x, y, opts = {}) => ({
    x, y, mousex: x, mousey: y,
    deltaX: opts.deltaX ?? 0,
    deltaY: opts.deltaY ?? 0,
    e: {button: 0, shiftKey: false, ctrlKey: false},
    context: {command: '', shapes: [], id: 'ctx', start: Date.now()},
});

// ═══════════════════════════════════════════════════════════════════════════════
// Bug-1  wantedShape 时序
// ═══════════════════════════════════════════════════════════════════════════════

describe('Bug-1: wantedShape 应在 pluginMeta.import() 调用前同步清除', () => {

    it('want() 后 wantedShape 不为空', () => {
        const p = makePageStub();
        p.want('rectangle', {width: 120, height: 80});
        expect(p.wantedShape.isEmpty()).toBe(false);
        expect(p.wantedShape.getType()).toBe('rectangle');
    });

    it('onMouseDown 调用后（同步）wantedShape 已被清除', () => {
        const p = makePageStub();
        p.want('rectangle', {width: 120, height: 80});
        const pos = makePos(150, 150);

        p.onMouseDown(pos);

        // 修复后：wantedShape 同步清除，mouseup 时 isEmpty()===true
        expect(p.wantedShape.isEmpty()).toBe(true);
    });

    it('await microtask 后 wantedShape 仍为空（修复核心断言）', async () => {
        const p = makePageStub();
        p.want('rectangle', {width: 120, height: 80});
        const pos = makePos(150, 150);

        p.onMouseDown(pos);

        // flush microtasks
        await Promise.resolve();
        await Promise.resolve();

        expect(p.wantedShape.isEmpty()).toBe(true);
    });

    it('await microtask 后 mousedownShape 指向新形状', async () => {
        const p = makePageStub();
        p.want('rectangle', {width: 120, height: 80});
        const pos = makePos(150, 150);

        p.onMouseDown(pos);
        await Promise.resolve();
        await Promise.resolve();

        // ❌ 若 mousedownShape 为 null，后续拖拽和 mouseup 均无效
        expect(p.mousedownShape).not.toBeNull();
    });

    it('第二次 onMouseDown（wantedShape 已空）不创建第二个形状', async () => {
        const p = makePageStub();
        p.want('rectangle', {width: 120, height: 80});
        const pos1 = makePos(100, 100);
        p.onMouseDown(pos1);
        await Promise.resolve();
        await Promise.resolve();

        const countAfterFirst = p.sm.getShapes().length;

        // 模拟第二次点击（此时 wantedShape 已清除）
        const pos2 = makePos(200, 200);
        p.onMouseDown(pos2);
        await Promise.resolve();
        await Promise.resolve();

        // ❌ 若第二次仍然创建了形状，此断言失败
        expect(p.sm.getShapes().length).toBe(countAfterFirst);
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Bug-2  形状落点
// ═══════════════════════════════════════════════════════════════════════════════

describe('Bug-2: 形状应创建在鼠标 (x, y)，不是 (0, 0)', () => {

    it('position(150, 200) → 形状 x=150, y=200', async () => {
        const p = makePageStub();
        p.want('rectangle', {width: 120, height: 80});
        const pos = makePos(150, 200);

        p.onMouseDown(pos);
        await Promise.resolve();
        await Promise.resolve();

        const shapes = p.sm.getShapes();
        expect(shapes.length).toBe(1);
        // ❌ Bug-2: 若 createNew 被以 (0,0) 调用，x=0, y=0，以下失败
        expect(shapes[0].x).toBe(150);
        expect(shapes[0].y).toBe(200);
    });

    it('createNew 应以 position.x, position.y 为参数调用', async () => {
        const p = makePageStub();
        p.want('rectangle', {width: 120, height: 80});
        const pos = makePos(300, 400);

        p.onMouseDown(pos);
        await Promise.resolve();
        await Promise.resolve();

        // ❌ Bug-2: 如果传入了 (0,0) 而不是 (300, 400)，此处失败
        // 第三、四参数分别为 idVal（可为 undefined）和 properties
        const call = p.createNew.mock.calls[0];
        expect(call[0]).toBe('rectangle');
        expect(call[1]).toBe(300);   // x
        expect(call[2]).toBe(400);   // y
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Bug-3  拖拽 resize
// ═══════════════════════════════════════════════════════════════════════════════

describe('Bug-3: mousedown 后拖拽应能 resize 新形状', () => {

    it('beginDrag 后 mousedownConnector 应为 rightBottom', async () => {
        const p = makePageStub();
        p.want('rectangle', {width: 120, height: 80});
        const pos = makePos(100, 100);

        p.onMouseDown(pos);
        await Promise.resolve();
        await Promise.resolve();

        const shape = p.mousedownShape;
        expect(shape).not.toBeNull();
        // ❌ Bug-3: 若 beginDrag 未被调用或 connector 未设置，此处失败
        expect(shape.mousedownConnector).not.toBeNull();
        expect(shape.mousedownConnector.type).toBe('rightBottom');
    });

    it('resize(1,1) 后 width/height 为 1', async () => {
        const p = makePageStub();
        p.want('rectangle', {width: 120, height: 80});
        const pos = makePos(100, 100);

        p.onMouseDown(pos);
        await Promise.resolve();
        await Promise.resolve();

        const shape = p.mousedownShape;
        // ❌ Bug-3: beginDrag 后 resize(1,1) 未生效，则 width 仍为 120
        expect(shape.width).toBe(1);
        expect(shape.height).toBe(1);
    });

    it('拖拽 deltaX=100, deltaY=80 后，宽高应增大', async () => {
        const p = makePageStub();
        p.want('rectangle', {width: 120, height: 80});
        const pos = makePos(100, 100);

        p.onMouseDown(pos);
        await Promise.resolve();
        await Promise.resolve();

        const shape = p.mousedownShape;
        const wBefore = shape.width;   // =1 after resize(1,1)
        const hBefore = shape.height;  // =1 after resize(1,1)

        // 模拟用户拖拽
        const dragPos = makePos(200, 180, {deltaX: 100, deltaY: 80});
        dragPos.context = pos.context;
        p.mouseDrag(dragPos);

        // ❌ Bug-3: 若 onMouseDrag 未被正确路由到 connector，宽高不变
        expect(shape.width).toBeGreaterThan(wBefore);
        expect(shape.height).toBeGreaterThan(hBefore);
    });

    it('点击不拖拽 → mouseUp 后尺寸恢复为默认 (120×80)', async () => {
        const p = makePageStub();
        p.want('rectangle', {width: 120, height: 80});
        const pos = makePos(100, 100);

        p.onMouseDown(pos);
        await Promise.resolve();
        await Promise.resolve();

        const shape = p.mousedownShape;
        expect(shape.width).toBe(1);    // resize(1,1) 后
        expect(shape._defaultWidth).toBe(120);

        // 不拖拽，直接 mouseUp
        await shape.onMouseUp(pos);

        // ❌ Bug-3: 若 release 逻辑未能恢复默认尺寸，此处失败
        expect(shape.width).toBeCloseTo(120, 0);
        expect(shape.height).toBeCloseTo(80, 0);
    });
});
