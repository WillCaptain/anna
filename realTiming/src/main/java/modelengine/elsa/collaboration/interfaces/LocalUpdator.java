/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.elsa.collaboration.interfaces;

import modelengine.elsa.entities.Shape;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.BiConsumer;

/**
 * 本地配置更新器。
 *
 * @author 陈镕希
 * @since 2025-07-25
 */
@Component
public class LocalUpdator {
    private static final String UPDATE_FREE_LINES = "update_free_lines";
    private static final String DELETE_FREE_LINES = "delete_free_lines";
    private static final String ADD_FREE_LINES = "add_free_lines";
    private static final String CHANGE_CELL_VALUE = "grid_cell_value_change";
    //    private static final String DELETE_CELL_VALUE = "grid_cell_delete";
    private static final String ADD_COLUMN_BEFORE = "column_add_before";
    private static final String DUPLICATE_COLUMN = "column_duplicate";
    private static final String DELETE_COLUMN = "column_delete";
    private static final String ADD_COLUMN_AFTER = "column_add_after";
    private static final String ADD_ROW_BEFORE = "row_add_before";
    private static final String ADD_ROW_AFTER = "row_add_after";
    private static final String DUPLICATE_ROW = "row_duplicate";
    private static final String DELETE_ROW = "row_delete";
    private static final String UPDATE_COLUMN = "column_change";
    private static final String UPDATE_ROW = "row_change";
    private static final String BATCH_ACTIONS = "actions";

    private final Map<String, BiConsumer<Shape, Map<String, Object>>> handlers = new HashMap<>();
    /**
     * 手写线的移动，resize，rotate保存变动
     */
    private final BiConsumer<Shape, Map<String, Object>> updateFreeLines = (freeLine, local) -> {
        List<Map<String, Object>> newLines = (List<Map<String, Object>>) local.get("lines");
        List<Map<String, Object>> lines = (List<Map<String, Object>>) freeLine.get("lines");
        newLines.forEach(line -> {
            Optional<Map<String, Object>> possibleLine = lines.stream().filter(l -> l.get("id").equals(line.get("id"))).findFirst();
            if (!possibleLine.isPresent()) return;
            Map<String, Object> confirmedLine = possibleLine.get();
            confirmedLine.put("points", line.get("points"));
            confirmedLine.put("bound", line.get("bound"));
            confirmedLine.put("delta", line.get("delta"));
            confirmedLine.put("scale", line.get("scale"));
            confirmedLine.put("rotate", line.get("rotate"));
        });
    };

    /**
     * 精确保存手写线的删除
     * *************注意，手写线的擦除会分拆lines，所以整体替换freeline.lines，而不是精确替换************
     */
    private final BiConsumer<Shape, Map<String, Object>> deleteFreeLines = (freeLine, local) -> {
        List<Map<String, Object>> newLines = (List<Map<String, Object>>) local.get("lines");
        List<Map<String, Object>> lines = (List<Map<String, Object>>) freeLine.get("lines");
        lines.removeIf((l -> newLines.stream().anyMatch(l1 -> l1.get("id").equals(l.get("id")))));
    };

    /**
     * 精确保存新增的手写线
     * 这里主要是删除线后的undo新增
     * 手写新增在FreeLineDoneCommand里做了处理
     */
    private final BiConsumer<Shape, Map<String, Object>> addFreeLines = (freeLine, local) -> {
        List<Map<String, Object>> newLines = (List<Map<String, Object>>) local.get("lines");
        List<Map<String, Object>> lines = (List<Map<String, Object>>) freeLine.get("lines");
        if (lines == null) {
            lines = new ArrayList();
            freeLine.set("lines", lines);
        }
        final List<Map<String, Object>> lines1 = lines;
        newLines.forEach(l -> lines1.add(l));
    };


    private final BiConsumer<Shape, Map<String, Object>> changeCellValue = (grid, local) -> {
        List<Map<String, Object>> cells = (List<Map<String, Object>>) grid.get("cells");
        ((List<Map<String, Object>>) local.get("cells")).forEach(c_input -> {
            Optional<Map<String, Object>> possibleCell = cells.stream().filter(c -> c.get("r").equals(c_input.get("r")) && c.get("c").equals(c_input.get("c"))).findFirst();
            Map<String, Object> confirmedCell;
            if (possibleCell.isPresent()) {
                confirmedCell = possibleCell.get();
                confirmedCell.remove("dv");
            }else {
                confirmedCell = new HashMap<>();
                cells.add(confirmedCell);
            }
            if(c_input.get("delete")!=null && (Boolean)c_input.get("delete")){
                cells.remove(confirmedCell);
            }else {
                c_input.forEach((key, value) -> {
                    if (key.indexOf("pre-") == 0) return;
                    //                if(key.equals("dv")) return;
                    if(value.equals("")) confirmedCell.remove(key);
                    else confirmedCell.put(key, value);
                });
            }

        });
    };

    private final BiConsumer<Shape, Map<String, Object>> addColumnBefore = (grid, local) -> {
        final Map<String, Map<String, Object>> columns = (Map<String, Map<String, Object>>) grid.get("columns");
        this.newColumns(grid, local, (colId, column) -> columns.remove(colId), null);

    };

    private final BiConsumer<Shape, Map<String, Object>> addColumnAfter = (grid, local) -> {
        Integer from = (Integer) local.get("from");
        Integer steps = (Integer) local.get("steps");
        Map<String,Object> l =new HashMap<>();
        l.put("from",from+steps);
        l.put("steps",steps);
        this.addColumnBefore.accept(grid, l);
    };

    private void newColumns(Shape grid, Map<String, Object> local, BiConsumer<String, Map<String, Object>> colAction, BiConsumer<Integer, Map<String, Object>> cellAction) {
        List<Map<String, Object>> cells = (List<Map<String, Object>>) grid.get("cells");
        Map<String, Map<String, Object>> columns = (Map<String, Map<String, Object>>) grid.get("columns");
        Integer from = (Integer) local.get("from");
        Integer steps = (Integer) local.get("steps");
        List<String> colIds = new ArrayList<>();
        columns.keySet().forEach(id -> colIds.add(id));
        colIds.sort((a, b) -> Integer.valueOf(b) - Integer.valueOf(a));
        colIds.forEach(colId -> {
            Integer cid = Integer.valueOf(colId);
            if (cid < from) return;
            Map<String, Object> column = columns.get(colId);
            columns.put(String.valueOf(cid + steps), column);
            //            columns.remove(colId);
            if (colAction != null && cid < from + steps) colAction.accept(colId, column);
        });
        cells.forEach(cell -> {
            Integer colId = Integer.valueOf(cell.get("c").toString());
            if (colId < from) return;
            cell.put("c", colId + steps);
            if (cellAction != null && colId < from + steps) cellAction.accept(colId, cell);
        });
    }

    private final BiConsumer<Shape, Map<String, Object>> duplicateColumn = (grid, local) -> {
        final Map<String, Map<String, Object>> columns = (Map<String, Map<String, Object>>) grid.get("columns");
        final List<Map<String, Object>> cells = (List<Map<String, Object>>) grid.get("cells");
        final List<Map<String, Object>> changed = new ArrayList<>();
        this.newColumns(grid, local, (colId, column) -> {
            Map<String, Object> colon = new HashMap<>();
            column.forEach((key, value) -> colon.put(key, value));
            columns.put(colId, colon);

        }, (colId, cell) -> {
            Map<String, Object> colon = new HashMap<>();
            cell.forEach((key, value) -> colon.put(key, value));
            colon.put("c", colId);
            changed.add(colon);
        });
        cells.addAll(changed);
    };

    private final BiConsumer<Shape, Map<String, Object>> deleteColumn = (grid, local) -> {
        final Map<String, Map<String, Object>> columns = (Map<String, Map<String, Object>>) grid.get("columns");
        final List<Map<String, Object>> cells = (List<Map<String, Object>>) grid.get("cells");
        Integer from = (Integer) local.get("from");
        Integer steps = (Integer) local.get("steps");

        for (Integer i = from; i < from + steps; i++) {
            columns.remove(String.valueOf(i));
        }

        final List<Map<String, Object>> removed = new ArrayList<>();
        cells.forEach(cell -> {
            Integer colId = (Integer) cell.get("c");
            if (colId >= from && colId < from + steps) removed.add(cell);
            if (colId >= from + steps) cell.put("c", colId - steps);
        });
        removed.forEach(cell->cells.remove(cell));
    };

    private void newRows(Shape grid, Map<String, Object> local, BiConsumer<String, Map<String, Object>> rowAction, BiConsumer<Integer, Map<String, Object>> cellAction) {
        List<Map<String, Object>> cells = (List<Map<String, Object>>) grid.get("cells");
        Map<String, Map<String, Object>> rows = (Map<String, Map<String, Object>>) grid.get("rows");
        Integer from = (Integer) local.get("from");
        Integer steps = (Integer) local.get("steps");
        List<String> rowIds = new ArrayList<>();
        rows.keySet().forEach(id -> rowIds.add(id));
        rowIds.forEach(rowId -> {
            Integer rId = Integer.valueOf(rowId);
            if (rId < from) return;
            Map<String, Object> row = rows.get(rowId);
            rows.put(String.valueOf(rId + steps), row);
            //            rows.remove(rowId);
            if (rowAction != null && rId < from + steps) rowAction.accept(rowId, row);
        });
        cells.forEach(cell -> {
            Integer rowId = Integer.valueOf(cell.get("r").toString());
            if (rowId < from) return;
            cell.put("r", rowId + steps);
            if (cellAction != null && rowId < from + steps) cellAction.accept(rowId, cell);
        });
    }

    private final BiConsumer<Shape, Map<String, Object>> addRowBefore = (grid, local) -> {
        final Map<String, Map<String, Object>> rows = (Map<String, Map<String, Object>>) grid.get("rows");
        this.newRows(grid, local, (rowId, row) -> rows.remove(rowId), null);
    };

    private final BiConsumer<Shape, Map<String, Object>> addRowAfter = (grid, local) -> {
        Integer from = (Integer) local.get("from");
        Integer steps = (Integer) local.get("steps");
        Map<String,Object> l =new HashMap<>();
        l.put("from",from+steps);
        l.put("steps",steps);
        this.addRowBefore.accept(grid, l);
    };

    private final BiConsumer<Shape, Map<String, Object>> duplicateRow = (grid, local) -> {
        final Map<String, Map<String, Object>> rows = (Map<String, Map<String, Object>>) grid.get("rows");
        List<Map<String, Object>> cells = (List<Map<String, Object>>) grid.get("cells");
        final List<Map<String, Object>> changed = new ArrayList<>();
        this.newRows(grid, local, (rowId, row) -> {
            Map<String, Object> colon = new HashMap<>();
            row.forEach((key, value) -> colon.put(key, value));
            rows.put(rowId, colon);

        }, (rowId, cell) -> {
            Map<String, Object> colon = new HashMap<>();
            cell.forEach((key, value) -> colon.put(key, value));
            colon.put("r", rowId);
            changed.add(colon);
        });
        cells.addAll(changed);
    };

    private final BiConsumer<Shape, Map<String, Object>> deleteRow = (grid, local) -> {
        final Map<String, Map<String, Object>> rows = (Map<String, Map<String, Object>>) grid.get("rows");
        final List<Map<String, Object>> cells = (List<Map<String, Object>>) grid.get("cells");
        Integer from = (Integer) local.get("from");
        Integer steps = (Integer) local.get("steps");

        for (Integer i = from; i < from + steps; i++) {
            rows.remove(String.valueOf(i));
        }

        final List<Map<String, Object>> removed = new ArrayList<>();
        cells.forEach(cell -> {
            Integer rowId = (Integer) cell.get("r");
            if (rowId >= from && rowId < from + steps) removed.add(cell);
            if (rowId >= from + steps) cell.put("r", rowId - steps);
        });
        removed.forEach(cell->cells.remove(cell));
    };

    private final BiConsumer<Shape, Map<String, Object>> updateColumn = (grid, local) -> {
        final Map<String, Map<String, Object>> columns = (Map<String, Map<String, Object>>) grid.get("columns");
        ((List<Map<String, Object>>)local.get("columns")).forEach(col->{
            Integer cid = (Integer) col.get("c");
            if(columns.get(cid.toString())==null) {
                columns.put(cid.toString(),new HashMap<>());
            }
            Map<String, Object> column = columns.get(cid.toString());
            col.forEach((key,value)->{
                if(key.equals("c")) return;
                column.put(key,value);
            });
        });
    };

    private final BiConsumer<Shape, Map<String, Object>> updateRow = (grid, local) -> {
        final Map<String, Map<String, Object>> rows = (Map<String, Map<String, Object>>) grid.get("rows");
        ((List<Map<String, Object>>)local.get("rows")).forEach(r->{
            Integer rid = (Integer) r.get("r");
            if(rows.get(rid.toString())==null){
                rows.put(rid.toString(),new HashMap<>());
            }
            Map<String, Object> row = rows.get(rid.toString());

            r.forEach((key,value)->{
                if(key.equals("r")) return;
                row.put(key,value);
            });
        });
    };

    private final BiConsumer<Shape, Map<String, Object>> batchActions = (shape, local) -> {
        List<Map<String,Object>> actions = (List<Map<String, Object>>) local.get("actions");
        actions.forEach(action->{
            this.handlers.get(action.get("action")).accept(shape, action);
        });

    };

    public LocalUpdator() {
        //        this.handlers = new HashMap<>();
        this.handlers.put(BATCH_ACTIONS, this.batchActions);
        this.handlers.put(UPDATE_FREE_LINES, this.updateFreeLines);
        this.handlers.put(DELETE_FREE_LINES, this.deleteFreeLines);
        this.handlers.put(ADD_FREE_LINES, this.addFreeLines);
        this.handlers.put(CHANGE_CELL_VALUE, this.changeCellValue);
        this.handlers.put(ADD_COLUMN_BEFORE, this.addColumnBefore);
        this.handlers.put(ADD_COLUMN_AFTER, this.addColumnAfter);
        this.handlers.put(DUPLICATE_COLUMN, this.duplicateColumn);
        this.handlers.put(DELETE_COLUMN, this.deleteColumn);
        this.handlers.put(ADD_ROW_BEFORE, this.addRowBefore);
        this.handlers.put(ADD_ROW_AFTER, this.addRowAfter);
        this.handlers.put(DUPLICATE_ROW, this.duplicateRow);
        this.handlers.put(DELETE_ROW, this.deleteRow);
        this.handlers.put(UPDATE_COLUMN, this.updateColumn);
        this.handlers.put(UPDATE_ROW, this.updateRow);

    }

    public void handle(Shape shape, Map<String, Object> local) {
        BiConsumer<Shape, Map<String, Object>> handler = this.handlers.get(local.get("action"));
        if (handler == null) return;
        handler.accept(shape, local);
    }
}
