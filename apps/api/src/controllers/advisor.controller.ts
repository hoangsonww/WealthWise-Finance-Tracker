import { Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler";
import * as advisorService from "../services/advisor.service";

export const chat = asyncHandler(async (req: Request, res: Response) => {
  const result = await advisorService.chat(req.userId!, req.body);

  res.status(200).json({
    success: true,
    data: result,
  });
});
