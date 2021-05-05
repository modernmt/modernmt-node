import {ModernMTException, HttpClient} from "../types";

/** @internal */
export class Fetch implements HttpClient {

    private readonly baseUrl: string;
    private readonly headers: any;

    constructor(baseUrl: string, headers?: any) {
        this.baseUrl = baseUrl;
        this.headers = headers;
    }

    async send(cls: any, method: string, path: string, data?: any, files?: any): Promise<any> {
        const endpoint = `${this.baseUrl}${path}`;
        const options: any = {
            headers: {
                ...this.headers,
                "X-HTTP-Method-Override": method
            },
            method: "post"
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

                formData.append(key, <any>value);
            }

            options.body = formData;
        }
        else {
            options.headers["Content-Type"] = "application/json";
            options.body = JSON.stringify(data);
        }

        const res = await fetch(endpoint, options);
        const json = await res.json();

        if (json.status >= 300 || json.status < 200)
            throw new ModernMTException(json.status, json.error.type, json.error.message);

        return cls ? new cls(json.data) : json.data;
    }

}
