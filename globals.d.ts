type OptionType = "string"|"int"|"bool";
type OptionValueType = string|number|boolean;

interface SOMU {
    keyPrefix: string,
    hasInit: boolean,
    sidebar: JQuery | null,
    sidebarContent: JQuery | null,
    store: Storage | import("@userscripters/storage").AsyncStorage

    addOption(scriptName: string, optionName: string, defaultValue?: boolean, dataType?: "bool"): boolean | undefined;
    addOption(scriptName: string, optionName: string, defaultValue?: number, dataType?: "int"): boolean | undefined;
    addOption(scriptName: string, optionName: string, defaultValue?: string, dataType?: "string"): boolean | undefined;
    addOption(scriptName: string, optionName: string, defaultValue?: string, dataType?: OptionType): boolean | undefined;

    appendStyles(): void;
    handleSidebarEvents(): void;

    getOptionValue(scriptName: string, optionName: string, defaultValue?: boolean, dataType?: "bool"): boolean;
    getOptionValue(scriptName: string, optionName: string, defaultValue?: number, dataType?: "int"): number;
    getOptionValue(scriptName: string, optionName: string, defaultValue?: string, dataType?: "string"): string;
    getOptionValue(scriptName: string, optionName: string, defaultValue?: OptionValueType, dataType?: OptionType): OptionValueType;

    saveOptionValue(key: string, value: string): void;

    init(): void;
}

declare var SOMU: SOMU;
declare var Store: typeof import("@userscripters/storage");

declare function ajaxPromise(opts: string|object, type?: string): Promise<Document>;
declare function isModerator(): boolean;
declare function hasInvalidIds(): boolean;
declare function htmlDecode(input:string): string;
declare function jQueryXhrOverride(): XMLHttpRequest;
declare function addBackoff(sec:number): void;

interface Window {
    SOMU: SOMU | undefined;
    Store: typeof Store | undefined;
}