export default class BlobWorker extends Worker {
  constructor(url, options) {
    const blob = new Blob([`import ${JSON.stringify(url.href)};`], {
      type: 'text/javascript',
    });
    const blobUrl = URL.createObjectURL(blob);
    super(blobUrl, options);
    URL.revokeObjectURL(blobUrl);
  }
}
