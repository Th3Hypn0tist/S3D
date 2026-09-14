# S3D

> **License notice:** S3D is proprietary source-available software, not open source. The public source may be inspected and evaluated, but it may not be implemented, integrated, embedded, ported, adapted, redistributed, or used as part of your own software without a separate written license. See [`LICENSE`](./LICENSE). For licensing, contact the repository owner.

S3D is a standalone structural 3D framework. Its core provides scene management, structural objects, transforms, math, rendering contracts, packed render stores and generic runtime mechanics. Reusable domain implementations live under `domains/` as first-class modules.

```text
domains/* -> core
core -/-> domains/*
```

Domain terminology is allowed. Domain lock-in is not. Domain modules must remain independently instantiable and usable without their originating applications.

## Current first-class domains

```text
domains/acoustics   acoustic structures, sampled fields and spatial field visualization
domains/statistics  statistical structures, metric spaces, selection and dense visual encoding
```

```js
import { Scene, Group, Link } from './s3d.js';
import { FrequencyRangeController } from './domains/acoustics/index.js';
import {
  Dimension,
  MetricSpace,
  Observation,
  VisualEncoding,
} from './domains/statistics/index.js';
```

Applications own instances, project state, source semantics and wiring. See `Contracts/` for architectural invariants.

## Core feature baseline

S3D core currently provides:

- scene and object hierarchy
- groups and links
- transforms
- reusable math/runtime primitives
- renderer callback interface
- reusable packed render store
- solid, transparent and outline box batching
- packed box-instance submission
- canonical per-face RGBA box channels
- lines
- glyphs
- flow pulses
- full-3D object picking
- horizontal plane dragging
- modifier-driven vertical dragging
- transform-gizmo infrastructure
- renderer-independent domain objects

### Packed box instance layout

Dense box rendering uses one shared 33-float instance layout:

```text
position XYZ                    3
scale XYZ                       3
rotation XYZ                    3
face z- RGBA                    4
face z+ RGBA                    4
face x- RGBA                    4
face x+ RGBA                    4
face y- RGBA                    4
face y+ RGBA                    4
---------------------------------
total                          33 floats / instance
```

The canonical face order is:

```text
z-, z+, x-, x+, y-, y+
```

The geometry contract lives in core through `BOX_FACES`, `BOX_FACE_ORDER`, `BOX_FACE_INDICES` and `boxFaceIndex()`. The packed instance contract lives in core through `BOX_INSTANCE_STRIDE`, `BOX_FACE_COLOR_OFFSET`, `BOX_FACE_COLOR_STRIDE`, `writeBoxInstance()` and `writeBoxFaceInstance()`.

`writeBoxInstance()` is a uniform-material shorthand: one RGB/RGBA value is copied into all six canonical face slots. It does not create a second base-color truth. `writeBoxFaceInstance()` requires all six face colors explicitly and in canonical order. Partial face sets are rejected.

A box is routed to the transparent batch when any face has alpha below 1. The WebGL renderer keeps the representation instanced: the six face colors are instance attributes, so per-face color does not require six draw calls or duplicated box geometry.

Domains consume the core layout instead of reproducing GPU-instance formats independently.

## Statistics domain

The Statistics domain is application-neutral. It does not know about LMTS, models, benchmarks or consuming application semantics.

Current feature baseline:

- `Dimension`
- explicit numeric domains
- normalization / denormalization
- `Observation`
- `Distribution`
- descriptive statistics
- `RangeSelection`
- `MetricSpace`
- metric-space projection
- `MetricPointCloud`
- packed typed instance buffers for high-density point clouds
- cached packed submissions instead of one SceneObject or renderer submission per observation
- selection overlays as a second small packed instance buffer
- nearest-observation lookup
- projected-point inspection
- dimension-driven `VisualEncoding`
- reusable `VisualChannelBinding`

### VisualEncoding

A `VisualEncoding` maps an observation dimension independently to a visual channel and output range.

Supported channels:

```text
position.x
position.y
position.z

rotation.x
rotation.y
rotation.z

scale.x
scale.y
scale.z

color.r
color.g
color.b
```

Example:

```js
const encoding = new VisualEncoding({
  bindings: {
    'position.x': { dimension: 'quality', range: [-10, 10] },
    'rotation.y': { dimension: 'latency', range: [0, Math.PI] },
    'scale.z': { dimension: 'speed', range: [0.1, 2.1] },
    'color.r': { dimension: 'quality', range: [0, 1] },
  },
});
```

`MetricPointCloud` writes encoded position, rotation, scale and RGB directly into the packed instance buffer. Its current color encoding is uniform across all six face slots, preserving the existing statistical visual-channel contract while using the canonical per-face core layout underneath.

Selection overlays preserve encoded position, rotation and scale instead of falling back to default geometry.

Per-face RGBA is now a core rendering primitive. Domain-specific per-face visual semantics remain the responsibility of the domain or consuming application.

## Acoustics domain

The Acoustics domain includes reusable acoustic and spatial-field structures, including:

- frequency-range control
- sampled scalar fields
- field value ranges
- spatial sampling policies
- single-plane field views
- transparent orthogonal field slices
- hidden-field views
- speaker-node structures
- image reference layers

These remain independently instantiable from any consuming application.

## Data-visualization role

S3D is the generic visualization/runtime layer below systems such as LMTS DVS. It does not know Input Templates, LMTS reports or application-specific visualization presets.

A consumer can therefore build:

```text
source data
   -> application/domain interpretation
   -> S3D statistical dimensions + visual encoding
   -> packed renderer submission
```

without creating application-specific code inside S3D core.

## Architectural rules

1. `core` never depends on `domains/*`.
2. Domains may depend on core.
3. Domains do not depend on consuming applications.
4. Domain modules do not encode consumer-specific semantics.
5. High-density data does not create one SceneObject per observation.
6. Packed buffer layout belongs to core.
7. Domain visual encoding produces generic visual values; renderer storage remains a core concern.
8. Missing consumer data is never reconstructed or invented by S3D.

## Licensing

Viewing or evaluating this repository does not grant permission to use S3D as an implementation dependency or as the implementation basis of another product. If you want to use S3D in your own software, service, device, project, or organization, obtain a separate written license first.

Licensing inquiries: contact the repository owner through this repository or the associated GitHub profile.
