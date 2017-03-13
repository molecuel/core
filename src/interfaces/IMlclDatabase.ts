export interface IMlclDatabase {
  type;
  idPattern?;
  layer?;
  connect();
  save();
  update();
  find();
}
