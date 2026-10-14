import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
import {runInNewContext} from "node:vm";

type Rect={x:number;y:number;width:number;height:number};
type Geometry={snowY:number;pivot:[number,number];board:Rect;boot:Rect&{radius:number};footbed:Rect;angle:number;rotation:number;contact:boolean;point:[number,number];gap:number};
// Exercise the production pure helper without starting the application's DOM.
const source=readFileSync(new URL("../app.js",import.meta.url),"utf8");
const start=source.indexOf("function bootClearanceGeometry("),end=source.indexOf("function mountIllustration(",start);
assert.ok(start>=0&&end>start);
const geometry=runInNewContext(`(${source.slice(start,end).trim()})`) as (shift:number,side:"toe"|"heel",angle:number)=>Geometry;
const rotate=(p:[number,number],g:Geometry):[number,number]=>{
  const a=g.rotation*Math.PI/180,c=Math.cos(a),s=Math.sin(a),x=p[0]-g.pivot[0],y=p[1]-g.pivot[1];
  return [g.pivot[0]+c*x-s*y,g.pivot[1]+s*x+c*y];
};
function bootBoundary(g:Geometry){
  const b=g.boot,r=b.radius,points:Array<[number,number]>=[];
  for(const [cx,cy,start] of [[b.x+b.width-r,b.y+r,-90],[b.x+b.width-r,b.y+b.height-r,0],[b.x+r,b.y+b.height-r,90],[b.x+r,b.y+r,180]]){
    for(let i=0;i<=120;i++){
      const a=(start+i*90/120)*Math.PI/180;
      points.push(rotate([cx+r*Math.cos(a),cy+r*Math.sin(a)],g));
    }
  }
  return points;
}

test("all 18 equipment views keep the board on snow and stop the real rounded boot at contact",()=>{
  let contacts=0;
  for(const shift of [-25,0,25])for(const side of ["toe","heel"] as const)for(const angle of [0,20,40]){
    const g=geometry(shift,side,angle),b=g.board,boundary=bootBoundary(g),lowest=Math.max(...boundary.map(p=>p[1]));
    assert.equal(g.pivot[1],g.snowY);
    for(const point of [[b.x,b.y],[b.x+b.width,b.y],[b.x,b.y+b.height],[b.x+b.width,b.y+b.height]] as Array<[number,number]>)assert.ok(rotate(point,g)[1]<=g.snowY+1e-9);
    assert.ok(lowest<=g.snowY+1e-8,"boot must not pass through snow");
    assert.ok(Math.abs(g.point[1]-lowest)<.001,"indicator follows the rounded outline, not its bounding corner");
    assert.equal(g.footbed.y+g.footbed.height,b.y);
    assert.equal(g.boot.y+g.boot.height,g.footbed.y);
    assert.ok(g.footbed.x>=b.x&&g.footbed.x+g.footbed.width<=b.x+b.width);
    if(g.contact){
      contacts++;
      assert.ok(Math.abs(g.point[1]-g.snowY)<1e-8);
      assert.ok(g.angle<angle,"requested larger inclination is visibly stopped at first contact");
    }else{
      assert.equal(g.angle,angle);
      assert.ok(g.gap>0);
    }
  }
  assert.equal(contacts,2,"only a large tilt toward the biased boot side contacts in this authored illustration");
});

test("opposite centering and edges mirror the complete clearance geometry",()=>{
  for(const shift of [-25,0,25])for(const angle of [0,20,40]){
    const toe=geometry(shift,"toe",angle),heel=geometry(-shift,"heel",angle);
    assert.equal(toe.contact,heel.contact);
    assert.ok(Math.abs(toe.angle-heel.angle)<1e-10);
    assert.ok(Math.abs(toe.point[0]+heel.point[0]-560)<1e-8);
    assert.ok(Math.abs(toe.point[1]-heel.point[1])<1e-8);
    assert.ok(Math.abs(toe.gap-heel.gap)<1e-8);
  }
});

test("contact persists when larger inclination is requested without increasing penetration",()=>{
  const atLarge=geometry(25,"toe",40),before=geometry(25,"toe",atLarge.angle-.1),after=geometry(25,"toe",atLarge.angle+.1);
  assert.equal(before.contact,false);
  assert.equal(after.contact,true);
  assert.ok(before.point[1]<before.snowY);
  assert.ok(Math.abs(after.point[1]-after.snowY)<1e-8);
  assert.ok(Math.abs(after.angle-atLarge.angle)<1e-8);
});
