declare class mlcl_utils {
    molecuel: any;
    constructor(molecuel: any);
    getVar(variable: any, req: any, res: any): string;
    resolve(text: string, options: any): string;
}
export = mlcl_utils;
