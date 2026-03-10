/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import 'core-js/stable';
import '../../../common/extensions/arrayExtension.js';
import {commandHistory, graphCommandHistory, pageCommandHistory} from '../../../core/history/history.js';

let _graphIdCounter = 0;
const makeGraph = (pages = []) => ({
    id: 'g-' + (++_graphIdCounter),
    pages,
    collaboration: {invoke: jest.fn()},
    activePage: pages[0] || null,
});

const makeCommand = (executeResult = true) => ({
    id: 'cmd-' + Math.random(),
    execute: jest.fn(() => executeResult),
    undo: jest.fn(),
    redo: jest.fn(),
    batchNo: 0,
    type: 'test',
    host: {isPage: false},
});

describe('commandHistory', () => {
    let history;

    beforeEach(() => {
        history = commandHistory('graph', makeGraph());
    });

    // ─── addCommand ──────────────────────────────────────
    describe('addCommand()', () => {
        it('added command is pushed to undoStack', () => {
            const cmd = makeCommand();
            history.addCommand(cmd);
            expect(history.canUndo()).toBe(true);
        });

        it('adding new command clears redoStack', () => {
            const cmd1 = makeCommand();
            history.addCommand(cmd1);
            history.undo();
            const cmd2 = makeCommand();
            history.addCommand(cmd2);
            expect(history.canRedo()).toBe(false);
        });
    });

    // ─── undo / redo ─────────────────────────────────────
    describe('undo() / redo()', () => {
        it('command.undo() is called after undo', () => {
            const cmd = makeCommand();
            history.addCommand(cmd);
            history.undo();
            expect(cmd.undo).toHaveBeenCalled();
        });

        it('command.redo() is called after undo then redo', () => {
            const cmd = makeCommand();
            history.addCommand(cmd);
            history.undo();
            history.redo();
            expect(cmd.redo).toHaveBeenCalled();
        });

        it('undo does nothing when undoStack is empty', () => {
            expect(() => history.undo()).not.toThrow();
        });

        it('redo does nothing when redoStack is empty', () => {
            expect(() => history.redo()).not.toThrow();
        });
    });

    // ─── canUndo / canRedo ───────────────────────────────
    describe('canUndo() / canRedo()', () => {
        it('canUndo is false when no commands', () => {
            expect(history.canUndo()).toBe(false);
        });

        it('canUndo is true when command exists', () => {
            history.addCommand(makeCommand());
            expect(history.canUndo()).toBe(true);
        });

        it('canRedo is false before undo', () => {
            history.addCommand(makeCommand());
            expect(history.canRedo()).toBe(false);
        });

        it('canRedo is true after undo', () => {
            history.addCommand(makeCommand());
            history.undo();
            expect(history.canRedo()).toBe(true);
        });
    });

    // ─── clear ───────────────────────────────────────────
    describe('clear()', () => {
        it('undo/redo not possible after clear', () => {
            history.addCommand(makeCommand());
            history.clear();
            expect(history.canUndo()).toBe(false);
            expect(history.canRedo()).toBe(false);
        });
    });
});

describe('graphCommandHistory', () => {
    it('graphCommandHistory is created successfully', () => {
        const g = makeGraph();
        const h = graphCommandHistory(g);
        expect(h).toBeDefined();
        expect(typeof h.addCommand).toBe('function');
    });
});

describe('pageCommandHistory', () => {
    it('pageCommandHistory is created successfully', () => {
        const g = makeGraph();
        const h = pageCommandHistory(g);
        expect(h).toBeDefined();
        expect(typeof h.addCommand).toBe('function');
    });
});
