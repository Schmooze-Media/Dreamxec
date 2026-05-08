const express = require("express");
const collegesController = require("./colleges.controller");

const router = express.Router();

/**
 * GET /api/colleges/search?state=<state>&q=<query>&limit=<limit>
 * Search colleges/institutions by state and query
 */
router.get("/search", collegesController.searchColleges);

/**
 * GET /api/colleges/states
 * Fetch list of all states
 */
router.get("/states", collegesController.getStates);

module.exports = router;
