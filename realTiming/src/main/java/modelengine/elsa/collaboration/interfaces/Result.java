/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.elsa.collaboration.interfaces;

import lombok.Data;

/**
 * 结果
 *
 * @author 陈镕希
 * @since 2025-07-25
 */
@Data
public class Result<T> {
    private int code;
    private String message;
    private T data;
    private boolean success;

    public Result(T data) {
        this.data = data;
        this.code = 200;
        this.message = "ok";
        this.success = true;
    }

    /**
     * 默认构造方案
     */
    public Result() {
        this.success = true;
    }
}
