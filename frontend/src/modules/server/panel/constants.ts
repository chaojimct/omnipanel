export const SERVER_PATH = "/server";

export const SERVER_VIEW_TABS = ["panel", "terminal"] as const;
export type ServerViewTabId = (typeof SERVER_VIEW_TABS)[number];
