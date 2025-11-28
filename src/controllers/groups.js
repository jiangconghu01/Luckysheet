import Store from "../store";
import { hideRowOrColumn } from "../global/api";
//hideRowOrColumn
export function groupsInitial() {
  const rowGroupData = Store.rowGroups;
  if (!rowGroupData || rowGroupData.length === 0) {
    return;
  }
  console.log("rowGroupData", rowGroupData);
  let maxDepth = 0;
  const depthWidth = 15;
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
  Store.rowGroupWidth = maxDepth * depthWidth;
  $("#luckysheet-grid-window-1").css("left", `${maxDepth * depthWidth}px`);
  $("#luckysheet-row-groups").css("width", `${maxDepth * depthWidth - 2}px`);
//   $("#luckysheet-row-groups").html("<div>2342342</div>");
  console.log("maxDepth before", maxDepth);
//   setTimeout(() => {
//     hideRowOrColumn("row", 2, 7,{order:0});
//   }, 500);

  return "";
}
