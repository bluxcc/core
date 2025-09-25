import React, { useRef, useEffect } from "react";

const COLOR_THEMES = {
  purple: {
    id: "purple_gradient",
    colors: [
      [0.992, 0.878, 1.0], // #FDE0FF
      [0.992, 0.878, 1.0], // #FDE0FF
      [0.592, 0.451, 1.0], // #9773FF
      [0.792, 0.663, 1.0], // #CAA9FF
    ],
  },
};

type AnimatedGradientType = {
  theme: keyof typeof COLOR_THEMES;
  className?: string;
  children?: React.ReactNode;
  animationSpeed?: number;
  onClick?: () => void;
  size?: string;
  style?: React.CSSProperties;
};

const AnimatedGradient = ({
  theme = "purple",
  className = "",
  children,
  animationSpeed = 1.0,
  onClick,
  style,
  size = "100%",
}: AnimatedGradientType) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationIdRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl");
    if (!gl) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // --- Helpers ---
    const compile = (src: string, type: number) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        //
      }
      return shader;
    };

    const program = gl.createProgram()!;
    const vertexShader = compile(
      `
      attribute vec2 aPos;
      varying vec2 vUv;
      void main() {
        vUv = (aPos + 1.0) * 0.5;
        gl_Position = vec4(aPos, 0.0, 1.0);
      }
      `,
      gl.VERTEX_SHADER,
    );

    const fragmentShader = compile(
      `
      precision mediump float;
      uniform float uTime;
      uniform vec2 uResolution;
      uniform vec3 uColor1;
      uniform vec3 uColor2;
      uniform vec3 uColor3;
      uniform vec3 uColor4;
      varying vec2 vUv;

      float noise(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
      }
      float smoothNoise(vec2 st) {
        vec2 i=floor(st),f=fract(st);
        float a=noise(i);
        float b=noise(i+vec2(1.,0.));
        float c=noise(i+vec2(0.,1.));
        float d=noise(i+vec2(1.,1.));
        vec2 u=f*f*(3.-2.*f);
        return mix(a,b,u.x)+(c-a)*u.y*(1.-u.x)+(d-b)*u.x*u.y;
      }
      float fbm(vec2 st){
        float v=0.,a=0.7;
        for(int i=0;i<2;i++){
          v+=a*smoothNoise(st);
          st*=1.8;a*=0.4;
        }
        return v;
      }

      void main(){
        vec2 st=vUv;
        float time=uTime*0.12;
        vec2 center=vec2(0.5);
        vec2 fromCenter=st-center;
        float rot=time*0.3;
        float c=cos(rot),s=sin(rot);
        vec2 rotated=vec2(
          fromCenter.x*c-fromCenter.y*s,
          fromCenter.x*s+fromCenter.y*c
        )+center;

        vec2 pos=st;
        pos+=vec2(
          fbm(rotated*1.2+time*0.4)*0.08,
          fbm(rotated*1.2+time*0.5+50.0)*0.08
        );

        float mixX=clamp(pos.x+fbm(rotated*1.0+time*0.6)*0.25,0.,1.);
        float mixY=clamp(pos.y+fbm(rotated*1.0+time*0.7)*0.25,0.,1.);

        vec3 topColors=mix(uColor1,uColor2,smoothstep(0.1,0.9,mixX));
        vec3 bottomColors=mix(uColor3,uColor4,smoothstep(0.1,0.9,mixX));
        vec3 finalColor=mix(topColors,bottomColors,smoothstep(0.1,0.9,mixY));

        gl_FragColor=vec4(finalColor,1.0);
      }
      `,
      gl.FRAGMENT_SHADER,
    );

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    // Quad
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const aPos = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    // Uniforms
    const uTime = gl.getUniformLocation(program, "uTime");
    const uResolution = gl.getUniformLocation(program, "uResolution");
    const uColor1 = gl.getUniformLocation(program, "uColor1");
    const uColor2 = gl.getUniformLocation(program, "uColor2");
    const uColor3 = gl.getUniformLocation(program, "uColor3");
    const uColor4 = gl.getUniformLocation(program, "uColor4");

    const colors = COLOR_THEMES[theme].colors;
    gl.uniform2f(uResolution, rect.width, rect.height);
    gl.uniform3fv(uColor1, colors[0]);
    gl.uniform3fv(uColor2, colors[1]);
    gl.uniform3fv(uColor3, colors[2]);
    gl.uniform3fv(uColor4, colors[3]);

    let t = 0;
    const render = () => {
      animationIdRef.current = requestAnimationFrame(render);
      t += 0.015 * animationSpeed;
      gl.uniform1f(uTime, t);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    render();

    return () => {
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
      gl.deleteProgram(program);
      gl.deleteBuffer(buffer);
    };
  }, [theme, animationSpeed]);

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden ${className}`}
      style={style}
      data-gradient-id={COLOR_THEMES[theme]?.id || "unknown_gradient"}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0"
        style={{ width: size, height: size }}
      />
      {children && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          {children}
        </div>
      )}
    </div>
  );
};

export default AnimatedGradient;
