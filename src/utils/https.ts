import {ModernMTException, HttpClient} from "../types";
import {request} from "https";
import FormData from "form-data";

/** @internal */
export class Https implements HttpClient {

    private readonly host: string;
    private readonly headers: any;

    constructor(host: string, headers?: any) {
        this.host = host;
        this.headers = headers;
    }

    send(cls: any, method: string, path: string, data?: any, files?: any): Promise<any> {
        const options = {
            host: this.host,
            headers: {
                ...this.headers,
                "Content-Type": "application/json",
                "X-HTTP-Method-Override": method
            },
            method: "post",
            path
        };

        let formData: FormData;
        if (files) {
            const form = {
                ...data,
                ...files
            };
            formData = new FormData();

            for (let [key, value] of Object.entries(form)) {
                if (value === undefined)
                    continue;
                if (Array.isArray(value))
                    value = value.join(",");

                formData.append(key, value);
            }

            delete options.headers["Content-Type"];
            options.headers = {
                ...options.headers,
                ...formData.getHeaders()
            };
        }

        return new Promise((resolve, reject) => {
            const req = request(options, (res) => {
                let chunks = '';

                res.on("data", (chunk) => {
                    chunks += chunk;
                });
                res.on("end", () => {
                    let json;

                    try {
                        json = JSON.parse(chunks);
                    }
                    catch (e) {
                        return reject(e);
                    }

                    if (json.status >= 300 || json.status < 200)
                        return reject(new ModernMTException(json.status, json.error.type, json.error.message));

                    return resolve(cls ? new cls(json.data) : json.data);
                });
            });

            req.on("error", (e) => {
                return reject(e);
            });

            if (data && !formData) {
                req.write(Buffer.from(JSON.stringify(data)));
                req.end();
            }
            else if (formData)
                formData.pipe(req);
            else
                req.end();
        });
    }

}
