export interface IMlclDatabase {
  type?;
  idPattern?;
  layer?;
  connect();
  save(document: any, ...rest: any[]);
  update(query: any, ...rest: any[]);
  find(query: any, ...rest: any[]);
}
