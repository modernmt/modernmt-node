import {ModernMTException, HttpClient} from "../types";

export class Fetch implements HttpClient {

    private readonly baseUrl: string;
    private readonly headers?: any;

    constructor(baseUrl: string, headers?: any) {
        this.baseUrl = baseUrl;

        if (headers)
            this.headers = headers;
    }

    async send(cls: any, method: string, path: string, data?: any, files?: any, headers?: any): Promise<any> {
        const endpoint = `${this.baseUrl}${path}`;
        const options: any = {
            headers: Object.assign({"X-HTTP-Method-Override": method}, this.headers, headers),
            method: "post"
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

                formData.append(key, <any>value);
            }

            options.body = formData;
        }
        else {
            options.headers["Content-Type"] = "application/json";
            options.body = JSON.stringify(data, (_key, value) => value == null ? undefined : value);
        }

        const res = await fetch(endpoint, options);
        const json = await res.json();

        if (json.status >= 300 || json.status < 200)
            throw new ModernMTException(json.status, json.error.type, json.error.message);

        return cls ? new cls(json.data) : json.data;
    }

}
