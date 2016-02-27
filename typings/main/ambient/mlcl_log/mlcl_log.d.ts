import winston = require('winston');
declare class mlcl_log {
  static loaderversion: number;
  static singleton: boolean;
  static molecuel: any;
  protected logger: winston.LoggerInstance;
  protected levels: string[];
  constructor(molecuel: any, config: any);
  protected formatArgs(args: any): any[];
  log(level: any, source: any, msg: any, meta: any): void;
  endLog(): void;
  registerTransport(name: string, handler: any): void;
  overwriteConsole(): void;
  recoverConsole(): void;
}
export = mlcl_log;
