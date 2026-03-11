/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import {graph} from './graph.js';

/**
 * 默认图形容器。
 *
 * 继承自 graph，当前版本不添加任何额外行为。
 * 文字编辑能力由基类 graph.createEditor（nativeTextEditor）提供。
 *
 * 保留此类是为了兼容 annaEntry 中的注册机制和未来可能的扩展。
 */
const defaultGraph = (div, title) => {
  const self = graph(div, title);
  return self;
};

export {defaultGraph};
