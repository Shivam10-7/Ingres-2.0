/**
 * API Routes
 * Defines all API endpoints for the INGRES backend
 */

import express from "express";
import { validateQuickQuery, validateDropdownQuery } from "./middleware/validation.js";
import * as quickQueryController from "../controllers/quickQuery.controller.js";
import * as dropdownController from "../controllers/dropdown.controller.js";

const router = express.Router();

/**
 * Quick Query Endpoints
 */
router.post("/quick-query", validateQuickQuery, quickQueryController.submitQuickQuery);
router.get("/quick-query/health", quickQueryController.healthCheck);
router.post("/quick-query/cache/clear", quickQueryController.clearCache);

/**
 * Dropdown Endpoints
 */
router.get("/dropdowns/states", dropdownController.getStates);
router.get(
  "/dropdowns/districts",
  validateDropdownQuery,
  dropdownController.getDistricts
);
router.get(
  "/dropdowns/blocks",
  validateDropdownQuery,
  dropdownController.getBlocks
);
router.get("/dropdowns/years", dropdownController.getYears);
router.get("/dropdowns/all", dropdownController.getAllDropdowns);

// Reverse lookup endpoints
router.get("/dropdowns/states-for-district", dropdownController.getStatesForDistrict);
router.get("/dropdowns/districts-for-block", dropdownController.getDistrictsForBlock);
router.get("/dropdowns/states-for-block", dropdownController.getStatesForBlock);

export default router;
