self.onmessage = (e) => {
  self.postMessage({ result: e.data.val * 2 });
};
