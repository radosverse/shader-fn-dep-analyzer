/**
 * Vulkan GLSL Extension Scanner - Browser Version
 * Uses File API to scan shader folders selected by user
 *
 * Usage:
 * 1. Include this script in an HTML page
 * 2. Call scanDirectoryWithFileAPI(files) with FileList from input[type=file][webkitdirectory]
 * 3. Results are returned as structured data
 */

// Extension database - constants defining all Vulkan GLSL extensions
const EXTENSIONS_DATABASE = {
  "GL_KHR_shader_subgroup": {
    functions: [
      "subgroupBarrier", "subgroupMemoryBarrier", "subgroupMemoryBarrierBuffer",
      "subgroupMemoryBarrierShared", "subgroupMemoryBarrierImage",
      "subgroupElect", "subgroupAll", "subgroupAny", "subgroupAllEqual",
      "subgroupBallot", "subgroupInverseBallot", "subgroupBallotBitExtract",
      "subgroupBallotBitCount", "subgroupBallotInclusiveBitCount",
      "subgroupBallotExclusiveBitCount", "subgroupBallotFindLSB", "subgroupBallotFindMSB",
      "subgroupBroadcast", "subgroupBroadcastFirst",
      "subgroupShuffle", "subgroupShuffleXor", "subgroupShuffleUp", "subgroupShuffleDown",
      "subgroupAdd", "subgroupMul", "subgroupMin", "subgroupMax",
      "subgroupAnd", "subgroupOr", "subgroupXor",
      "subgroupInclusiveAdd", "subgroupInclusiveMul", "subgroupInclusiveMin", "subgroupInclusiveMax",
      "subgroupInclusiveAnd", "subgroupInclusiveOr", "subgroupInclusiveXor",
      "subgroupExclusiveAdd", "subgroupExclusiveMul", "subgroupExclusiveMin", "subgroupExclusiveMax",
      "subgroupExclusiveAnd", "subgroupExclusiveOr", "subgroupExclusiveXor",
      "subgroupClusteredAdd", "subgroupClusteredMul", "subgroupClusteredMin", "subgroupClusteredMax",
      "subgroupClusteredAnd", "subgroupClusteredOr", "subgroupClusteredXor",
      "subgroupQuadBroadcast", "subgroupQuadSwapHorizontal", "subgroupQuadSwapVertical", "subgroupQuadSwapDiagonal"
    ],
    types: [],
    built_in_variables: [
      "gl_SubgroupSize", "gl_SubgroupInvocationID", "gl_NumSubgroups", "gl_SubgroupID",
      "gl_SubgroupEqMask", "gl_SubgroupGeMask", "gl_SubgroupGtMask", "gl_SubgroupLeMask", "gl_SubgroupLtMask"
    ],
    qualifiers: [],
    constants: [],
    keywords: []
  },

  "GL_KHR_memory_scope_semantics": {
    functions: [],
    types: [],
    built_in_variables: [],
    qualifiers: ["shadercallcoherent"],
    constants: ["gl_ScopeDevice", "gl_ScopeWorkgroup", "gl_ScopeSubgroup", "gl_ScopeInvocation", "gl_ScopeShaderCallEXT"],
    keywords: []
  },

  "GL_KHR_cooperative_matrix": {
    functions: ["coopMatLoad", "coopMatStore", "coopMatMulAdd"],
    types: ["coopmat"],
    built_in_variables: [],
    qualifiers: [],
    constants: [],
    keywords: []
  },

  "GL_EXT_ray_tracing": {
    functions: ["traceRayEXT", "reportIntersectionEXT", "executeCallableEXT"],
    types: ["accelerationStructureEXT"],
    built_in_variables: [
      "gl_LaunchIDEXT", "gl_LaunchSizeEXT", "gl_PrimitiveID", "gl_InstanceID",
      "gl_InstanceCustomIndexEXT", "gl_GeometryIndexEXT",
      "gl_WorldRayOriginEXT", "gl_WorldRayDirectionEXT", "gl_ObjectRayOriginEXT", "gl_ObjectRayDirectionEXT",
      "gl_RayTminEXT", "gl_RayTmaxEXT", "gl_IncomingRayFlagsEXT",
      "gl_HitTEXT", "gl_HitKindEXT",
      "gl_ObjectToWorldEXT", "gl_ObjectToWorld3x4EXT", "gl_WorldToObjectEXT", "gl_WorldToObject3x4EXT"
    ],
    qualifiers: ["rayPayloadEXT", "rayPayloadInEXT", "hitAttributeEXT", "callableDataEXT", "callableDataInEXT", "shaderRecordEXT"],
    constants: [
      "gl_RayFlagsNoneEXT", "gl_RayFlagsOpaqueEXT", "gl_RayFlagsNoOpaqueEXT",
      "gl_RayFlagsTerminateOnFirstHitEXT", "gl_RayFlagsSkipClosestHitShaderEXT",
      "gl_RayFlagsCullBackFacingTrianglesEXT", "gl_RayFlagsCullFrontFacingTrianglesEXT",
      "gl_RayFlagsCullOpaqueEXT", "gl_RayFlagsCullNoOpaqueEXT",
      "gl_HitKindFrontFacingTriangleEXT", "gl_HitKindBackFacingTriangleEXT"
    ],
    keywords: ["ignoreIntersectionEXT", "terminateRayEXT"]
  },

  "GL_EXT_ray_query": {
    functions: [
      "rayQueryInitializeEXT", "rayQueryProceedEXT", "rayQueryTerminateEXT",
      "rayQueryGenerateIntersectionEXT", "rayQueryConfirmIntersectionEXT",
      "rayQueryGetIntersectionTypeEXT", "rayQueryGetRayTMinEXT", "rayQueryGetRayFlagsEXT",
      "rayQueryGetWorldRayOriginEXT", "rayQueryGetWorldRayDirectionEXT",
      "rayQueryGetIntersectionTEXT", "rayQueryGetIntersectionInstanceCustomIndexEXT",
      "rayQueryGetIntersectionInstanceIdEXT", "rayQueryGetIntersectionInstanceShaderBindingTableRecordOffsetEXT",
      "rayQueryGetIntersectionGeometryIndexEXT", "rayQueryGetIntersectionPrimitiveIndexEXT",
      "rayQueryGetIntersectionBarycentricsEXT", "rayQueryGetIntersectionFrontFaceEXT",
      "rayQueryGetIntersectionCandidateAABBOpaqueEXT",
      "rayQueryGetIntersectionObjectRayDirectionEXT", "rayQueryGetIntersectionObjectRayOriginEXT",
      "rayQueryGetIntersectionObjectToWorldEXT", "rayQueryGetIntersectionWorldToObjectEXT"
    ],
    types: ["rayQueryEXT"],
    built_in_variables: [],
    qualifiers: [],
    constants: [
      "gl_RayQueryCommittedIntersectionNoneEXT", "gl_RayQueryCommittedIntersectionTriangleEXT",
      "gl_RayQueryCommittedIntersectionGeneratedEXT",
      "gl_RayQueryCandidateIntersectionTriangleEXT", "gl_RayQueryCandidateIntersectionAABBEXT"
    ],
    keywords: []
  },

  "GL_EXT_buffer_reference": {
    functions: [],
    types: [],
    built_in_variables: [],
    qualifiers: ["buffer_reference", "buffer_reference_align"],
    constants: [],
    keywords: []
  },

  "GL_EXT_buffer_reference2": {
    functions: [],
    types: [],
    built_in_variables: [],
    qualifiers: ["buffer_reference"],
    constants: [],
    keywords: []
  },

  "GL_EXT_nonuniform_qualifier": {
    functions: [],
    types: [],
    built_in_variables: [],
    qualifiers: ["nonuniformEXT"],
    constants: [],
    keywords: []
  },

  "GL_EXT_scalar_block_layout": {
    functions: [],
    types: [],
    built_in_variables: [],
    qualifiers: ["scalar"],
    constants: [],
    keywords: []
  },

  "GL_EXT_shader_explicit_arithmetic_types": {
    functions: [],
    types: [
      "int8_t", "uint8_t", "i8vec2", "i8vec3", "i8vec4", "u8vec2", "u8vec3", "u8vec4",
      "int16_t", "uint16_t", "i16vec2", "i16vec3", "i16vec4", "u16vec2", "u16vec3", "u16vec4",
      "int32_t", "uint32_t", "i32vec2", "i32vec3", "i32vec4", "u32vec2", "u32vec3", "u32vec4",
      "int64_t", "uint64_t", "i64vec2", "i64vec3", "i64vec4", "u64vec2", "u64vec3", "u64vec4",
      "float16_t", "f16vec2", "f16vec3", "f16vec4",
      "f16mat2", "f16mat3", "f16mat4", "f16mat2x2", "f16mat2x3", "f16mat2x4",
      "f16mat3x2", "f16mat3x3", "f16mat3x4", "f16mat4x2", "f16mat4x3", "f16mat4x4",
      "float32_t", "f32vec2", "f32vec3", "f32vec4",
      "f32mat2", "f32mat3", "f32mat4", "f32mat2x2", "f32mat2x3", "f32mat2x4",
      "f32mat3x2", "f32mat3x3", "f32mat3x4", "f32mat4x2", "f32mat4x3", "f32mat4x4",
      "float64_t", "f64vec2", "f64vec3", "f64vec4",
      "f64mat2", "f64mat3", "f64mat4", "f64mat2x2", "f64mat2x3", "f64mat2x4",
      "f64mat3x2", "f64mat3x3", "f64mat3x4", "f64mat4x2", "f64mat4x3", "f64mat4x4"
    ],
    built_in_variables: [],
    qualifiers: [],
    constants: [],
    keywords: []
  },

  "GL_EXT_shader_atomic_int64": {
    functions: [
      "atomicAdd", "atomicMin", "atomicMax", "atomicAnd", "atomicOr", "atomicXor",
      "atomicExchange", "atomicCompSwap"
    ],
    types: [],
    built_in_variables: [],
    qualifiers: [],
    constants: [],
    keywords: []
  },

  "GL_EXT_shader_atomic_float": {
    functions: [
      "atomicAdd", "atomicExchange", "atomicLoad", "atomicStore",
      "imageAtomicAdd", "imageAtomicExchange", "imageAtomicLoad", "imageAtomicStore"
    ],
    types: [],
    built_in_variables: [],
    qualifiers: [],
    constants: [],
    keywords: []
  },

  "GL_EXT_shader_atomic_float2": {
    functions: ["atomicMin", "atomicMax", "imageAtomicMin", "imageAtomicMax"],
    types: [],
    built_in_variables: [],
    qualifiers: [],
    constants: [],
    keywords: []
  },

  "GL_EXT_fragment_shader_barycentric": {
    functions: [],
    types: [],
    built_in_variables: ["gl_BaryCoordEXT", "gl_BaryCoordNoPerspEXT"],
    qualifiers: ["pervertexEXT"],
    constants: [],
    keywords: []
  },

  "GL_EXT_mesh_shader": {
    functions: ["SetMeshOutputsEXT"],
    types: [],
    built_in_variables: [
      "gl_PrimitivePointIndicesEXT", "gl_PrimitiveLineIndicesEXT", "gl_PrimitiveTriangleIndicesEXT",
      "gl_MeshPerVertexEXT", "gl_MeshPerPrimitiveEXT", "gl_MeshVerticesEXT", "gl_MeshPrimitivesEXT"
    ],
    qualifiers: ["perprimitiveEXT", "taskPayloadSharedEXT"],
    constants: [],
    keywords: []
  },

  "GL_EXT_shader_realtime_clock": {
    functions: ["clockRealtime2x32EXT", "clockRealtimeEXT"],
    types: [],
    built_in_variables: [],
    qualifiers: [],
    constants: [],
    keywords: []
  },

  "GL_EXT_samplerless_texture_functions": {
    functions: ["texelFetch"],
    types: [],
    built_in_variables: [],
    qualifiers: [],
    constants: [],
    keywords: []
  },

  "GL_EXT_demote_to_helper_invocation": {
    functions: ["demote"],
    types: [],
    built_in_variables: ["gl_HelperInvocation"],
    qualifiers: [],
    constants: [],
    keywords: []
  },

  "GL_EXT_shader_image_int64": {
    functions: ["imageAtomicAdd", "imageAtomicMin", "imageAtomicMax", "imageAtomicAnd", "imageAtomicOr", "imageAtomicXor", "imageAtomicExchange", "imageAtomicCompSwap"],
    types: [],
    built_in_variables: [],
    qualifiers: [],
    constants: [],
    keywords: []
  },

  "GL_NV_ray_tracing": {
    functions: ["traceNV", "reportIntersectionNV", "executeCallableNV"],
    types: ["accelerationStructureNV"],
    built_in_variables: [
      "gl_LaunchIDNV", "gl_LaunchSizeNV", "gl_InstanceCustomIndexNV",
      "gl_WorldRayOriginNV", "gl_WorldRayDirectionNV", "gl_ObjectRayOriginNV", "gl_ObjectRayDirectionNV",
      "gl_RayTminNV", "gl_RayTmaxNV", "gl_HitTNV", "gl_HitKindNV",
      "gl_ObjectToWorldNV", "gl_WorldToObjectNV"
    ],
    qualifiers: ["rayPayloadNV", "rayPayloadInNV", "hitAttributeNV", "callableDataNV", "callableDataInNV"],
    constants: [],
    keywords: ["ignoreIntersectionNV", "terminateRayNV"]
  },

  "GL_NV_mesh_shader": {
    functions: [],
    types: [],
    built_in_variables: [
      "gl_PrimitiveIndicesNV", "gl_MeshViewCountNV", "gl_MeshViewIndicesNV"
    ],
    qualifiers: ["perprimitiveNV", "taskNV"],
    constants: [],
    keywords: []
  },

  "GL_NV_fragment_shader_barycentric": {
    functions: [],
    types: [],
    built_in_variables: ["gl_BaryCoordNV", "gl_BaryCoordNoPerspNV"],
    qualifiers: ["pervertexNV"],
    constants: [],
    keywords: []
  },

  "GL_NV_shader_subgroup_partitioned": {
    functions: [
      "subgroupPartitionNV",
      "subgroupPartitionedAddNV", "subgroupPartitionedMulNV",
      "subgroupPartitionedMinNV", "subgroupPartitionedMaxNV",
      "subgroupPartitionedAndNV", "subgroupPartitionedOrNV", "subgroupPartitionedXorNV",
      "subgroupPartitionedInclusiveAddNV", "subgroupPartitionedInclusiveMulNV",
      "subgroupPartitionedInclusiveMinNV", "subgroupPartitionedInclusiveMaxNV",
      "subgroupPartitionedInclusiveAndNV", "subgroupPartitionedInclusiveOrNV", "subgroupPartitionedInclusiveXorNV",
      "subgroupPartitionedExclusiveAddNV", "subgroupPartitionedExclusiveMulNV",
      "subgroupPartitionedExclusiveMinNV", "subgroupPartitionedExclusiveMaxNV",
      "subgroupPartitionedExclusiveAndNV", "subgroupPartitionedExclusiveOrNV", "subgroupPartitionedExclusiveXorNV"
    ],
    types: [],
    built_in_variables: [],
    qualifiers: [],
    constants: [],
    keywords: []
  },

  "GL_NV_compute_shader_derivatives": {
    functions: ["dFdx", "dFdy", "fwidth", "dFdxFine", "dFdyFine", "fwidthFine", "dFdxCoarse", "dFdyCoarse", "fwidthCoarse"],
    types: [],
    built_in_variables: [],
    qualifiers: [],
    constants: [],
    keywords: []
  },

  "GL_NV_shader_sm_builtins": {
    functions: [],
    types: [],
    built_in_variables: ["gl_WarpIDNV", "gl_SMIDNV"],
    qualifiers: [],
    constants: [],
    keywords: []
  },

  "GL_ARB_gpu_shader_int64": {
    functions: [],
    types: ["int64_t", "uint64_t", "i64vec2", "i64vec3", "i64vec4", "u64vec2", "u64vec3", "u64vec4"],
    built_in_variables: [],
    qualifiers: [],
    constants: [],
    keywords: []
  },

  "GL_ARB_shader_ballot": {
    functions: ["ballotARB", "readInvocationARB", "readFirstInvocationARB"],
    types: [],
    built_in_variables: ["gl_SubGroupSizeARB", "gl_SubGroupInvocationARB", "gl_SubGroupEqMaskARB", "gl_SubGroupGeMaskARB", "gl_SubGroupGtMaskARB", "gl_SubGroupLeMaskARB", "gl_SubGroupLtMaskARB"],
    qualifiers: [],
    constants: [],
    keywords: []
  },

  "GL_ARB_shader_clock": {
    functions: ["clock2x32ARB", "clockARB"],
    types: [],
    built_in_variables: [],
    qualifiers: [],
    constants: [],
    keywords: []
  },

  "GL_ARB_derivative_control": {
    functions: ["dFdxFine", "dFdyFine", "fwidthFine", "dFdxCoarse", "dFdyCoarse", "fwidthCoarse"],
    types: [],
    built_in_variables: [],
    qualifiers: [],
    constants: [],
    keywords: []
  },

  "GL_AMD_shader_fragment_mask": {
    functions: ["fragmentMaskFetchAMD", "fragmentFetchAMD"],
    types: [],
    built_in_variables: [],
    qualifiers: [],
    constants: [],
    keywords: []
  },

  "GL_AMD_gpu_shader_half_float": {
    functions: [],
    types: ["float16_t", "f16vec2", "f16vec3", "f16vec4", "f16mat2", "f16mat3", "f16mat4"],
    built_in_variables: [],
    qualifiers: [],
    constants: [],
    keywords: []
  }
};

// Shader file extensions to scan
const SHADER_EXTENSIONS = ['.glsl', '.rgen', '.rchit', '.rmiss', '.rint', '.rahit', '.vert', '.frag', '.comp', '.geom', '.tesc', '.tese'];

/**
 * Check if file should be processed based on extension
 */
function shouldProcessFile(filename) {
  const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
  return SHADER_EXTENSIONS.includes(ext);
}

/**
 * Scan a single file content for extension usage
 */
function scanFileContent(content, filePath) {
  const detectedExtensions = {};

  // Scan for each extension's identifiers
  for (const [extName, extData] of Object.entries(EXTENSIONS_DATABASE)) {
    const detected = {
      functions: [],
      types: [],
      built_in_variables: [],
      qualifiers: [],
      constants: [],
      keywords: []
    };

    let hasMatch = false;

    // Check functions
    for (const func of extData.functions) {
      // Match function calls: functionName(
      const regex = new RegExp(`\\b${func}\\s*\\(`, 'g');
      if (regex.test(content)) {
        detected.functions.push(func);
        hasMatch = true;
      }
    }

    // Check types
    for (const type of extData.types) {
      // Match type usage (declarations, casts, etc.)
      const regex = new RegExp(`\\b${type}\\b`, 'g');
      if (regex.test(content)) {
        detected.types.push(type);
        hasMatch = true;
      }
    }

    // Check built-in variables
    for (const builtin of extData.built_in_variables) {
      const regex = new RegExp(`\\b${builtin}\\b`, 'g');
      if (regex.test(content)) {
        detected.built_in_variables.push(builtin);
        hasMatch = true;
      }
    }

    // Check qualifiers
    for (const qualifier of extData.qualifiers) {
      const regex = new RegExp(`\\b${qualifier}\\b`, 'g');
      if (regex.test(content)) {
        detected.qualifiers.push(qualifier);
        hasMatch = true;
      }
    }

    // Check constants
    for (const constant of extData.constants) {
      const regex = new RegExp(`\\b${constant}\\b`, 'g');
      if (regex.test(content)) {
        detected.constants.push(constant);
        hasMatch = true;
      }
    }

    // Check keywords
    for (const keyword of extData.keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      if (regex.test(content)) {
        detected.keywords.push(keyword);
        hasMatch = true;
      }
    }

    if (hasMatch) {
      detectedExtensions[extName] = detected;
    }
  }

  return {
    file_path: filePath,
    extensions_detected: detectedExtensions
  };
}

/**
 * Scan directory using File API
 * @param {FileList} files - Files from input[type=file][webkitdirectory]
 * @param {number} maxFiles - Maximum files to process
 * @param {Function} progressCallback - Optional callback for progress updates (filesProcessed, totalFiles)
 * @returns {Promise<Object>} Scan results
 */
async function scanDirectoryWithFileAPI(files, maxFiles = 5000, progressCallback = null) {
  const startTime = Date.now();
  const results = [];
  const extensionUsageStats = {};
  const functionUsageStats = {};
  const builtinUsageStats = {};
  const typeUsageStats = {};

  let filesProcessed = 0;
  let shaderFilesFound = 0;

  console.log(`Scanning ${files.length} files for extension usage...`);

  for (const file of files) {
    if (filesProcessed >= maxFiles) break;

    if (!shouldProcessFile(file.name)) {
      continue;
    }

    shaderFilesFound++;
    filesProcessed++;

    // Progress callback
    if (progressCallback && filesProcessed % 10 === 0) {
      progressCallback(filesProcessed, shaderFilesFound);
    }

    try {
      const content = await file.text();
      const fileResult = scanFileContent(content, file.webkitRelativePath || file.name);

      // Only include files that use extensions
      if (Object.keys(fileResult.extensions_detected).length > 0) {
        results.push(fileResult);

        // Update statistics
        for (const [extName, extData] of Object.entries(fileResult.extensions_detected)) {
          extensionUsageStats[extName] = (extensionUsageStats[extName] || 0) + 1;

          extData.functions.forEach(func => {
            functionUsageStats[func] = (functionUsageStats[func] || 0) + 1;
          });

          extData.built_in_variables.forEach(builtin => {
            builtinUsageStats[builtin] = (builtinUsageStats[builtin] || 0) + 1;
          });

          extData.types.forEach(type => {
            typeUsageStats[type] = (typeUsageStats[type] || 0) + 1;
          });
        }
      }
    } catch (err) {
      console.error(`Error reading ${file.name}: ${err.message}`);
    }
  }

  const endTime = Date.now();

  // Build final output
  const output = {
    scan_date: new Date().toISOString(),
    total_files_scanned: shaderFilesFound,
    files_using_extensions: results.length,
    scan_time_ms: endTime - startTime,
    extensions_database: EXTENSIONS_DATABASE,
    shader_files: results,
    statistics: {
      extension_usage: extensionUsageStats,
      function_usage: functionUsageStats,
      builtin_usage: builtinUsageStats,
      type_usage: typeUsageStats
    }
  };

  console.log(`\n=== SCAN COMPLETE ===`);
  console.log(`Total shader files scanned: ${shaderFilesFound}`);
  console.log(`Files using extensions: ${results.length}`);
  console.log(`Unique extensions detected: ${Object.keys(extensionUsageStats).length}`);
  console.log(`Scan time: ${endTime - startTime}ms`);

  return output;
}

/**
 * Download scan results as JSON
 */
function downloadResults(results, filename = 'extension_scan_results.json') {
  const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Export functions for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    scanDirectoryWithFileAPI,
    scanFileContent,
    shouldProcessFile,
    downloadResults,
    EXTENSIONS_DATABASE,
    SHADER_EXTENSIONS
  };
}
