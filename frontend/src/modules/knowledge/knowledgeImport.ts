const PDF_IMPORT_PREFIX = "import:pdf:";

/** 从知识条目 source 字段解析 PDF 本地路径。 */
export function parseKnowledgeImportPdfPath(source: string): string | null {
  if (!source.startsWith(PDF_IMPORT_PREFIX)) {
    return null;
  }
  const path = source.slice(PDF_IMPORT_PREFIX.length).trim();
  return path.length > 0 ? path : null;
}
