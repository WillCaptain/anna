/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.elsa.collaboration.aop.annotations;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.util.concurrent.TimeUnit;

/**
 * 接口限流注解。
 *
 * @author 陈镕希
 * @since 2025-07-25
 */
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.METHOD})
@Documented
public @interface TokenLimiter {
    /**
     * 建议不同接口使用不同的令牌桶，id可以为接口的名称
     * 作用：不同的接口，不同的流量控制
     */
    String id() default "";

    /**
     * 每秒访问限额
     */
    double permitsPerSecond();

    /**
     * 获取令牌最大等待时间
     */
    long timeout() default 500;

    /**
     * 获取令牌最大等待时间,单位(例:分钟/秒/毫秒) 默认:毫秒
     */
    TimeUnit timeunit() default TimeUnit.MILLISECONDS;

    /**
     * 错误提示
     */
    String getErrorMsg() default "当前请求过多，请稍后再试.";
}
