/** @internal */
export interface HttpClient {
    send: (cls: any, method: string, path: string, data?: any, files?: any) => Promise<any>
}

export class ModernMTException extends Error {

    private status: number;

    constructor(status: number, type: string, message: string) {
        super(message);
        this.name = type;
        this.status = status;
    }

}

export type TranslateOptions = {
    priority?: string,
    projectId?: string,
    multiline?: boolean,
    timeout?: number
}

export class Model {

    constructor(data: any, fields: string[]) {
        for (const key of fields) {
            if (data[key] !== undefined) (<any>this)[key] = data[key];
        }
    }

}

export class Translation extends Model {

    public readonly translation?: string;
    public readonly contextVector?: string;
    public readonly characters?: number;
    public readonly billedCharacters?: number;
    public readonly detectedLanguage?: string;

    constructor(data: any) {
        super(data, ["translation", "contextVector", "characters", "billedCharacters", "detectedLanguage"]);
    }

}

export class Memory extends Model {

    public readonly id?: number;
    public readonly name?: string;
    public readonly description?: string;
    public readonly creationDate?: string;

    constructor(data: any) {
        super(data, ["id", "name", "description", "creationDate"]);
    }

}

export class ImportJob extends Model {

    public readonly id?: number;
    public readonly memory?: number;
    public readonly size?: number;
    public readonly progress?: number;

    constructor(data: any) {
        super(data, ["id", "memory", "size", "progress"]);
    }

}
