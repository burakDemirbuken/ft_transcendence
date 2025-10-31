// Global BABYLON declaration for CDN-loaded Babylon.js
// Using 'any' to bypass strict typing while maintaining namespace structure

declare namespace BABYLON {
  class Scene {
    [key: string]: any;
  }
  class Engine {
    [key: string]: any;
  }
  class UniversalCamera {
    [key: string]: any;
  }
  class Vector3 {
    [key: string]: any;
  }
  class Color3 {
    [key: string]: any;
  }
  class Color4 {
    [key: string]: any;
  }
  class HemisphericLight {
    [key: string]: any;
  }
  class SceneLoader {
    [key: string]: any;
  }
  class AbstractMesh {
    [key: string]: any;
  }
  class Mesh {
    [key: string]: any;
  }
  class DynamicTexture {
    [key: string]: any;
  }
  class Texture {
    [key: string]: any;
  }
  class StandardMaterial {
    [key: string]: any;
  }
  class MeshBuilder {
    [key: string]: any;
  }
  class Scalar {
    [key: string]: any;
  }
  class Tools {
    [key: string]: any;
  }
}

// Declare BABYLON as a global variable (loaded from CDN)
declare const BABYLON: typeof BABYLON;
