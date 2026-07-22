export async function executeServerRender(renderFn, url) {
  return await renderFn(url);
}
