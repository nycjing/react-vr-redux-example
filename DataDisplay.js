import * as THREE from 'three';
import React, { Component } from 'react';
import d3 from './d3.js';
import ReactFileReader from 'react-file-reader';


function createTextCanvas(text, color, font, size) {
    size = size || 16;
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    var fontStr = (size + 'px ') + (font || 'Arial');
    ctx.font = fontStr;
    var w = ctx.measureText(text).width;
    var h = Math.ceil(size);
    canvas.width = w;
    canvas.height = h;
    ctx.font = fontStr;
    ctx.fillStyle = color || 'black';
    ctx.fillText(text, 0, Math.ceil(size * 0.8));
    return canvas;
}

function createText2D(text, color, font, size, segW, segH) {
    var canvas = createTextCanvas(text, color, font, size);
    var plane = new THREE.PlaneGeometry(canvas.width, canvas.height, segW, segH);
    var tex = new THREE.Texture(canvas);
    tex.needsUpdate = true;
    var planeMat = new THREE.MeshBasicMaterial({
        map: tex,
        color: 0xffffff,
        transparent: true
    });
    var mesh = new THREE.Mesh(plane, planeMat);
    mesh.scale.set(0.5, 0.5, 0.5);
    mesh.doubleSided = true;
    return mesh;
}

function findMaxMin(data) {
    var xMin=data[0].x;
    var xMax=data[0].x;
    var yMin=data[0].y;
    var yMax=data[0].y;
    var zMin=data[0].z;
    var zMax=data[0].z;
    for (var i = 1; i < data.length; i ++) {
        if (+data[i].x > xMax) xMax = +data[i].x;
        if (+data[i].x < xMin) xMin = +data[i].x;
        if (+data[i].y > yMax) yMax = +data[i].y;
        if (+data[i].y < yMin) yMin = +data[i].y;
        if (+data[i].z > zMax) zMax = +data[i].z;
        if (+data[i].z < zMin) zMin = +data[i].z;
    }
    return [xMin,xMax,yMin,yMax,zMin,zMax];
}

function hexToRgb(hex) {
    var arrBuff = new ArrayBuffer(4);
    var vw = new DataView(arrBuff);
    vw.setUint32(0,parseInt(hex, 16),false);
    var arrByte = new Uint8Array(arrBuff);

    return arrByte[1] + "," + arrByte[2] + "," + arrByte[3];
}

function v(x, y, z) {
    return new THREE.Vector3(x, y, z);
}

export default class DataDisplay extends Component {

    constructor(props, context) {
        super(props)

        this.cameraPosition = new THREE.Vector3(0, 0, 5);

        this.state = {
            unfiltered : [{x:1,y:1,z:1},{x:2,y:2,z:2},{x:-1,y:-1,z:-1},{x:-2,y:-2,z:-2},{x:2,y:1,z:-1}],
            lowPass: [],
            highPass: [],
            vpts: {},
            xExent: [-4,4],
            yExent: [-4,4],
            zExent: [-4,4],
            paused: false,
            animating: false,
            down: false,
            sx: 0,
            sy:0,
        }
        this.start = this.start.bind(this)
        this.stop = this.stop.bind(this)
        this.animate = this.animate.bind(this)
        this.ondblclick = this.ondblclick.bind(this)
        this.onmousemove = this.onmousemove.bind(this)
        this.onmouseup = this.onmouseup.bind(this)
        this.onmousedown = this.onmousedown.bind(this)
        this.handleFiles = this.handleFiles.bind(this)
    }

    // componentDidMount () {
    //     var https = require("https");
    //
    //     var username = "6396a000c64c6fa919e7cafd02a35355";
    //     var password = "25873bae86605ea24d360215a9cee09b";
    //     var auth = "Basic " + new Buffer(username + ':' + password).toString('base64');
    //
    //     var request = https.request({
    //         method: "GET",
    //         host: "api.intrinio.com",
    //         path: "/companies?ticker=AAPL",
    //         headers: {
    //             "Authorization": auth
    //         }
    //     }, function(response) {
    //         var json = "";
    //         response.on('data', function (chunk) {
    //             json += chunk;
    //         });
    //         response.on('end', function() {
    //             var company = JSON.parse(json);
    //             console.log(company);
    //         });
    //     });
    //
    //     request.end();
    // }

    componentWillMount() {

        var unfiltered = this.state.unfiltered;
        var xExent = this.state.xExent;
        var yExent = this.state.yExent;
        var zExent = this.state.zExent;
        var vpts = {
            xMax: xExent[1],
            xCen: (xExent[1] + xExent[0]) / 2,
            xMin: xExent[0],
            yMax: yExent[1],
            yCen: (yExent[1] + yExent[0]) / 2,
            yMin: yExent[0],
            zMax: zExent[1],
            zCen: (zExent[1] + zExent[0]) / 2,
            zMin: zExent[0]
        }

        var renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        var w =1200;
        var h = 800;
        const format = (d) => d;
        renderer.setSize(w, h);
        // document.body.appendChild(renderer.domElement);
        renderer.setClearColor( 0xEEEEEE, 1.0 );

        var camera = new THREE.PerspectiveCamera(75, w / h, 1, 1000);
        camera.position.z = 300;
        camera.position.x = -100;
        camera.position.y = 100;

        var scene = new THREE.Scene();

        var scatterPlot = new THREE.Object3D();

        scene.add(scatterPlot);

        scatterPlot.rotation.y = 0;

        // var colour = d3.scale.category20c();
        var colour = d3.scaleOrdinal(d3.schemeCategory10);

        var xScale = d3.scaleLinear()
            .domain(xExent)
            .range([-50,50]);
        var yScale = d3.scaleLinear()
            .domain(yExent)
            .range([-50,50]);
        var zScale = d3.scaleLinear()
            .domain(zExent)
            .range([-50,50]);
        var lineGeo = new THREE.Geometry();
        lineGeo.vertices.push(
            v(xScale(vpts.xMin), yScale(vpts.yCen), zScale(vpts.zCen)), v(xScale(vpts.xMax), yScale(vpts.yCen), zScale(vpts.zCen)),
            v(xScale(vpts.xMax), yScale(vpts.yCen), zScale(vpts.zMin)), v(xScale(vpts.xMax), yScale(vpts.yCen), zScale(vpts.zMax)),
            v(xScale(vpts.xMin), yScale(vpts.yCen), zScale(vpts.zMax)), v(xScale(vpts.xMin), yScale(vpts.yCen), zScale(vpts.zMin)),
            v(xScale(vpts.xMax), yScale(vpts.yCen), zScale(vpts.zMin)), v(xScale(vpts.xMax), yScale(vpts.yMax), zScale(vpts.zMin)),
            v(xScale(vpts.xMax), yScale(vpts.yMax), zScale(vpts.zMax)), v(xScale(vpts.xMin), yScale(vpts.yMax), zScale(vpts.zMax)),
            v(xScale(vpts.xMin), yScale(vpts.yMax), zScale(vpts.zMin)), v(xScale(vpts.xMax), yScale(vpts.yMax), zScale(vpts.zMin)),
            v(xScale(vpts.xMax), yScale(vpts.yMax), zScale(vpts.zCen)), v(xScale(vpts.xMin), yScale(vpts.yMax), zScale(vpts.zCen)),
            v(xScale(vpts.xMin), yScale(vpts.yMin), zScale(vpts.zCen)), v(xScale(vpts.xMax), yScale(vpts.yMin), zScale(vpts.zCen)),
            v(xScale(vpts.xMax), yScale(vpts.yMin), zScale(vpts.zMin)), v(xScale(vpts.xMax), yScale(vpts.yMin), zScale(vpts.zMax)),
            v(xScale(vpts.xMin), yScale(vpts.yMin), zScale(vpts.zMax)), v(xScale(vpts.xMin), yScale(vpts.yMin), zScale(vpts.zMin)),
            v(xScale(vpts.xMax), yScale(vpts.yMin), zScale(vpts.zMin)), v(xScale(vpts.xMax), yScale(vpts.yMax), zScale(vpts.zMin)),
            v(xScale(vpts.xMax), yScale(vpts.yMax), zScale(vpts.zMax)), v(xScale(vpts.xMax), yScale(vpts.yMin), zScale(vpts.zMax)),
            v(xScale(vpts.xMax), yScale(vpts.yCen), zScale(vpts.zMax)), v(xScale(vpts.xMax), yScale(vpts.yCen), zScale(vpts.zMin)),
            v(xScale(vpts.xMin), yScale(vpts.yCen), zScale(vpts.zMin)), v(xScale(vpts.xMin), yScale(vpts.yMin), zScale(vpts.zMin)),
            v(xScale(vpts.xMin), yScale(vpts.yMax), zScale(vpts.zMin)), v(xScale(vpts.xMin), yScale(vpts.yMax), zScale(vpts.zMax)),
            v(xScale(vpts.xMin), yScale(vpts.yMin), zScale(vpts.zMax)), v(xScale(vpts.xCen), yScale(vpts.yMin), zScale(vpts.zMax)),
            v(xScale(vpts.xCen), yScale(vpts.yMin), zScale(vpts.zMax)), v(xScale(vpts.xCen), yScale(vpts.yMax), zScale(vpts.zMax)),
            v(xScale(vpts.xCen), yScale(vpts.yMax), zScale(vpts.zMin)), v(xScale(vpts.xCen), yScale(vpts.yMin), zScale(vpts.zMin)),
            v(xScale(vpts.xCen), yScale(vpts.yMin), zScale(vpts.zMax)), v(xScale(vpts.xCen), yScale(vpts.yCen), zScale(vpts.zMax)),
            v(xScale(vpts.xCen), yScale(vpts.yCen), zScale(vpts.zMin)),  v(xScale(vpts.xCen), yScale(vpts.yCen), zScale(vpts.zCen)),
            v(xScale(vpts.xMax), yScale(vpts.yCen), zScale(vpts.zCen)),  v(xScale(vpts.xMax), yScale(vpts.yMin), zScale(vpts.zCen)),
            v(xScale(vpts.xMax), yScale(vpts.yMax), zScale(vpts.zCen)),  v(xScale(vpts.xMax), yScale(vpts.yCen), zScale(vpts.zCen)),
            v(xScale(vpts.xMax), yScale(vpts.yMax), zScale(vpts.zCen)),  v(xScale(vpts.xCen), yScale(vpts.yMax), zScale(vpts.zCen)),
            v(xScale(vpts.xCen), yScale(vpts.yMin), zScale(vpts.zCen)),
            //

        );

        var lineMat = new THREE.LineBasicMaterial({
            color: 0x000000,
            // lineWidth: 1
        });
        var line = new THREE.Line(lineGeo, lineMat);
        line.type = THREE.Line;
        scatterPlot.add(line);

        var titleX = createText2D('-X');
        titleX.position.x = xScale(vpts.xMin) - 12;
        titleX.position.y = 5;
        scatterPlot.add(titleX);

        var valueX = createText2D(format(xExent[0]));
        valueX.position.x = xScale(vpts.xMin) - 12;
        valueX.position.y = -5;
        scatterPlot.add(valueX);

        var titleXX = createText2D('X');
        titleXX.position.x = xScale(vpts.xMax) + 12;
        titleXX.position.y = 5;
        scatterPlot.add(titleXX);

        var valueXX = createText2D(format(xExent[1]));
        valueXX.position.x = xScale(vpts.xMax) + 12;
        valueXX.position.y = -5;
        scatterPlot.add(valueXX);

        var titleY = createText2D('-Y');
        titleY.position.y = yScale(vpts.yMin) - 5;
        scatterPlot.add(titleY);

        var valueY = createText2D(format(yExent[0]));
        valueY.position.y = yScale(vpts.yMin) - 15;
        scatterPlot.add(valueY);

        var titleYY = createText2D('Y');
        titleYY.position.y = yScale(vpts.yMax) + 15;
        scatterPlot.add(titleYY);

        var valueYY = createText2D(format(yExent[1]));
        valueYY.position.y = yScale(vpts.yMax) + 5;
        scatterPlot.add(valueYY);

        var titleZ = createText2D('-Z ' + format(zExent[0]));
        titleZ.position.z = zScale(vpts.zMin) + 2;
        scatterPlot.add(titleZ);

        var titleZZ = createText2D('Z ' + format(zExent[1]));
        titleZZ.position.z = zScale(vpts.zMax) + 2;
        scatterPlot.add(titleZZ);

        var mat = new THREE.PointsMaterial({
            vertexColors: true,
            size: 10
        });

        var pointCount = unfiltered.length;
        var pointGeo = new THREE.Geometry();
        this.pointGeo = pointGeo
        for (var i = 0; i < pointCount; i ++) {
            var x = xScale(unfiltered[i].x);
            var y = yScale(unfiltered[i].y);
            var z = zScale(unfiltered[i].z);

            pointGeo.vertices.push(new THREE.Vector3(x, y, z));
            console.log(pointGeo.vertices[i]);
            console.log(  Math.random(), 0, 0);
            //pointGeo.vertices[i].angle = Math.atan2(z, x);
            //pointGeo.vertices[i].radius = Math.sqrt(x * x + z * z);
            //pointGeo.vertices[i].speed = (z / 100) * (x / 100);
            pointGeo.colors.push(new THREE.Color().setRGB(
                Math.random(), 0, 0
                // hexToRgb(colour(i)).r / 255, hexToRgb(colour(i)).g / 255, hexToRgb(colour(i)).b / 255
            ));

        }
        var points = new THREE.Points(pointGeo, mat);
        scatterPlot.add(points);
        console.log('scene',scene);
        console.log('camera',camera);
        this.scene = scene
        this.camera = camera
        this.renderer = renderer
        // this.material = material
        // if (this.mount)
        // {this.mount.appendChild(this.renderer.domElement) }
        // else
        document.body.appendChild(this.renderer.domElement)
        console.log('this.mount', this.mount,this.renderer.domElement,this.state.paused,this.state.animating )
        var paused = false;
        var last = new Date().getTime();
        var down = false;
        var sx = 0,
            sy = 0;

        window.onmousedown = function(ev) {
            down = true;
            sx = ev.clientX;
            sy = ev.clientY;
        };
        window.onmouseup = function() {
            down = false;
        };
        window.onmousemove = function(ev) {
            if (down) {
                var dx = ev.clientX - sx;
                var dy = ev.clientY - sy;
                scatterPlot.rotation.y += dx * 0.01;
                camera.position.y += dy;
                sx += dx;
                sy += dy;
            }
        }
        var animating = false;
        window.ondblclick = function() {
            animating = !animating;
        };
        this.start()
        console.log(this.frameId );
        // this.renderScene()
        this.animate()

    }

    componentWillUnmount() {
        this.stop()
        // this.renderer.clear();
        // if(this.mount) { this.mount.removeChild(this.renderer.domElement)}
        // else
        document.body.removeChild(this.renderer.domElement);
        // this.mount.removeChild(this.renderer.domElement)
    }

    start() {
        if (!this.frameId) {
            this.frameId = requestAnimationFrame(this.animate)
        }
    }

    stop() {
        cancelAnimationFrame(this.frameId)
    }

    onmousedown(evt){
        evt.preventDefault()

        this.setState({
            down: true,
            sx: evt.clientX,
            sy : evt.clientY,
        })
        console.log('down?',this.state.down,this.state.sx,this.state.sx  )
    }

    onmouseup(){
        this.setState({down : false})
    }

    onmousemove(evt){
        evt.preventDefault()
        console.log('down?',this.state.down,this.state.sx )
        if (this.state.down) {
            var dx = evt.clientX - this.state.sx;
            var dy = evt.clientY - this.state.sy;

            // var euler = new THREE.Euler( dx*0.01, dy, 0, 'XYZ' );
            // this.pointGeo.applyEuler(euler);
            this.scatterPlot.rotation.y += dx * 0.01;
            this.camera.position.y += dy;
            this.setState({sx : this.state.sx+dx,sy : this.state.sy+dy});
        }
    }


    ondblclick(){
        this.setState({ animating : !this.state.animating});
    }


    animate() {

        if (!this.state.paused) {
            // var last = new Date().getTime();
            if (this.state.animating) {
                var v = this.pointGeo.vertices;
                for (var i = 0; i < v.length; i++) {
                    var u = v[i];
                    console.log(u)
                    u.angle += u.speed * 0.01;
                    u.x = Math.cos(u.angle) * u.radius;
                    u.z = Math.sin(u.angle) * u.radius;
                }
                this.pointGeo.__dirtyVertices = true;
            }
            this.renderer.clear();
            this.camera.lookAt(this.scene.position);
            this.renderScene()
        }

        this.frameId = window.requestAnimationFrame(this.animate)
    };

    onmessage = function(ev) {
        this.setState({paused : (ev.data === 'pause')});
    };


    renderScene() {
        this.renderer.render(this.scene, this.camera)
    }


    handleFiles = files => {
        var output;
        var reader = new FileReader();

        reader.onload = function (e) {
            // Use reader.result
            var csv = reader.result;
            var lines = csv.split("\n");
            var result = [];
            var headers = lines[0].split(",");
            for (var i = 1; i < lines.length; i++) {
                var obj = {};
                var currentline = lines[i].split(",");
                for (var j = 0; j < headers.length; j++) {
                    obj[headers[j]] = currentline[j];
                }
                result.push(obj);
            }
            console.log(result);
            output = result; //JavaScript object
            // result = JSON.stringify(result); //JSON
            // console.log(result);
        }

        reader.readAsText(files[0])
        setTimeout(()=>{
            console.log(output);
            var unfiltered = [];
            for (var i = 0; i < output.length; i++) {
                unfiltered[i]={x: +output[i].x, y : +output[i].y, z: +output[i].z};
            }
            console.log('updated',unfiltered)

            var maxMin= findMaxMin(unfiltered);
            console.log(maxMin);

            var xExent = [maxMin[0],maxMin[1]];
            var yExent = [maxMin[2],maxMin[3]];
            var zExent = [maxMin[4],maxMin[5]];

            var vpts = {
                xMax: xExent[1],
                xCen: (xExent[1] + xExent[0]) / 2,
                xMin: xExent[0],
                yMax: yExent[1],
                yCen: (yExent[1] + yExent[0]) / 2,
                yMin: yExent[0],
                zMax: zExent[1],
                zCen: (zExent[1] + zExent[0]) / 2,
                zMin: zExent[0]
            }


            this.setState({
                unfiltered,
                vpts,
                xExent,
                yExent,
                zExent,
            });
            this.componentWillUnmount()
            this.componentWillMount()
        }, 1000);

    }

    render() {
        return (

            <div>
                <div
                    style={{ width: '900px', height: '600px' }}
                    ref={(mount) => { this.mount = mount }}
                />

                <div>
                    <ReactFileReader handleFiles={this.handleFiles}>
                        <button className='btn'>Upload</button>
                    </ReactFileReader>
                </div>


            </div>

        )
    }

}