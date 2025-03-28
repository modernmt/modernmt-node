import {
    BatchTranslation,
    DetectedLanguage,
    GlossaryTerm,
    HttpClient,
    ImportJob,
    Memory,
    ModernMTException,
    QualityEstimation,
    TranslateOptions,
    Translation,
    User
} from "./types";
import {Https} from "./utils/https";
import {Fetch} from "./utils/fetch";
import {createReadStream} from "fs";
import * as jose from "jose";

export class ModernMT {

    private readonly http: HttpClient;
    public readonly memories: MemoryServices;

    private batchPublicKey: jose.KeyLike | undefined;
    private batchPublicKeyTimestampMs: number = 0;

    constructor(apiKey: string, platform = "modernmt-node", platformVersion = "1.5.3", apiClient?: number) {
        const headers: any = {
            "MMT-ApiKey": apiKey,
            "MMT-Platform": platform,
            "MMT-PlatformVersion": platformVersion
        };

        if (apiClient)
            headers["MMT-ApiClient"] = apiClient;

        if (typeof window !== "undefined")
            this.http = new Fetch("https://api.modernmt.com", headers);
        else
            this.http = new Https("api.modernmt.com", headers);

        this.memories = new MemoryServices(this.http);
    }

    listSupportedLanguages(): Promise<string[]> {
        return this.http.send(null, "get", "/translate/languages");
    }

    async detectLanguage(q: string | string[], format?: string): Promise<DetectedLanguage | DetectedLanguage[]> {
        const res = await this.http.send(null, "get", "/translate/detect", {q, format});
        if (!Array.isArray(res))
            return new DetectedLanguage(res);

        const languages = [];
        for (const el of res)
            languages.push(new DetectedLanguage(el));

        return languages;
    }

    async translate(source: string, target: string, q: string | string[], hints?: (number | string)[],
                    contextVector?: string, options?: TranslateOptions): Promise<Translation | Translation[]> {
        const data: any = {
            source,
            target,
            q,
            context_vector: contextVector,
            hints
        };

        if (options) {
            data.priority = options.priority;
            data.project_id = options.projectId;
            data.multiline = options.multiline;
            data.timeout = options.timeout;
            data.format = options.format;
            data.alt_translations = options.altTranslations;
            data.session = options.session;
            data.ignore_glossary_case = options.ignoreGlossaryCase;
            data.glossaries = options.glossaries;
            data.mask_profanities = options.maskProfanities;
        }

        const res = await this.http.send(null, "get", "/translate", data);

        if (!Array.isArray(res))
            return new Translation(res);

        const translations = []
        for (const el of res)
            translations.push(new Translation(el));

        return translations;
    }

    async batchTranslate(webhook: string, source: string, target: string, q: string | string[],
                         hints?: (number | string)[], contextVector?: string,
                         options?: TranslateOptions): Promise<boolean> {
        const data: any = {
            webhook,
            source,
            target,
            q,
            context_vector: contextVector,
            hints
        };

        if (options) {
            data.project_id = options.projectId;
            data.multiline = options.multiline;
            data.format = options.format;
            data.alt_translations = options.altTranslations;
            data.metadata = options.metadata;
            data.session = options.session;
            data.ignore_glossary_case = options.ignoreGlossaryCase;
            data.glossaries = options.glossaries;
            data.mask_profanities = options.maskProfanities;
        }

        let headers;
        if (options && options.idempotencyKey) {
            headers = { "x-idempotency-key": options.idempotencyKey };
        }

        const res = await this.http.send(null, "post", "/translate/batch", data, null, headers);

        return res.enqueued;
    }

    async getContextVector(source: string, targets: string | string[], text: string,
                           hints?: (number | string)[], limit?: number): Promise<string | Map<string, string>> {
        const res = await this.http.send(null, "get", "/context-vector", {
            source,
            targets,
            text,
            hints,
            limit
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
            hints,
            limit,
            compression
        }, {
            content: file
        });

        return Array.isArray(targets) ? res.vectors : res.vectors[<string>targets];
    }

    async handleCallback(body: any, signature: string): Promise<BatchTranslation> {
        if (!this.batchPublicKey)
            await this.refreshBatchPublicKey();

        if ((Date.now() - this.batchPublicKeyTimestampMs) > 1000 * 3600) {  // key is older than 1 hour
            try {
                await this.refreshBatchPublicKey();
            }
            catch (e) {
                // ignore
            }
        }

        await jose.jwtVerify(signature, this.batchPublicKey as jose.KeyLike);

        if (typeof body === 'string')
            body = JSON.parse(body);

        const {result, metadata} = body;

        if (result.error) {
            const {type, message} = result.error;
            throw new ModernMTException(result.status, type, message, metadata);
        }

        return new BatchTranslation(body);
    }

    private async refreshBatchPublicKey(): Promise<void> {
        const key = (await this.http.send(null, "get", "/translate/batch/key")).publicKey;
        const alg = 'RS256';

        if (typeof window !== "undefined")
            this.batchPublicKey = await jose.importSPKI(window.atob(key), alg);
        else
            this.batchPublicKey = await jose.importSPKI(Buffer.from(key, 'base64').toString(), alg);

        this.batchPublicKeyTimestampMs = Date.now();
    }

    me(): Promise<User> {
        return this.http.send(User, "get", "/users/me");
    }

    async qe(source: string, target: string, sentence: string | string[],
             translation: string | string[]): Promise<QualityEstimation | QualityEstimation[]> {
        const res = await this.http.send(null, "get", "/translate/qe", {
            source, target, sentence, translation
        });

        if (!Array.isArray(res))
            return new QualityEstimation(res);

        const qes = [];
        for (const el of res)
            qes.push(new QualityEstimation(el));

        return qes;
    }

}

export class MemoryServices {

    private readonly http: HttpClient;

    constructor(http: HttpClient) {
        this.http = http;
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
            description,
            external_id: externalId
        });
    }

    edit(id: number | string, name?: string, description?: string): Promise<Memory> {
        return this.http.send(Memory,"put", `/memories/${id}`, {
            name,
            description
        });
    }

    delete(id: number | string): Promise<Memory> {
        return this.http.send(Memory, "delete", `/memories/${id}`);
    }

    add(id: number | string, source: string, target: string, sentence: string, translation: string,
        tuid?: string, session?: string): Promise<ImportJob> {
        const data = {
            source,
            target,
            sentence,
            translation,
            tuid,
            session
        };
        return this.http.send(ImportJob, "post", `/memories/${id}/content`, data);
    }

    replace(id: number | string, tuid: string, source: string, target: string,
            sentence: string, translation: string, session?: string): Promise<ImportJob> {
        const data = {
            tuid,
            source,
            target,
            sentence,
            translation,
            session
        };
        return this.http.send(ImportJob, "put", `/memories/${id}/content`, data);
    }

    import(id: number | string, tmx: any, compression?: string): Promise<ImportJob> {
        if (typeof tmx === "string")
            tmx = createReadStream(tmx);

        return this.http.send(ImportJob, "post", `/memories/${id}/content`, {
            compression
        }, {
            tmx
        });
    }

    addToGlossary(id: number | string, terms: GlossaryTerm[], type: string, tuid?: string): Promise<ImportJob> {
        const data = {
            terms,
            type,
            tuid
        };
        return this.http.send(ImportJob, "post", `/memories/${id}/glossary`, data);
    }

    replaceInGlossary(id: number | string, terms: GlossaryTerm[], type: string, tuid?: string): Promise<ImportJob> {
        const data = {
            terms,
            type,
            tuid
        };
        return this.http.send(ImportJob, "put", `/memories/${id}/glossary`, data);
    }

    importGlossary(id: number | string, csv: any, type: string, compression?: string): Promise<ImportJob> {
        if (typeof csv === "string")
            csv = createReadStream(csv);

        return this.http.send(ImportJob, "post", `/memories/${id}/glossary`, {
            type,
            compression
        }, {
            csv
        });
    }

    getImportStatus(uuid: string): Promise<ImportJob> {
        return this.http.send(ImportJob, "get", `/import-jobs/${uuid}`);
    }

}
