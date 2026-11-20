// Genera TODAS las texturas del juego (canvas). BootScene las registra en Phaser.
import { PRODUCTS } from '../data/products.js';
import { OWNER_PAL, CUSTOMER_PALS, makeCharSheet, productIcon, downscale2, boxClosed, boxOpen } from './pixel.js';
import * as W from './world.js';

export function generateAll() {
  const tex = {
    floor_store0: W.tileStore(0), floor_store1: W.tileStore(1), floor_back: W.tileBack(), floor_office: W.tileOffice(),
    floor_bath: W.tileBath(), floor_dock: W.tileDock(), floor_hazard: W.tileHazard(),
    floor_sidewalk: W.tileSidewalk(), floor_street: W.tileStreet(), wall_face: W.wallFace(), wall_top: W.wallTop(),
    shelf: W.shelfTex(), fridge: W.fridgeTex(), rack: W.rackTex(),
    register: W.registerTex(), plant: W.plantTex(), bin: W.binTex(), poster: W.posterTex(1), poster2: W.posterTex(2),
    clock: W.clockTex(), mat: W.matTex(), crates: W.cratesTex(), rug: W.rugTex(), desk: W.deskTex(), chair: W.chairTex(),
    cabinet: W.cabinetTex(), toilet: W.toiletTex(), sink: W.sinkTex(), bucket: W.bucketTex(), shutter: W.shutterTex(),
    pallet: W.palletTex(), streetlamp: W.streetlampTex(), door: W.doorTex(),
    dirt_spill: W.dirtTex('spill'), dirt_trash: W.dirtTex('trash'), dirt_crumbs: W.dirtTex('crumbs'),
    light: W.lightTex(), glow_warm: W.glowTex('#ffb15a'), glow_cool: W.glowTex('#9ec4ff'),
  };
  PRODUCTS.forEach((p) => {
    const icon = productIcon(p);
    tex['icon_' + p.id] = icon;
    tex['mini_' + p.id] = downscale2(icon);
    tex['boxc_' + p.id] = boxClosed(p);
    tex['boxo_' + p.id] = boxOpen(p);
  });
  const sheets = { owner: makeCharSheet(OWNER_PAL) };
  CUSTOMER_PALS.forEach((pal, i) => { sheets['cust' + i] = makeCharSheet(pal); });
  return { tex, sheets };
}
