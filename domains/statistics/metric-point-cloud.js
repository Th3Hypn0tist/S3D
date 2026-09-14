import { SceneObject } from '../../core/objects/object.js';
import { finiteNumber } from './dimension.js';
import { MetricSpace, finiteVec3, projectionBounds } from './metric-space.js';
import { Observation } from './observation.js';

function positiveVec3(value, label) {
  const result = finiteVec3(value, label);
  if (result.some(component => component <= 0)) throw new Error(`${label} components must be positive`);
  return result;
}

function colorValue(value, label) {
  if (!Array.isArray(value) || ![3, 4].includes(value.length)) throw new Error(`${label} must be RGB or RGBA`);
  const color = value.map((component, index) => finiteNumber(component, `${label}[${index}]`));
  if (color.some(component => component < 0 || component > 1)) throw new Error(`${label} components must be between 0 and 1`);
  return color;
}

class MetricPointCloud extends SceneObject {
  constructor({
    id,
    space,
    observations = [],
    bounds = { min: [-1, -1, -1], max: [1, 1, 1] },
    pointScale = [0.04, 0.04, 0.04],
    color = [0.35, 0.7, 1],
    selectedColor = [1, 0.75, 0.2],
    axisColor = [0.4, 0.4, 0.4],
    showAxes = true,
    showSelectedLabels = true,
    metadata = {},
  } = {}) {
    super({ id, metadata, selectable: false });
    if (!(space instanceof MetricSpace)) throw new Error('MetricPointCloud requires a MetricSpace');
    this.space = space;
    this.bounds = projectionBounds(bounds);
    this.pointScale = positiveVec3(pointScale, 'MetricPointCloud pointScale');
    this.color = colorValue(color, 'MetricPointCloud color');
    this.selectedColor = colorValue(selectedColor, 'MetricPointCloud selectedColor');
    this.axisColor = colorValue(axisColor, 'MetricPointCloud axisColor');
    this.showAxes = Boolean(showAxes);
    this.showSelectedLabels = Boolean(showSelectedLabels);
    this.selectedIds = new Set();
    this.setObservations(observations);
  }

  setSpace(space) {
    if (!(space instanceof MetricSpace)) throw new Error('MetricPointCloud requires a MetricSpace');
    this.space = space;
    return this;
  }

  setBounds(bounds) {
    this.bounds = projectionBounds(bounds);
    return this;
  }

  setObservations(observations) {
    if (!Array.isArray(observations) || observations.some(item => !(item instanceof Observation))) {
      throw new Error('MetricPointCloud observations must be an Observation array');
    }
    const ids = observations.map(observation => observation.id);
    if (new Set(ids).size !== ids.length) throw new Error('MetricPointCloud observation ids must be unique');
    this.observations = [...observations];
    const available = new Set(ids);
    this.selectedIds = new Set([...this.selectedIds].filter(id => available.has(id)));
    return this;
  }

  select(ids) {
    if (!Array.isArray(ids) && !(ids instanceof Set)) throw new Error('MetricPointCloud.select requires an array or Set');
    const requested = [...ids];
    const available = new Set(this.observations.map(observation => observation.id));
    const unknown = requested.filter(id => !available.has(id));
    if (unknown.length) throw new Error(`MetricPointCloud cannot select unknown observation id(s): ${unknown.join(', ')}`);
    this.selectedIds = new Set(requested);
    this.emit('selectionChanged', { ids: [...this.selectedIds] });
    return this;
  }

  clearSelection() {
    this.selectedIds.clear();
    this.emit('selectionChanged', { ids: [] });
    return this;
  }

  projectedPoints() {
    const origin = this.worldPosition();
    return this.observations.map(observation => {
      const local = this.space.project(observation, this.bounds);
      return {
        observation,
        position: local.map((component, index) => component + origin[index]),
        selected: this.selectedIds.has(observation.id),
      };
    });
  }

  nearest(position, maxDistance = Infinity) {
    const target = finiteVec3(position, 'MetricPointCloud nearest position');
    if (maxDistance !== Infinity) {
      finiteNumber(maxDistance, 'MetricPointCloud maxDistance');
      if (maxDistance < 0) throw new Error('MetricPointCloud maxDistance must be non-negative');
    }
    let best = null;
    let bestDistance = maxDistance;
    for (const point of this.projectedPoints()) {
      const distance = Math.hypot(...point.position.map((component, index) => component - target[index]));
      if (distance <= bestDistance) {
        best = point;
        bestDistance = distance;
      }
    }
    return best == null ? null : { ...best, distance: bestDistance };
  }

  _worldBounds() {
    const origin = this.worldPosition();
    return {
      min: this.bounds.min.map((component, index) => component + origin[index]),
      max: this.bounds.max.map((component, index) => component + origin[index]),
    };
  }

  draw(renderer, context = {}) {
    const bounds = this._worldBounds();
    if (this.showAxes) {
      const origin = [...bounds.min];
      renderer?.line?.(origin, [bounds.max[0], origin[1], origin[2]], this.axisColor, this, context);
      renderer?.line?.(origin, [origin[0], bounds.max[1], origin[2]], this.axisColor, this, context);
      renderer?.line?.(origin, [origin[0], origin[1], bounds.max[2]], this.axisColor, this, context);
    }

    for (const point of this.projectedPoints()) {
      const color = point.selected ? this.selectedColor : this.color;
      renderer?.box?.(point.position, this.pointScale, color, false, this, context);
      if (point.selected && this.showSelectedLabels) {
        const labelPosition = [point.position[0], point.position[1] + this.pointScale[1] * 2.5, point.position[2]];
        const width = Math.max(0.2, point.observation.label.length * 0.08);
        renderer?.billboardText?.(point.observation.label, labelPosition, width, 0.12, color, this, context);
      }
    }
  }
}

export { MetricPointCloud, colorValue, positiveVec3 };
