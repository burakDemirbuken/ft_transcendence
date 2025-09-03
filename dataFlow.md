# 🌐 Server Data Flow Documentation

## 📤 Client → Server Messages


### 🎮 game/
- playerAction
```javascript
{
	key: 'w',
	action: true
}
```

### 🏠 room/
- create
```javascript
{

}
```



## 📤 Server → Client Messages

### 🎮 game/
- started
```javascript
{
	gameMode: "local" | "arcade" | "classic"
}
```

- ended
```javascript
{

}
```

- stateUpdate
```javascript
{
	gameData: {
		players: [
			{
				id: 'player123',
				name: 'Player1',
				position: { x: 10, y: 250 }
			},
			{
				id: 'player456',
				name: 'Player2',
				position: { x: 780, y: 280 }
			}
		],
		ball: {
			position: { x: 400, y: 300 },
			direction: { x: 1, y: -0.5 },
			radius: 7,
			speed: 600
		},
		score: {
			left: 2,
			right: 1
		}
	}
}
```
---

## 📊 Message Types Summary

### 📤 Client → Server
- `game/playerAction` - Player keyboard input
- `game/create` - Create new room

### 📥 Server → Client
- `game/started` - Game start notification
- `game/ended` - Game end results
- `game/stateUpdate` - Real-time game state

---

*Last Updated: September 2, 2025*
