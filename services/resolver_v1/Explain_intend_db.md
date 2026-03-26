# JalSathi — Intent Reference Guide

This document explains every intent code used in `intent_db.json` and `resolver_v1.py`.
Use this as a quick reference when writing query handlers, SQL mappers, or response generators.

---

## How Intents Are Structured

Intents are grouped into 4 categories. The resolver picks **one intent per group** per query,
except in the `metric` group where two can fire simultaneously (e.g. `recharge + extraction`).

```
metric     → WHAT data the user wants
operation  → HOW the user wants it processed
status     → WHICH category/zone the user is filtering by
general    → Non-data conversational queries
```

Multiple intents fire together. Example:

> "list over exploited districts in Punjab with lowest recharge"
> → `ranking` (operation) + `status_overexploited` (status) + `recharge` (metric) + `lowest` (operation)

---

## Group: `metric` — What data is being requested

| Intent Code    | Meaning                                              | Example Query                                 |
|----------------|------------------------------------------------------|-----------------------------------------------|
| `extraction`   | How much groundwater is being pumped/withdrawn       | "water extraction in Nagpur"                  |
| `recharge`     | How much water is being replenished into the aquifer | "recharge rate in Pune district"              |
| `water_level`  | Depth of water table below ground surface            | "groundwater level in Amravati"               |
| `availability` | Total usable groundwater present in a region         | "how much water is available in Vidarbha"     |
| `balance`      | Net difference between recharge and extraction       | "water balance in Maharashtra"                |
| `quality`      | Contamination, pollution, or drinking safety of water| "is groundwater in Latur safe for drinking"   |

> **Note for SQL mapping:** Each metric maps to a specific column in the groundwater dataset.
> Always pair a `metric` intent with a `location` to form a valid query.

---

## Group: `operation` — How to process or present the data

| Intent Code  | Meaning                                                    | Example Query                                          |
|--------------|------------------------------------------------------------|--------------------------------------------------------|
| `comparison` | Compare metric values across two or more locations         | "compare extraction in Pune and Nagpur"                |
| `highest`    | Return the single maximum value or top-ranked location     | "which district has highest recharge in Maharashtra"   |
| `lowest`     | Return the single minimum value or bottom-ranked location  | "district with lowest water level in Punjab"           |
| `ranking`    | Return an ordered list of multiple locations               | "list all districts in Punjab by extraction"           |
| `trend`      | Show how a metric has changed over multiple years          | "water level trend in Nagpur over the years"           |
| `forecast`   | Predict or project future values of a metric               | "forecast groundwater level in Pune for next year"     |

> **Note:** `highest` / `lowest` return **one** result. `ranking` returns **a list**.
> `comparison` requires **two or more locations** in the query — validate this before querying.

---

## Group: `status` — Groundwater zone/category filter

These intents filter data by the official CGWB assessment category of a region.
They do **not** represent a data column — they represent a **WHERE clause filter**.

| Intent Code             | CGWB Category      | Meaning                                                        | Example Query                                      |
|-------------------------|--------------------|----------------------------------------------------------------|----------------------------------------------------|
| `status_safe`           | Safe               | Extraction is well within recharge limits, no stress           | "show safe districts in Rajasthan"                 |
| `status_semi_critical`  | Semi-Critical      | Extraction is 70–90% of recharge, approaching stress           | "semi critical blocks in Haryana"                  |
| `status_critical`       | Critical           | Extraction is 90–100% of recharge, high risk                   | "critical zones in UP"                             |
| `status_overexploited`  | Over-Exploited     | Extraction exceeds recharge, aquifer is depleting              | "list over exploited districts in Punjab"          |

> **Note:** A query can have both a `status_*` intent and a `metric` intent together.
> Example: "lowest recharge in over exploited districts" → `status_overexploited + recharge + lowest`

---

## Group: `general` — Conversational / non-data queries

| Intent Code | Meaning                                              | Example Query                  |
|-------------|------------------------------------------------------|--------------------------------|
| `greeting`  | User is starting a conversation or asking for help   | "hi", "hello", "what can you do" |
| `summary`   | User wants a general overview report of a region     | "give me a summary of Punjab"  |

> **Note:** These intents should **not** trigger a database query.
> `greeting` → return capability message. `summary` → return pre-built region overview.

---

## Quick Cheat Sheet

```
extraction          → pumped/withdrawn water volume
recharge            → water replenishment volume
water_level         → depth to water table
availability        → total usable water
balance             → recharge minus extraction
quality             → contamination / drinking safety

comparison          → side-by-side across locations
highest             → single max value
lowest              → single min value
ranking             → sorted list of locations
trend               → change over time (historical)
forecast            → future prediction

status_safe         → CGWB: Safe zone
status_semi_critical→ CGWB: Semi-Critical zone
status_critical     → CGWB: Critical zone
status_overexploited→ CGWB: Over-Exploited zone

greeting            → no DB query, return help message
summary             → no DB query, return region overview
```

---

## Detection Method Per Intent

| Method          | Applies To                                                               |
|-----------------|--------------------------------------------------------------------------|
| Semantic (MiniLM) | All intents — cosine similarity against phrase embeddings              |
| Hard Trigger    | `comparison`, `highest`, `lowest`, `ranking`, `trend`, `forecast`, all `status_*` |
| Phrase Boost    | All intents — `+0.12` if exact phrase match found in query tokens       |

Hard triggers override semantic scoring. If a trigger keyword is present, the intent **always** fires.
See `HARD_TRIGGERS` in `resolver_v1.py` for the full keyword list.

---

*Last updated: JalSathi Resolver v1*