export function downloadFile(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

export const adaptBlockNoteHTML = (html: string) => {
  html = html.replaceAll('<p class="bn-inline-content"></p>', '<br/>');
  html = html.replaceAll(
    /data-text-alignment=\"([a-z]+)\"/g,
    'style="text-align: $1;"',
  );
  html = html.replaceAll(/data-text-color=\"([a-z]+)\"/g, 'style="color: $1;"');
  html = html.replaceAll(
    /data-background-color=\"([a-z]+)\"/g,
    'style="background-color: $1;"',
  );
  return html;
};
