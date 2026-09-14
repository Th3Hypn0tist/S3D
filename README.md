# S3D

> **License notice:** S3D is proprietary source-available software, not open source. The public source may be inspected and evaluated, but it may not be implemented, integrated, embedded, ported, adapted, redistributed, or used as part of your own software without a separate written license. See [`LICENSE`](./LICENSE). For licensing, contact the repository owner.

S3D is a standalone structural 3D framework. Its core provides the scene, structural objects, math, rendering and generic runtime mechanics. Reusable domain implementations live under `domains/` as first-class modules.

```text
domains/* -> core
core -/-> domains/*
```

Domain terminology is allowed. Domain lock-in is not. Domain modules must remain independently instantiable and usable without their originating applications.

Current first-class domains:

```text
domains/acoustics   acoustic structures, sampled fields and spatial field visualization
domains/statistics  statistical structures, metric spaces, selections and spatial data projection
```

```js
import { Scene, Group, Link } from './s3d.js';
import { FrequencyRangeController } from './domains/acoustics/index.js';
import { Dimension, MetricSpace, Observation } from './domains/statistics/index.js';
```

Applications own instances, project state, source semantics and wiring. See `Contracts/` for the architectural invariants.

Core interaction includes full-3D object picking, horizontal plane dragging and modifier-driven vertical dragging. The acoustics domain includes independently instantiable single-plane field views and transparent orthogonal field slices. The statistics domain provides application-neutral dimensions, observations, distributions, range selections, metric-space projection and batched point-cloud visualization.

## Licensing

Viewing or evaluating this repository does not grant permission to use S3D as an implementation dependency or as the implementation basis of another product. If you want to use S3D in your own software, service, device, project, or organization, obtain a separate written license first.

Licensing inquiries: contact the repository owner through this repository or the associated GitHub profile.
