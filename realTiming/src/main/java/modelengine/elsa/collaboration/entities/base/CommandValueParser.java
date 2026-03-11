/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.elsa.collaboration.entities.base;

/**
 * 属性转换器
 * propertyCommand中传递的value需要不同的转换器转换value
 *
 * @author 陈镕希
 * @since 2025-07-25
 */
public interface CommandValueParser {
    Object parse(Object preValue, Object commandValue);
}
