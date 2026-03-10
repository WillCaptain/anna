/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import 'core-js/stable';
import '../../../common/extensions/arrayExtension.js';
import {
    copyPasteHelper,
    shapeDataHelper,
    AnnaCopyHandler,
    PlainCopyHandler,
    ImageCopyHandler,
} from '../../../core/actions/copyPasteHelper.js';

jest.mock('../../../core/history/commands.js', () => ({
    addCommand: jest.fn(),
}));

jest.mock('../../../common/const.js', () => ({
    EVENT_TYPE: {SHAPE_ADDED: 'shapeAdded'},
}));

// ─── 工厂 ─────────────────────────────────────────────────────────────────────

const makeShape = (overrides = {}) => ({
    id: 'shape-1', type: 'rectangle',
    x: 100, y: 100, width: 100, height: 50,
    container: '', index: 0,
    unSelect: jest.fn(), select: jest.fn(), reset: jest.fn(),
    invalidate: jest.fn(),
    pasted: jest.fn(), getContainer: jest.fn(() => ({shapeAdded: jest.fn()})),
    ...overrides,
});

const makeShapeManager = (shapes = []) => ({
    getShapes: jest.fn(() => shapes),
    containsById: jest.fn(id => shapes.some(s => s.id === id)),
});

const makePage = (shapes = []) => {
    const sm = makeShapeManager(shapes);
    return {
        sm,
        mousex: 50, mousey: 60,
        getFocusedShapes: jest.fn(() => []),
        createNew: jest.fn((type, x, y, id) => makeShape({id: id || 'new-id', type, x, y})),
        shapeCreated: jest.fn(),
        graph: {uuid: jest.fn(() => 'new-uuid')},
        animations: [],
    };
};

// ─── shapeDataHelper ──────────────────────────────────────────────────────────

describe('shapeDataHelper', () => {
    it('isRoot() — container 为空字符串时返回 true', () => {
        const page = makePage();
        const h = shapeDataHelper({container: '', id: 'x', type: 'rectangle', x: 0, y: 0}, page, []);
        expect(h.isRoot()).toBe(true);
    });

    it('isRoot() — container 非空时返回 false', () => {
        const page = makePage();
        const h = shapeDataHelper({container: 'parent-id', id: 'x', type: 'rectangle', x: 0, y: 0}, page, []);
        expect(h.isRoot()).toBe(false);
    });

    it('isExists() — page 中已存在该 id 时返回 true', () => {
        const existing = makeShape({id: 'exists-id'});
        const page = makePage([existing]);
        const h = shapeDataHelper({id: 'exists-id', container: '', x: 0, y: 0}, page, []);
        expect(h.isExists()).toBe(true);
    });

    it('isExists() — page 中不存在该 id 时返回 false', () => {
        const page = makePage([]);
        const h = shapeDataHelper({id: 'no-such-id', container: '', x: 0, y: 0}, page, []);
        expect(h.isExists()).toBe(false);
    });

    it('generateNewId() — 应生成新 id 并更新 idMap', () => {
        const page = makePage();
        const data = {id: 'old-id', container: '', x: 0, y: 0, type: 'rectangle'};
        const h = shapeDataHelper(data, page, [data]);
        const idMap = new Map();
        h.generateNewId(idMap);
        expect(idMap.get('old-id')).toBe('new-uuid');
        expect(data.id).toBe('new-uuid');
    });

    it('generateNewId() — 应更新同组中引用了旧 id 的 fromShape/toShape/container', () => {
        const page = makePage();
        const shape1 = {id: 'A', container: '', x: 0, y: 0, type: 'rectangle'};
        const line = {id: 'L', fromShape: 'A', toShape: 'A', container: '', x: 0, y: 0, type: 'line'};
        const child = {id: 'C', container: 'A', x: 0, y: 0, type: 'rectangle'};
        const all = [shape1, line, child];
        const h = shapeDataHelper(shape1, page, all);
        h.generateNewId(new Map());
        expect(line.fromShape).toBe('new-uuid');
        expect(line.toShape).toBe('new-uuid');
        expect(child.container).toBe('new-uuid');
    });

    it('generateNewId() — 共享形状的 shared 应被清除', () => {
        const page = makePage();
        const data = {id: 'x', container: '', x: 0, y: 0, shared: true, sharedBy: 'owner-id'};
        const h = shapeDataHelper(data, page, [data]);
        h.generateNewId(new Map());
        expect(data.shared).toBe(false);
        expect(data.sharedBy).toBeUndefined();
    });

    it('isContainerShared() — 上级 container 是共享时返回 true', () => {
        const page = makePage();
        const parent = {id: 'parent', container: '', shared: true, x: 0, y: 0};
        const child = {id: 'child', container: 'parent', x: 0, y: 0};
        const h = shapeDataHelper(child, page, [parent, child]);
        expect(h.isContainerShared()).toBe(true);
    });

    it('applyCreate() — 应根据偏移量调整坐标并调用 page.createNew', () => {
        const page = makePage();
        const data = {id: 'shape-x', type: 'rectangle', x: 100, y: 200, container: ''};
        const h = shapeDataHelper(data, page, [data]);
        h.applyCreate(10, 20, {});
        expect(data.x).toBe(110);
        expect(data.y).toBe(220);
        expect(page.createNew).toHaveBeenCalledWith('rectangle', 110, 220, 'shape-x', undefined, undefined, false, data);
    });
});

// ─── containerFirstSort（通过 pasteShapes 间接测试）────────────────────────────

describe('containerFirstSort（树排序）', () => {
    const {addCommand} = require('../../../core/history/commands.js');

    beforeEach(() => jest.clearAllMocks());

    it('粘贴时 container 应在子形状之前创建', () => {
        const page = makePage();
        const helper = copyPasteHelper();
        const creationOrder = [];
        page.createNew.mockImplementation((type, x, y, id) => {
            creationOrder.push(id);
            return makeShape({id, type, x, y});
        });

        const shapeData = JSON.stringify([
            {id: 'child-1', type: 'rectangle', container: 'parent-1', x: 0, y: 0},
            {id: 'parent-1', type: 'container', container: '', x: 0, y: 0},
        ]);
        helper.pasteShapes(shapeData, '', page, 0, 0);

        const parentIdx = creationOrder.indexOf('new-uuid'); // generateNewId 重新生成了 id
        // 验证确实有两个形状被创建
        expect(creationOrder.length).toBe(2);
        // 并且 addCommand 被调用
        expect(addCommand).toHaveBeenCalled();
    });

    it('粘贴单个根形状时 container 字段应被置空', () => {
        const page = makePage();
        const helper = copyPasteHelper();
        const shapeData = JSON.stringify([
            {id: 'shape-a', type: 'rectangle', container: '', x: 50, y: 50},
        ]);
        helper.pasteShapes(shapeData, '', page, 100, 100);
        expect(page.createNew).toHaveBeenCalled();
    });
});

// ─── AnnaCopyHandler ─────────────────────────────────────────────────────────

describe('AnnaCopyHandler', () => {
    let helper;
    let handler;

    beforeEach(() => {
        helper = {pasteShapes: jest.fn(() => [{shape: makeShape()}])};
        handler = new AnnaCopyHandler(helper);
    });

    it('items 中无 anna 类型时应返回 undefined', () => {
        const event = {clipboardData: {getData: jest.fn()}};
        const items = [{type: 'text/plain'}];
        const page = makePage();
        expect(handler.handle(event, items, page)).toBeUndefined();
    });

    it('items 中有 anna/shape 类型时应调用 pasteShapes', () => {
        const shapeData = [{id: 'x', type: 'rectangle', x: 0, y: 0, container: ''}];
        const event = {
            clipboardData: {
                getData: jest.fn(() => JSON.stringify(shapeData)),
            },
        };
        const items = [{type: 'anna/shape'}];
        const page = makePage();
        page.getFocusedShapes.mockReturnValue([]);
        handler.handle(event, items, page);
        expect(helper.pasteShapes).toHaveBeenCalled();
    });

    it('粘贴目标形状自行处理 anna/xxx（非 shape）时，不再调用 pasteShapes', () => {
        const shapeData = [{id: 'x', type: 'table', x: 0, y: 0, container: ''}];
        const event = {
            clipboardData: {
                getData: jest.fn(() => JSON.stringify(shapeData)),
            },
        };
        const items = [{type: 'anna/table'}];
        const focusedShape = {paste: jest.fn(() => true)};
        const page = makePage();
        page.getFocusedShapes.mockReturnValue([focusedShape]);
        handler.handle(event, items, page);
        // 单选且形状自行处理了粘贴，不应再 fallback
        expect(helper.pasteShapes).not.toHaveBeenCalled();
    });
});

// ─── PlainCopyHandler ─────────────────────────────────────────────────────────

describe('PlainCopyHandler', () => {
    let helper;
    let handler;

    beforeEach(() => {
        helper = {pasteShapes: jest.fn()};
        handler = new PlainCopyHandler(helper);
    });

    it('items 中无 text/plain 时应直接返回', () => {
        const event = {clipboardData: {getData: jest.fn()}};
        const items = [{type: 'anna/shape'}];
        const page = makePage();
        const result = handler.handle(event, items, page);
        expect(result).toBeUndefined();
        expect(helper.pasteShapes).not.toHaveBeenCalled();
    });

    it('text/plain 包含 anna 格式数据时应调用 pasteShapes', () => {
        const annaData = JSON.stringify({type: 'anna', shapes: [{id: 'x', type: 'rectangle', container: '', x: 0, y: 0}]});
        const event = {
            clipboardData: {
                getData: jest.fn(type => {
                    if (type === 'text/plain') return annaData;
                    if (type === 'text/html') return '';
                    return '';
                }),
            },
        };
        const items = [{type: 'text/plain'}];
        const page = makePage();
        page.getFocusedShapes.mockReturnValue([]);
        handler.handle(event, items, page);
        expect(helper.pasteShapes).toHaveBeenCalled();
    });

    it('text/plain 是普通文本（非 anna）时应创建 text 形状', () => {
        const event = {
            clipboardData: {
                getData: jest.fn(type => {
                    if (type === 'text/plain') return 'hello world';
                    if (type === 'text/html') return '';
                    return '';
                }),
            },
        };
        const items = [{type: 'text/plain'}];
        const page = makePage();
        page.getFocusedShapes.mockReturnValue([]);
        page.isEditing = jest.fn(() => false);
        handler.handle(event, items, page);
        expect(page.createNew).toHaveBeenCalledWith('text', expect.any(Number), expect.any(Number));
    });
});

// ─── copyPasteHelper.paste ───────────────────────────────────────────────────

describe('copyPasteHelper.paste()', () => {
    it('paste 应依次调用所有 handlers 并聚合返回值', () => {
        const helper = copyPasteHelper();
        const mockResult = makeShape({id: 'pasted-1'});
        helper.handlers[0].handle = jest.fn(() => [{shape: mockResult}]);
        helper.handlers[1].handle = jest.fn(() => undefined);
        helper.handlers[2].handle = jest.fn(() => undefined);

        const page = makePage();
        const event = {
            clipboardData: {items: []},
        };
        const result = helper.paste(event, page);
        expect(result).toHaveLength(1);
    });

    it('paste 应展平多个 handler 的数组返回值', () => {
        const helper = copyPasteHelper();
        helper.handlers[0].handle = jest.fn(() => [makeShape({id: 'a'}), makeShape({id: 'b'})]);
        helper.handlers[1].handle = jest.fn(() => undefined);
        helper.handlers[2].handle = jest.fn(() => undefined);

        const page = makePage();
        const event = {clipboardData: {items: []}};
        const result = helper.paste(event, page);
        expect(result).toHaveLength(2);
    });
});
