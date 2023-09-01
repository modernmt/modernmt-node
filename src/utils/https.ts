import {ModernMTException, HttpClient} from "../types";
import {request} from "https";
import FormData from "form-data";

/** @internal */
export class Https implements HttpClient {

    private readonly host: string;
    private readonly headers?: any;

    constructor(host: string, headers?: any) {
        this.host = host;

        if (headers)
            this.headers = headers;
    }

    send(cls: any, method: string, path: string, data?: any, files?: any, headers?: any): Promise<any> {
        const options: any = {
            host: this.host,
            headers: Object.assign({"X-HTTP-Method-Override": method}, this.headers, headers),
            method: "post",
            path
        };

        let formData: FormData;
        if (files) {
            const form = Object.assign({}, files, data);
            formData = new FormData();

            for (let [key, value] of Object.entries(form)) {
                if (value == null)
                    continue;
                if (Array.isArray(value))
                    value = value.join(",");

                formData.append(key, value);
            }

            options.headers = {
                ...options.headers,
                ...formData.getHeaders()
            };
        }
        else {
            options.headers["Content-Type"] = "application/json";
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
                const json = JSON.stringify(data, (_key, value) => value == null ? undefined : value);
                req.write(Buffer.from(json));
                req.end();
            }
            else if (formData)
                formData.pipe(req);
            else
                req.end();
        });
    }

}
