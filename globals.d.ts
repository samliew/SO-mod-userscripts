type OptionType = "string"|"int"|"bool";
type OptionValueType = string|number|boolean;

interface SOMU {
    keyPrefix: string,
    hasInit: boolean,
    sidebar: JQuery | null,
    sidebarContent: JQuery | null,
    store: Storage;

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

interface Window {
    SOMU: SOMU | undefined;
}