import Store from "../store";
import { hideRowOrColumn, showRowOrColumn } from "../global/api";

const SVG_NS = "http://www.w3.org/2000/svg"
const GROUP_LEVEL_WIDTH = 18; //每一级分组的宽度
const POINT_WIDTH = 12; //折叠点的宽度

//给定起点和终点，绘制线条和相关坐标点的元素
function drawLine(start, end, svgbox,information) {
  const path = document.createElementNS(SVG_NS, "path");
  let path_d = `M${start[0]} ${start[1] + POINT_WIDTH}  
        L${end[0]} ${end[1]}
        M${end[0]} ${end[1]} 
        L${end[0] + 7} ${end[1]}
        `;
  path.setAttribute("d", path_d);
  path.setAttribute("class", "path-class");
    const icon = document.createElementNS(SVG_NS, "path");
    //默认展开，绘制减号
    let isFolded = false;
    let path_d_rect =
        `M${start[0] - POINT_WIDTH / 2 + 2} ${start[1] + POINT_WIDTH / 2} 
         L${start[0] + POINT_WIDTH / 2 - 2} ${start[1] + POINT_WIDTH / 2}`;
  //起始点和终点在同一位置，判定为折叠，添加加号,否则为展开，添加减号
    if (end[1] - start[1] < 3) {
      isFolded = true;
    path_d_rect += `M${start[0]} ${start[1] + 2} 
        L${start[0]} ${start[1] + POINT_WIDTH - 2}`;
  }
  icon.setAttribute("d", path_d_rect);
  icon.setAttribute("class", "icon-class");
  const rect = document.createElementNS(SVG_NS, "rect");
  rect.setAttribute("x", start[0] - POINT_WIDTH / 2);
  rect.setAttribute("y", start[1]);
  rect.setAttribute("width", POINT_WIDTH);
  rect.setAttribute("height", POINT_WIDTH);
  rect.setAttribute("infor", JSON.stringify(information));
  rect.setAttribute("foldstatus", isFolded ? "folded" : "opened");

  !isFolded && svgbox.appendChild(path);
  svgbox.appendChild(icon);
  svgbox.appendChild(rect);
}
//整体绘制
function dragGroupsLine(svgbox, rowGroupData) {
  const top_dis = Store.columnHeaderHeight;
  const row_height_list = Store.visibledatarow;
  const row_hide_list = Store.config["rowhidden"];
    const maxRowIndex = row_height_list.length - 1;
    const currentSheetIndex = Store.currentSheetIndex;
  //单组绘制
  function drawLinItem(group, currentDepth) {
    const start =
      group.startIndex == 0 ? 0 : row_height_list[group.startIndex - 1];
    const end =
      group.endIndex > maxRowIndex
        ? row_height_list[maxRowIndex]
        : row_height_list[group.endIndex - 1];
    let x = (currentDepth - 1) * GROUP_LEVEL_WIDTH + GROUP_LEVEL_WIDTH / 2;
    // let y = top_dis + start - GROUP_LEVEL_WIDTH / 2
    let y1 = top_dis + start;
    let y2 = top_dis + end;
    const startPoint = [x, y1];
    const endPoint = [x, y2];
    // console.log("drawLine", startPoint, endPoint, group);
    drawLine(startPoint, endPoint, svgbox, group);
  }
  function traverseGroups(groups, currentDepth = 1) {
      for (const group of groups) {
          //非当前sheet页的分组跳过
        if(currentSheetIndex != group.sheetOrder){
            continue;
        }
        drawLinItem(group, currentDepth);
        if (group.children && group.children.length > 0) {
            traverseGroups(group.children, currentDepth + 1);
        }
    }
  }
  traverseGroups(rowGroupData);
  // dragLines(rowGroups, svgbox)
}
//执行初始化的隐藏
function executeGroupAction(rowGroupData) {
  for (const group of rowGroupData) {
    if (group.collapsed) {
      Store.currentSheetIndex == group.sheetOrder &&
        hideRowOrColumn("row", group.startIndex, group.endIndex - 1, {
          order: group.sheetOrder,
        });
    } else {
      group.children &&
        group.children.length > 0 &&
        executeGroupAction(group.children);
    }
  }
}
//hideRowOrColumn
export function groupsInitial() {
  const rowGroupData = Store.rowGroups;
  if (!rowGroupData || rowGroupData.length === 0) {
    return;
  }
  console.log("rowGroupData", rowGroupData);
  const svgbox = document.getElementById("row-groups-lines");
  let maxDepth = 0;
  function traverseGroups(groups, currentDepth = 1) {
    // 更新最大深度
        if (currentDepth > maxDepth) {
        maxDepth = currentDepth;
        }
        for (const group of groups) {
        if (group.children && group.children.length > 0) {
            traverseGroups(group.children, currentDepth + 1);
        }
        }
    }
    traverseGroups(rowGroupData);
    Store.rowGroupWidth = maxDepth * GROUP_LEVEL_WIDTH;
    $("#luckysheet-grid-window-1").css(
        "left",
        `${maxDepth * GROUP_LEVEL_WIDTH + 4}px`
    );
    $("#luckysheet-row-groups").css("width", `${maxDepth * GROUP_LEVEL_WIDTH}px`);
    //   $("#luckysheet-row-groups").html("<div>2342342</div>");

    console.log("maxDepth before", maxDepth);

    setTimeout(() => {
        executeGroupAction(rowGroupData);
        console.log("init", Store.visibledatarow, Store.config["rowhidden"]);
        dragGroupsLine(svgbox, rowGroupData, maxDepth);
    }, 1000);
    $("#luckysheet-row-groups").off('click').on("click", "rect", function (e) {
        const infor = JSON.parse($(this).attr("infor"));
        const foldstatus = $(this).attr("foldstatus");
        const startIndex = infor.startIndex;
        const endIndex = infor.endIndex - 1;
        if (foldstatus == "opened") {
            //折叠
            hideRowOrColumn("row", startIndex, endIndex, { order: infor.sheetOrder });
            $(this).attr("foldstatus", "folded");
        } else {
            //展开
            showRowOrColumn("row", startIndex, endIndex, { order: infor.sheetOrder });
            $(this).attr("foldstatus", "opened");
        }
        console.log("click rect", infor);
    });
}
export function updateGroupsDataAndDrawineLines(type) {
  if (type == "update") {
    return;
  } else if (type == "resize") {
    const svgbox = document.getElementById("row-groups-lines");
    $(svgbox).empty();
    const rowGroupData = Store.rowGroups;
    dragGroupsLine(svgbox, rowGroupData);
  }
}
