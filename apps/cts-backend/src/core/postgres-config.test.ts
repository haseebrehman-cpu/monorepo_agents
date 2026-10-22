import { describe, expect, it } from "vitest";
import { connectionStringForPool, schemaSearchPathOption } from "./postgres-config.js";

describe("connectionStringForPool", () => {
    it("keeps TLS and skips CA verification for Railway sslmode=require", () => {
        const result = connectionStringForPool(
            "postgresql://cts_app:secret@db.example:5432/railway?sslmode=require"
        );

        expect(new URL(result).searchParams.get("sslmode")).toBe("no-verify");
        expect(result).toContain("postgresql://cts_app:secret@db.example:5432/railway");
    });

    it("leaves verify-full unchanged", () => {
        const databaseUrl = "postgresql://cts_app:secret@db.example:5432/railway?sslmode=verify-full";

        expect(connectionStringForPool(databaseUrl)).toBe(databaseUrl);
    });
});

describe("schemaSearchPathOption", () => {
    it("pins unqualified queries to the cts schema", () => {
        expect(schemaSearchPathOption()).toBe("-c search_path=cts");
    });

    it("rejects schema names that could change the startup option", () => {
        expect(() => schemaSearchPathOption("cts;DROP")).toThrow(/Invalid database schema/);
    });
});
