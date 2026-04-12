function createRequestId() {
  return `req_${Math.random().toString(36).slice(2, 10)}`;
}

export function requestContext(req: any, _res: any, next: any) {
  req.requestId = createRequestId();
  next();
}
