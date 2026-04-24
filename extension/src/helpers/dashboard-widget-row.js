function syncDashboardWidgetRowMode(row) {
  if (!row) {
    return;
  }

  const visibleChildren = [...row.children].filter((child) => child.nodeType === Node.ELEMENT_NODE);
  row.classList.toggle("iref-dashboard-widget-row-single", visibleChildren.length <= 1);
}

export function ensureDashboardWidgetRow() {
  const scroll = document.querySelector("#scroll");

  if (!scroll) {
    return null;
  }

  const anchor = scroll.querySelector(".dashboard") || scroll.firstElementChild || null;
  const parent = anchor?.parentNode || scroll;

  if (!parent) {
    return null;
  }

  let row = document.querySelector("#iref-dashboard-widget-row");

  if (!row) {
    row = document.createElement("section");
    row.id = "iref-dashboard-widget-row";
    row.className = "iref-dashboard-widget-row";
  }

  if (anchor && row !== anchor.previousSibling) {
    parent.insertBefore(row, anchor);
  } else if (!row.parentNode) {
    parent.prepend(row);
  }

  syncDashboardWidgetRowMode(row);
  queueMicrotask(() => {
    syncDashboardWidgetRowMode(row);
  });
  return row;
}

export function cleanupDashboardWidgetRow() {
  const row = document.querySelector("#iref-dashboard-widget-row");

  if (!row) {
    return;
  }

  if (row.children.length === 0) {
    row.remove();
    return;
  }

  syncDashboardWidgetRowMode(row);
}
