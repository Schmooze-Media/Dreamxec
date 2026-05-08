const AppError = require("../../utils/AppError");

const INDIAN_COLLEGES_API_BASE =
  "https://indian-colleges-list.vercel.app";

/**
 * Fetch institutions/colleges by state and search query
 */
exports.searchColleges = async (req, res, next) => {
  let timeout;

  try {
    const { state, q, limit = 15 } = req.query;

    // Validate input
    if (!state || typeof state !== "string") {
      return next(new AppError("State parameter is required", 400));
    }

    if (!q || typeof q !== "string" || q.trim().length < 3) {
      return next(
        new AppError("Search query must be at least 3 characters", 400)
      );
    }

    // Prevent abuse
    const safeLimit = Math.min(parseInt(limit) || 15, 50);

    const params = new URLSearchParams({
      state: state.trim(),
      q: q.trim(),
      limit: String(safeLimit),
    });

    const controller = new AbortController();
    timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(
      `${INDIAN_COLLEGES_API_BASE}/api/institutions/search?${params.toString()}`,
      {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Dreamxec/1.0 (+http://dreamxec.com; +http://dreamxec.com/contact)",
        },
      }
    );

    // 🔒 Validate response
    if (!response.ok) {
      throw new Error(`External API error: ${response.status}`);
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      throw new Error(`Invalid JSON response: ${text.slice(0, 100)}`);
    }

    const payload = await response.json();

    // Normalize response
    let rawResults = [];

    if (Array.isArray(payload)) {
      rawResults = payload;
    } else if (payload && typeof payload === "object") {
      if (Array.isArray(payload.results)) rawResults = payload.results;
      else if (Array.isArray(payload.data)) rawResults = payload.data;
      else if (Array.isArray(payload.institutions))
        rawResults = payload.institutions;
    }

    const normalizedResults = rawResults
      .filter((item) => item.name || item.institution_name)
      .map((item) => ({
        institution_name: item.name || item.institution_name,
        aicte_id:
          item.id || item.aicte_id
            ? String(item.id || item.aicte_id)
            : undefined,
      }));

    res.json({
      success: true,
      count: normalizedResults.length,
      data: normalizedResults,
    });
  } catch (err) {
    if (err.name === "AbortError") {
      return next(
        new AppError("Request timeout: Colleges search took too long", 504)
      );
    }

    console.error("Colleges search error:", err.message);

    next(
      new AppError(
        err instanceof Error ? err.message : "Failed to fetch colleges",
        500
      )
    );
  } finally {
    if (timeout) clearTimeout(timeout);
  }
};

/**
 * Fetch states list
 */
exports.getStates = async (req, res, next) => {
  let timeout;

  try {
    const controller = new AbortController();
    timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(
      `${INDIAN_COLLEGES_API_BASE}/api/institutions/states`,
      {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Dreamxec/1.0 (+http://dreamxec.com; +http://dreamxec.com/contact)",
        },
      }
    );

    // 🔒 Validate response
    if (!response.ok) {
      throw new Error(`External API error: ${response.status}`);
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      throw new Error(`Invalid JSON response: ${text.slice(0, 100)}`);
    }

    const payload = await response.json();

    // ✅ Normalize → only state names
    const states =
      payload &&
      typeof payload === "object" &&
      Array.isArray(payload.states)
        ? payload.states.map((s) => s.name)
        : [];

    res.json({
      success: true,
      count: states.length,
      data: states,
    });
  } catch (err) {
    if (err.name === "AbortError") {
      return next(
        new AppError("Request timeout: States fetch took too long", 504)
      );
    }

    console.error("States fetch error:", err.message);

    next(
      new AppError(
        err instanceof Error ? err.message : "Failed to fetch states",
        500
      )
    );
  } finally {
    if (timeout) clearTimeout(timeout);
  }
};
