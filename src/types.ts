/** @internal */
export interface HttpClient {
    send: (cls: any, method: string, path: string, data?: any, files?: any, headers?: any) => Promise<any>
}

export class ModernMTException extends Error {

    public readonly status: number;
    public readonly metadata?: any;

    constructor(status: number, type: string, message: string, metadata?: any) {
        super(message);
        this.name = type;
        this.status = status;

        if (metadata)
            this.metadata = metadata;
    }

}

export type TranslateOptions = {
    priority?: string,
    projectId?: string,
    multiline?: boolean,
    timeout?: number,
    format?: string,
    altTranslations?: number,
    idempotencyKey?: string,
    metadata?: any
}

export class Translation {

    public readonly translation: string;
    public readonly characters: number;
    public readonly billedCharacters: number;
    public readonly contextVector?: string;
    public readonly detectedLanguage?: string;
    public readonly altTranslations?: string[];

    constructor(data: any) {
        this.translation = data.translation;
        this.characters = data.characters;
        this.billedCharacters = data.billedCharacters;

        if (data.contextVector) this.contextVector = data.contextVector;
        if (data.detectedLanguage) this.detectedLanguage = data.detectedLanguage;
        if (data.altTranslations) this.altTranslations = data.altTranslations;
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

    public readonly id: string;
    public readonly memory?: number;
    public readonly size: number;
    public readonly progress: number;

    constructor(data: any) {
        this.id = data.id;
        this.memory = data.memory;
        this.size = data.size;
        this.progress = data.progress;
    }

}

export class DetectedLanguage {

    public readonly billedCharacters: number;
    public readonly detectedLanguage: string;

    constructor(data: any) {
        this.billedCharacters = data.billedCharacters;
        this.detectedLanguage = data.detectedLanguage;
    }

}

export class BatchTranslation {

    public readonly data: Translation | Translation[];
    public readonly metadata?: any;

    constructor(data: any) {
        const {result, metadata} = data;

        if (Array.isArray(result.data)) {
            this.data = [];
            for (const el of result.data)
                this.data.push(new Translation(el))
        }
        else {
            this.data = new Translation(result.data);
        }

        if (metadata)
            this.metadata = metadata;
    }

}

export class User {

    public readonly id: number;
    public readonly name: string;
    public readonly email: string;
    public readonly registrationDate: string;
    public readonly country: string;
    public readonly isBusiness: number;
    public readonly status: string;
    public readonly billingPeriod: BillingPeriod;

    constructor(data: any) {
        this.id = data.id;
        this.name = data.name;
        this.email = data.email;
        this.registrationDate = data.registrationDate;
        this.country = data.country;
        this.isBusiness = data.isBusiness;
        this.status = data.status;

        this.billingPeriod = new BillingPeriod(data.billingPeriod);
    }

}

class BillingPeriod {

    public readonly begin: string;
    public readonly end: string;
    public readonly chars: number;
    public readonly plan: string;
    public readonly planDescription: string;
    public readonly planForCatTool: boolean;
    public readonly amount: number;
    public readonly currency: string;
    public readonly currencySymbol: string;

    constructor(data: any) {
        this.begin = data.begin;
        this.end = data.end;
        this.chars = data.chars;
        this.plan = data.plan;
        this.planDescription = data.planDescription;
        this.planForCatTool = data.planForCatTool;
        this.amount = data.amount;
        this.currency = data.currency;
        this.currencySymbol = data.currencySymbol;
    }

}
