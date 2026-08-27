import { Router } from "express";
import authRoutes from "./auth.routes.js";
import { authenticate } from "../authorization/authorization.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

router.use("/", authRoutes);

// Feature 1 Gherkin: authenticated GET /todo/lists returns 200 + caller-scoped array.
// Full list CRUD is Feature 2; this stub returns no lists yet.
router.get("/lists", [authenticate], (_req, res) => {
  res.send([]);
});

export default router;
