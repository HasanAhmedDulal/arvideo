'use client'
import { useEffect, useRef } from "react";
// import DefaultVideo from "video/mobilephoe.mp4";

const fragmentShaderRaw = `
precision mediump float;

uniform sampler2D tex;
uniform float texWidth;
uniform float texHeight;

uniform vec3 keyColor;
uniform float similarity;
uniform float smoothness;
uniform float spill;

vec2 RGBtoUV(vec3 rgb) {
  return vec2(
    rgb.r * -0.169 + rgb.g * -0.331 + rgb.b *  0.5    + 0.5,
    rgb.r *  0.5   + rgb.g * -0.419 + rgb.b * -0.081  + 0.5
  );
}

vec4 ProcessChromaKey(vec2 texCoord) {
  vec4 rgba = texture2D(tex, texCoord);
  float chromaDist = distance(RGBtoUV(texture2D(tex, texCoord).rgb), RGBtoUV(keyColor));
  float baseMask = chromaDist - similarity;
  float fullMask = pow(clamp(baseMask / smoothness, 0., 1.), 1.5);
  rgba.a = fullMask;
  float spillVal = pow(clamp(baseMask / spill, 0., 1.), 1.5);
  float desat = clamp(rgba.r * 0.2126 + rgba.g * 0.7152 + rgba.b * 0.0722, 0., 1.);
  rgba.rgb = mix(vec3(desat, desat, desat), rgba.rgb, spillVal);
  return rgba;
}

void main(void) {
  vec2 texCoord = vec2(gl_FragCoord.x/texWidth, 1.0 - (gl_FragCoord.y/texHeight));
  gl_FragColor = ProcessChromaKey(texCoord);
}
`;

function init(gl) {
    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, "attribute vec2 c; void main(void) { gl_Position=vec4(c, 0.0, 1.0); }");
    gl.compileShader(vs);

    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, fragmentShaderRaw);
    gl.compileShader(fs);

    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(fs));
    }

    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const vb = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vb);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, 1, -1, -1, 1, -1, 1, 1]), gl.STATIC_DRAW);

    const coordLoc = gl.getAttribLocation(prog, "c");
    gl.vertexAttribPointer(coordLoc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(coordLoc);

    gl.activeTexture(gl.TEXTURE0);
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    return prog;
}

function hexColorToRGBPct(hex) {
    const match = hex.match(/^#([0-9a-f]{6})$/i);
    if (!match) return [0, 0, 0];
    const hexNum = match[1];
    return [
        parseInt(hexNum.substr(0, 2), 16) / 255,
        parseInt(hexNum.substr(2, 2), 16) / 255,
        parseInt(hexNum.substr(4, 2), 16) / 255,
    ];
}

function startProcessing(video, canvas, wgl, getConfig) {
    const { gl, prog } = wgl;

    const texLoc = gl.getUniformLocation(prog, "tex");
    const texWidthLoc = gl.getUniformLocation(prog, "texWidth");
    const texHeightLoc = gl.getUniformLocation(prog, "texHeight");
    const keyColorLoc = gl.getUniformLocation(prog, "keyColor");
    const similarityLoc = gl.getUniformLocation(prog, "similarity");
    const smoothnessLoc = gl.getUniformLocation(prog, "smoothness");
    const spillLoc = gl.getUniformLocation(prog, "spill");

    function render() {
        if (wgl.stopped) return;

        if (video.videoWidth !== canvas.width) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            gl.viewport(0, 0, video.videoWidth, video.videoHeight);
        }

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, video);
        gl.uniform1i(texLoc, 0);
        gl.uniform1f(texWidthLoc, video.videoWidth);
        gl.uniform1f(texHeightLoc, video.videoHeight);

        const config = getConfig();
        gl.uniform3f(keyColorLoc, config.keycolor[0], config.keycolor[1], config.keycolor[2]);
        gl.uniform1f(similarityLoc, config.similarity);
        gl.uniform1f(smoothnessLoc, config.smoothness);
        gl.uniform1f(spillLoc, config.spill);

        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

        if (wgl.stopped) return;

        if (wgl.useRequestVideoFrameCallback && wgl.requestVideoFrameCallbackIsAvailable) {
            video.requestVideoFrameCallback(render);
        } else {
            setTimeout(() => requestAnimationFrame(render), 1000 / 24);
        }
    }

    render();
}

export default function ProdReadyChromaDemo() {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const wglRef = useRef(null);

    useEffect(() => {
        if (!canvasRef.current || !videoRef.current) return;

        const gl = canvasRef.current.getContext("webgl", {
            premultipliedAlpha: false,
        });
        if (!gl) throw new Error("WebGL init failed");

        const prog = init(gl);
        const video = videoRef.current;

        // Force video play (autoplay with mute works)
        video.play().catch((err) => {
            console.warn("Autoplay failed", err);
        });

        const wgl = {
            gl,
            prog,
            stopped: false,
            useRequestVideoFrameCallback: true,
            requestVideoFrameCallbackIsAvailable: "requestVideoFrameCallback" in video,
            start: () => {
                const getConfig = () => {
                    const defaults = {
                        keycolor: "#11ff05",
                        similarity: 0.4,
                        smoothness: 0.08,
                        spill: 0.1,
                    };
                    return {
                        ...defaults,
                        keycolor: hexColorToRGBPct(defaults.keycolor),
                    };
                };
                startProcessing(video, canvasRef.current, wgl, getConfig);
            },
            stop: () => {
                wgl.stopped = true;
            },
        };

        wglRef.current = wgl;
        wgl.start();

        return () => {
            wgl.stop();
            gl.deleteProgram(prog);
        };
    }, []);

    const unmuteAndPlay = () => {
        const video = videoRef.current;
        if (video) {
            video.muted = false;
            video.play();
        }
    };
    const cameraRef = useRef(null);
    // Start the back camera
    useEffect(() => {
        navigator.mediaDevices
            .getUserMedia({
                video: { facingMode: { ideal: 'environment' } },
                audio: false,
            })
            .then((stream) => {
                if (cameraRef.current) {
                    cameraRef.current.srcObject = stream;
                }
            })
            .catch((err) => {
                console.error('Camera access error:', err);
            });
    }, []);
    return (

        <div className="fixed inset-0 z-0 flex items-center justify-center bg-black">
            {/* live streaming */}
            <video
                ref={cameraRef}
                autoPlay
                muted
                playsInline
                className="absolute top-0 left-0 w-full h-full object-cover z-0"
            />

            {/* remove greenscreen video */}
            <canvas
                className="absolute top-0 left-0 z-30 w-full h-full object-cover"
                ref={canvasRef}
                style={{ width: "100%", height: "auto", display: "block" }}
            />
            {/* input video */}
            <video
                ref={videoRef}
                src={'video/arvideo.mp4'}
                crossOrigin="anonymous"
                loop
                muted
                autoPlay
                playsInline
                style={{ display: "none" }}
            />
            <button
                onClick={unmuteAndPlay}
                className="btn btn-primary"
            >
                Enable Sound
            </button>
        </div>





    );
}
