import { Router, type IRouter } from "express";
import healthRouter from "./health";
import royalHelmetRouter from "./royal-helmet";

const router: IRouter = Router();

router.use(healthRouter);
router.use(royalHelmetRouter);

export default router;
