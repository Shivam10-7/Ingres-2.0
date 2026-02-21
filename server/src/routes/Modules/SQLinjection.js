class SQLInjectionError extends Error {
    constructor(message) {
        super(message);
        this.name = "SQLInjectionError";
    }
}

function validateSQLQuery(query, options = { allowWrite: false, strict: true }) {
    if (typeof query !== "string" || query.trim() === "") {
        throw new SQLInjectionError("Empty or invalid query");
    }

    const q = query.trim();
    const qUpper = q.toUpperCase();

    // -------------------------------------------------
    // 1. Block multiple statements (stacked queries)
    // -------------------------------------------------
    const semicolonCount = (q.match(/;/g) || []).length;
    if (semicolonCount > 1 || (semicolonCount === 1 && !q.endsWith(";"))) {
        throw new SQLInjectionError("Multiple SQL statements detected");
    }

    // -------------------------------------------------
    // 2. Block SQL comments
    // -------------------------------------------------
    if (/--|\/\*|\*\//.test(q)) {
        throw new SQLInjectionError("SQL comments detected");
    }

    // -------------------------------------------------
    // 3. Block PostgreSQL dollar quoting ($$)
    // -------------------------------------------------
    if (options.strict && /\$\$/.test(q)) {
        throw new SQLInjectionError("Dollar-quoted string detected ($$)");
    }

    // -------------------------------------------------
    // 4. Block destructive operations
    // -------------------------------------------------
    const destructivePatterns = [
        /\bDROP\b/,
        /\bTRUNCATE\b/,
        /\bALTER\b/,
        /\bCREATE\b/,
        /\bREPLACE\b/,
        /\bGRANT\b/,
        /\bREVOKE\b/,
        /\bEXEC\b/,
        /\bEXECUTE\b/,
        /\bCALL\b/
    ];

    for (const pattern of destructivePatterns) {
        if (pattern.test(qUpper)) {
            throw new SQLInjectionError("Destructive operation detected");
        }
    }

    // -------------------------------------------------
    // 5. Block write operations if not allowed
    // -------------------------------------------------
    if (!options.allowWrite) {
        const writePatterns = [
            /\bINSERT\b/,
            /\bUPDATE\b/,
            /\bDELETE\b/,
            /\bMERGE\b/
        ];

        for (const pattern of writePatterns) {
            if (pattern.test(qUpper)) {
                throw new SQLInjectionError("Write operation not allowed");
            }
        }
    }

    // -------------------------------------------------
    // 6. Block tautology injections
    // -------------------------------------------------
    const tautologyPatterns = [
        /\bOR\b\s+\d+\s*=\s*\d+/,
        /\bOR\b\s+'[^']+'\s*=\s*'[^']+'/,
        /\bOR\b\s+TRUE\b/
    ];

    for (const pattern of tautologyPatterns) {
        if (pattern.test(qUpper)) {
            throw new SQLInjectionError("Tautology-based injection detected");
        }
    }

    // -------------------------------------------------
    // 7. Block UNION-based exfiltration
    // -------------------------------------------------
    if (/\bUNION\b\s+\bSELECT\b/.test(qUpper)) {
        throw new SQLInjectionError("UNION-based injection detected");
    }

    // -------------------------------------------------
    // 8. Block system table access
    // -------------------------------------------------
    const systemTables = [
        "INFORMATION_SCHEMA",
        "PG_CATALOG",
        "SYS.",
        "MYSQL."
    ];

    for (const table of systemTables) {
        if (qUpper.includes(table)) {
            throw new SQLInjectionError("System table access detected");
        }
    }

    // -------------------------------------------------
    // 9. Block encoded payloads (hex literals)
    // -------------------------------------------------
    if (/0x[0-9A-F]+/i.test(q)) {
        throw new SQLInjectionError("Hex-encoded payload detected");
    }

    // -------------------------------------------------
    // 10. Block dangerous execution functions
    // -------------------------------------------------
    const dangerousFunctions = [
        "XP_CMDSHELL",
        "PG_SLEEP",
        "SLEEP(",
        "BENCHMARK("
    ];

    for (const func of dangerousFunctions) {
        if (qUpper.includes(func)) {
            throw new SQLInjectionError("Dangerous execution function detected");
        }
    }

    return true;
}

module.exports = validateSQLQuery;