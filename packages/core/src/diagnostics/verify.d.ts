interface VerifyReport {
    configOk: boolean;
    graphOk: boolean;
    cacheOk: boolean;
    ssrOk: boolean;
    buildOk: boolean;
    issues: string[];
}
export declare function runVerify(projectRoot: string): Promise<VerifyReport>;
export declare function printVerifyReport(report: VerifyReport): void;
export {};
//# sourceMappingURL=verify.d.ts.map