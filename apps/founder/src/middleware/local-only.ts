import type { NextFunction, Request, Response } from 'express';

function isLoopbackAddress(address: string | undefined): boolean {
  if (!address) {
    return false;
  }

  return (
    address === '127.0.0.1' ||
    address === '::1' ||
    address === '::ffff:127.0.0.1' ||
    address === 'localhost'
  );
}

export function localOnlyMiddleware(req: Request, res: Response, next: NextFunction): void {
  const remoteAddress = req.socket.remoteAddress;

  if (isLoopbackAddress(remoteAddress)) {
    next();
    return;
  }

  res.status(403).json({
    success: false,
    error: {
      code: 'FORBIDDEN',
      message: 'Founder dashboard is localhost-only',
      status: 403,
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
}
