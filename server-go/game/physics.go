package game

import (
	"fmt"
	"math"
	"strings"
)

// Default Creature Presets
var DefaultPresets = []struct {
	Name        string            `json:"name"`
	Description string            `json:"description"`
	Elements    []CreatureElement `json:"elements"`
}{
	{
		Name:        "Чудик-Маятник",
		Description: "Центральный шарнир с головой вверху, симметричными ребрами и противоположными мышцами. Бежит вперед!",
		Elements: []CreatureElement{
			{ID: "head-top", RelX: 0, RelY: -1, Type: ElementHead, Weight: 0, HeadAngle: floatPtr(270)},
			{ID: "joint-center", RelX: 0, RelY: 0, Type: ElementJoint, Weight: 0},
			{ID: "edge-l1", RelX: -1, RelY: 0, Type: ElementEdgeH, Weight: 1},
			{ID: "edge-r1", RelX: 1, RelY: 0, Type: ElementEdgeH, Weight: 1},
			{ID: "edge-v1", RelX: 0, RelY: -1, Type: ElementEdgeV, Weight: 1},
			{ID: "muscle-l", RelX: -1, RelY: -1, Type: ElementMuscleLeft, Weight: 0},
			{ID: "muscle-r", RelX: 1, RelY: -1, Type: ElementMuscleRight, Weight: 0},
		},
	},
	{
		Name:        "Асимметричный Вращатель",
		Description: "Имеет голову и больше ребер на левом плече. Легкое правое плечо совершает поворот на шарнире при сокращении.",
		Elements: []CreatureElement{
			{ID: "head-top", RelX: 0, RelY: -1, Type: ElementHead, Weight: 0, HeadAngle: floatPtr(270)},
			{ID: "joint-center", RelX: 0, RelY: 0, Type: ElementJoint, Weight: 0},
			{ID: "edge-l1", RelX: -1, RelY: 0, Type: ElementEdgeH, Weight: 1},
			{ID: "edge-l2", RelX: -1, RelY: 1, Type: ElementEdgeV, Weight: 1},
			{ID: "edge-r1", RelX: 1, RelY: 0, Type: ElementEdgeH, Weight: 1},
			{ID: "muscle-l", RelX: -1, RelY: -1, Type: ElementMuscleLeft, Weight: 0},
		},
	},
	{
		Name:        "Диагональный Бегун (45°)",
		Description: "Использует диагональные ребра (/) и (\\) с ведущей головой для быстрого перемещения по сетке.",
		Elements: []CreatureElement{
			{ID: "head-top", RelX: 0, RelY: -1, Type: ElementHead, Weight: 0, HeadAngle: floatPtr(270)},
			{ID: "joint-center", RelX: 0, RelY: 0, Type: ElementJoint, Weight: 0},
			{ID: "edge-d1", RelX: -1, RelY: -1, Type: ElementEdgeD2, Weight: 1},
			{ID: "edge-d2", RelX: 1, RelY: -1, Type: ElementEdgeD1, Weight: 1},
			{ID: "edge-d3", RelX: -1, RelY: 1, Type: ElementEdgeD1, Weight: 1},
			{ID: "edge-d4", RelX: 1, RelY: 1, Type: ElementEdgeD2, Weight: 1},
			{ID: "muscle-l", RelX: -1, RelY: 0, Type: ElementMuscleLeft, Weight: 0},
			{ID: "muscle-r", RelX: 1, RelY: 0, Type: ElementMuscleRight, Weight: 0},
		},
	},
	{
		Name:        "Двухшарнирный Сороконожка",
		Description: "Два шарнира на разных узлах сетки с мышцами сгибания и головой, создающими движение вперед.",
		Elements: []CreatureElement{
			{ID: "head-top", RelX: 0, RelY: -2, Type: ElementHead, Weight: 0, HeadAngle: floatPtr(270)},
			{ID: "joint-1", RelX: 0, RelY: -1, Type: ElementJoint, Weight: 0},
			{ID: "joint-2", RelX: 0, RelY: 1, Type: ElementJoint, Weight: 0},
			{ID: "edge-v", RelX: 0, RelY: 0, Type: ElementEdgeV, Weight: 1},
			{ID: "edge-h1", RelX: -1, RelY: -1, Type: ElementEdgeH, Weight: 1},
			{ID: "edge-h2", RelX: 1, RelY: -1, Type: ElementEdgeH, Weight: 1},
			{ID: "edge-h3", RelX: -1, RelY: 1, Type: ElementEdgeH, Weight: 1},
			{ID: "edge-h4", RelX: 1, RelY: 1, Type: ElementEdgeH, Weight: 1},
			{ID: "muscle-1", RelX: -1, RelY: 0, Type: ElementMuscleLeft, Weight: 0},
			{ID: "muscle-2", RelX: 1, RelY: 0, Type: ElementMuscleRight, Weight: 0},
		},
	},
	{
		Name:        "Хаотичный Бегун (Случайные Мышцы 🎲)",
		Description: "Использует случайные мышцы с вероятностью срабатывания (35%). Движение и повороты непредсказуемы каждый ход!",
		Elements: []CreatureElement{
			{ID: "head-top", RelX: 0, RelY: -1, Type: ElementHead, Weight: 0, HeadAngle: floatPtr(270)},
			{ID: "joint-center", RelX: 0, RelY: 0, Type: ElementJoint, Weight: 0},
			{ID: "edge-l1", RelX: -1, RelY: 0, Type: ElementEdgeH, Weight: 1},
			{ID: "edge-r1", RelX: 1, RelY: 0, Type: ElementEdgeH, Weight: 1},
			{ID: "edge-v1", RelX: 0, RelY: -1, Type: ElementEdgeV, Weight: 1},
			{ID: "muscle-rnd-l", RelX: -1, RelY: -1, Type: ElementMuscleRandomLeft, Weight: 0, RandomChance: floatPtr(35)},
			{ID: "muscle-rnd-r", RelX: 1, RelY: -1, Type: ElementMuscleRandomRight, Weight: 0, RandomChance: floatPtr(35)},
		},
	},
}

func floatPtr(v float64) *float64 {
	return &v
}

func IsRandomMuscleTriggered(el CreatureElement, cycle int) bool {
	if cycle <= 0 {
		return true
	}
	chance := 35.0
	if el.RandomChance != nil {
		chance = *el.RandomChance
	}
	chance = math.Max(10.0, math.Min(90.0, chance))
	hash := int32(0)
	str := fmt.Sprintf("%s_c_%d", el.ID, cycle)
	for i := 0; i < len(str); i++ {
		hash = (hash << 5) - hash + int32(str[i])
	}
	val := math.Abs(float64(hash))
	valMod := math.Mod(val, 100)
	return valMod < chance
}

type RandomMuscleState struct {
	IsFlexed     bool
	JustFlexed   bool
	JustUnflexed bool
}

func GetRandomMuscleState(el CreatureElement, step int) RandomMuscleState {
	if step <= 0 {
		return RandomMuscleState{}
	}
	isTriggeredNow := IsRandomMuscleTriggered(el, step)
	isTriggeredPrev := IsRandomMuscleTriggered(el, step-1)
	return RandomMuscleState{
		IsFlexed:     isTriggeredNow,
		JustFlexed:   isTriggeredNow && !isTriggeredPrev,
		JustUnflexed: !isTriggeredNow && isTriggeredPrev,
	}
}

func DetermineCreatureHeadAngle(elements []CreatureElement) float64 {
	for _, el := range elements {
		if el.Type == ElementHead {
			if el.HeadAngle != nil {
				return *el.HeadAngle
			}
			if el.RelX != 0 || el.RelY != 0 {
				rad := math.Atan2(el.RelY, el.RelX)
				deg := math.Round((rad * 180) / math.Pi)
				if deg < 0 {
					deg += 360
				}
				return deg
			}
		}
	}
	return 270.0
}

func CalculatePhysicsForces(elements []CreatureElement, muscleActiveStep int) PhysicsForces {
	isMuscleContracted := muscleActiveStep%2 == 1

	headAngle := DetermineCreatureHeadAngle(elements)
	headRad := (headAngle * math.Pi) / 180.0

	// Local unit vectors relative to head orientation
	fx := math.Cos(headRad)
	fy := math.Sin(headRad)
	lx := fy
	ly := -fx

	type JointNode struct {
		ID string
		X  float64
		Y  float64
	}

	joints := []JointNode{}
	edgeElements := []CreatureElement{}
	muscleElements := []CreatureElement{}

	totalMass := 0.0
	totalInertia := 0.0
	totalLeftMass := 0.0
	totalRightMass := 0.0

	// Spec: only edges (ribs) have mass = 1.0; joints, muscles, head = 0
	for _, el := range elements {
		elWeight := 0.0

		if el.Type == ElementJoint {
			joints = append(joints, JointNode{ID: el.ID, X: el.RelX, Y: el.RelY})
		} else if strings.HasPrefix(string(el.Type), "edge-") {
			edgeElements = append(edgeElements, el)
			elWeight = 1.0
		} else if strings.HasPrefix(string(el.Type), "muscle-") {
			muscleElements = append(muscleElements, el)
		} else if el.Type == ElementHead {
			// Head mass = 0 per spec
		}

		totalMass += elWeight

		// Spec: I = sum(m_i * r_i^2) — no +0.5
		rSq := el.RelX*el.RelX + el.RelY*el.RelY
		totalInertia += elWeight * rSq

		projLeft := el.RelX*lx + el.RelY*ly
		if projLeft > 0.01 {
			totalLeftMass += elWeight
		} else if projLeft < -0.01 {
			totalRightMass += elWeight
		} else {
			totalLeftMass += elWeight * 0.5
			totalRightMass += elWeight * 0.5
		}
	}

	if len(joints) == 0 {
		joints = append(joints, JointNode{ID: "center-joint", X: 0, Y: 0})
	}

	// Spec fallback: I ~= M * R^2 * 0.5 when too small
	totalMass = math.Max(1.0, totalMass)
	totalInertia = math.Max(1.0, totalInertia)

	jointsPhysics := []JointPhysics{}
	sumLeftTorque := 0.0
	sumRightTorque := 0.0
	totalActiveMusclesCount := 0
	motionActiveMusclesCount := 0

	hasMultipleJoints := len(joints) > 1

	for _, j := range joints {
		jLeftMass := 0.0
		jRightMass := 0.0
		jLeftTorquePotential := 0.0
		jRightTorquePotential := 0.0

		for _, el := range edgeElements {
			weight := 1.0
			dx := el.RelX - j.X
			dy := el.RelY - j.Y

			projLeft := dx*lx + dy*ly

			if projLeft > 0.01 {
				arm := projLeft
				leverMultiplier := 1.0 + 0.5*(arm-1.0)
				jLeftMass += weight
				jLeftTorquePotential += weight * leverMultiplier
			} else if projLeft < -0.01 {
				arm := -projLeft
				leverMultiplier := 1.0 + 0.5*(arm-1.0)
				jRightMass += weight
				jRightTorquePotential += weight * leverMultiplier
			} else {
				jLeftMass += weight * 0.5
				jRightMass += weight * 0.5
				jLeftTorquePotential += weight * 0.5
				jRightTorquePotential += weight * 0.5
			}
		}

		activeLeftMuscles := 0.0
		activeRightMuscles := 0.0

		for _, el := range muscleElements {
			if hasMultipleJoints {
				mdx := el.RelX - j.X
				mdy := el.RelY - j.Y
				if mdx*mdx+mdy*mdy > 6.25 {
					continue
				}
			}

			providesTorque := false
			providesMotion := false

			if el.Type == ElementMuscleLeft || el.Type == ElementMuscleRight {
				providesTorque = isMuscleContracted
				providesMotion = true
			} else if el.Type == ElementMuscleRandomLeft || el.Type == ElementMuscleRandomRight {
				mState := GetRandomMuscleState(el, muscleActiveStep)
				providesTorque = mState.JustFlexed
				providesMotion = mState.JustFlexed || mState.JustUnflexed
			}

			if providesTorque {
				mdx := el.RelX - j.X
				mdy := el.RelY - j.Y
				spineDist := math.Abs(mdx*fx + mdy*fy)

				muscleArm := 1.0 + 0.4*spineDist
				muscleForce := 1.5 * muscleArm

				if strings.Contains(string(el.Type), "left") {
					activeLeftMuscles += muscleForce
				} else if strings.Contains(string(el.Type), "right") {
					activeRightMuscles += muscleForce
				}
			}

			if providesMotion {
				motionActiveMusclesCount++
			}
		}

		netJointTorque := activeLeftMuscles - activeRightMuscles

		jointsPhysics = append(jointsPhysics, JointPhysics{
			JointID:              j.ID,
			JX:                   j.X,
			JY:                   j.Y,
			LeftEdgeMass:         jLeftMass,
			RightEdgeMass:        jRightMass,
			LeftTorquePotential:  jLeftTorquePotential,
			RightTorquePotential: jRightTorquePotential,
			ActiveLeftMuscles:    int(math.Round(activeLeftMuscles)),
			ActiveRightMuscles:   int(math.Round(activeRightMuscles)),
			NetJointTorque:       netJointTorque,
		})

		sumLeftTorque += activeLeftMuscles
		sumRightTorque += activeRightMuscles
		if activeLeftMuscles+activeRightMuscles > 0 {
			totalActiveMusclesCount++
		}
	}

	netTorque := sumLeftTorque - sumRightTorque

	// Rotation from torque difference
	netRotationDeg := 0.0
	if math.Abs(netTorque) > 0 {
		rawRotation := (netTorque / totalInertia) * 28.0
		netRotationDeg = math.Min(60.0, math.Max(-60.0, rawRotation))
	}

	isLighterSideRotating := totalLeftMass != totalRightMass && netTorque != 0

	// Spec: v_forward = 0.25 base; balanced part -> forward, difference -> rotation
	forwardSpeed := 0.0
	if motionActiveMusclesCount > 0 || sumLeftTorque > 0 || sumRightTorque > 0 {
		balanced := math.Min(sumLeftTorque, sumRightTorque)
		if balanced > 0 {
			forwardSpeed = math.Min(0.25, 0.12+balanced*0.06)
		} else {
			forwardSpeed = 0.08
		}
	}

	return PhysicsForces{
		LeftTorque:            sumLeftTorque,
		RightTorque:           sumRightTorque,
		NetRotationDeg:        netRotationDeg,
		ForwardSpeed:          forwardSpeed,
		LeftMass:              totalLeftMass,
		RightMass:             totalRightMass,
		TotalMass:             totalMass,
		TotalInertia:          totalInertia,
		IsLighterSideRotating: isLighterSideRotating,
		JointsPhysics:         jointsPhysics,
		ActiveMusclesCount:    totalActiveMusclesCount,
	}
}

// ResolveCreatureCollisions implements Newtonian collision physics per spec sections 4-5:
// - Two-phase detection (broad + narrow element-level)
// - Impulse with elasticity e=0.5
// - Positional separation proportional to mass
// - Torque from off-center hits, angle clamped to +/-25 deg
func ResolveCreatureCollisions(creatures map[string]*Creature) {
	if len(creatures) < 2 {
		return
	}

	const touchDist = 1.0   // elementRadius(0.5) * 2
	const restitution = 0.5 // spec: e = 0.5

	list := make([]*Creature, 0, len(creatures))
	for _, c := range creatures {
		list = append(list, c)
	}

	for i := 0; i < len(list); i++ {
		for j := i + 1; j < len(list); j++ {
			cA := list[i]
			cB := list[j]

			// Broad-phase
			rA := CalculateCreatureRadius(cA.Elements)
			rB := CalculateCreatureRadius(cB.Elements)
			centerDist := math.Hypot(cB.X-cA.X, cB.Y-cA.Y)
			if centerDist >= rA+rB {
				continue
			}

			// Narrow-phase: element-level
			ptsA := GetCreatureElementWorldPositions(cA.X, cA.Y, cA.AngleDeg, cA.Elements)
			ptsB := GetCreatureElementWorldPositions(cB.X, cB.Y, cB.AngleDeg, cB.Elements)

			minElDist := math.Inf(1)
			var contactPtA, contactPtB Point

			for pa := 0; pa < len(ptsA); pa++ {
				for pb := 0; pb < len(ptsB); pb++ {
					edist := math.Hypot(ptsB[pb].X-ptsA[pa].X, ptsB[pb].Y-ptsA[pa].Y)
					if edist < minElDist {
						minElDist = edist
						contactPtA = ptsA[pa]
						contactPtB = ptsB[pb]
					}
				}
			}

			if minElDist >= touchDist {
				continue
			}

			// Normal vector from contact A to contact B
			nx := contactPtB.X - contactPtA.X
			ny := contactPtB.Y - contactPtA.Y
			nlen := math.Hypot(nx, ny)

			if nlen < 0.0001 {
				nx = cB.X - cA.X
				ny = cB.Y - cA.Y
				nlen = math.Hypot(nx, ny)
				if nlen < 0.0001 {
					nx = 1
					ny = 0
					nlen = 1
				}
			}
			nx /= nlen
			ny /= nlen

			mA := math.Max(0.5, cA.Forces.TotalMass)
			mB := math.Max(0.5, cB.Forces.TotalMass)

			// Positional separation (anti-overlap)
			overlap := touchDist - minElDist
			if overlap > 0 {
				pushA := overlap * (mB / (mA + mB))
				pushB := overlap * (mA / (mA + mB))
				cA.X -= nx * pushA
				cA.Y -= ny * pushA
				cB.X += nx * pushB
				cB.Y += ny * pushB
			}

			// Velocities
			speedA := cA.Forces.ForwardSpeed * 0.35
			speedB := cB.Forces.ForwardSpeed * 0.35

			radA := (cA.AngleDeg * math.Pi) / 180.0
			radB := (cB.AngleDeg * math.Pi) / 180.0

			vAn := (speedA*math.Cos(radA))*nx + (speedA*math.Sin(radA))*ny
			vBn := (speedB*math.Cos(radB))*nx + (speedB*math.Sin(radB))*ny
			vRel := vAn - vBn

			// Impulse exchange only when approaching
			if vRel > 0 {
				impulse := ((1 + restitution) * vRel) / (1.0/mA + 1.0/mB)

				// Torque from off-center hit
				rxA := contactPtA.X - cA.X
				ryA := contactPtA.Y - cA.Y
				rxB := contactPtB.X - cB.X
				ryB := contactPtB.Y - cB.Y

				jAx := -impulse * nx
				jAy := -impulse * ny
				jBx := +impulse * nx
				jBy := +impulse * ny

				torqueA := rxA*jAy - ryA*jAx
				torqueB := rxB*jBy - ryB*jBx

				iA := math.Max(1.0, cA.Forces.TotalInertia)
				iB := math.Max(1.0, cB.Forces.TotalInertia)

				dAngleA := (torqueA / iA) * (180.0 / math.Pi) * 1.2
				dAngleB := (torqueB / iB) * (180.0 / math.Pi) * 1.2

				clampedDA := math.Max(-25, math.Min(25, dAngleA))
				clampedDB := math.Max(-25, math.Min(25, dAngleB))

				cA.AngleDeg = math.Mod(cA.AngleDeg+clampedDA+360, 360)
				cB.AngleDeg = math.Mod(cB.AngleDeg+clampedDB+360, 360)
				cA.TargetAngleDeg = cA.AngleDeg
				cB.TargetAngleDeg = cB.AngleDeg
			}
		}
	}
}

type Point struct {
	X float64
	Y float64
}

func GetVectorFromAngle(angleDeg float64) (float64, float64) {
	rad := (angleDeg * math.Pi) / 180.0
	return math.Cos(rad), math.Sin(rad)
}

func CalculateCreatureRadius(elements []CreatureElement) float64 {
	maxR := 0.5
	for _, el := range elements {
		r := math.Hypot(el.RelX, el.RelY) + 0.5
		if r > maxR {
			maxR = r
		}
	}
	return maxR
}

func PointToSegmentDistanceSq(px, py, ax, ay, bx, by float64) float64 {
	dx := bx - ax
	dy := by - ay
	if dx == 0 && dy == 0 {
		return (px-ax)*(px-ax) + (py-ay)*(py-ay)
	}
	t := math.Max(0, math.Min(1, ((px-ax)*dx+(py-ay)*dy)/(dx*dx+dy*dy)))
	projX := ax + t*dx
	projY := ay + t*dy
	return (px-projX)*(px-projX) + (py-projY)*(py-projY)
}

func GetCreatureElementWorldPositions(cx, cy, angleDeg float64, elements []CreatureElement) []Point {
	baseHeadAngle := DetermineCreatureHeadAngle(elements)
	rotRad := ((angleDeg - baseHeadAngle) * math.Pi) / 180.0
	cos := math.Cos(rotRad)
	sin := math.Sin(rotRad)

	points := []Point{{X: cx, Y: cy}}
	for _, el := range elements {
		wx := cx + el.RelX*cos - el.RelY*sin
		wy := cy + el.RelX*sin + el.RelY*cos
		points = append(points, Point{X: wx, Y: wy})
	}
	return points
}

func FindEatenFood(prevX, prevY, prevAngleDeg, nextX, nextY, nextAngleDeg float64, elements []CreatureElement, foods []Food) *Food {
	if len(foods) == 0 {
		return nil
	}
	maxRadiusSq := 0.7 * 0.7

	startPts := GetCreatureElementWorldPositions(prevX, prevY, prevAngleDeg, elements)
	endPts := GetCreatureElementWorldPositions(nextX, nextY, nextAngleDeg, elements)

	for i := range foods {
		f := &foods[i]
		if PointToSegmentDistanceSq(f.X, f.Y, prevX, prevY, nextX, nextY) <= maxRadiusSq {
			return f
		}
		for p := range endPts {
			sp := Point{X: prevX, Y: prevY}
			if p < len(startPts) {
				sp = startPts[p]
			}
			ep := endPts[p]
			if PointToSegmentDistanceSq(f.X, f.Y, sp.X, sp.Y, ep.X, ep.Y) <= maxRadiusSq {
				return f
			}
		}
	}
	return nil
}
