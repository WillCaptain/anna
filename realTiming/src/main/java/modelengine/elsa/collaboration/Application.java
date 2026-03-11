/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.elsa.collaboration;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * 入口类
 *
 * @author 陈镕希
 * @since 2025-07-25
 */
@SpringBootApplication(scanBasePackages = "modelengine.elsa")
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
