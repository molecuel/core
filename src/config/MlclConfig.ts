import {singleton} from "@molecuel/di";
import * as fs from "fs";
import * as _ from "lodash";

@singleton
export class MlclConfig {
  private config: any;
  constructor() {
    this.readConfig();
  }
  public readConfig() {
    let configPath;
    let environment = "development";
    if (process.env.NODE_ENV) {
      environment = process.env.NODE_ENV;
    }
    if (process.env.configfilepath) {
      configPath = process.env.configfilepath;
    } else if (process.env.configpath) {
      configPath = process.env.configpath + "/" + environment + ".json";
    } else {
      configPath = process.cwd() + "/config/" + environment + ".json";
    }
    try {
      const readConfig = fs.readFileSync(configPath, "utf8");
      this.config = JSON.parse(readConfig);
    } catch (error) {
      this.config = {};
    }
  }
  public getConfig(path?: string) {
    if (path) {
      return _.get(this.config, path);
    } else {
      return this.config;
    }
  }
}
