import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { Mood } from "./types";
import catalog from "../public/assets/mimi3d/catalog.json";

export type SceneKind = "reading-nook" | "kitchen" | "beach" | "farm" | "garden" | "winter" | "autumn-garden";
export type Mimi3DState = {
  mood: Mood; speaking: boolean; glasses: "none" | "black" | "blue";
  scene: SceneKind; props: string[]; audioLevel: number | null;
  readingSession: boolean;
  /** "none" hides the 3D room and clears to transparent so a reviewed book scene shows behind. */
  backdrop?: "room" | "none";
};
type V3 = [number, number, number];
const C = { fur: 0xffdca9, cream: 0xfff3dc, ear: 0xf49d96, ink: 0x44354b, blush: 0xf3ad98, lilac: 0x8772cd, mint: 0x6dbaa4, blue: 0x64bbdd, yellow: 0xf7c965, wood: 0xcba578 };
const sphereGeometry = () => new THREE.SphereGeometry(1, 28, 20);

function material(color: number, roughness = .82) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 });
}
function mesh(parent: THREE.Object3D, geometry: THREE.BufferGeometry, color: number, position: V3, scale: V3 = [1, 1, 1]) {
  const object = new THREE.Mesh(geometry, material(color));
  object.position.set(...position); object.scale.set(...scale);
  object.castShadow = true; object.receiveShadow = true; parent.add(object); return object;
}
function orb(parent: THREE.Object3D, color: number, position: V3, scale: V3) {
  return mesh(parent, sphereGeometry(), color, position, scale);
}
function box(parent: THREE.Object3D, color: number, position: V3, size: V3, radius = .06) {
  return mesh(parent, new RoundedBoxGeometry(...size, 3, Math.min(radius, Math.min(...size) / 2)), color, position);
}
function tube(parent: THREE.Object3D, points: V3[], radius: number, color: number) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
  return mesh(parent, new THREE.TubeGeometry(curve, 24, radius, 8, false), color, [0, 0, 0]);
}
function ring(parent: THREE.Object3D, radius: number, thickness: number, color: number, position: V3) {
  return mesh(parent, new THREE.TorusGeometry(radius, thickness, 10, 40), color, position);
}
function group(parent: THREE.Object3D, position: V3 = [0, 0, 0]) {
  const object = new THREE.Group(); object.position.set(...position); parent.add(object); return object;
}
function star(parent: THREE.Object3D, position: V3, size: number, color = C.yellow) {
  const shape = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? size * .48 : size;
    if (!i) shape.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else shape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  shape.closePath();
  return mesh(parent, new THREE.ExtrudeGeometry(shape, { depth: .045, bevelEnabled: true, bevelSize: .018, bevelThickness: .018, bevelSegments: 3, steps: 1 }), color, position);
}

/** A rounded ear with a thick fur rim, closed back and recessed pink bowl. */
function createEar(head: THREE.Object3D, side: number) {
  const ear = group(head, [side * .58, .44, -.025]);
  ear.name = side < 0 ? "ear-left" : "ear-right";
  ear.rotation.set(-.08, side * .12, -side * .19);
  const outline = new THREE.Shape();
  outline.moveTo(-.29, .035);
  outline.quadraticCurveTo(-.32, .13, -.072, .645);
  outline.quadraticCurveTo(0, .755, .072, .645);
  outline.quadraticCurveTo(.32, .13, .29, .035);
  outline.quadraticCurveTo(0, -.06, -.29, .035);
  const opening = new THREE.Path();
  opening.moveTo(-.19, .145);
  opening.quadraticCurveTo(0, .075, .19, .145);
  opening.quadraticCurveTo(.18, .23, .045, .515);
  opening.quadraticCurveTo(0, .59, -.045, .515);
  opening.quadraticCurveTo(-.18, .23, -.19, .145);
  mesh(ear, new THREE.ExtrudeGeometry(outline, { depth: .055, bevelEnabled: true, bevelSize: .026, bevelThickness: .026, bevelSegments: 4 }), C.fur, [0, 0, -.065]).name = "ear-back";
  outline.holes.push(opening);
  mesh(ear, new THREE.ExtrudeGeometry(outline, { depth: .18, bevelEnabled: true, bevelSize: .023, bevelThickness: .023, bevelSegments: 4 }), C.fur, [0, 0, 0]).name = "ear-rim";
  // The interior slopes back into the ear; it is not a flat decal on its tip.
  const boundary = opening.getPoints(16);
  const positions: number[] = [], indices: number[] = [];
  const rings = 5, count = boundary.length;
  for (let ring = 0; ring <= rings; ring++) {
    const r = ring / rings;
    for (const point of boundary) positions.push(point.x * r, .295 + (point.y - .295) * r, .065 + .115 * r * r);
  }
  for (let ring = 0; ring < rings; ring++) for (let i = 0; i < count - 1; i++) {
    const a = ring * count + i, b = a + count;
    indices.push(a, b, b + 1, a, b + 1, a + 1);
  }
  const bowl = new THREE.BufferGeometry();
  bowl.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  bowl.setIndex(indices); bowl.computeVertexNormals();
  mesh(ear, bowl, C.ear, [0, 0, 0]).name = "ear-inner-bowl";
  return ear;
}

function createReadingBook(root: THREE.Object3D) {
  const book = group(root, [0, .77, .94]);
  book.name = "reading-book";
  // Local +Z is the printed page side. Turn it toward Mimi and tilt up to her eyes.
  book.rotation.set(.48, Math.PI, 0);
  const grips: THREE.Object3D[] = [];
  box(book, 0x7460b5, [0, 0, -.012], [.075, .66, .088], .026).name = "book-spine";
  for (const side of [-1, 1]) {
    // Both covers hinge at their inner edge, never through their centres.
    const half = group(book, [side * .025, 0, 0]);
    half.name = side < 0 ? "book-left-leaf" : "book-right-leaf";
    // Local +Z points toward the reader. Lift both fore-edges into that side
    // of the book, leaving a valley at the spine rather than a backwards fold.
    half.rotation.y = -side * .28;
    box(half, C.lilac, [side * .285, 0, 0], [.57, .65, .054], .014).name = "book-cover";
    // The block rests directly on the inside cover, with a visible cover overhang.
    box(half, C.cream, [side * .285, 0, .048], [.53, .605, .042], .007).name = "book-pages";
    for (const z of [.035, .047, .059]) {
      box(half, 0xd9c9b3, [side * .285, .303, z], [.526, .002, .002], .0005).name = "book-page-edge";
    }
    for (let i = 0; i < 4; i++) box(half, 0xd9c4ac, [side * .285, .14 - i * .075, .071], [.33 - i % 2 * .08, .01, .002], .0005);
    // Two grip anchors are part of the book, so the paws follow the actual fore-edges.
    const grip = group(half, [side * .55, -.035, .005]); grip.name = "book-grip"; grips.push(grip);
  }
  return { book, grips };
}

export function createKitten(parent: THREE.Object3D) {
  const root = group(parent);
  root.name = "Mimi";
  const tail = group(root, [.6, .5, -.27]);
  tube(tail, [[0, 0, 0], [.65, -.13, .03], [.91, .18, .1], [.95, .55, .1], [.78, .72, .12]], .145, C.fur);
  orb(tail, C.cream, [.78, .72, .12], [.15, .15, .15]);
  // Breathe through the chest, not by stretching the head, book or feet.
  const torso = group(root, [0, .07, 0]); torso.name = "breathing-chest";
  orb(torso, C.fur, [0, .82, 0], [.68, .82, .51]);
  orb(torso, C.cream, [0, .87, .41], [.47, .54, .18]);
  for (const side of [-1, 1]) {
    orb(root, C.fur, [side * .48, .27, .38], [.32, .2, .36]);
    for (const offset of [-.06, .06]) tube(root, [[side * .48 + offset, .31, .69], [side * .48 + offset, .25, .73]], .009, 0xd7b494);
  }
  const head = group(root, [0, 2.04, 0]);
  orb(head, C.fur, [0, 0, 0], [1.01, .88, .75]).name = "head-fur";
  const ears = [-1, 1].map(side => createEar(head, side));
  // Subtle forehead markings instead of a large contrasting face patch.
  for (const x of [-.17, 0, .17]) orb(head, 0xe8ba85, [x, .69 - Math.abs(x) * .12, .44], [.044, .105, .022]).rotation.z = -x;
  const eyes = group(head, [0, .085, .685]);
  for (const side of [-1, 1]) {
    orb(eyes, C.ink, [side * .335, .04, .005], [.105, .135, .07]).material.roughness = .22;
    orb(eyes, 0xffffff, [side * .335 - .028, .09, .067], [.031, .037, .015]);
    orb(eyes, 0xecc9ad, [side * .335 + .028, .003, .069], [.013, .014, .008]);
    orb(head, C.blush, [side * .56, -.14, .626], [.14, .075, .025]);
    orb(head, C.cream, [side * .15, -.19, .719], [.235, .15, .103]);
    for (const dy of [-.055, .055]) tube(head, [[side * .67, -.13 + dy, .58], [side * .82, -.11 + dy * 1.4, .48], [side * .91, -.11 + dy * 1.7, .38]], .008, 0xb49782);
  }
  orb(head, 0xc07f7e, [0, -.115, .841], [.068, .043, .045]);
  const mouth = group(head, [0, -.255, .846]); mouth.name = "lower-mouth-opening";
  const mouthShape = new THREE.Shape();
  mouthShape.moveTo(-.13, 0); mouthShape.quadraticCurveTo(0, -.17, .13, 0); mouthShape.lineTo(-.13, 0);
  mesh(mouth, new THREE.ShapeGeometry(mouthShape), C.ink, [0, 0, 0]);
  orb(mouth, C.ear, [0, -.063, .006], [.062, .02, .007]);
  // Fixed upper muzzle and smile NEVER inherit mouth-opening scale.
  tube(head, [[0, -.145, .871], [0, -.215, .855], [-.09, -.27, .851], [-.18, -.24, .83]], .014, C.ink).name = "fixed-smile-left";
  tube(head, [[0, -.215, .855], [.09, -.27, .851], [.18, -.24, .83]], .014, C.ink).name = "fixed-smile-right";
  const glasses = group(head);
  const black = group(glasses), blue = group(glasses);
  for (const side of [-1, 1]) {
    ring(black, .207, .022, C.ink, [side * .32, .117, .795]);
    ring(blue, .215, .048, 0x399ac9, [side * .32, .117, .803]).scale.y = .87;
    const lens = orb(blue, 0x9cdef0, [side * .32, .117, .798], [.187, .163, .022]);
    lens.material.transparent = true; lens.material.opacity = .18; lens.material.depthWrite = false;
  }
  tube(black, [[-.11, .14, .8], [0, .18, .83], [.11, .14, .8]], .02, C.ink);
  tube(blue, [[-.11, .14, .81], [0, .19, .85], [.11, .14, .81]], .035, 0x399ac9);
  const { book } = createReadingBook(root);
  // Restore the original rounded paws exactly (archived reading-3d-2b23dd50f3).
  // No elongated tubes, curled fingers, or separate crossed-arm meshes.
  const paws = [-1, 1].map(side => {
    const paw = orb(root, C.fur, [side * .62, .84, .58], [.23, .3, .24]);
    paw.name = "book-holding-paw";
    return paw;
  });
  const apron = group(root);
  box(apron, C.mint, [0, 1.08, .53], [.55, .65, .035], .12);
  const bandage = group(head, [.59, -.14, .65]);
  box(bandage, 0xf4d0b2, [0, 0, 0], [.22, .09, .023], .03).rotation.z = -.3;
  const horns = group(head);
  for (const side of [-1, 1]) {
    const horn = mesh(horns, new THREE.ConeGeometry(.10, .3, 16), C.cream, [side * .44, .97, .12]);
    horn.rotation.z = side * -.3;
  }
  const hat = createProp(head, "sun-hat"); hat.position.set(0, .73, 0); hat.scale.set(2.3, 1.25, 2.3);
  star(root, [0, 1.34, .505], .085);
  return { root, torso, head, ears, eyes, mouth, tail, black, blue, paws, apron, bandage, horns, hat, book };
}

function plant(parent: THREE.Object3D, position: V3, size = 1) {
  const p = group(parent, position); p.scale.setScalar(size);
  mesh(p, new THREE.CylinderGeometry(.2, .15, .3, 20), 0xe8a589, [0, .15, 0]);
  for (let i = 0; i < 5; i++) {
    const a = i * 2.4;
    const leaf = orb(p, i % 2 ? 0x67a18d : 0x85b39a, [Math.cos(a) * .15, .48 + i * .035, Math.sin(a) * .15], [.105, .26, .075]);
    leaf.rotation.z = Math.cos(a) * -.5;
  }
}
function tree(parent: THREE.Object3D, x: number, z: number, color: number, size = 1) {
  const p = group(parent, [x, 0, z]); p.scale.setScalar(size);
  mesh(p, new THREE.CylinderGeometry(.11, .15, 1.5, 12), C.wood, [0, .75, 0]);
  for (const [dx, dy] of [[0, 1.9], [-.34, 1.63], [.34, 1.67]]) orb(p, color, [dx, dy, 0], [.54, .6, .44]);
}
function books(parent: THREE.Object3D, position: V3) {
  const p = group(parent, position);
  [C.lilac, C.ear, C.mint, C.yellow].forEach((color, i) => {
    box(p, color, [0, .07 + i * .13, 0], [.66 - (i % 2) * .08, .115, .44], .025).rotation.y = i * .09;
    box(p, C.cream, [.015, .075 + i * .13, .225], [.55 - (i % 2) * .08, .055, .008], .003);
  });
}

export function createScenery(parent: THREE.Object3D, kind: SceneKind) {
  const root = group(parent); root.name = `scene:${kind}`;
  const indoors = kind === "reading-nook" || kind === "kitchen";
  const winter = kind === "winter", autumn = kind === "autumn-garden";
  // A full floor and backdrop fill every canvas aspect, including shallow mobile stages.
  box(root, indoors ? 0xe4cbb0 : winter ? 0xe5edf4 : kind === "beach" ? 0xf2dca6 : 0xb5cca1, [0, -.15, 0], [100, .24, 100]);
  if (indoors) {
    box(root, 0xdcd5ef, [0, 5, -3.8], [100, 10, .2]);
    box(root, 0xc5b9d8, [0, .17, -3.65], [30, .27, .13]);
    const window = group(root, [-1.68, 2.75, -3.5]);
    box(window, 0xf8eddc, [0, 0, 0], [1.9, 2.14, .16], .32);
    box(window, 0x9ccedd, [0, .015, .1], [1.64, 1.87, .08], .26);
    orb(window, 0xffdc89, [.46, .46, .15], [.24, .24, .035]);
    for (let i = 0; i < 3; i++) orb(window, 0xeef5f2, [-.42 + i * .2, -.24 + (i % 2) * .1, .17], [.26, .13, .04]);
    box(window, 0xf8eddc, [0, 0, .22], [.065, 1.88, .08]);
    box(window, 0xf8eddc, [0, -.08, .22], [1.65, .065, .08]);
    box(window, 0xf8eddc, [0, -1.1, .13], [2.05, .13, .42]);
    if (kind === "kitchen") {
      box(root, 0xe8b38d, [1.98, .55, -2.8], [1.65, 1.1, .75]);
      box(root, C.cream, [1.98, 1.15, -2.77], [1.82, .12, .89]);
      box(root, 0x766b84, [2.3, .6, -2.39], [.61, .63, .06]);
      box(root, 0xb9ced4, [2.3, .6, -2.345], [.47, .42, .02]);
      box(root, C.cream, [2.3, .98, -2.34], [.39, .06, .07]);
      plant(root, [1.52, 1.22, -2.8], .65);
    } else {
      box(root, C.wood, [2.05, .76, -2.6], [1.45, 1.52, .5]);
      for (let row = 0; row < 2; row++) {
        box(root, 0xdcd5ef, [2.05, .4 + row * .69, -2.31], [1.24, .58, .04]);
        for (let i = 0; i < 5; i++) box(root, [C.lilac, C.ear, C.mint, C.yellow, 0x86afcf][i], [1.62 + i * .21, .35 + row * .7, -2.24], [.16, .41 + i % 2 * .07, .23], .012);
      }
      plant(root, [2.03, 1.54, -2.6], .85);
    }
    plant(root, [-1.72, 0, -.72], 1.2);
    books(root, [1.42, 0, -.9]);
    for (let i = 0; i < 3; i++) star(root, [.5 + i * .48, 3.26 + Math.sin(i) * .18, -3.46], .11, i % 2 ? C.cream : C.yellow);
  } else {
    if (kind === "beach") {
      box(root, 0x90cbcf, [0, -.003, -7.5], [90, .03, 10]);
      for (let i = 0; i < 4; i++) tube(root, [[-5, .02, -3.3 - i * .8], [0, .03, -3.6 - i * .8], [5, .02, -3.3 - i * .8]], .035, 0xe9f1df);
      mesh(root, new THREE.CylinderGeometry(.035, .035, 2.5, 12), C.wood, [-2.1, 1.25, -1.9]);
      mesh(root, new THREE.ConeGeometry(.98, .5, 32), C.ear, [-2.1, 2.5, -1.9]);
    } else {
      const foliage = winter ? 0xeaf2f3 : autumn ? 0xd6a26e : 0x8fb79b;
      tree(root, -2.25, -2.5, foliage, 1.25); tree(root, 2.65, -3.6, foliage, 1.4);
      for (let i = -6; i < 7; i++) box(root, winter ? 0xbdc6cd : 0xdac39f, [i * .48, .5, -3.4], [.32, 1, .1], .09);
      box(root, winter ? 0xbdc6cd : 0xdac39f, [0, .65, -3.32], [7, .13, .1]);
      if (kind === "farm") {
        box(root, 0xcf8f80, [0, 1, -5.6], [2, 2, 1.6]);
        const roof = mesh(root, new THREE.ConeGeometry(1.65, .9, 4), 0x947b84, [0, 2.45, -5.6]); roof.rotation.y = Math.PI / 4;
        box(root, C.cream, [0, .7, -4.76], [.7, 1.3, .06]);
      }
      if (winter) {
        orb(root, 0xfaf9f3, [-1.65, .4, -1.2], [.39, .4, .39]);
        orb(root, 0xfaf9f3, [-1.65, .95, -1.2], [.28, .28, .28]);
        for (const x of [-1.73, -1.57]) orb(root, C.ink, [x, .99, -.94], [.022, .022, .022]);
      }
      if (autumn) for (let i = 0; i < 16; i++) {
        const a = i * 2.39;
        orb(root, i % 2 ? 0xd79766 : C.yellow, [Math.sin(a) * 2.2, .02, Math.cos(a) * 1.8], [.09, .013, .15]).rotation.y = a;
      }
    }
    orb(root, C.yellow, [2.2, 4.5, -6], [.47, .47, .15]);
    for (const x of [-2.5, .1]) for (let i = 0; i < 3; i++) orb(root, 0xf6f5ef, [x + i * .36, 3.8 + i % 2 * .12, -5], [.42, .23, .2]);
  }
  const rug = mesh(root, new THREE.CylinderGeometry(1, 1, .075, 64), indoors ? 0xb5a3d5 : 0xead1a4, [0, -.006, .14], [1.65, 1, 1.14]);
  rug.receiveShadow = true;
  return root;
}

export function createProp(parent: THREE.Object3D, key: string) {
  const p = group(parent); p.name = `prop:${key}`;
  if (key === "cake" || key === "cupcake") {
    mesh(p, new THREE.CylinderGeometry(.22, .17, .28, 24), C.lilac, [0, .16, 0]);
    orb(p, C.cream, [0, .35, 0], [.23, .12, .23]); orb(p, C.ear, [0, .48, 0], [.065, .065, .065]);
  } else if (key === "mixing-bowl") {
    mesh(p, new THREE.SphereGeometry(.32, 24, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), C.yellow, [0, .33, 0]);
    const rim = ring(p, .32, .028, C.cream, [0, .33, 0]); rim.rotation.x = Math.PI / 2;
    tube(p, [[.05, .12, 0], [.19, .57, 0]], .032, C.wood);
  } else if (key === "monster-mask") {
    orb(p, 0x718ac5, [0, .34, 0], [.35, .31, .18]);
    for (const side of [-1, 1]) {
      orb(p, C.mint, [side * .29, .58, 0], [.11, .13, .065]);
      orb(p, C.ink, [side * .13, .41, .16], [.063, .063, .018]);
    }
    tube(p, [[-.15, .23, .17], [0, .18, .19], [.15, .23, .17]], .027, C.cream);
  } else if (key === "shells") {
    for (let i = 0; i < 3; i++) {
      const shell = group(p, [(i - 1) * .21, .075, (i % 2) * .13]);
      orb(shell, i % 2 ? C.ear : C.cream, [0, 0, 0], [.15, .07, .18]);
      for (let line = -2; line < 3; line++) tube(shell, [[0, .04, .15], [line * .045, .077, 0], [line * .05, .045, -.1]], .007, 0xd8b599);
    }
  } else if (["garden-snail", "blackbird-snail"].includes(key)) {
    orb(p, C.mint, [0, .08, 0], [.38, .09, .14]); orb(p, C.yellow, [0, .27, 0], [.23, .23, .17]);
    ring(p, .13, .025, C.wood, [0, .27, .165]);
    for (const x of [.27, .34]) tube(p, [[x, .12, .02], [x, .27, .02]], .015, C.mint);
    if (key === "blackbird-snail") {
      orb(p, C.ink, [.33, .64, 0], [.25, .16, .13]);
      orb(p, C.ink, [.1, .71, .03], [.12, .12, .12]);
      orb(p, C.yellow, [-.02, .65, .04], [.10, .035, .035]);
      orb(p, C.cream, [.09, .75, .14], [.02, .02, .008]);
    }
  } else if (key === "ice-cream") {
    const cone = mesh(p, new THREE.ConeGeometry(.18, .48, 24), C.wood, [0, .24, 0]); cone.rotation.z = Math.PI;
    orb(p, C.ear, [0, .52, 0], [.22, .22, .22]);
  } else if (key === "beach-ball") {
    orb(p, C.yellow, [0, .3, 0], [.3, .3, .3]); ring(p, .298, .025, C.ear, [0, .3, 0]);
  } else if (["milk-bottle", "toothpaste"].includes(key)) {
    box(p, C.cream, [0, .25, 0], [.25, .46, .2]); box(p, C.blue, [0, .15, .105], [.25, .15, .015]);
    box(p, C.blue, [0, .5, 0], [.14, .06, .16]);
  } else if (["toy-train", "broken-truck"].includes(key)) {
    box(p, C.mint, [0, .18, 0], [.64, .25, .27]); box(p, C.lilac, [.19, .4, 0], [.25, .27, .27]);
    for (const x of [-.22, .22]) for (const z of [-.15, .15]) orb(p, C.ink, [x, .08, z], [.09, .09, .04]);
  } else if (["toy-drum", "noise-makers"].includes(key)) {
    mesh(p, new THREE.CylinderGeometry(.28, .28, .3, 24), C.ear, [0, .2, 0]);
    mesh(p, new THREE.CylinderGeometry(.28, .28, .03, 24), C.cream, [0, .37, 0]);
    tube(p, [[-.32, .4, 0], [.05, .53, 0]], .025, C.wood);
  } else if (key === "story-book") {
    books(p, [0, 0, 0]);
  } else if (key === "coin-pouch") {
    orb(p, C.wood, [0, .22, 0], [.25, .24, .18]);
    ring(p, .13, .025, C.ink, [0, .42, 0]).rotation.x = Math.PI / 2;
    tube(p, [[-.12, .41, .06], [0, .37, .12], [.2, .23, .08]], .012, C.ink);
  } else if (key === "sandcastle") {
    box(p, 0xe6bf83, [0, .22, 0], [.5, .44, .35]);
    for (const x of [-.23, .23]) mesh(p, new THREE.CylinderGeometry(.11, .14, .6, 16), 0xe6bf83, [x, .3, 0]);
  } else if (["sun-hat", "bike-helmet", "hard-hat"].includes(key)) {
    orb(p, C.yellow, [0, .15, 0], [.33, .075, .3]); orb(p, C.yellow, [0, .27, 0], [.23, .2, .23]);
  } else if (key === "blueberries") {
    for (let i = 0; i < 7; i++) orb(p, 0x8580bf, [Math.sin(i * 2.4) * .18, .12 + i % 3 * .08, Math.cos(i * 2.4) * .14], [.085, .085, .085]);
  } else if (key === "bee-flowers") {
    plant(p, [0, 0, 0], .8);
    for (let i = 0; i < 5; i++) orb(p, C.ear, [Math.cos(i * 1.26) * .11, .6 + Math.sin(i * 1.26) * .11, .08], [.07, .07, .04]);
  } else if (key === "coin-toss") {
    const coin = mesh(p, new THREE.CylinderGeometry(.23, .23, .065, 24), C.yellow, [0, .3, 0]); coin.rotation.x = Math.PI / 2;
    star(p, [0, .3, .05], .12, C.cream);
  } else if (key === "factory-gear") {
    ring(p, .18, .075, C.blue, [0, .3, 0]);
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      box(p, C.blue, [Math.sin(a) * .24, .3 + Math.cos(a) * .24, 0], [.09, .13, .10], .01).rotation.z = -a;
    }
  } else if (key === "seagull" || key === "sheep") {
    orb(p, C.cream, [0, .24, 0], [.3, .22, .21]); orb(p, key === "sheep" ? C.wood : C.cream, [.25, .39, 0], [.15, .15, .15]);
    orb(p, C.ink, [.28, .43, .135], [.023, .023, .018]);
  } else if (["bear-paws", "self-hug", "cow-horns", "work-apron", "cheek-bandage", "goggles"].includes(key)) {
    // These are handled by the wearable/pose layer, never substituted with unrelated objects.
  }
  return p;
}

export function disposeObjects(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>();
  root.traverse(object => {
    if (object instanceof THREE.Mesh) {
      geometries.add(object.geometry);
      for (const mat of Array.isArray(object.material) ? object.material : [object.material]) materials.add(mat);
    }
  });
  geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose());
}

export function mouthScale(level: number | null, speaking: boolean, time: number) {
  if (!speaking) return .035;
  const amplitude = level === null ? (.3 + .7 * Math.abs(Math.sin(time * 10.5) * Math.sin(time * 6.2))) : Math.max(0, Math.min(1, Number.isFinite(level) ? level : 0));
  // About 24% more opening, without widening the mouth or changing the upper smile.
  return .035 + amplitude * 1.02;
}

export function mouthTapScale(elapsedSeconds: number) {
  if (!Number.isFinite(elapsedSeconds) || elapsedSeconds < 0 || elapsedSeconds >= .65) return .035;
  const open = THREE.MathUtils.smoothstep(elapsedSeconds, 0, .10);
  const close = 1 - THREE.MathUtils.smoothstep(elapsedSeconds, .18, .65);
  return .035 + .9 * open * close;
}

export function hitsMimi(raycaster: THREE.Raycaster, root: THREE.Object3D) {
  return raycaster.intersectObject(root, true).some(hit => {
    // Raycaster itself also reports invisible accessories: ignore hidden ancestors.
    let object: THREE.Object3D | null = hit.object;
    while (object) {
      if (!object.visible) return false;
      if (object === root) return true;
      object = object.parent;
    }
    return false;
  });
}

export function mimi3DPointer(clientX: number, clientY: number, bounds: { left: number; top: number; width: number; height: number }, faceNdc: { x: number; y: number }) {
  const range = Math.min(bounds.width, bounds.height) * .6;
  if (!(range > 0) || ![clientX, clientY, bounds.left, bounds.top, bounds.width, bounds.height, faceNdc.x, faceNdc.y].every(Number.isFinite)) return { x: 0, y: 0 };
  const faceX = bounds.left + (faceNdc.x + 1) * bounds.width / 2;
  const faceY = bounds.top + (1 - faceNdc.y) * bounds.height / 2;
  return { x: THREE.MathUtils.clamp((clientX - faceX) / range, -1, 1), y: THREE.MathUtils.clamp((clientY - faceY) / range, -1, 1) };
}

export function mimi3DLookPose(x: number, y: number, reduced = false) {
  const safe = (n: number) => Number.isFinite(n) ? THREE.MathUtils.clamp(n, -1, 1) : 0;
  x = safe(x); y = safe(y);
  return { yaw: reduced ? 0 : x * .18, pitch: .055 + (reduced ? 0 : y * .10), eyeX: x * .045, eyeY: .085 - y * .03 };
}

export function mimi3DSessionLookPose(readingSession: boolean, x: number, y: number, reduced = false) {
  // During a book, keep the original neutral face. No nods, tilts or audio poses.
  return mimi3DLookPose(readingSession ? 0 : x, readingSession ? 0 : y, reduced);
}

export function mimi3DLifeMotion(readingSession: boolean, elapsed: number, reduced = false) {
  if (reduced) return { chestX: 1, chestY: 1, chestZ: 1, swayZ: 0, tailYaw: 0 };
  const t = Number.isFinite(elapsed) ? Math.max(0, elapsed) : 0;
  const motion = 1;
  // A slow 4.8-second inhale/exhale; slightly quieter while reading.
  const breath = (1 - Math.cos(t * Math.PI * 2 / 4.8)) / 2 * motion;
  const depth = readingSession ? .007 : .012;
  // Tiny seated sways and occasional tail flicks, independent of mouse/audio cues.
  const playful = Math.pow(Math.max(0, Math.sin(t * Math.PI * 2 / 13)), 4);
  return {
    chestX: 1 + breath * depth * .6,
    chestY: 1 + breath * depth,
    chestZ: 1 + breath * depth * .8,
    swayZ: readingSession ? Math.sin(t * .85) * (.004 + .005 * playful) * motion : 0,
    tailYaw: (Math.sin(t * .8) * .07 + (readingSession ? Math.sin(t * 3) * .035 * playful : 0)) * motion,
  };
}

export function mountMimi3D(host: HTMLDivElement, readState: () => Mimi3DState, onError: () => void) {
  const scene = new THREE.Scene();
  const roomBackground = new THREE.Color(0xdde4ef), roomFog = new THREE.Fog(0xdde4ef, 12, 35);
  scene.background = roomBackground; scene.fog = roomFog;
  const camera = new THREE.PerspectiveCamera(35, 1, .1, 100);
  // Alpha lets a reviewed book scene show through when the 3D room is hidden.
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.22;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.setAttribute("aria-hidden", "true"); host.appendChild(renderer.domElement);
  scene.add(new THREE.HemisphereLight(0xfff7e9, 0xa9a5c7, 2.5));
  const sun = new THREE.DirectionalLight(0xfff1d7, 3.3); sun.position.set(-3, 6, 5); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024); sun.shadow.camera.left = -5; sun.shadow.camera.right = 5;
  sun.shadow.camera.top = 6; sun.shadow.camera.bottom = -4; sun.shadow.normalBias = .025; sun.shadow.bias = -.0001; scene.add(sun);
  const fill = new THREE.DirectionalLight(0xc9d9ff, 1.2); fill.position.set(4, 3, -2); scene.add(fill);
  const kitten = createKitten(scene);
  let background = createScenery(scene, readState().scene), backgroundKey = readState().scene;
  let propRoot = group(scene), propKey = "";
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  let visible = true, stopped = false, frame = 0, lastFrame = 0, mouth = .035;
  let lastTap = -Infinity;
  const tapRay = new THREE.Raycaster(), tapPoint = new THREE.Vector2();
  const tap = (event: MouseEvent) => {
    if (event.button !== 0) return;
    const bounds = renderer.domElement.getBoundingClientRect();
    if (bounds.width <= 0 || bounds.height <= 0) return;
    tapPoint.set((event.clientX - bounds.left) / bounds.width * 2 - 1, 1 - (event.clientY - bounds.top) / bounds.height * 2);
    if (Math.abs(tapPoint.x) > 1 || Math.abs(tapPoint.y) > 1) return;
    scene.updateMatrixWorld(true);
    tapRay.setFromCamera(tapPoint, camera);
    if (hitsMimi(tapRay, kitten.root)) lastTap = performance.now() / 1000;
    // Keep bubbling: the existing tap-to-read action and audio remain unchanged.
  };
  const pointer = new THREE.Vector2(), gaze = new THREE.Vector2(), face = new THREE.Vector3();
  const move = (event: PointerEvent) => {
    if (readState().readingSession) { leave(); gaze.set(0, 0); return; }
    if (event.pointerType !== "mouse" && event.pointerType !== "pen") { leave(); return; }
    const bounds = host.getBoundingClientRect();
    kitten.head.getWorldPosition(face).project(camera);
    const target = mimi3DPointer(event.clientX, event.clientY, bounds, face);
    pointer.set(target.x, target.y);
  };
  const leave = () => pointer.set(0, 0);
  const resize = () => {
    leave();
    const w = Math.max(1, host.clientWidth), h = Math.max(1, host.clientHeight);
    renderer.setSize(w, h, false); camera.aspect = w / h;
    // Fit the full kitten (ears, paws, book) for both portrait and landscape containers.
    const distance = Math.max(6.4, 3.7 / camera.aspect);
    camera.position.set(0, 2.7 + distance * .06, distance); camera.lookAt(0, 1.63, 0); camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  };
  const observer = new ResizeObserver(resize); observer.observe(host); resize();
  const intersection = new IntersectionObserver(entries => { visible = entries[0]?.isIntersecting ?? true; }); intersection.observe(host);
  let trackingPointer = false;
  const syncPointerTracking = (readingSession: boolean) => {
    if (readingSession) {
      if (trackingPointer) window.removeEventListener("pointermove", move);
      trackingPointer = false;
      pointer.set(0, 0); gaze.set(0, 0);
    } else if (!trackingPointer) {
      window.addEventListener("pointermove", move, { passive: true });
      trackingPointer = true;
    }
  };
  syncPointerTracking(readState().readingSession);
  document.documentElement.addEventListener("pointerleave", leave);
  window.addEventListener("blur", leave);
  window.addEventListener("scroll", leave, true);
  document.addEventListener("visibilitychange", leave);
  renderer.domElement.addEventListener("click", tap);
  const contextLost = (event: Event) => { event.preventDefault(); onError(); };
  renderer.domElement.addEventListener("webglcontextlost", contextLost);
  function render(now: number) {
    if (stopped) return;
    frame = requestAnimationFrame(render);
    if (!visible || document.hidden || now - lastFrame < 1000 / 30) return;
    const delta = Math.min(.1, (now - lastFrame) / 1000); lastFrame = now;
    const state = readState(), t = now / 1000, motion = reduced.matches ? 0 : 1;
    syncPointerTracking(state.readingSession);
    if (backgroundKey !== state.scene) {
      scene.remove(background); disposeObjects(background); background = createScenery(scene, state.scene); backgroundKey = state.scene;
    }
    const roomShown = state.backdrop !== "none";
    background.visible = roomShown;
    scene.background = roomShown ? roomBackground : null;
    scene.fog = roomShown ? roomFog : null;
    const nextKey = JSON.stringify(state.props);
    if (nextKey !== propKey) {
      scene.remove(propRoot); disposeObjects(propRoot); propRoot = group(scene); propKey = nextKey;
      [...new Set(state.props)].filter(key => catalog.props.includes(key) && !["sun-hat", "bike-helmet", "hard-hat"].includes(key)).slice(0, 3).forEach((key, index) => {
        const prop = createProp(propRoot, key); prop.position.set(index === 2 ? 0 : index ? -1.25 : 1.23, .075, index === 2 ? 1.5 : .63);
      });
    }
    const life = mimi3DLifeMotion(state.readingSession, t, reduced.matches);
    kitten.torso.scale.x = THREE.MathUtils.damp(kitten.torso.scale.x, life.chestX, 8, delta);
    kitten.torso.scale.y = THREE.MathUtils.damp(kitten.torso.scale.y, life.chestY, 8, delta);
    kitten.torso.scale.z = THREE.MathUtils.damp(kitten.torso.scale.z, life.chestZ, 8, delta);
    kitten.root.rotation.z = THREE.MathUtils.damp(kitten.root.rotation.z, life.swayZ, 5, delta);
    const tilt = state.mood === "curious" || state.mood === "listening" ? .065 : state.mood === "happy" ? -.05 : 0;
    gaze.x = THREE.MathUtils.damp(gaze.x, pointer.x, 9, delta);
    gaze.y = THREE.MathUtils.damp(gaze.y, pointer.y, 9, delta);
    const look = mimi3DSessionLookPose(state.readingSession, gaze.x, gaze.y, reduced.matches);
    kitten.head.rotation.z = state.readingSession ? 0 : tilt + Math.sin(t * 1.2) * .014 * motion;
    kitten.head.rotation.y = look.yaw;
    kitten.head.rotation.x = look.pitch;
    kitten.eyes.position.x = look.eyeX;
    kitten.eyes.position.y = look.eyeY;
    const blink = t % 5.4;
    kitten.eyes.scale.y = motion && blink > 5.14 ? Math.max(.07, Math.abs(blink - 5.27) / .13) : 1;
    const mouthTarget = Math.max(mouthScale(state.audioLevel, state.speaking, t), mouthTapScale(t - lastTap));
    mouth += (mouthTarget - mouth) * (1 - Math.exp(-22 * delta));
    kitten.mouth.scale.y = mouth;
    kitten.tail.rotation.y = THREE.MathUtils.damp(kitten.tail.rotation.y, life.tailYaw, 8, delta);
    kitten.black.visible = state.glasses === "black";
    kitten.blue.visible = state.glasses === "blue" || state.props.includes("goggles");
    kitten.apron.visible = state.props.includes("work-apron");
    kitten.bandage.visible = state.props.includes("cheek-bandage");
    kitten.horns.visible = state.props.includes("cow-horns");
    kitten.hat.visible = state.props.some(key => ["sun-hat", "bike-helmet", "hard-hat"].includes(key));
    const hugging = state.props.includes("self-hug");
    kitten.book.visible = !hugging;
    kitten.paws.forEach((paw, index) => {
      const target = (index ? 1 : -1) * (hugging ? .24 : .62);
      paw.position.x += (target - paw.position.x) * (1 - Math.exp(-6 * delta));
      paw.material.color.setHex(state.props.includes("bear-paws") ? C.wood : C.fur);
    });
    kitten.paws[1].rotation.z = state.speaking ? Math.sin(t * 3) * .04 * motion : 0;
    renderer.render(scene, camera);
  }
  frame = requestAnimationFrame(render);
  return () => {
    stopped = true; cancelAnimationFrame(frame); observer.disconnect(); intersection.disconnect();
    window.removeEventListener("pointermove", move);
    document.documentElement.removeEventListener("pointerleave", leave);
    window.removeEventListener("blur", leave);
    window.removeEventListener("scroll", leave, true);
    document.removeEventListener("visibilitychange", leave);
    renderer.domElement.removeEventListener("click", tap);
    renderer.domElement.removeEventListener("webglcontextlost", contextLost);
    disposeObjects(scene); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
  };
}
