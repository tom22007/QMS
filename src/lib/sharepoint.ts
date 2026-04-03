const SHAREPOINT_BASE =
  "https://reesscientific0-my.sharepoint.com/personal/todonnell_reesscientific_com/Documents/Claude%20-%20Rees%20Software%20Validation%20Documents/";

export function getSharePointUrl(folder: string, filename: string): string {
  return `${SHAREPOINT_BASE}${folder}/${encodeURIComponent(filename)}`;
}
