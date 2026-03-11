/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.elsa.collaboration.entities.elsa.commands;

import modelengine.elsa.collaboration.entities.elsa.ElsaSession;
import modelengine.elsa.collaboration.entities.elsa.ElsaTopic;

/**
 * 演示时执行一步的命令
 *
 * @author 陈镕希
 * @since 2025-07-27
 */
public class MovePageStepCommand extends ActionCommand<Integer> {
    public MovePageStepCommand(ElsaTopic<Integer> topic) {
        super(topic.getFrom(), topic);
        topic.setTopic("page_step_moved");
    }

    @Override
    protected void updateSnapShotData(ElsaSession session) throws Exception {
        session.setCurrentPage(this.getTopic().getPage())
                .setCurrentStep(this.getTopic().getValue());
    }
}
