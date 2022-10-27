import {DetectedLanguage, HttpClient, ImportJob, Memory, TranslateOptions, Translation} from "./types";
import {Https} from "./utils/https";
import {Fetch} from "./utils/fetch";
import {createReadStream} from "fs";

export class ModernMT {

    private readonly http: HttpClient;
    public readonly memories: MemoryServices;

    constructor(apiKey: string, platform = "modernmt-node", platformVersion = "1.0.11") {
        const headers: any = {
            "MMT-ApiKey": apiKey,
            "MMT-Platform": platform,
            "MMT-PlatformVersion": platformVersion
        };

        if (typeof fetch === "function")
            this.http = new Fetch("https://api.modernmt.com", headers);
        else
            this.http = new Https("api.modernmt.com", headers);

        this.memories = new MemoryServices(this);
    }

    listSupportedLanguages(): Promise<string[]> {
        return this.http.send(null, "get", "/translate/languages");
    }

    async detectLanguage(q: string | string[], format?: string): Promise<DetectedLanguage | DetectedLanguage[]> {
        const res = await this.http.send(null, "get", "/translate/detect", {q, format});
        if (!Array.isArray(q))
            return new DetectedLanguage(res);

        const languages = [];
        for (const el of res)
            languages.push(new DetectedLanguage(el));

        return languages;
    }

    async translate(source: string, target: string, q: string | string[], hints?: (number | string)[],
                    contextVector?: string, options?: TranslateOptions): Promise<Translation | Translation[]> {

        const res = await this.http.send(null, "get", "/translate", {
            source: source ? source : undefined,
            target,
            q,
            context_vector: contextVector ? contextVector : undefined,
            hints: hints ? hints.join(",") : undefined,
            priority: options ? options.priority : undefined,
            project_id: options ? options.projectId : undefined,
            multiline: options ? options.multiline : undefined,
            timeout: options ? options.timeout : undefined,
            format: options ? options.format : undefined,
            alt_translations: options ? options.altTranslations : undefined
        });

        if (!Array.isArray(q))
            return new Translation(res);

        const translations = []
        for (const el of res)
            translations.push(new Translation(el));

        return translations;
    }

    async getContextVector(source: string, targets: string | string[], text: string,
                           hints?: (number | string)[], limit?: number): Promise<string | Map<string, string>> {
        const res = await this.http.send(null, "get", "/context-vector", {
            source,
            targets,
            text,
            hints: hints ? hints.join(",") : undefined,
            limit: limit ? limit : undefined
        });

        return Array.isArray(targets) ? res.vectors : res.vectors[<string>targets];
    }

    async getContextVectorFromFile(source: string, targets: string | string[], file: any, hints?: (number | string)[],
                                   limit?: number, compression?: "gzip"): Promise<string | Map<string, string>> {
        if (typeof file === "string")
            file = createReadStream(file);

        const res = await this.http.send(null, "get", "/context-vector", {
            source,
            targets,
            hints: hints ? hints.join(",") : undefined,
            limit: limit ? limit : undefined,
            compression: compression ? compression : undefined
        }, {
            content: file
        });

        return Array.isArray(targets) ? res.vectors : res.vectors[<string>targets];
    }

}

export class MemoryServices {

    private readonly http: HttpClient;

    constructor(mmt: ModernMT) {
        this.http = (<any>mmt).http;
    }

    async list(): Promise<Memory[]> {
        const res = await this.http.send(null, "get", "/memories");

        const memories = [];
        for (const el of res)
            memories.push(new Memory(el));

        return memories;
    }

    get(id: number | string): Promise<Memory> {
        return this.http.send(Memory, "get", `/memories/${id}`);
    }

    create(name: string, description?: string, externalId?: string): Promise<Memory> {
        return this.http.send(Memory,"post", "/memories", {
            name,
            description: description ? description : undefined,
            external_id: externalId ? externalId : undefined
        });
    }

    edit(id: number | string, name?: string, description?: string): Promise<Memory> {
        return this.http.send(Memory,"put", `/memories/${id}`, {
            name: name ? name : undefined,
            description: description ? description : undefined
        });
    }

    delete(id: number | string): Promise<Memory> {
        return this.http.send(Memory, "delete", `/memories/${id}`);
    }

    add(id: number | string, source: string, target: string, sentence: string, translation: string,
              tuid?: string): Promise<ImportJob> {
        const data = {source, target, sentence, translation, tuid: tuid ? tuid : undefined};
        return this.http.send(ImportJob, "post", `/memories/${id}/content`, data);
    }

    replace(id: number | string, tuid: string, source: string, target: string,
                  sentence: string, translation: string): Promise<ImportJob> {
        const data = {tuid, source, target, sentence, translation};
        return this.http.send(ImportJob, "put", `/memories/${id}/content`, data);
    }

    import(id: number | string, tmx: any, compression?: string): Promise<ImportJob> {
        if (typeof tmx === "string")
            tmx = createReadStream(tmx);

        return this.http.send(ImportJob, "post", `/memories/${id}/content`, {
            compression: compression ? compression : undefined
        }, {
            tmx
        });
    }

    getImportStatus(uuid: string): Promise<ImportJob> {
        return this.http.send(ImportJob, "get", `/import-jobs/${uuid}`);
    }

}
