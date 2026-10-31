// The A4 page size and the print-media reset for a result sheet. `@page` and
// `@media print` cannot be written as Tailwind utilities, so the templates
// inject this string in a <style> tag that exists only while a sheet is
// mounted. Every template uses it.

export const PRINT_STYLES = `
  @page { size: A4 portrait; margin: 0; }
  @media print {
    html, body { background: white; }
    .result-page { box-shadow: none !important; margin: 0 !important; }
  }
`;
