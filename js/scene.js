// 场景、球体生成、变换逻辑
const canvas = document.getElementById('canvas');
const gl = canvas.getContext('webgl2');

let sun, earth, moon;
let sunAngle = 0;
let earthRevolve = 0;
let earthRotate = 0;
let moonRevolve = 0;
let moonRotate = 0;
let earthTilt = 23.5;

// 球体生成函数
function createSphere(radius, segW, segH) {
    const positions = [];
    const texCoords = [];
    const indices = [];
    for(let h=0; h<=segH; h++){
        const phi = h * Math.PI / segH;
        const sinPhi = Math.sin(phi);
        const cosPhi = Math.cos(phi);
        for(let w=0; w<=segW; w++){
            const theta = w * 2 * Math.PI / segW;
            const sinTh = Math.sin(theta);
            const cosTh = Math.cos(theta);
            positions.push(radius * cosTh * sinPhi, radius * cosPhi, radius * sinTh * sinPhi);
            texCoords.push(w/segW, h/segH);
        }
    }
    for(let h=0; h<segH; h++){
        for(let w=0; w<segW; w++){
            const a = h*(segW+1)+w;
            const b = a + segW + 1;
            indices.push(a,b,a+1);
            indices.push(b,b+1,a+1);
        }
    }
    return {positions, texCoords, indices};
}

// 创建三个球体
sun = createSphere(0.8, 40, 40);
earth = createSphere(0.4, 40, 40);
moon = createSphere(0.2, 40, 40);

// 矩阵工具
function mat4Identity(){
    return [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
}
function mat4Multiply(a,b){
    const out = new Array(16).fill(0);
    for(let i=0;i<4;i++){
        for(let j=0;j<4;j++){
            for(let k=0;k<4;k++){
                out[i*4+j] += a[k*4+j] * b[i*4+k];
            }
        }
    }
    return out;
}
function mat4RotateY(angle){
    const r = angle * Math.PI / 180;
    const c = Math.cos(r), s = Math.sin(r);
    return [c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1];
}
function mat4RotateX(angle){
    const r = angle * Math.PI / 180;
    const c = Math.cos(r), s = Math.sin(r);
    return [1,0,0,0, 0,c,s,0, 0,-s,c,0, 0,0,0,1];
}
function mat4Translate(x,y,z){
    return [1,0,0,0, 0,1,0,0, 0,0,1,0, x,y,z,1];
}
function mat4Perspective(fov, aspect, near, far){
    const f = 1/Math.tan(fov*Math.PI/360);
    return [f/aspect,0,0,0, 0,f,0,0, 0,0,-(far+near)/(far-near),-1, 0,0,-2*far*near/(far-near),0];
}

// 更新角度，由main驱动
function updateAngles(speed1, speed2, tiltVal){
    earthTilt = tiltVal;
    sunAngle += 0.2 * speed1;
    earthRevolve += 0.15 * speed1;
    earthRotate += 0.8 * speed2;
    moonRevolve += 0.4 * speed1;
    moonRotate += 0.6 * speed2;
}

function getSunMatrix(){
    let m = mat4Identity();
    m = mat4Multiply(mat4RotateY(sunAngle), m);
    return m;
}
function getEarthMatrix(){
    let m = mat4Identity();
    m = mat4Multiply(mat4RotateY(earthRevolve), m);
    m = mat4Multiply(mat4Translate(3.5,0,0), m);
    m = mat4Multiply(mat4RotateX(earthTilt), m);
    m = mat4Multiply(mat4RotateY(earthRotate), m);
    return m;
}
function getMoonMatrix(){
    let m = mat4Identity();
    m = mat4Multiply(mat4RotateY(earthRevolve), m);
    m = mat4Multiply(mat4Translate(3.5,0,0), m);
    m = mat4Multiply(mat4RotateY(moonRevolve), m);
    m = mat4Multiply(mat4Translate(1.2,0,0), m);
    m = mat4Multiply(mat4RotateY(moonRotate), m);
    return m;
}

export { gl, canvas, sun, earth, moon, getSunMatrix, getEarthMatrix, getMoonMatrix, updateAngles, mat4Perspective, mat4Identity, mat4Multiply, mat4RotateX, mat4RotateY, mat4Translate };