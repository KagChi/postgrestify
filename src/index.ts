/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { PGlite } from "@electric-sql/pglite";
import { Server } from "hyper-express";

const db = new PGlite("./db/pgdata");
const server = new Server();

type RequestBody = { sql: string; params: any[]; method: string; };

server.post("/query", async (req, res) => {
    const { sql, params, method } = await req.json<RequestBody, RequestBody>();

    console.log(sql, params, method);

    const sqlBody = sql.replaceAll(";", "");
    try {
        const result = await db.query(sqlBody, params, {
            rowMode: method === "all" ? "array" : undefined
        });
        res.json(result.rows);
    } catch (error: any) {
        res.status(500).json({ error });
    }
    res.status(500).json({ error: "Unknown method value" });
});

await server.listen(3_001, "0.0.0.0");
console.log("Server running at port 3001!");
