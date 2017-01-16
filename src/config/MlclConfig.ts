import {singleton} from '@molecuel/di';
import * as _ from 'lodash';
import * as fs from 'fs';

@singleton
export class MlclConfig {
  private config: any;
  constructor() {
    this.readConfig();
  }
  readConfig() {
    let configPath;
    let environment = 'development';
    if(process.env.NODE_ENV) {
      environment = process.env.NODE_ENV;
    }
    if(process.env.configfilepath) {
      configPath = process.env.configfilepath;
    } else if(process.env.configpath) {
      configPath = process.env.configpath + '/' + environment + '.json';
    } else {
      configPath = process.cwd() + '/config/' + environment + '.json';
    }
    try {
      let readConfig = fs.readFileSync(configPath, 'utf8');
      this.config = JSON.parse(readConfig);
    } catch (error) {
      this.config = {};
    }
  }
  getConfig(path?: string) {
    if(path) {
      return _.get(this.config, path);
    } else {
      return this.config;
    }
  }
}