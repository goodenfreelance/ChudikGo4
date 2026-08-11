import { Creature, CreatureElement, Food, PhysicsForces, JointPhysics, Point } from '../types';

// Новые пресеты чудиков, полностью соответствующие правилам: Ребра (вес 1), Шарниры (вес 0), Мышцы (импульс), Голова (направление)
export const DEFAULT_PRESETS: { name: string; description: string; elements: CreatureElement[] }[] = [
  {
    name: 'Чудик-Маятник (Шарнир + Голова + 2 Мышцы)',
    description: 'Центральный шарнир с головой вверху, симметричными ребрами и противоположными мышцами. Бежит вперед!',
    elements: [
      { id: 'head-top', relX: 0, relY: -1, type: 'head', weight: 0, headAngle: 270 },
      { id: 'joint-center', relX: 0, relY: 0, type: 'joint', weight: 0 },
      { id: 'edge-l1', relX: -1, relY: 0, type: 'edge-h', weight: 1 },
      { id: 'edge-r1', relX: 1, relY: 0, type: 'edge-h', weight: 1 },
      { id: 'edge-v1', relX: 0, relY: -1, type: 'edge-v', weight: 1 },
      { id: 'muscle-l', relX: -1, relY: -1, type: 'muscle-left', weight: 0 },
      { id: 'muscle-r', relX: 1, relY: -1, type: 'muscle-right', weight: 0 },
    ],
  },
  {
    name: 'Асимметричный Вращатель',
    description: 'Имеет голову и больше ребер на левом плече. Легкое правое плечо совершает поворот на шарнире при сокращении.',
    elements: [
      { id: 'head-top', relX: 0, relY: -1, type: 'head', weight: 0, headAngle: 270 },
      { id: 'joint-center', relX: 0, relY: 0, type: 'joint', weight: 0 },
      { id: 'edge-l1', relX: -1, relY: 0, type: 'edge-h', weight: 1 },
      { id: 'edge-l2', relX: -1, relY: 1, type: 'edge-v', weight: 1 },
      { id: 'edge-r1', relX: 1, relY: 0, type: 'edge-h', weight: 1 },
      { id: 'muscle-l', relX: -1, relY: -1, type: 'muscle-left', weight: 0 },
    ],
  },
  {
    name: 'Диагональный Бегун (45°)',
    description: 'Использует диагональные ребра (/) и (\\) с ведущей головой для быстрого перемещения по сетке.',
    elements: [
      { id: 'head-top', relX: 0, relY: -1, type: 'head', weight: 0, headAngle: 270 },
      { id: 'joint-center', relX: 0, relY: 0, type: 'joint', weight: 0 },
      { id: 'edge-d1', relX: -1, relY: -1, type: 'edge-d2', weight: 1 },
      { id: 'edge-d2', relX: 1, relY: -1, type: 'edge-d1', weight: 1 },
      { id: 'edge-d3', relX: -1, relY: 1, type: 'edge-d1', weight: 1 },
      { id: 'edge-d4', relX: 1, relY: 1, type: 'edge-d2', weight: 1 },
      { id: 'muscle-l', relX: -1, relY: 0, type: 'muscle-left', weight: 0 },
      { id: 'muscle-r', relX: 1, relY: 0, type: 'muscle-right', weight: 0 },
    ],
  },
  {
    name: 'Двухшарнирный Сороконожка',
    description: 'Два шарнира на разных узлах сетки с мышцами сгибания и головой, создающими движение вперед.',
    elements: [
      { id: 'head-top', relX: 0, relY: -2, type: 'head', weight: 0, headAngle: 270 },
      { id: 'joint-1', relX: 0, relY: -1, type: 'joint', weight: 0 },
      { id: 'joint-2', relX: 0, relY: 1, type: 'joint', weight: 0 },
      { id: 'edge-v', relX: 0, relY: 0, type: 'edge-v', weight: 1 },
      { id: 'edge-h1', relX: -1, relY: -1, type: 'edge-h', weight: 1 },
      { id: 'edge-h2', relX: 1, relY: -1, type: 'edge-h', weight: 1 },
      { id: 'edge-h3', relX: -1, relY: 1, type: 'edge-h', weight: 1 },
      { id: 'edge-h4', relX: 1, relY: 1, type: 'edge-h', weight: 1 },
      { id: 'muscle-1', relX: -1, relY: 0, type: 'muscle-left', weight: 0 },
      { id: 'muscle-2', relX: 1, relY: 0, type: 'muscle-right', weight: 0 },
    ],
  },
  {
    name: 'Хаотичный Бегун (Случайные Мышцы 🎲)',
    description: 'Использует случайные мышцы с вероятностью срабатывания (35%). Движение и повороты непредсказуемы каждый ход!',
    elements: [
      { id: 'head-top', relX: 0, relY: -1, type: 'head', weight: 0, headAngle: 270 },
      { id: 'joint-center', relX: 0, relY: 0, type: 'joint', weight: 0 },
      { id: 'edge-l1', relX: -1, relY: 0, type: 'edge-h', weight: 1 },
      { id: 'edge-r1', relX: 1, relY: 0, type: 'edge-h', weight: 1 },
      { id: 'edge-v1', relX: 0, relY: -1, type: 'edge-v', weight: 1 },
      { id: 'muscle-rnd-l', relX: -1, relY: -1, type: 'muscle-random-left', weight: 0, randomChance: 35 },
      { id: 'muscle-rnd-r', relX: 1, relY: -1, type: 'muscle-random-right', weight: 0, randomChance: 35 },
    ],
  },
];

// Детерминированная проверка срабатывания случайной мышцы для конкретного цикла
export function isRandomMuscleTriggered(el: CreatureElement, cycle: number): boolean {
  if (cycle <= 0) return true; // При сбросе / в редакторе показываем мышцу как способную сработать
  const chance = Math.max(10, Math.min(90, el.randomChance ?? 35));
  let hash = 0;
  const str = `${el.id}_c_${cycle}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const val = Math.abs(hash) % 100;
  return val < chance;
}

export interface RandomMuscleState {
  isFlexed: boolean;       // Мышца согнута (сокращена) в данный момент
  justFlexed: boolean;     // Произошел сгиб на данном шаге (однократный импульс поворота)
  justUnflexed: boolean;   // Произошел розгиб на данном шаге по вероятности
}

// Расчет состояния случайной мышцы (сгиб только по вероятности)
export function getRandomMuscleState(el: CreatureElement, step: number): RandomMuscleState {
  if (step <= 0) {
    return { isFlexed: false, justFlexed: false, justUnflexed: false };
  }

  const isTriggeredNow = isRandomMuscleTriggered(el, step);
  const isTriggeredPrev = isRandomMuscleTriggered(el, step - 1);

  return {
    isFlexed: isTriggeredNow,
    justFlexed: isTriggeredNow && !isTriggeredPrev,
    justUnflexed: !isTriggeredNow && isTriggeredPrev,
  };
}

export function determineCreatureHeadAngle(elements: CreatureElement[]): number {
  const headEl = elements.find((e) => e.type === 'head');
  if (headEl) {
    if (headEl.headAngle !== undefined) return headEl.headAngle;
    if (headEl.relX !== 0 || headEl.relY !== 0) {
      const rad = Math.atan2(headEl.relY, headEl.relX);
      let deg = Math.round((rad * 180) / Math.PI);
      if (deg < 0) deg += 360;
      return deg;
    }
  }
  return 270; // По умолчанию ВВЕРХ (270°)
}

// Вычисление физических сил, момента инерции, масс и угла разворота
export function calculatePhysicsForces(elements: CreatureElement[], muscleActiveStep: number = 0): PhysicsForces {
  const isMuscleContracted = muscleActiveStep % 2 === 1;

  const headAngle = determineCreatureHeadAngle(elements);
  const headRad = (headAngle * Math.PI) / 180;

  // Local unit vectors relative to head orientation
  const fx = Math.cos(headRad);
  const fy = Math.sin(headRad);
  const lx = fy;
  const ly = -fx;

  const joints: { id: string; x: number; y: number }[] = [];
  const edgeElements: CreatureElement[] = [];
  const muscleElements: CreatureElement[] = [];

  let totalMass = 0;
  let totalInertia = 0;
  let totalLeftMass = 0;
  let totalRightMass = 0;

  // Spec: only edges (ribs) have mass = 1.0; joints, muscles, head = 0
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    let elWeight = 0;

    if (el.type === 'joint') {
      joints.push({ id: el.id, x: el.relX, y: el.relY });
    } else if (el.type.startsWith('edge-')) {
      edgeElements.push(el);
      elWeight = 1.0;
    } else if (el.type.startsWith('muscle-')) {
      muscleElements.push(el);
    } else if (el.type === 'head') {
      // Head mass = 0 per spec
    }

    totalMass += elWeight;

    // Spec: I = sum(m_i * r_i^2) — no +0.5
    const rSq = el.relX * el.relX + el.relY * el.relY;
    totalInertia += elWeight * rSq;

    const projLeft = el.relX * lx + el.relY * ly;
    if (projLeft > 0.01) totalLeftMass += elWeight;
    else if (projLeft < -0.01) totalRightMass += elWeight;
    else {
      totalLeftMass += elWeight * 0.5;
      totalRightMass += elWeight * 0.5;
    }
  }

  if (joints.length === 0) {
    joints.push({ id: 'center-joint', x: 0, y: 0 });
  }

  totalMass = Math.max(1.0, totalMass);
  totalInertia = Math.max(1.0, totalInertia);

  const jointsPhysics: JointPhysics[] = [];
  let sumLeftTorque = 0;
  let sumRightTorque = 0;
  let totalActiveMusclesCount = 0;
  let motionActiveMusclesCount = 0;

  const hasMultipleJoints = joints.length > 1;

  for (let jIdx = 0; jIdx < joints.length; jIdx++) {
    const j = joints[jIdx];
    let jLeftMass = 0;
    let jRightMass = 0;
    let jLeftTorquePotential = 0;
    let jRightTorquePotential = 0;

    for (let eIdx = 0; eIdx < edgeElements.length; eIdx++) {
      const el = edgeElements[eIdx];
      const weight = 1;
      const dx = el.relX - j.x;
      const dy = el.relY - j.y;

      const projLeft = dx * lx + dy * ly;

      if (projLeft > 0.01) {
        const arm = projLeft;
        const leverMultiplier = 1 + 0.5 * (arm - 1);
        jLeftMass += weight;
        jLeftTorquePotential += weight * leverMultiplier;
      } else if (projLeft < -0.01) {
        const arm = -projLeft;
        const leverMultiplier = 1 + 0.5 * (arm - 1);
        jRightMass += weight;
        jRightTorquePotential += weight * leverMultiplier;
      } else {
        jLeftMass += weight * 0.5;
        jRightMass += weight * 0.5;
        jLeftTorquePotential += weight * 0.5;
        jRightTorquePotential += weight * 0.5;
      }
    }

    let activeLeftMuscles = 0;
    let activeRightMuscles = 0;

    for (let mIdx = 0; mIdx < muscleElements.length; mIdx++) {
      const el = muscleElements[mIdx];

      if (hasMultipleJoints) {
        const mdx = el.relX - j.x;
        const mdy = el.relY - j.y;
        if (mdx * mdx + mdy * mdy > 6.25) continue;
      }

      let providesTorque = false;
      let providesMotion = false;

      if (el.type === 'muscle-left' || el.type === 'muscle-right') {
        providesTorque = isMuscleContracted;
        providesMotion = true;
      } else if (el.type === 'muscle-random-left' || el.type === 'muscle-random-right') {
        const mState = getRandomMuscleState(el, muscleActiveStep);
        providesTorque = mState.justFlexed;
        providesMotion = mState.justFlexed || mState.justUnflexed;
      }

      if (providesTorque) {
        const mdx = el.relX - j.x;
        const mdy = el.relY - j.y;
        const spineDist = Math.abs(mdx * fx + mdy * fy);

        const muscleArm = 1.0 + 0.4 * spineDist;
        const muscleForce = 1.5 * muscleArm;

        if (el.type.includes('left')) {
          activeLeftMuscles += muscleForce;
        } else if (el.type.includes('right')) {
          activeRightMuscles += muscleForce;
        }
      }

      if (providesMotion) {
        motionActiveMusclesCount++;
      }
    }

    const netJointTorque = activeLeftMuscles - activeRightMuscles;

    jointsPhysics.push({
      jointId: j.id,
      jx: j.x,
      jy: j.y,
      leftEdgeMass: jLeftMass,
      rightEdgeMass: jRightMass,
      leftTorquePotential: jLeftTorquePotential,
      rightTorquePotential: jRightTorquePotential,
      activeLeftMuscles: Math.round(activeLeftMuscles),
      activeRightMuscles: Math.round(activeRightMuscles),
      netJointTorque,
    });

    sumLeftTorque += activeLeftMuscles;
    sumRightTorque += activeRightMuscles;
    totalActiveMusclesCount += (activeLeftMuscles + activeRightMuscles > 0 ? 1 : 0);
  }

  const netTorque = sumLeftTorque - sumRightTorque;

  // Rotation from torque difference
  let netRotationDeg = 0;
  if (Math.abs(netTorque) > 0) {
    const rawRotation = (netTorque / totalInertia) * 28;
    netRotationDeg = Math.min(60, Math.max(-60, rawRotation));
  }

  const isLighterSideRotating = totalLeftMass !== totalRightMass && netTorque !== 0;

  // Spec: v_forward = 0.25 base; balanced part -> forward, difference -> rotation
  let forwardSpeed = 0;
  if (motionActiveMusclesCount > 0 || sumLeftTorque > 0 || sumRightTorque > 0) {
    const balanced = Math.min(sumLeftTorque, sumRightTorque);
    if (balanced > 0) {
      forwardSpeed = Math.min(0.25, 0.12 + balanced * 0.06);
    } else {
      forwardSpeed = 0.08;
    }
  }

  return {
    leftTorque: sumLeftTorque,
    rightTorque: sumRightTorque,
    netRotationDeg,
    forwardSpeed,
    leftMass: totalLeftMass,
    rightMass: totalRightMass,
    totalMass,
    totalInertia,
    isLighterSideRotating,
    jointsPhysics,
    activeMusclesCount: totalActiveMusclesCount,
  };
}

export function createCreature(
  id: string,
  name: string,
  x: number,
  y: number,
  presetIndex: number = 0,
  color: string = '#6366f1'
): Creature {
  const elements = JSON.parse(JSON.stringify(DEFAULT_PRESETS[presetIndex % DEFAULT_PRESETS.length].elements));
  const forces = calculatePhysicsForces(elements, 0);
  const initialAngle = determineCreatureHeadAngle(elements);

  return {
    id,
    name,
    color,
    x,
    y,
    elements,
    energy: 100,
    maxEnergy: 150,
    foodEaten: 0,
    stepsCount: 0,
    angleDeg: initialAngle,
    forces,
    state: 'idle',
    muscleStep: 0,
    moveProgress: 1,
    prevX: x,
    prevY: y,
    prevAngleDeg: initialAngle,
  };
}

// Найти ближайшую еду
export function findClosestFood(creature: Creature, foods: Food[]): Food | null {
  if (foods.length === 0) return null;
  let minDistanceSq = Infinity;
  let closest: Food | null = null;

  for (let i = 0; i < foods.length; i++) {
    const food = foods[i];
    const dx = food.x - creature.x;
    const dy = food.y - creature.y;
    const distSq = dx * dx + dy * dy;
    if (distSq < minDistanceSq) {
      minDistanceSq = distSq;
      closest = food;
    }
  }

  return closest;
}

// Перемещение вектора вперед с учетом угла поворота
export function getVectorFromAngle(angleDeg: number): { dx: number; dy: number } {
  const rad = (angleDeg * Math.PI) / 180;
  const dx = Math.cos(rad);
  const dy = Math.sin(rad);
  return { dx, dy };
}

export interface BentElementPosition {
  id: string;
  relX: number; // Bent X coordinate relative to creature center (0,0)
  relY: number; // Bent Y coordinate relative to creature center (0,0)
  rotationDeg: number; // Accumulated rotation angle of this element
}

// Иерархический расчет кинематических сгибов плеч и шарниров по весам и активным мышцам
export function calculateKinematicBends(
  elements: CreatureElement[],
  muscleStep: number = 0,
  precalculatedForces?: PhysicsForces
): Map<string, BentElementPosition> {
  const result = new Map<string, BentElementPosition>();
  if (elements.length === 0) return result;

  const elementMap = new Map<string, CreatureElement>();
  const jointEls: CreatureElement[] = [];
  const edgeEls: CreatureElement[] = [];
  const muscleEls: CreatureElement[] = [];

  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    elementMap.set(el.id, el);
    if (el.type === 'joint') {
      jointEls.push(el);
    } else if (el.type.startsWith('edge-')) {
      edgeEls.push(el);
    } else if (el.type.startsWith('muscle-')) {
      muscleEls.push(el);
    }
  }

  const joints = jointEls.length > 0
    ? jointEls.map((j) => ({ id: j.id, x: j.relX, y: j.relY }))
    : [{ id: 'center-joint', x: 0, y: 0 }];

  // 1. Найти корневой шарнир (ближайший к центру 0,0)
  let rootJoint = joints[0];
  let minDistSq = rootJoint.x * rootJoint.x + rootJoint.y * rootJoint.y;
  for (let i = 1; i < joints.length; i++) {
    const dSq = joints[i].x * joints[i].x + joints[i].y * joints[i].y;
    if (dSq < minDistSq) {
      minDistSq = dSq;
      rootJoint = joints[i];
    }
  }

  // Сглаженная непрерывная фаза сокращения регулярных мышц (0..1..0)
  const flexPulse = (1 - Math.cos(muscleStep * Math.PI)) * 0.5;
  const currentIntStep = Math.floor(muscleStep);

  interface JointData {
    id: string;
    x: number;
    y: number;
    leftMass: number;
    rightMass: number;
    leftBendDeg: number;
    rightBendDeg: number;
    accumulatedRotDeg: number;
    worldX: number;
    worldY: number;
  }

  const jointDataMap = new Map<string, JointData>();

  // Local unit vectors relative to head orientation
  const headAngle = determineCreatureHeadAngle(elements);
  const headRad = (headAngle * Math.PI) / 180;
  const fx = Math.cos(headRad);
  const fy = Math.sin(headRad);
  const lx = fy;
  const ly = -fx;

  // 2. Рассчитываем физические свойства каждого шарнира (массы и сгибы)
  for (let i = 0; i < joints.length; i++) {
    const j = joints[i];

    // Массы плеч относительно шарнира j
    let leftMass = 0;
    let rightMass = 0;

    for (let eIdx = 0; eIdx < edgeEls.length; eIdx++) {
      const eel = edgeEls[eIdx];
      const dx = eel.relX - j.x;
      const dy = eel.relY - j.y;
      const projLeft = dx * lx + dy * ly;
      if (projLeft > 0.01) leftMass += 1.0;
      else if (projLeft < -0.01) rightMass += 1.0;
      else {
        leftMass += 0.5;
        rightMass += 0.5;
      }
    }
    leftMass = Math.max(0.5, leftMass);
    rightMass = Math.max(0.5, rightMass);

    // Активность мышц при шарнире j
    let leftMuscleForce = 0;
    let rightMuscleForce = 0;

    for (let mIdx = 0; mIdx < muscleEls.length; mIdx++) {
      const mel = muscleEls[mIdx];
      if (joints.length > 1) {
        const mdx = mel.relX - j.x;
        const mdy = mel.relY - j.y;
        if (mdx * mdx + mdy * mdy > 6.25) continue;
      }

      let isFlexed = false;
      if (mel.type === 'muscle-left' || mel.type === 'muscle-right') {
        isFlexed = true; // Регулярные мышцы активны
      } else if (mel.type.startsWith('muscle-random-')) {
        isFlexed = getRandomMuscleState(mel, currentIntStep).isFlexed;
      }

      if (!isFlexed) continue;

      const mdx = mel.relX - j.x;
      const mdy = mel.relY - j.y;
      const spineDist = Math.abs(mdx * fx + mdy * fy);
      const muscleArm = 1.0 + 0.4 * spineDist;
      const forceVal = 1.5 * muscleArm;

      if (mel.type.includes('left')) {
        leftMuscleForce += forceVal;
      } else if (mel.type.includes('right')) {
        rightMuscleForce += forceVal;
      }
    }

    let leftBendDeg = 0;
    let rightBendDeg = 0;

    if (leftMuscleForce > 0) {
      const rawBend = (leftMass * 35.0 * leftMuscleForce) / (1.0 + 0.25 * leftMass);
      const maxAngle = Math.min(72.0, Math.max(18.0, rawBend));
      leftBendDeg = -maxAngle * flexPulse;
    }

    if (rightMuscleForce > 0) {
      const rawBend = (rightMass * 35.0 * rightMuscleForce) / (1.0 + 0.25 * rightMass);
      const maxAngle = Math.min(72.0, Math.max(18.0, rawBend));
      rightBendDeg = maxAngle * flexPulse;
    }

    jointDataMap.set(j.id, {
      id: j.id,
      x: j.x,
      y: j.y,
      leftMass,
      rightMass,
      leftBendDeg,
      rightBendDeg,
      accumulatedRotDeg: 0,
      worldX: j.x,
      worldY: j.y,
    });
  }

  // 3. Строим дерево кинематики шарниров от rootJoint
  const processedJointIds = new Set<string>();
  const processedJointsList: JointData[] = [];

  const rootData = jointDataMap.get(rootJoint.id)!;
  rootData.worldX = rootJoint.x;
  rootData.worldY = rootJoint.y;
  rootData.accumulatedRotDeg = 0;
  processedJointIds.add(rootJoint.id);
  processedJointsList.push(rootData);

  // Сортируем остальные шарниры по удаленности от корневого
  const remainingJoints = joints
    .filter((j) => j.id !== rootJoint.id)
    .sort((a, b) => {
      const dA = (a.x - rootJoint.x) ** 2 + (a.y - rootJoint.y) ** 2;
      const dB = (b.x - rootJoint.x) ** 2 + (b.y - rootJoint.y) ** 2;
      return dA - dB;
    });

  for (let i = 0; i < remainingJoints.length; i++) {
    const j = remainingJoints[i];
    const jData = jointDataMap.get(j.id)!;

    // Находим ближайший обработанный родительский шарнир
    let parentData = processedJointsList[0];
    let parentMinDistSq = (j.x - parentData.x) ** 2 + (j.y - parentData.y) ** 2;

    for (let pIdx = 1; pIdx < processedJointsList.length; pIdx++) {
      const cand = processedJointsList[pIdx];
      const dSq = (j.x - cand.x) ** 2 + (j.y - cand.y) ** 2;
      if (dSq < parentMinDistSq) {
        parentMinDistSq = dSq;
        parentData = cand;
      }
    }

    const dx = j.x - parentData.x;
    const dy = j.y - parentData.y;
    const projLeft = dx * lx + dy * ly;
    let bendOffset = 0;
    if (projLeft > 0.01) {
      bendOffset = parentData.leftBendDeg;
    } else if (projLeft < -0.01) {
      bendOffset = parentData.rightBendDeg;
    } else {
      bendOffset = 0; // На оси позвоночника
    }

    const totalRotDeg = parentData.accumulatedRotDeg + bendOffset;
    jData.accumulatedRotDeg = totalRotDeg;

    const rad = (parentData.accumulatedRotDeg + bendOffset) * (Math.PI / 180);
    const relX = j.x - parentData.x;
    const relY = j.y - parentData.y;

    const rotX = relX * Math.cos(rad) - relY * Math.sin(rad);
    const rotY = relX * Math.sin(rad) + relY * Math.cos(rad);

    jData.worldX = parentData.worldX + rotX;
    jData.worldY = parentData.worldY + rotY;

    processedJointIds.add(j.id);
    processedJointsList.push(jData);
  }

  // Сохраняем позиции шарниров
  for (let i = 0; i < processedJointsList.length; i++) {
    const jd = processedJointsList[i];
    const jointEl = elementMap.get(jd.id);
    if (jointEl) {
      result.set(jointEl.id, {
        id: jointEl.id,
        relX: jd.worldX,
        relY: jd.worldY,
        rotationDeg: jd.accumulatedRotDeg,
      });
    }
  }

  // 4. Позиционируем и поворачиваем все не-шарнирные элементы
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    if (el.type === 'joint') continue;

    // Находим ближайший шарнир
    let closestJoint = processedJointsList[0];
    let closestDistSq = (el.relX - closestJoint.x) ** 2 + (el.relY - closestJoint.y) ** 2;

    for (let k = 1; k < processedJointsList.length; k++) {
      const jd = processedJointsList[k];
      const dSq = (el.relX - jd.x) ** 2 + (el.relY - jd.y) ** 2;
      if (dSq < closestDistSq) {
        closestDistSq = dSq;
        closestJoint = jd;
      }
    }

    const dx = el.relX - closestJoint.x;
    const dy = el.relY - closestJoint.y;
    const projLeft = dx * lx + dy * ly;

    let sideBendDeg = 0;
    if (projLeft > 0.01 || el.type.includes('left')) {
      sideBendDeg = closestJoint.leftBendDeg;
    } else if (projLeft < -0.01 || el.type.includes('right')) {
      sideBendDeg = closestJoint.rightBendDeg;
    } else {
      sideBendDeg = 0;
    }

    const totalRotDeg = closestJoint.accumulatedRotDeg + sideBendDeg;
    const rad = (closestJoint.accumulatedRotDeg + sideBendDeg) * (Math.PI / 180);

    const rotX = dx * Math.cos(rad) - dy * Math.sin(rad);
    const rotY = dx * Math.sin(rad) + dy * Math.cos(rad);

    result.set(el.id, {
      id: el.id,
      relX: closestJoint.worldX + rotX,
      relY: closestJoint.worldY + rotY,
      rotationDeg: totalRotDeg,
    });
  }

  return result;
}

function sortedJointsForBends(joints: { id: string; x: number; y: number }[], rootJoint: { id: string; x: number; y: number }) {
  return [...joints].sort((a, b) => {
    const dA = (a.x - rootJoint.x) ** 2 + (a.y - rootJoint.y) ** 2;
    const dB = (b.x - rootJoint.x) ** 2 + (b.y - rootJoint.y) ** 2;
    return dA - dB;
  });
}

// Расчет всех точек чудика в мировых координатах с учетом изгибов
export function getCreatureElementWorldPositions(
  cx: number,
  cy: number,
  angleDeg: number,
  elements: CreatureElement[],
  muscleStep: number = 0,
  precalculatedForces?: PhysicsForces
): { x: number; y: number }[] {
  const baseHeadAngle = determineCreatureHeadAngle(elements);
  const rotRad = ((angleDeg - baseHeadAngle) * Math.PI) / 180;
  const cos = Math.cos(rotRad);
  const sin = Math.sin(rotRad);

  const points: { x: number; y: number }[] = [{ x: cx, y: cy }];

  const bentMap = calculateKinematicBends(elements, muscleStep, precalculatedForces);

  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    const bent = bentMap.get(el.id) || { relX: el.relX, relY: el.relY, rotationDeg: 0 };
    const wx = cx + bent.relX * cos - bent.relY * sin;
    const wy = cy + bent.relX * sin + bent.relY * cos;
    points.push({ x: wx, y: wy });

    if (el.type.startsWith('edge-')) {
      points.push({
        x: cx + (bent.relX * cos - bent.relY * sin) * 0.5,
        y: cy + (bent.relX * sin + bent.relY * cos) * 0.5,
      });
    }
  }


  return points;
}

export interface ConnectivityResult {
  isConnected: boolean;
  connectedIds: Set<string>;
  disconnectedIds: Set<string>;
}

// Проверка связности всех элементов чудика (отсутствие оторванных элементов / "ребер в воздухе")
export function getCreatureConnectivity(elements: CreatureElement[]): ConnectivityResult {
  if (elements.length <= 1) {
    return {
      isConnected: true,
      connectedIds: new Set(elements.map((e) => e.id)),
      disconnectedIds: new Set(),
    };
  }

  // Выбор опорного элемента: сначала Голова, затем Шарнир, иначе первый элемент
  let rootIdx = elements.findIndex((e) => e.type === 'head');
  if (rootIdx === -1) rootIdx = elements.findIndex((e) => e.type === 'joint');
  if (rootIdx === -1) rootIdx = 0;

  const connectedIndices = new Set<number>();
  const queue: number[] = [rootIdx];
  connectedIndices.add(rootIdx);

  while (queue.length > 0) {
    const currIdx = queue.shift()!;
    const curr = elements[currIdx];

    for (let i = 0; i < elements.length; i++) {
      if (connectedIndices.has(i)) continue;
      const other = elements[i];
      const dx = Math.abs(curr.relX - other.relX);
      const dy = Math.abs(curr.relY - other.relY);

      // Связанные элементы находятся в соседних клетках сетки (dx <= 1, dy <= 1)
      if (dx <= 1 && dy <= 1) {
        connectedIndices.add(i);
        queue.push(i);
      }
    }
  }

  const connectedIds = new Set<string>();
  const disconnectedIds = new Set<string>();

  elements.forEach((el, idx) => {
    if (connectedIndices.has(idx)) {
      connectedIds.add(el.id);
    } else {
      disconnectedIds.add(el.id);
    }
  });

  return {
    isConnected: disconnectedIds.size === 0,
    connectedIds,
    disconnectedIds,
  };
}

// Расчет квадрата расстояния от точки (px, py) до отрезка (ax, ay) -> (bx, by)
export function pointToSegmentDistanceSq(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  if (dx === 0 && dy === 0) {
    return (px - ax) ** 2 + (py - ay) ** 2;
  }
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  const projX = ax + t * dx;
  const projY = ay + t * dy;
  return (px - projX) ** 2 + (py - projY) ** 2;
}

// Точная проверка столкновения с едой с учетом заметаемого траекторного отрезка чудика и всех его деталей
export function findEatenFood(
  prevX: number,
  prevY: number,
  prevAngleDeg: number,
  nextX: number,
  nextY: number,
  nextAngleDeg: number,
  elements: CreatureElement[],
  foods: Food[],
  ignoreIds: Set<string> = new Set(),
  muscleStep: number = 0,
  forces?: PhysicsForces,
  maxRadius: number = 0.7 // Радиус касания: 0.5 клетки (элемент) + 0.2 клетки (еда)
): Food | null {
  if (foods.length === 0) return null;

  const maxRadiusSq = maxRadius * maxRadius;

  // Точки чудика в начале движения
  const startPoints = getCreatureElementWorldPositions(prevX, prevY, prevAngleDeg, elements, muscleStep, forces);
  // Точки чудика в конце движения
  const endPoints = getCreatureElementWorldPositions(nextX, nextY, nextAngleDeg, elements, muscleStep, forces);

  for (let i = 0; i < foods.length; i++) {
    const f = foods[i];
    if (ignoreIds.has(f.id)) continue;

    // 1. Проверка непрерывной траектории центра чудика
    if (pointToSegmentDistanceSq(f.x, f.y, prevX, prevY, nextX, nextY) <= maxRadiusSq) {
      return f;
    }

    // 2. Проверка непрерывных траекторий каждой физической детали (голова, щупальца, края)
    for (let p = 0; p < endPoints.length; p++) {
      const sp = startPoints[p] || { x: prevX, y: prevY };
      const ep = endPoints[p];
      if (pointToSegmentDistanceSq(f.x, f.y, sp.x, sp.y, ep.x, ep.y) <= maxRadiusSq) {
        return f;
      }
    }
  }

  return null;
}

export function calculateCreatureRadius(elements: CreatureElement[]): number {
  let maxR = 0.5; // Радиус касания отдельной детали = 0.5 клетки (полклетки)
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    const r = Math.hypot(el.relX, el.relY) + 0.5;
    if (r > maxR) maxR = r;
  }
  return maxR;
}

export interface CreatureCollisionResult {
  creatures: Creature[];
  hasCollided: boolean;
  maxImpulse: number;
}

// Физический расчет столкновений чудиков с радиусом детали = 0.5 клетки и сохранением импульса (p = m*v)
export function resolveCreatureCollisions(creatures: Creature[]): CreatureCollisionResult {
  if (creatures.length < 2) {
    return { creatures, hasCollided: false, maxImpulse: 0 };
  }

  const ELEMENT_RADIUS = 0.5; // Радиус детали = полклетки
  const list = creatures.map((c) => ({ ...c }));
  let hasCollided = false;
  let maxImpulse = 0;

  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const cA = list[i];
      const cB = list[j];

      const rA = calculateCreatureRadius(cA.elements);
      const rB = calculateCreatureRadius(cB.elements);

      const centerDist = Math.hypot(cB.x - cA.x, cB.y - cA.y);
      if (centerDist >= rA + rB) continue;

      // Вычисление точных мировых координат всех элементов
      const ptsA = getCreatureElementWorldPositions(cA.x, cA.y, cA.angleDeg, cA.elements, cA.muscleStep, cA.forces);
      const ptsB = getCreatureElementWorldPositions(cB.x, cB.y, cB.angleDeg, cB.elements, cB.muscleStep, cB.forces);

      let minElDist = Infinity;
      let contactPtA = { x: cA.x, y: cA.y };
      let contactPtB = { x: cB.x, y: cB.y };

      // Поиск минимального расстояния между элементами A и B
      for (let pa = 0; pa < ptsA.length; pa++) {
        for (let pb = 0; pb < ptsB.length; pb++) {
          const edx = ptsB[pb].x - ptsA[pa].x;
          const edy = ptsB[pb].y - ptsA[pa].y;
          const edist = Math.hypot(edx, edy);

          if (edist < minElDist) {
            minElDist = edist;
            contactPtA = ptsA[pa];
            contactPtB = ptsB[pb];
          }
        }
      }

      // Касание происходит, когда расстояния между деталями < 1.0 клетки (0.5 + 0.5)
      const touchDist = ELEMENT_RADIUS * 2;
      if (minElDist >= touchDist) continue;

      hasCollided = true;

      // Вектор от точки контакта A к точке контакта B
      let nx = contactPtB.x - contactPtA.x;
      let ny = contactPtB.y - contactPtA.y;
      let len = Math.hypot(nx, ny);

      if (len < 0.0001) {
        nx = cB.x - cA.x;
        ny = cB.y - cA.y;
        len = Math.hypot(nx, ny);
        if (len < 0.0001) {
          nx = 1;
          ny = 0;
          len = 1;
        }
      }

      nx /= len;
      ny /= len;

      const mA = Math.max(0.5, cA.forces?.totalMass || cA.elements.length * 1.2);
      const mB = Math.max(0.5, cB.forces?.totalMass || cB.elements.length * 1.2);

      // 1. Позиционное разделение при перекрытии (устраняет вклинивание деталей)
      const overlap = touchDist - minElDist;
      if (overlap > 0) {
        const pushA = overlap * (mB / (mA + mB));
        const pushB = overlap * (mA / (mA + mB));

        cA.x -= nx * pushA;
        cA.y -= ny * pushA;
        cB.x += nx * pushB;
        cB.y += ny * pushB;
      }

      // 2. Определение физических скоростей движения
      const speedA = (cA.forces?.forwardSpeed ?? 0.3) * 0.35;
      const speedB = (cB.forces?.forwardSpeed ?? 0.3) * 0.35;

      const radA = (cA.angleDeg * Math.PI) / 180;
      const radB = (cB.angleDeg * Math.PI) / 180;

      const vAx = speedA * Math.cos(radA);
      const vAy = speedA * Math.sin(radA);

      const vBx = speedB * Math.cos(radB);
      const vBy = speedB * Math.sin(radB);

      // Проекции скоростей на нормаль сближения n
      const vAn = vAx * nx + vAy * ny;
      const vBn = vBx * nx + vBy * ny;

      // Относительная скорость сближения
      const vRel = vAn - vBn;

      // Импульсный обмен происходит только при сближении (vRel > 0)
      if (vRel > 0) {
        const restitution = 0.5; // Коэффициент упругости
        const impulse = ((1 + restitution) * vRel) / (1 / mA + 1 / mB);

        if (impulse > maxImpulse) maxImpulse = impulse;

        // Вращательные моменты (Torque) от удара относительно центров масс
        const rxA = contactPtA.x - cA.x;
        const ryA = contactPtA.y - cA.y;
        const rxB = contactPtB.x - cB.x;
        const ryB = contactPtB.y - cB.y;

        // Векторы импульсов сил: на A действует (-impulse * n), на B (+impulse * n)
        const jAx = -impulse * nx;
        const jAy = -impulse * ny;
        const jBx = +impulse * nx;
        const jBy = +impulse * ny;

        // Крутящий момент τ = r_x * J_y - r_y * J_x
        const torqueA = rxA * jAy - ryA * jAx;
        const torqueB = rxB * jBy - ryB * jBx;

        // Моменты инерции чудиков
        const iA = Math.max(1, cA.forces?.totalInertia || mA * Math.pow(rA, 2) * 0.5);
        const iB = Math.max(1, cB.forces?.totalInertia || mB * Math.pow(rB, 2) * 0.5);

        // Поворот угла тела, пропорциональный крутящему моменту (torque)
        const dAngleA = (torqueA / iA) * (180 / Math.PI) * 1.2;
        const dAngleB = (torqueB / iB) * (180 / Math.PI) * 1.2;

        // Ограничиваем максимальный поворот от одного столкновения (не более 25°)
        const clampedDA = Math.max(-25, Math.min(25, dAngleA));
        const clampedDB = Math.max(-25, Math.min(25, dAngleB));

        cA.angleDeg = (cA.angleDeg + clampedDA + 360) % 360;
        cB.angleDeg = (cB.angleDeg + clampedDB + 360) % 360;
      }
    }
  }

  return { creatures: list, hasCollided, maxImpulse };
}
