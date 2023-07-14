// varying vec3 vertexNormal;

// void main() {
//     float intensity = pow(0.7 - dot(vertexNormal, vec3(0, 0, 1.0)), 2.0);
//     gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
// }

uniform float time;
uniform vec2 resolution;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec2 center = vec2(0.5, 0.5);
  
  // Calculate distance from the center of the screen
  float distance = distance(uv, center);
  
  // Create a gradient effect based on the distance
  vec3 color = vec3(1.0, 0.8, 0.2) * smoothstep(0.3, 0.0, distance);
  
  // Add some pulsating effect using time
  float pulse = sin(time * 2.0) * 0.2 + 0.8;
  color *= pulse;
  
  // Output the final color
  gl_FragColor = vec4(color, 1.0);
}