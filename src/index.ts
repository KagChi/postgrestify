/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import process from "node:process";
import { Server } from "hyper-express";
import pg from "pg";
import pino from "pino";

const config = {
    database: {
        url: process.env.DATABASE_URL!,
        connections: Number(process.env.DATABASE_MAX_CONNECTIONS ?? "36")
    },
    port: Number(process.env.PORT ?? "3000"),
    auth: process.env.AUTH!
};

const { Pool } = pg;
const db = new Pool({ connectionString: config.database.url, max: config.database.connections });
const server = new Server();

type RequestBody = { sql: string; params: any[]; method: string; };

const logger = pino({
    transport: {
        target: "pino-pretty",
        options: {
            colorize: true
        }
    }
});

server.post("/query", async (req, res) => {
    const { sql, params, method } = await req.json<RequestBody, RequestBody>();

    if (req.headers.authorization !== config.auth) {
        res.status(401).json({ error: "Invalid authorization token!" });
        return;
    }

    logger.info({
        sql,
        params,
        method
    }, `Request from ${req.ip}`);

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
        logger.error(error, "An error emitted.");
        res.status(500).json({ error });
    }
    res.status(500).json({ error: "Unknown method value" });
});

await server.listen(config.port, "0.0.0.0");
logger.info(`Server running at port ${config.port}!`);
