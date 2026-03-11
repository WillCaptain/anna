/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.elsa.collaboration.entities.elsa;

import lombok.Getter;

import java.io.Serializable;

/**
 * 自定义键值对
 *
 * @param <K> 键类型
 * @param <V> 值类型
 * @author 陈镕希
 * @since 2025-07-25
 */
public class Pair<K, V> implements Serializable {
    @Getter
    private final K key;

    @Getter
    private final V value;

    public Pair(K key, V value) {
        this.key = key;
        this.value = value;
    }
}
