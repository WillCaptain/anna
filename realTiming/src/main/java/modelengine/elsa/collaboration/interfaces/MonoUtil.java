/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.elsa.collaboration.interfaces;

import reactor.core.publisher.Mono;

import java.util.function.Supplier;

/**
 * 构建mono返回值的工具
 *
 * @author 陈镕希
 * @since 2025-07-25
 */
public class MonoUtil {
    public static <T> Mono<T> toMono(Supplier<T> supplier) {
        return Mono.create(sink -> sink.success(supplier.get()));
    }
}
