/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

Set.prototype.batchAdd = function (...data) {
    data.forEach(d => this.add(d));
}
Set.prototype.batchDelete = function (...data) {
    data.forEach(d => this.delete(d));
};