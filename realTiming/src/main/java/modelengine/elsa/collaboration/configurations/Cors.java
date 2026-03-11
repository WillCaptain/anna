/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.elsa.collaboration.configurations;

import reactor.core.publisher.Mono;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.web.cors.reactive.CorsUtils;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;

import java.util.List;
import java.util.Objects;

/**
 * 跨域支持。
 *
 * @author 陈镕希
 * @since 2025-07-26
 */
@Configuration
public class Cors {
    private static final String ALLOWED_HEADERS = "*";
    private static final String ALLOWED_METHODS = "*";
    private static final String ALLOWED_EXPOSE = "*";
    private static final String MAX_AGE = "18000L";

    /**
     * 跨域的filter支持
     *
     * @return web的filter
     */
    @Bean
    public WebFilter corsFilter() {
        return (ServerWebExchange ctx, WebFilterChain chain) -> {
            ServerHttpRequest request = ctx.getRequest();
            if (CorsUtils.isCorsRequest(request)) {
                ServerHttpResponse response = ctx.getResponse();
                HttpHeaders headers = response.getHeaders();
                headers.add("Access-Control-Allow-Origin", request.getHeaders().getOrigin());
                headers.add("Access-Control-Allow-Methods", ALLOWED_METHODS);
                headers.add("Access-Control-Max-Age", MAX_AGE);

                // 根据 Access-Control-Request-Headers 来设置 Access-Control-Allow-Headers.
                List<String> requestHeaders = request.getHeaders().get("Access-Control-Request-Headers");
                if (Objects.isNull(requestHeaders) || requestHeaders.isEmpty()) {
                    headers.add("Access-Control-Allow-Headers", ALLOWED_HEADERS);
                } else {
                    headers.add("Access-Control-Allow-Headers", String.join(",", requestHeaders));
                }

                // 给浏览器暴露所有的自定义headers.
                headers.add("Access-Control-Expose-Headers", ALLOWED_EXPOSE);

                // 允许认证.
                headers.add("Access-Control-Allow-Credentials", "true");
                if (request.getMethod() == HttpMethod.OPTIONS) {
                    response.setStatusCode(HttpStatus.OK);
                    return Mono.empty();
                }
            }
            return chain.filter(ctx);
        };
    }
}
