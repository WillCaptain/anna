/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.elsa.collaboration.entities.elsa;

import modelengine.elsa.collaboration.entities.base.Session;
import modelengine.elsa.collaboration.entities.base.SessionRepo;

import org.springframework.stereotype.Component;

/**
 * 默认的session repo实现
 *
 * @author 陈镕希
 * @since 2025-07-26
 */
@Component
public class ElsaSessionRepo implements SessionRepo {
    @Override
    public void save(Session session) {

    }
}
