/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

/**
 * 默认存储仓库的最小桩实现（内存版，供 demo / 测试使用）。
 * 生产环境应注入真实的持久化实现（通过 ANNA.setRepo）。
 */
export const defaultRepository = () => {
    const store = new Map();

    return {
        /**
         * 获取 Graph 序列化数据.
         */
        getGraph: async (graphId) => {
            return store.get(graphId) || null;
        },

        /**
         * 保存 Graph 序列化数据.
         */
        saveGraph: async (data) => {
            if (data && data.id) {
                store.set(data.id, data);
            }
        },

        /**
         * 获取当前用户 session.
         */
        getSession: async () => {
            return {name: 'Demo User', id: 'demo-user-001'};
        },
    };
};
