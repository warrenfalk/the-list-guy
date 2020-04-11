import express, { request } from 'express';
import ngrok from "ngrok";
import bodyParser from 'body-parser';
import {openApp, processIntentRequest } from "./app";
import { RequestEnvelope } from 'ask-sdk-model';

const app = express();
const jsonParser = bodyParser.json();
const port = (process.env.PORT && parseInt(process.env.PORT)) || 3400;
const host = process.env.HOST || "127.0.0.1"

app.get('*', (req, res) => {
    res.send('Hello World!');
    console.log(req.method, req.url);
});

app.post('/', jsonParser, (req, res) => {
    const body = req.body as RequestEnvelope
    const { request } = body;
    switch (request.type) {
        case "IntentRequest":
            processIntentRequest(request).then(response => {
                res.json(response);
            });
            break;
        case "LaunchRequest":
            openApp(request).then(response => {
                res.json(response);
            })
            break;
        case "SessionEndedRequest":
            res.json({
                version: "1.0",
                response: {}
            });
            break;
        default:
            res.json('{error: "unhandled"}');
            console.warn(`Unhandled request type: ${request.type}`);
            break;
    }
})

app.listen(port, host, () => console.log(`API web proxy listening on ${host}:${port}`));

(async function() {
    const url = await ngrok.connect({
        addr: `${host}:${port}`,
        subdomain: "the-list-guy"
    });
    console.log("ngrok url:", url);
})();