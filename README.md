# S3D

S3D is a standalone structural 3D framework. Its core provides the scene, structural objects, math, rendering and generic runtime mechanics. Reusable domain implementations live under `domains/` as first-class modules.

```text
domains/* -> core
core -/-> domains/*
```

Domain terminology is allowed. Domain lock-in is not. A module in `domains/acoustics`, for example, must be independently instantiable and usable without its originating application.

```js
import { Scene, Group, Link } from './s3d.js';
import { FrequencyRangeController } from './domains/acoustics/index.js';
```

Applications own instances, project state and wiring. See `Contracts/` for the architectural invariants.
