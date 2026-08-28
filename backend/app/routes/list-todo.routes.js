import { Router } from "express";
import todoController from "../controllers/todo.controller.js";
import { authenticate } from "../authorization/authorization.js";

const router = Router({ mergeParams: true });

router.get("/", [authenticate], todoController.findAllForList);
router.post("/", [authenticate], todoController.createForList);

export default router;
