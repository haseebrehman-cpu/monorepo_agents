export const CTS_SCHEMA = "cts";

const SCHEMA_NAME = /^[a-z_][a-z0-9_]*$/;

/**
 * pg v8 treats sslmode=require as verify-full. The Railway proxy presents a
 * certificate this process does not trust, so require/prefer are normalized to
 * no-verify: the session stays encrypted, and the certificate is not checked.
 */
export function connectionStringForPool(databaseUrl: string): string {
    const url = new URL(databaseUrl);
    const sslmode = url.searchParams.get("sslmode");
    if (sslmode === "require" || sslmode === "prefer") {
        url.searchParams.set("sslmode", "no-verify");
    }
    return url.toString();
}

export function schemaSearchPathOption(schema: string = CTS_SCHEMA): string {
    if (!SCHEMA_NAME.test(schema)) {
        throw new Error(`Invalid database schema: ${schema}`);
    }
    return `-c search_path=${schema}`;
}
