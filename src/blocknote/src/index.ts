import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";

dotenv.config();

const app: Express = express();
const port = process.env.PORT ?? 8081;

app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server");
});

app.get("/__heartbeat__", (req: Request, res: Response) => {
  res.status(200).send({ status: "OK" });
});

app.get("/__lbheartbeat__", (req: Request, res: Response) => {
  res.status(200).send({ status: "OK" });
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
