/** @internal */
export interface HttpClient {
    send: (cls: any, method: string, path: string, data?: any, files?: any) => Promise<any>
}

export class ModernMTException extends Error {

    public readonly status: number;

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

export class Translation {

    public readonly translation: string;
    public readonly characters: number;
    public readonly billedCharacters: number;
    public readonly contextVector?: string;
    public readonly detectedLanguage?: string;

    constructor(data: any) {
        this.translation = data.translation;
        this.characters = data.characters;
        this.billedCharacters = data.billedCharacters;

        if (data.contextVector) this.contextVector = data.contextVector;
        if (data.detectedLanguage) this.detectedLanguage = data.detectedLanguage;
    }

}

export class Memory {

    public readonly id: number;
    public readonly name: string;
    public readonly description?: string;
    public readonly creationDate: string;

    constructor(data: any) {
        this.id = data.id;
        this.name = data.name;
        this.creationDate = data.creationDate;

        if (data.description) this.description = data.description;
    }

}

export class ImportJob {

    public readonly id: number;
    public readonly memory: number;
    public readonly size: number;
    public readonly progress: number;

    constructor(data: any) {
        this.id = data.id;
        this.memory = data.memory;
        this.size = data.size;
        this.progress = data.progress;
    }

}
