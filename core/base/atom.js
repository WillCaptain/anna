/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import {shapeFields} from "./shapeFields.js";
import {MODE_MANAGER} from "../../common/mode/modeManager.js";

/**
 * 序列化字段集合的单例缓存工厂。
 *
 * 每种 shape 类型（如 'rectangle'）的序列化字段集合只计算一次并缓存，
 * 避免每个 Shape 实例都持有一份独立的字段列表（内存浪费）。
 *
 * 字段集合的构建规则：
 *   1. 若存在父类型（typeChain.parent），从父类字段集合复制（继承）
 *   2. 从 shapeFields.get(type) 获取本类型额外字段列表
 *   3. 若该列表有 .delete 属性：
 *      - delete.length > 0：批量移除指定的继承字段
 *      - delete.length === 0：清空所有继承字段（完全重定义）
 *   4. 将本类型字段批量加入集合
 */
const getSerializedFields = (() => {
    const types = {};
    return (shape, type) => {
        let fields = types[type];
        if (fields === undefined) {
            if (shape.typeChain.parent) {
                fields = new Set(types[shape.typeChain.parent.type]);
            } else {
                fields = new Set();
            }
            const myFields = shapeFields.get(type)
            if (myFields.delete) {
                if (myFields.delete.length > 0) {
                    fields.batchDelete.apply(fields, myFields.delete);
                } else {
                    fields.clear();
                }
            }
            fields.batchAdd.apply(fields, myFields);
            types[type] = fields;
        }
        return fields;
    }
})();

/**
 * Atom — 所有 Shape 的根基类
 *
 * 核心机制：通过 ES6 Proxy 拦截属性的 get/set，实现以下能力：
 *
 * 1. 序列化字段透明存储
 *    - 属于 serializedFields 的属性，值实际存储在 _data 对象中
 *    - 通过 Proxy 对外透明访问，使用者无需感知 _data 的存在
 *
 * 2. 属性监听（Detection）
 *    - addDetection(props[], react) 注册监听器
 *    - 属性 set 时触发对应的 react(propKey, value, preValue) 回调
 *    - 有 inReacting 防重入保护，避免监听回调中触发自身导致无限循环
 *    - page.disableReact 为 true 时跳过所有监听（批量操作时用于提升性能）
 *
 * 3. 模式方法覆盖（ModeManager 集成）
 *    - 设置 type 时（handleTypeSet），将当前页面模式下该类型的覆盖方法写入 target
 *    - 设置函数属性时（handleFunctionSet），检查是否有模式覆盖，有则替换
 *    - get 方法时检查 forbiddenMethods，若被禁用则返回空函数
 *
 * 4. typeChain 继承链维护
 *    - 每次 type 赋值时，旧类型被追加为 parent，形成单向链表
 *    - 同时触发 serializedFields 的重新计算（getSerializedFields）
 */
class Atom {
    constructor(detections = []) {
        let defaultDetections = [];

        // 内置的 type 属性监听：每次 type 变化时维护 typeChain 和 serializedFields
        defaultDetections.push({
            props: new Set(["type"]), react: async function (property, value, preValue, target) {
                let parentChain = target.typeChain;
                // 将当前类型追加到继承链尾部
                target.typeChain = {
                    parent: parentChain, type: value
                };
                (!target._data) && (target._data = {});
                // displayType 用于 reference 等特殊形状：序列化字段以 displayType 为准，而 type 用于渲染
                target.serializedFields = getSerializedFields(target, (target.displayType ? target.displayType : value));

                // 包装 batchAdd，在字段加入 serializedFields 时，同步将 target 上已有的同名值迁移到 _data
                // 这确保子类在设置 type 之前已赋值的属性不会丢失
                const batchAdd = target.serializedFields.batchAdd;
                target.serializedFields.batchAdd = (...fields) => {
                    batchAdd.apply(target.serializedFields, fields);
                    fields.forEach(field => {
                        const value = target[field];
                        if (typeof value === "function") {
                            throw new Error("Function field[" + field + "] can't serialize.");
                        }
                        if (value) {
                            target._data[field] = value;
                            delete target[field];
                        }
                    });
                };
            }
        });

        // 遍历 detections 数组，触发监听了 propKey 的所有监听器
        let reactDetection = (detections, propKey, value, preValue, target) => {
            detections.forEach(detection => {
                if (detection.props.has(propKey)) {
                    detection.react(propKey, value, preValue, target);
                }
            });
        };

        /**
         * Proxy 是 Atom 的核心，所有属性读写都经过这里。
         *
         * set 流程：
         *   1. 若值为 Function → 检查 ModeManager 模式覆盖（handleFunctionSet）
         *   2. 若 propKey 为 "type" → 触发 ModeManager 覆盖方法注入（handleTypeSet）
         *   3. 触发 defaultDetections（type 监听，维护 typeChain + serializedFields）
         *   4. 将值存入 _data（serializedFields 中）或 target（普通属性）
         *   5. 触发自定义 detections（shape 内通过 addDetection 注册的监听）
         *   6. 触发 propertyChanged 回调（可被子类覆盖）
         *
         * get 流程：
         *   1. 若属于 serializedFields → 从 _data 读取
         *   2. 若为非函数普通属性 → 通过 propertyGet 读取（支持继承 page/graph 属性）
         *   3. 若为函数 → 检查当前模式下是否被 forbiddenMethods 禁用，是则返回空函数
         */
        const proxy = new Proxy({}, {
            set: function (target, propKey, value, receiver) {
                if (value instanceof Function) {
                    return handleFunctionSet(target, propKey, receiver, proxy, value);
                }

                if (propKey === "type") {
                    handleTypeSet(target, value, proxy);
                }

                let preValue = target[propKey];
                let set = target.set ? target.set(propKey, value) : undefined;
                if (preValue === undefined) {
                    preValue = (target._data ? target._data[propKey] : undefined);
                }
                reactDetection(defaultDetections, propKey, value, preValue, target);
                if (target.serializedFields && target.serializedFields.has(propKey)) {
                    // 序列化字段存入 _data，并删除 target 上的同名直接属性
                    target._data[propKey] = set ? set : value;
                    delete target[propKey];
                } else {
                    target[propKey] = set ? set : value;
                }
                reactDetection(detections, propKey, value, preValue, target);
                const isValidKey = propKey !== "inReacting" &&
                    propKey !== "propertyChanged" &&
                    propKey !== "changeIgnored";
                if (!target.changeIgnored && target.propertyChanged && isValidKey) {
                    target.propertyChanged(propKey, value, preValue);
                }
                return true;
            },
            get: function (target, propKey, receiver) {
                if (target.serializedFields && target.serializedFields.has(propKey)) {
                    return target.get ? target.get(propKey) : target._data[propKey];
                }
                const value = target[propKey];
                if (value === undefined) {
                    return undefined;
                }
                if (typeof value !== 'function') {
                    // 非函数属性：走 propertyGet，子类可覆盖以实现属性继承（如从 page/graph 读取默认值）
                    return target.propertyGet(target, propKey);
                }
                // 函数属性：检查当前模式是否禁用了该方法（forbiddenMethods）
                let currentMode = target.page.mode;
                let chain = target.typeChain;
                while (chain != null) {
                    let forbiddenMethods = MODE_MANAGER[currentMode].forbiddenMethods[chain.type];
                    if (forbiddenMethods && forbiddenMethods.indexOf(propKey) !== -1) {
                        return () => {};
                    }
                    chain = chain.parent;
                }
                return value;
            }
        });

        // 默认 propertyGet：直接返回 target 上的值
        proxy.propertyGet = (target, property) => {
            return target[property];
        }

        /**
         * 临时忽略 propertyChanged 回调的包装方法，
         * 适用于内部批量更新时不希望触发外部监听的场景。
         */
        proxy.ignoreChange = (ops) => {
            proxy.changeIgnored = true;
            ops();
            delete proxy.changeIgnored;
        };

        /**
         * 注册属性监听器。
         *
         * @param {string[]} props   监听的属性名列表
         * @param {function} react   回调，签名：(property, value, preValue) => void
         *
         * 注意：
         *   - page.disableReact 为 true 时不触发（批量操作优化）
         *   - inReacting 防重入，避免回调中又触发自身的监听
         *   - 回调中的异常会被捕获忽略（不影响其他监听器执行）
         */
        proxy.addDetection = (props, react) => {
            detections.push({
                props: new Set(props), react: async function (property, value, preValue) {
                    if (proxy.page === undefined || proxy.page.disableReact) {
                        return;
                    }
                    if (proxy.inReacting) {
                        return;
                    }
                    proxy.inReacting = true;
                    try {
                        react(property, value, preValue);
                    } catch (e) {
                        // 监听器内的异常不影响其他处理流程
                    } finally {
                        proxy.inReacting = false;
                    }
                }
            });
        };

        // propertyChanged 可被外部覆盖，用于监听所有属性变化（如协同广播）
        proxy.propertyChanged = (property, value, preValue) => {
        };

        return proxy;
    };
}

/**
 * 处理 set 时值为 Function 的情况（模式覆盖注入）。
 *
 * 背景：MODE_MANAGER 允许为特定模式下的特定类型注册覆盖方法。
 * 当子类（如 rectangle）设置某方法时（如 self.foo = () => {...}），
 * 若当前模式已为该类型注册了 overrideMethod['foo']，则用覆盖方法替换原方法。
 *
 * 特殊处理 'shape' 基类：
 * - shape 基类的 type 在设置时 page 尚未赋值，handleTypeSet 无法处理
 * - 因此在函数 set 时再做一次补充处理
 *
 * @param target   Proxy 内部对象
 * @param propKey  属性名
 * @param receiver Proxy 外部对象（可访问到正确的 type）
 * @param proxy    Proxy 对象本身（传给覆盖方法作为 this）
 * @param value    原始函数值
 */
const handleFunctionSet = (target, propKey, receiver, proxy, value) => {
    if (target.typeChain && target.typeChain.type) {
        let overrideMethods = MODE_MANAGER[target.page.mode].overrideMethods[target.typeChain.type];
        if (overrideMethods && overrideMethods[propKey]) {
            if (receiver.type === "shape") {
                target[propKey] = (...args) => {
                    return overrideMethods[propKey](proxy, ...args);
                }
            }
            return true;
        }
    }
    target[propKey] = value;
    return true;
};

/**
 * 处理 type 属性 set 时的模式覆盖方法批量注入（step2）。
 *
 * 当 type 被赋值时，从 MODE_MANAGER 中查找当前模式下该类型的所有 overrideMethods，
 * 并一次性写入 target，使得后续的 get 直接返回覆盖版本。
 *
 * 注意：shape 基类在 type 设置时 page 尚未赋值，此处会跳过，由 handleFunctionSet 补充处理。
 */
const handleTypeSet = (target, value, proxy) => {
    if (target.page && target.page.mode) {
        const overrideMethods = MODE_MANAGER[target.page.mode].overrideMethods[value];
        overrideMethods && Object.keys(overrideMethods).forEach(k => {
            target[k] = (...args) => {
                return overrideMethods[k](proxy, ...args);
            };
        });
    }
};

export { Atom };
