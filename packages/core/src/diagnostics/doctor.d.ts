interface DoctorReport {
    nodeVersion: string;
    nodeOk: boolean;
    packageManager: string;
    cacheHealthy: boolean;
    cacheDetails: string;
    configOk: boolean;
    configIssues: string[];
    envOk: boolean;
    envIssues: string[];
}
/**
 * Runs active diagnostic routines, validating system, config, and caches health.
 */
export declare function runDoctor(projectRoot: string): Promise<DoctorReport>;
/**
 * Renders doctor results to console.
 */
export declare function printDoctorReport(report: DoctorReport): void;
export {};
//# sourceMappingURL=doctor.d.ts.map