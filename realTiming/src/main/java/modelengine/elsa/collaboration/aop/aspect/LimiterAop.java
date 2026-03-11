/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.elsa.collaboration.aop.aspect;

import com.alibaba.fastjson.JSON;
import com.google.common.collect.Maps;
import com.google.common.util.concurrent.RateLimiter;

import lombok.extern.slf4j.Slf4j;
import modelengine.elsa.collaboration.controller.CollaborationController;
import modelengine.elsa.collaboration.interfaces.Result;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Optional;

/**
 * 接口限流注解实现，基于请求数/每秒控制并发。
 *
 * @author 陈镕希
 * @since 2025-07-28
 */
@Slf4j
@Aspect
@Component
@SuppressWarnings("all")
public class LimiterAop {

    public void updateLimit(String key, Double permitsPerSecond) {
        this.limitSettingMap.put(key, permitsPerSecond);
        Optional.ofNullable(this.limitMap.get(key)).ifPresent(limiter -> {
            limiter.setRate(permitsPerSecond);
        });
    }

    /**
     * 不同的接口，不同的流量控制
     * map的key为 Limiter.key
     */
    private final Map<String, RateLimiter> limitMap = Maps.newConcurrentMap();
    private final Map<String, Double> limitSettingMap = Maps.newConcurrentMap();

    @Around("@annotation(modelengine.elsa.collaboration.aop.annotations.TokenLimiter)")
    @SuppressWarnings("all")
    public Object around(ProceedingJoinPoint joinPoint) throws Throwable {
        //        Method method = ((MethodSignature) joinPoint.getSignature()).getMethod();
        //        TokenLimiter limiter = method.getAnnotation(TokenLimiter.class);
        //        if (limiter != null) {
        //            String id = limiter.id();
        //            RateLimiter rateLimiter = this.limitMap.computeIfAbsent(id, key -> {
        //                Double permit = this.limitSettingMap.getOrDefault(key, limiter.permitsPerSecond());
        //                log.info("新建了令牌桶={}，容量={}", id, permit);
        //                return RateLimiter.create(permit);
        //            });
        //            if (rateLimiter.getRate() < 0.1) {
        //                log.info("令牌桶id={}，禁止任何访问", id);
        //                return MonoUtil.toMono(() -> this.limitResult(id, "access forbidden!"));
        //            }
        //            // 拿不到命令，直接返回异常提示
        //            if (!rateLimiter.tryAcquire(limiter.timeout(), limiter.timeunit())) {
        //                log.info("令牌桶id={}，获取令牌失败", id);
        //                return MonoUtil.toMono(() -> this.limitResult(id, limiter.getErrorMsg()));
        //            }
        //        }
        return joinPoint.proceed();
    }

    private Object limitResult(String id, String errorMsg) {
        Result<Object> result = new Result<>();
        result.setCode(500);
        result.setMessage(errorMsg);
        // Todo 此处特殊处理了load graph，是因为返回值类型不同，未来需要提供自定义返回值能力
        return CollaborationController.LOAD_GRAPH.equals(id) ? JSON.toJSONString(result) : result;
    }
}
