package game

import (
	"fmt"
	"math"
	"math/rand"
	"sort"
	"sync"
	"time"
)

type EventCallback func(msg WSOutputMessage, targetPlayerID string)

type Room struct {
	mu            sync.RWMutex
	worldRadius   float64
	step          uint64
	creatures     map[string]*Creature
	foods         map[string]*Food
	spatialGrid   *SpatialGrid
	botController *BotController
	broadcastCb   EventCallback
	startTime     time.Time
	lastTickTime  time.Time
	minBots       int
	maxFoods      int
	rnd           *rand.Rand
}

func NewRoom(worldRadius float64, minBots int, maxFoods int, cb EventCallback) *Room {
	r := &Room{
		worldRadius:   worldRadius,
		step:          0,
		creatures:     make(map[string]*Creature),
		foods:         make(map[string]*Food),
		spatialGrid:   NewSpatialGrid(10.0),
		botController: NewBotController(),
		broadcastCb:   cb,
		startTime:     time.Now(),
		lastTickTime:  time.Now(),
		minBots:       minBots,
		maxFoods:      maxFoods,
		rnd:           rand.New(rand.NewSource(time.Now().UnixNano())),
	}

	r.initWorld()
	return r
}

func (r *Room) initWorld() {
	// Spawn initial food items on grid nodes
	for i := 0; i < r.maxFoods; i++ {
		r.spawnRandomFood()
	}

	// Spawn initial AI Bots
	bots := r.botController.SpawnInitialBots(r.minBots, r.worldRadius)
	for _, bot := range bots {
		b := bot
		r.creatures[b.ID] = &b
	}
}

func (r *Room) spawnRandomFood() {
	id := fmt.Sprintf("food-%d-%d", time.Now().UnixNano(), r.rnd.Intn(10000))
	angle := r.rnd.Float64() * math.Pi * 2
	dist := r.rnd.Float64() * (r.worldRadius - 2.0)
	x := math.Round(math.Cos(angle) * dist)
	y := math.Round(math.Sin(angle) * dist)

	foodType := FoodBerry
	val := 10
	typeRoll := r.rnd.Float64()
	if typeRoll > 0.85 {
		foodType = FoodGolden
		val = 25
	} else if typeRoll > 0.65 {
		foodType = FoodSuper
		val = 15
	}

	f := Food{
		ID:        id,
		X:         x,
		Y:         y,
		Value:     val,
		Type:      foodType,
		SpawnTime: time.Now().UnixMilli(),
	}
	r.foods[id] = &f
}

func (r *Room) AddPlayer(playerID, name, color string, elements []CreatureElement, presetIndex int, targetX *float64, targetY *float64, targetAngleDeg *float64) *Creature {
	r.mu.Lock()
	defer r.mu.Unlock()

	cID := fmt.Sprintf("player-%s", playerID)

	if len(elements) == 0 {
		preset := DefaultPresets[presetIndex%len(DefaultPresets)]
		elements = make([]CreatureElement, len(preset.Elements))
		copy(elements, preset.Elements)
	}

	forces := CalculatePhysicsForces(elements, 0)
	angle := DetermineCreatureHeadAngle(elements)
	if targetAngleDeg != nil {
		angle = *targetAngleDeg
	}

	// Spawn near center or target position
	spawnX := 0.0
	spawnY := 0.0

	if targetX != nil && targetY != nil {
		spawnX = *targetX
		spawnY = *targetY
	} else {
		spawnRad := r.rnd.Float64() * math.Pi * 2
		spawnDist := r.rnd.Float64() * (r.worldRadius * 0.5)
		spawnX = math.Round(math.Cos(spawnRad) * spawnDist)
		spawnY = math.Round(math.Sin(spawnRad) * spawnDist)
	}

	if name == "" {
		name = "Игрок-Чудик"
	}
	if color == "" {
		color = "#6366f1"
	}

	creature := Creature{
		ID:             cID,
		PlayerID:       playerID,
		Name:           name,
		Color:          color,
		IsBot:          false,
		X:              spawnX,
		Y:              spawnY,
		AngleDeg:       angle,
		TargetAngleDeg: angle,
		TargetX:        spawnX,
		TargetY:        spawnY,
		Energy:         150,
		MaxEnergy:      200,
		FoodEaten:      0,
		Score:          100,
		StepsCount:     0,
		MuscleStep:     0,
		State:          "idle",
		Elements:       elements,
		Forces:         forces,
		PrevX:          spawnX,
		PrevY:          spawnY,
		PrevAngleDeg:   angle,
		Kills:          0,
		LastActive:     time.Now(),
	}

	r.creatures[cID] = &creature
	return &creature
}

func (r *Room) RemovePlayer(playerID string) {
	r.mu.Lock()
	defer r.mu.Unlock()

	cID := fmt.Sprintf("player-%s", playerID)
	delete(r.creatures, cID)
}

func (r *Room) HandleInput(playerID string, msg WSInputMessage) {
	r.mu.Lock()
	defer r.mu.Unlock()

	cID := fmt.Sprintf("player-%s", playerID)
	c, exists := r.creatures[cID]
	if !exists {
		return
	}

	c.LastActive = time.Now()

	if msg.TargetAngleDeg != nil {
		c.TargetAngleDeg = *msg.TargetAngleDeg
	}
	if msg.TargetX != nil && msg.TargetY != nil {
		c.TargetX = *msg.TargetX
		c.TargetY = *msg.TargetY
	}

	if msg.MuscleContract {
		c.MuscleStep++
	}

	if msg.Dash && c.Energy > 15 {
		c.Energy -= 8
		c.State = "dashing"
	} else {
		c.State = "moving"
	}
}

func (r *Room) addFoodAtUnsafe(x, y float64, foodType FoodType) {

	val := 10
	if foodType == FoodGolden {
		val = 25
	} else if foodType == FoodSuper {
		val = 15
	}

	id := fmt.Sprintf("food-custom-%d-%d", time.Now().UnixNano(), r.rnd.Intn(1000))
	r.foods[id] = &Food{
		ID:        id,
		X:         x,
		Y:         y,
		Value:     val,
		Type:      foodType,
		SpawnTime: time.Now().UnixMilli(),
	}
}

func (r *Room) AddFoodAt(x, y float64, foodType FoodType) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.addFoodAtUnsafe(x, y, foodType)
}

func (r *Room) StartLoop() {
	ticker := time.NewTicker(33 * time.Millisecond) // ~30 Hz tick rate
	go func() {
		defer func() {
			if rec := recover(); rec != nil {
				fmt.Printf("[PANIC RECOVERY] Room Tick loop recovered: %v\n", rec)
			}
		}()
		for range ticker.C {
			r.safeTick()
		}
	}()
}

func (r *Room) safeTick() {
	defer func() {
		if rec := recover(); rec != nil {
			fmt.Printf("[PANIC RECOVERY] Room Tick error: %v\n", rec)
		}
	}()
	r.Tick()
}

func (r *Room) Tick() {
	r.mu.Lock()

	r.step++
	now := time.Now()

	// 1. Maintain minimum bots count
	currentBots := 0
	for _, c := range r.creatures {
		if c.IsBot {
			currentBots++
		}
	}
	if currentBots < r.minBots {
		newBots := r.botController.SpawnInitialBots(r.minBots-currentBots, r.worldRadius)
		for _, bot := range newBots {
			b := bot
			r.creatures[b.ID] = &b
		}
	}

	// 2. Maintain food density
	if len(r.foods) < r.maxFoods {
		r.spawnRandomFood()
	}

	// 3. Build spatial grids (food + creatures)
	r.spatialGrid.Clear()
	for _, f := range r.foods {
		r.spatialGrid.Insert(f.ID, f.X, f.Y)
	}

	creatureGrid := NewSpatialGrid(10.0)
	creatureMap := make(map[string]int)
	creatureSlice := make([]Creature, 0, len(r.creatures))
	idx := 0
	for _, c := range r.creatures {
		creatureSlice = append(creatureSlice, *c)
		creatureMap[c.ID] = idx
		creatureGrid.Insert(c.ID, c.X, c.Y)
		idx++
	}

	// 4. Process each creature (physics + food + bot AI with spatial queries)
	for _, c := range r.creatures {
		c.PrevX = c.X
		c.PrevY = c.Y
		c.PrevAngleDeg = c.AngleDeg

		// Bot AI — only scan nearby entities (#4)
		if c.IsBot {
			nearbyFoodIDs := r.spatialGrid.GetNearby(c.X, c.Y, 25.0)
			botFoods := make([]Food, 0, len(nearbyFoodIDs))
			for _, fid := range nearbyFoodIDs {
				if f, ok := r.foods[fid]; ok {
					botFoods = append(botFoods, *f)
				}
			}
			nearbyCreatureIDs := creatureGrid.GetNearby(c.X, c.Y, 25.0)
			botCreatures := make([]Creature, 0, len(nearbyCreatureIDs))
			for _, cid := range nearbyCreatureIDs {
				if ci, ok := creatureMap[cid]; ok {
					botCreatures = append(botCreatures, creatureSlice[ci])
				}
			}
			r.botController.UpdateBot(c, botFoods, botCreatures)
		}

		// Calculate physics forces
		c.Forces = CalculatePhysicsForces(c.Elements, c.MuscleStep)

		// Smooth angle rotation toward target angle
		angleDiff := c.TargetAngleDeg - c.AngleDeg
		for angleDiff > 180 {
			angleDiff -= 360
		}
		for angleDiff < -180 {
			angleDiff += 360
		}

		turnRate := math.Max(2.0, math.Min(12.0, 5.0+math.Abs(c.Forces.NetRotationDeg)*0.15))
		if c.State == "dashing" {
			turnRate *= 1.4
		}

		if math.Abs(angleDiff) > turnRate {
			if angleDiff > 0 {
				c.AngleDeg += turnRate
			} else {
				c.AngleDeg -= turnRate
			}
		} else {
			c.AngleDeg = c.TargetAngleDeg
		}
		c.AngleDeg = math.Mod(c.AngleDeg+360.0, 360.0)

		// Step forward velocity (spec: 0 when no active muscles)
		speed := c.Forces.ForwardSpeed
		if c.State == "dashing" {
			speed *= 1.6
		}

		dx, dy := GetVectorFromAngle(c.AngleDeg)
		c.X += dx * speed
		c.Y += dy * speed

		// World boundary collision check
		distFromCenter := math.Hypot(c.X, c.Y)
		if distFromCenter > r.worldRadius {
			c.X = c.PrevX
			c.Y = c.PrevY
			c.AngleDeg = math.Mod(c.AngleDeg+180.0, 360.0)
			c.TargetAngleDeg = c.AngleDeg
		}

		c.StepsCount++

		// Food eating — spatial query instead of full scan (#1)
		nearbyFoodIDs := r.spatialGrid.GetNearby(c.X, c.Y, 3.0)
		if len(nearbyFoodIDs) > 0 {
			nearbyFoods := make([]Food, 0, len(nearbyFoodIDs))
			for _, fid := range nearbyFoodIDs {
				if f, ok := r.foods[fid]; ok {
					nearbyFoods = append(nearbyFoods, *f)
				}
			}
			eaten := FindEatenFood(c.PrevX, c.PrevY, c.PrevAngleDeg, c.X, c.Y, c.AngleDeg, c.Elements, nearbyFoods)
			if eaten != nil {
				delete(r.foods, eaten.ID)
				c.FoodEaten++
				c.Score += eaten.Value
				c.Energy = math.Min(c.MaxEnergy, c.Energy+float64(eaten.Value)*1.2)
			}
		}
	}

	// 5. Resolve creature collisions — Newtonian physics (spec sections 4-5)
	ResolveCreatureCollisions(r.creatures)

	// 7. Build leaderboard + stats
	leaderboard := r.buildLeaderboard()

	stats := ServerStats{
		TickRate:       30.0,
		ActivePlayers:  len(r.creatures) - currentBots,
		ActiveBots:     currentBots,
		TotalCreatures: len(r.creatures),
		TotalFood:      len(r.foods),
		Step:           r.step,
		UptimeSeconds:  now.Sub(r.startTime).Seconds(),
	}

	r.mu.Unlock()

	// 8. Broadcast with view culling + trimmed payload + 15Hz (#2 #5 #6)
	if r.broadcastCb != nil && (r.step%2 == 0) {
		viewRadius := 35.0
		viewRadSq := viewRadius * viewRadius

		creaturesNet := make([]CreatureNet, 0, len(r.creatures))
		creaturesFull := make([]Creature, 0, len(r.creatures))
		for _, c := range r.creatures {
			creaturesFull = append(creaturesFull, *c)
			creaturesNet = append(creaturesNet, ToCreatureNet(*c))
		}

		foodsSnapshot := make([]Food, 0, len(r.foods))
		for _, f := range r.foods {
			foodsSnapshot = append(foodsSnapshot, *f)
		}

		for _, c := range creaturesFull {
			if c.IsBot {
				continue
			}

			visibleCreatures := make([]CreatureNet, 0, len(creaturesNet))
			for i := range creaturesNet {
				dxC := creaturesNet[i].X - c.X
				dyC := creaturesNet[i].Y - c.Y
				if dxC*dxC+dyC*dyC <= viewRadSq {
					visibleCreatures = append(visibleCreatures, creaturesNet[i])
				}
			}

			visibleFoods := make([]Food, 0, len(foodsSnapshot))
			for i := range foodsSnapshot {
				dxF := foodsSnapshot[i].X - c.X
				dyF := foodsSnapshot[i].Y - c.Y
				if dxF*dxF+dyF*dyF <= viewRadSq {
					visibleFoods = append(visibleFoods, foodsSnapshot[i])
				}
			}

			r.broadcastCb(WSOutputMessage{
				Type:        "state",
				WorldRadius: r.worldRadius,
				Tick:        r.step,
				Creatures:   visibleCreatures,
				Foods:       visibleFoods,
				Leaderboard: leaderboard,
				Stats:       &stats,
			}, c.PlayerID)
		}
	}
}

func (r *Room) buildLeaderboard() []LeaderboardEntry {
	entries := make([]LeaderboardEntry, 0, len(r.creatures))
	for _, c := range r.creatures {
		entries = append(entries, LeaderboardEntry{
			ID:        c.ID,
			Name:      c.Name,
			Score:     c.Score,
			Color:     c.Color,
			IsBot:     c.IsBot,
			Kills:     c.Kills,
			FoodEaten: c.FoodEaten,
		})
	}

	sort.Slice(entries, func(i, j int) bool {
		return entries[i].Score > entries[j].Score
	})

	for i := range entries {
		entries[i].Rank = i + 1
	}

	if len(entries) > 10 {
		return entries[:10]
	}
	return entries
}
