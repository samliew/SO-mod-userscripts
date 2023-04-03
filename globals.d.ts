type OptionType = "string" | "int" | "bool";
type OptionValueType = string | number | boolean;

interface SOMU {
    keyPrefix: string,
    hasInit: boolean,
    sidebar: JQuery | null,
    sidebarContent: JQuery | null,
    store: Storage | import("@userscripters/storage").AsyncStorage;

    addOption(scriptName: string, optionName: string, defaultValue?: boolean, dataType?: "bool"): boolean | undefined;
    addOption(scriptName: string, optionName: string, defaultValue?: number, dataType?: "int"): boolean | undefined;
    addOption(scriptName: string, optionName: string, defaultValue?: string, dataType?: "string"): boolean | undefined;
    addOption(scriptName: string, optionName: string, defaultValue?: string, dataType?: OptionType): boolean | undefined;

    getOptionValue(scriptName: string, optionName: string, defaultValue?: boolean, dataType?: "bool"): boolean;
    getOptionValue(scriptName: string, optionName: string, defaultValue?: number, dataType?: "int"): number;
    getOptionValue(scriptName: string, optionName: string, defaultValue?: string, dataType?: "string"): string;
    getOptionValue(scriptName: string, optionName: string, defaultValue?: OptionValueType, dataType?: OptionType): OptionValueType;

    saveOptionValue(key: string, value: string): void;

    handleSidebarEvents(): void;
    appendStyles(): void;

    init(): void;
}

declare var SOMU: SOMU;
declare var Store: typeof import("@userscripters/storage");

interface Window {
    jQuery: JQueryStatic;
    $: JQueryStatic;
    SOMU: SOMU | undefined;
    Store: typeof Store | undefined;
}

/**
 * ================================
 * Constant Variables
 * ================================
 */
declare var scriptName: string;
declare var scriptSlug: string;
declare var _window: Window;
declare var store: WindowLocalStorage;

declare var monthsOfYear: string[];
declare var daysOfWeek: string[];
declare var MS: object;

declare var _hostname: string;
declare var isMSE: boolean;
declare var isSO: boolean;
declare var isSOMeta: boolean;
declare var isMetaSite: boolean;
declare var parentUrl: string;
declare var metaUrl: string | undefined;
declare var siteApiSlug: string;

declare var userId: number | null;
declare var fkey: string | null;

/**
 * ================================
 * Date Functions
 * ================================
 */
declare function seApiDateToDate(apiDate: string): Date | null;
declare function dateToIsoString(date: Date): string;
declare function dateToRelativeString(date: Date): string;

/**
 * ================================
 * Validation/Boolean Functions
 * ================================
 */
declare function isModerator(): boolean;

/**
 * ================================
 * AJAX / Callback / Promise Functions
 * ================================
 */
declare function delay(ms: number): Promise<void>;
declare function ajaxPromise(opts: string | object, type?: string): Promise<Document>;
declare function jQueryXhrOverride(): XMLHttpRequest;
declare function hasBackoff(): boolean;
declare function addBackoff(sec: number): void;

/**
 * ================================
 * String / HTML Parsing / Validation Functions
 * ================================
 */
declare function htmlDecode(input: string): string;

/**
 * ================================
 * Post ID Functions
 * ================================
 */
declare function hasInvalidIds(): boolean;
declare function getPostId(url: string): number | null;

/**
 * ================================
 * Location and History Functions
 * ================================
 */
declare function getQueryParam(key: string): string;
declare function goToPost(pid: number): void;

/**
 * ================================
 * DOM Manipulation Functions
 * ================================
 */
declare function setAttributes(el: HTMLElement, attrs: object): void;
declare function makeElem(tagName: string, attrs?: object, text?: string, children?: HTMLElement[]): HTMLElement;
declare function addStylesheet(css: string, atDocumentEnd?: boolean): void;

/**
 * ================================
 * Observer / Event Functions
 * ================================
 */
declare function waitForElement(selector: string, context: HTMLElement | Document): Promise<void>
