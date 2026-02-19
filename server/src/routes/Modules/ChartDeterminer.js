function decideChartType(columns, rows) {
    if (rows.length === 1 && columns.length === 1) {
        return "NONE"; // stat card
    }

    if (columns.length === 2) {
        const [c1, c2] = columns;

        if (isYear(c1)) return "LINE";

        if (isString(c1) && isNumber(c2)) {
            if (rows.length <= 10) return "BAR";
            return "HORIZONTAL_BAR";
        }
    }

    if (isCategoryDistribution(columns, rows)) {
        return rows.length <= 8 ? "PIE" : "BAR";
    }

    if (twoNumeric(columns)) {
        return "SCATTER";
    }

    return "TABLE_ONLY";
}

module.exports = decideChartType;