import * as THREE from 'three';

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


