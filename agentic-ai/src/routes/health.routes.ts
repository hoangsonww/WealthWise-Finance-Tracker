import { Router, Request, Response } from "express";

export function createHealthRoutes(): Router {
  const router = Router();

  router.get("/health", (_req: Request, res: Response) => {
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      mcpConnected: true,
    });
  });

  return router;
}
