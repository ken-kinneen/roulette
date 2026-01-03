import * as THREE from 'three';

/**
 * Fix material to be less shiny and fix transparency issues
 * @param {THREE.Material} mat - The material to fix
 * @returns {THREE.Material} - Fixed material
 */
export function fixMaterial(mat) {
  // Reduce shininess - increase roughness, reduce metalness
  if (mat.roughness !== undefined) {
    mat.roughness = Math.max(mat.roughness, 0.7);
  }
  if (mat.metalness !== undefined) {
    mat.metalness = Math.min(mat.metalness, 0.15);
  }
  
  // Fix transparency issues
  mat.transparent = false;
  mat.alphaTest = 0.5;
  mat.depthWrite = true;
  mat.depthTest = true;
  mat.side = THREE.FrontSide;
  
  return mat;
}

/**
 * Clone a scene and fix materials (reduce shininess, fix transparency)
 * @param {THREE.Object3D} scene - The scene to clone
 * @returns {THREE.Object3D} - Cloned scene with fixed materials
 */
export function cloneAndFixMaterials(scene) {
  const clone = scene.clone();
  
  clone.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material = child.material.map(mat => fixMaterial(mat.clone()));
        } else {
          child.material = fixMaterial(child.material.clone());
        }
      }
    }
  });
  
  return clone;
}

/**
 * Clone a scene while sharing materials to reduce texture units
 * @param {THREE.Object3D} scene - The scene to clone
 * @param {Map} materialCache - Optional cache to share materials across multiple clones
 * @returns {THREE.Object3D} - Cloned scene with shared materials
 */
export function cloneWithSharedMaterials(scene, materialCache = new Map()) {
  const clone = scene.clone();
  
  clone.traverse((child) => {
    if (child.isMesh && child.material) {
      // Handle both single materials and arrays of materials
      if (Array.isArray(child.material)) {
        child.material = child.material.map(mat => {
          const cacheKey = mat.uuid;
          if (!materialCache.has(cacheKey)) {
            materialCache.set(cacheKey, mat);
          }
          return materialCache.get(cacheKey);
        });
      } else {
        const cacheKey = child.material.uuid;
        if (!materialCache.has(cacheKey)) {
          materialCache.set(cacheKey, child.material);
        }
        child.material = materialCache.get(cacheKey);
      }
    }
  });
  
  return clone;
}

/**
 * Create a global material cache for a specific model
 * Use this to share materials across all instances of the same model
 */
export function createModelMaterialCache() {
  return new Map();
}


