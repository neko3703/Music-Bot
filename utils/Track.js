export default class Track {
  constructor({ title, url, webpageUrl, duration, thumbnail, uploader, requestedBy, httpHeaders }) {
    this.title = title ?? "Unknown title";
    this.url = url;
    this.webpageUrl = webpageUrl ?? "";
    this.duration = duration ?? null;
    this.thumbnail = thumbnail ?? null;
    this.uploader = uploader ?? null;
    this.requestedBy = requestedBy ?? null;
    this.httpHeaders = httpHeaders ?? {};
  }
}