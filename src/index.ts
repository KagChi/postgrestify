/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import process from "node:process";
import { Server } from "hyper-express";
import pg from "pg";

const { Pool } = pg;

const server = new Server();

type RequestBody = { sql: string; params: any[]; method: string; };

const db = new Pool({ connectionString: process.env.DATABASE_URL!, max: Number(process.env.DATABASE_MAX_CONNECTIONS ?? "36") });

server.post("/query", async (req, res) => {
    const { sql, params, method } = await req.json<RequestBody, RequestBody>();

    const sqlBody = sql.replaceAll(";", "");
    try {
        const query = {
            text: sqlBody,
            values: params,
            rowMode: method === "all" ? "array" : undefined
        };

        const result = await db.query(query);
        res.json(result.rows);
    } catch (error: any) {
        res.status(500).json({ error });
    }
    res.status(500).json({ error: "Unknown method value" });
});

await server.listen(3_001, "0.0.0.0");
console.log("Server running at port 3001!");
