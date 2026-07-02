CREATE TABLE IF NOT EXISTS price_book (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_email TEXT NOT NULL,
  trade       TEXT,
  item        TEXT NOT NULL,
  unit        TEXT,
  price       REAL,
  region      TEXT,
  note        TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_pb_item ON price_book(item);
CREATE INDEX IF NOT EXISTS idx_pb_trade ON price_book(trade);
-- seed with the real numbers Gal gave (so the book isn't empty on day 1)
INSERT INTO price_book (owner_email,trade,item,unit,price,region,note) VALUES
 ('seed@obra','Insulation','Blown-in insulation (~1,100 sq ft)','job',1500,'Los Angeles','contractor cost incl materials+labor'),
 ('seed@obra','Insulation','License fronting fee','job',400,'Los Angeles','licensed contractor puts job under their name'),
 ('seed@obra','HVAC','Full HVAC system (furnace + condenser)','job',8000,'Los Angeles','manufacturer/installer cost before markup'),
 ('seed@obra','Countertop','Countertop install','sq ft',75,'Los Angeles','sazman-quoted'),
 ('seed@obra','Roofing','Add roof layer','big square',3000,'Los Angeles','open-add layers');
