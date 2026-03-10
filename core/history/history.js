/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import { EVENT_TYPE, PAGE_MODE } from "../../common/const.js";
import { uuid } from "../../common/util.js";

/**
 * commandHistory — Undo/Redo 历史管理工厂。
 *
 * 根据 strategy 参数选择不同粒度的历史实现：
 *   'graph'：全局单一历史栈（推荐），跨页操作可统一撤销
 *   'page' ：每页独立历史栈，页面间互不影响
 *
 * @param {'graph'|'page'} strategy 历史策略
 * @param {Graph} graph Graph 对象
 * @return {HistoryObject} 历史管理对象
 */
const commandHistory = (strategy, graph) => {
    switch (strategy) {
        case "graph":
            return graphCommandHistory(graph);
        case "page":
            return pageCommandHistory(graph);
        default:
            break;
    }
  return undefined;
}

/**
 * graphCommandHistory — Graph 级别的全局历史栈（单例，以 graph.id 为 key）。
 *
 * 数据结构：
 *   commands[]：所有 Command 的有序数组
 *   cursor：当前位置游标，-1 表示无可撤销操作
 *
 * Undo 流程：
 *   1. 取出 cursor 位置的 Command
 *   2. 若同 batchNo，继续取，直到 batchNo 不同
 *   3. 若 Command 属于非当前激活页，先 fireEvent 切换页面（await 保证顺序）
 *   4. 执行 command.undo(host)，cursor--
 *
 * Redo 流程与 Undo 相反，cursor 先自增再执行 command.redo。
 */
const graphCommandHistory = (() => {
    // 以 graph.id 为 key 的单例缓存，确保同一 Graph 全局共享同一个历史栈
    let history = {};
    return (graph) => {
        if (history[graph.id]) {
            return history[graph.id];
        }
        const self = {};
        history[graph.id] = self;
        // cursor：指向最近一次可撤销的 Command 的下标，-1 表示栈为空
        self.cursor = -1;
        self.commands = [];

        self.getUndoCommand = () => {
            return self.commands[self.cursor];
        }

        self.getRedoCommand = () => {
            return self.commands[self.cursor];
        }

        /**
         * ctrl-z
         */
        self.undo = async () => {
            if (!self.canUndo()) {
                return;
            }

            graph.inUndo = true;
            try {
                for (let command = self.getUndoCommand(), serialNo = command.batchNo;
                     command && serialNo === command.batchNo;
                     command = self.getUndoCommand()) {
                    const h = command.host;
                    if (h.isPage) {
                        if (h.id !== graph.activePage.id) {
                            /*
                             * 若当前撤销的图形所在页面不是当前激活状态页面，则需先激活图形所在页面（考虑合理性 graph.edit）
                             *
                             * 这里需要变成同步，否则下列情况会出现问题：
                             * 1、页面1中ctrl+x剪切图形并粘贴
                             * 2、切换到页面2
                             * 3、撤销，回到页面1
                             * 4、主画布中图形存在，缩略图中图形不存在
                             * 像这种涉及到页面切换的，并且需要进行invalidateAlone的操作都存在该问题。原因如下：
                             * 若未await，那么在执行到page.take方法时，会调用ignoreInvalidateAsync，里面会把disableInvalidate
                             * 设置为true，此时就不会执行后续了，会回到这里执行command.undo，若undo里面有invalidateAlone()相关操作，
                             * 由于disableInvalidate为true，就不会执行，导致出问题.
                             *
                             * * 注意 *
                             * 这里有一个疑惑的地方，设置属性等操作，在发生切换页面的时候，撤销是没问题的.
                             * 原因是因为在没加await的时候，先执行command，再执行page.take()中的page.active()方法，会调用图形的
                             * invalidateAlone()方法.而删除比较特殊，由于在command中，已经将container设置为空字符串了，所以在active
                             * 执行时，是获取不到该图形对象的，也就无法执行其invalidateAlone了.
                             */
                            await graph.fireEvent({type: EVENT_TYPE.FOCUSED_PAGE_CHANGE, value: h.id});
                        }
                        command.undo(graph.activePage);
                    } else {
                        command.undo(graph);
                    }
                    self.cursor--;
                }
            } finally {
                delete graph.inUndo;
            }
        };

        self.canUndo = () => {
            return self.cursor >= 0;
        }

        /**
         * ctrl-shit-z
         */
        self.redo = async () => {
            if (!self.canRedo()) {
                return;
            }

            graph.inRedo = true;
            self.cursor++;
            try {
                for (let command = self.getRedoCommand(), serialNo = command.batchNo;
                     command && serialNo === command.batchNo;
                     command = self.getRedoCommand()) {
                    self.cursor++;
                    const h = command.host;
                    if (h.isPage) {
                        if (h.id !== graph.activePage.id) {
                            // 若当前撤销的图形所在页面不是当前激活状态页面，则需先激活图形所在页面（考虑合理性 graph.edit）
                            await graph.fireEvent({type: EVENT_TYPE.FOCUSED_PAGE_CHANGE, value: h.id});
                        }
                        command.redo(graph.activePage);
                    } else {
                        command.redo(graph);
                    }
                }
            } catch (e) {
                // 没关系，继续，不影响其他错误信息的处理.
            } finally {
                delete graph.inRedo;
                self.cursor -= 1;
            }
        };

        self.canRedo = () => {
            return self.cursor < self.commands.length - 1;
        }

        /**
         * 将 Command 加入历史栈。
         *
         * 加入前会截断 cursor 之后的所有 Command（新操作使之前的 redo 历史失效）。
         * 若当前 batchNo 不存在，则生成新的 UUID 作为本次批次号，
         * 确保同一次 graph.change() 调用内的所有 Command 共享同一 batchNo。
         *
         * @param command  待加入的 Command 对象
         * @param host     Command 的宿主（Page 或 Graph）
         */
        self.addCommand = (command, host) => {
            if (command.host && command.host.isPage && host && !host.enableHistory()) {
                return;
            }
            // 截断 cursor 之后的"未来"历史（新操作之后不能再 redo）
            while (self.commands.length > self.cursor + 1) {
                self.commands.pop();
            }

            // 批次号：同一 graph.change() 调用内的所有 Command 共享，
            // 确保 Ctrl+Z 时作为整体撤销
            !self.batchNo && (self.batchNo = uuid());
            command.batchNo = self.batchNo;

            self.commands.push(command);
            self.cursor = self.commands.length - 1;
        };

        self.clear = () => {
            self.commands = [];
            self.cursor = -1;
            self.batchNo = null;
        };

        /**
         * 重置批次号，在 graph.change() 开始时调用。
         * 确保不同的 change() 调用不会共享批次号（避免跨操作被合并撤销）。
         */
        self.clearBatchNo = () => {
            self.batchNo && (self.batchNo = null);
        };

        /**
         * 删除最后一个指令.
         *
         * @param type command类型.
         */
        self.removeLastCommand = (type = undefined) => {
            if (type) {
                const index = self.commands.findLastIndex(c => c.type === type);
                if (index !== -1) {
                    self.commands.splice(index, 1);
                }
            } else {
                self.commands.splice(self.commands.length - 1, 1);
            }

            self.cursor = self.commands.length - 1;
        };

        return self;
    }
})();

/**
 * pageCommandHistory — 页面级别独立历史管理。
 *
 * 每个 Page 拥有自己的 commands[]/cursor，互不影响。
 * 适用于多页面需要独立 Undo/Redo 的场景（如多标签编辑器）。
 * 切换页面时不会影响其他页面的历史状态。
 */
const pageCommandHistory = (graph) => {
    const histories = {};
    const self = graphCommandHistory(graph);
    self.getUndoCommand = (host) => {
        const history = histories[host.id];
        return history.commands[history.cursor--];
    }

    self.getRedoCommand = (host) => {
        const history = histories[host.id];
        return history.commands[++history.cursor];
    }

    self.canRedo = (host) => {
        const history = histories[host.id];
        return history.cursor < history.commands.length - 1;
    }

    self.canUndo = (host) => {
        return histories[host.id].cursor >= 0;
    }

    self.addCommand = (command, h) => {
        if (h.isTypeof && h.isTypeof("page") && h.enableHistory()) {
            return;
        }

        const host = command.host;
        let redoUndoChange = self.canRedo(host) || !self.canUndo(host);
        const history = histories[host.id] ? histories[host.id] : { cursor: -1, commands: [] };
        if (history.cursor > -1) {
            while (history.commands.length > history.cursor + 1) {
                history.commands.pop();
            }
        }
        history.commands.push(command);
        history.cursor = history.commands.length - 1;
        if (!host.isTypeof || !host.isTypeof("page")) {
            return;
        }
        if (!redoUndoChange) {
            return;
        }
        host.triggerEvent({
            type: EVENT_TYPE.PAGE_HISTORY, value: {
                page: host.id, undo: true, redo: false
            }
        })
    }
    return self;
}

export { commandHistory, graphCommandHistory, pageCommandHistory };