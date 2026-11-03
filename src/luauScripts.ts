import { LuauScript } from './types';

export const LUAU_SCRIPTS: LuauScript[] = [
  {
    id: 'game_manager',
    name: 'GameManager.server.luau',
    path: 'ServerScriptService/GameManager.server.luau',
    service: 'ServerScriptService',
    type: 'Script',
    description: 'Gerenciador central do loop de jogo, spawn de objetos 3D, física, detecção de colisões e condições de vitória/derrota.',
    code: `--[[
    SOBRECARGA DIGITAL - GAME MANAGER (SERVER SCRIPT)
    Arquitetura: Roblox Studio (Luau)
    Localização: ServerScriptService/GameManager
    Descrição: Gerencia o ciclo de vida da partida, instanciação de objetos caindo,
               física, colisões com o jogador e atributos globais.
--]]

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local ServerScriptService = game:GetService("ServerScriptService")
local Players = game:GetService("Players")
local TweenService = game:GetService("TweenService")
local Lighting = game:GetService("Lighting")

-- Eventos Remotos
local EventsFolder = ReplicatedStorage:WaitForChild("Events")
local SASAnswerEvent = EventsFolder:WaitForChild("SASAnswerEvent")
local ToggleZenMode = EventsFolder:WaitForChild("ToggleZenMode")
local EndGameEvent = EventsFolder:WaitForChild("EndGameEvent")

-- Pastas de Assets
local AssetsFolder = ReplicatedStorage:WaitForChild("Assets")

-- Criar / Obter Atributos no ReplicatedStorage para Sincronização de Estado
local StateFolder = ReplicatedStorage:FindFirstChild("GameStateInfo") or Instance.new("Folder")
StateFolder.Name = "GameStateInfo"
StateFolder.Parent = ReplicatedStorage

local function createValue(class, name, defaultVal)
	local val = StateFolder:FindFirstChild(name)
	if not val then
		val = Instance.new(class)
		val.Name = name
		val.Value = defaultVal
		val.Parent = StateFolder
	end
	return val
end

local GameState = createValue("StringValue", "GameState", "PLAYING") -- MENU, PLAYING, PAUSED_SAS, MODO_ZEN, VITORIA, DERROTA
local GameTimer = createValue("IntValue", "GameTimer", 60)
local AnxietyLevel = createValue("IntValue", "AnxietyLevel", 0)
local NotificationSpeed = createValue("NumberValue", "NotificationSpeed", 1.0)
local ZenTimer = createValue("IntValue", "ZenTimer", 3)

-- Configurações de Limite
local X_BOUND = 25
local SPAWN_HEIGHT = 35
local DESPAWN_HEIGHT = -5

-- Tabela de Configuração dos Objetos Caindo
local OBJECT_TYPES = {
	Feed = { weight = 18, anxiety = 5, speedMod = 0, highlight = nil },
	Like = { weight = 18, anxiety = 5, speedMod = 0, highlight = Color3.fromRGB(255, 105, 180) },
	Wifi = { weight = 15, anxiety = 5, speedMod = 0, pointLight = Color3.fromRGB(0, 255, 255) },
	Geometric = { weight = 12, anxiety = 5, speedMod = 0.2, shape = "Pyramid" },
	Exercise = { weight = 10, anxiety = -5, speedMod = -0.2, zenTrigger = true, highlight = Color3.fromRGB(34, 197, 94) },
	Outdoor = { weight = 10, anxiety = -8, speedMod = -0.3, zenTrigger = true, highlight = Color3.fromRGB(16, 185, 129) },
	Disconnect = { weight = 8, anxiety = -13, speedMod = -0.4, zenTrigger = true, pointLight = Color3.fromRGB(6, 182, 212) },
	Coffee = { weight = 5, anxiety = -13, speedMod = 0, action = "Guitar", zenTrigger = true },
	Book = { weight = 4, anxiety = -2, speedMod = -0.2, action = "Slower", zenTrigger = true }
}

local activeFallingObjects = {}
local isSpawnActive = true

-- Função auxiliar para selecionar objeto por peso
local function getRandomObjectType()
	local totalWeight = 0
	for _, config in pairs(OBJECT_TYPES) do
		totalWeight += config.weight
	end
	
	local randomChoice = math.random(1, totalWeight)
	local currentWeight = 0
	
	for name, config in pairs(OBJECT_TYPES) do
		currentWeight += config.weight
		if randomChoice <= currentWeight then
			return name, config
		end
	end
	return "Feed", OBJECT_TYPES.Feed
end

-- Criar container no Workspace para itens ativos
local FallingObjectsFolder = Workspace:FindFirstChild("ActiveFallingObjects") or Instance.new("Folder")
FallingObjectsFolder.Name = "ActiveFallingObjects"
FallingObjectsFolder.Parent = Workspace

-- Função para Instanciar Objeto 3D no Workspace
local function spawnFallingObject()
	if GameState.Value ~= "PLAYING" then return end
	
	local objName, config = getRandomObjectType()
	local template = AssetsFolder:FindFirstChild(objName)
	local model
	
	if template then
		model = template:Clone()
	else
		-- Fallback caso o modelo 3D não exista na pasta Assets
		model = Instance.new("Part")
		model.Name = objName
		model.Size = Vector3.new(2, 2, 2)
		model.Material = Enum.Material.SmoothPlastic
		model.Anchored = false
		model.CanCollide = false
		
		if objName == "Feed" then model.Color = Color3.fromRGB(60, 120, 240)
		elseif objName == "Like" then model.Color = Color3.fromRGB(255, 80, 140)
		elseif objName == "Wifi" then model.Color = Color3.fromRGB(0, 230, 255)
		elseif objName == "Geometric" then model.Color = Color3.fromRGB(255, 170, 0)
		elseif objName == "Coffee" then model.Color = Color3.fromRGB(139, 69, 19)
		elseif objName == "Book" then model.Color = Color3.fromRGB(46, 139, 87)
		end
	end
	
	-- Adicionar Highlight / PointLight de acordo com o GDD
	if config.highlight then
		local hl = Instance.new("Highlight")
		hl.FillColor = config.highlight
		hl.OutlineColor = Color3.fromRGB(255, 255, 255)
		hl.FillTransparency = 0.3
		hl.Parent = model
	end
	
	if config.pointLight then
		local pl = Instance.new("PointLight")
		pl.Color = config.pointLight
		pl.Brightness = 3
		pl.Range = 12
		pl.Parent = model
	end
	
	local randomX = math.random(-X_BOUND, X_BOUND)
	local startPos = Vector3.new(randomX, SPAWN_HEIGHT, 0)
	
	if model:IsA("Model") then
		model:PivotTo(CFrame.new(startPos))
		for _, part in ipairs(model:GetDescendants()) do
			if part:IsA("BasePart") then
				part.CanCollide = false
			end
		end
	else
		model.CFrame = CFrame.new(startPos)
	end
	
	model.Parent = FallingObjectsFolder
	
	table.insert(activeFallingObjects, {
		instance = model,
		type = objName,
		config = config,
		position = startPos,
		speed = (15 + math.random(0, 10)) * NotificationSpeed.Value
	})
end

-- Processamento de Colisão com o Personagem do Jogador
local function handleCollision(player, objData)
	local character = player.Character
	if not character or not character:FindFirstChild("HumanoidRootPart") then return end
	
	local config = objData.config
	
	-- Atualizar Nível de Ansiedade (0 a 100)
	local newAnxiety = math.clamp(AnxietyLevel.Value + config.anxiety, 0, 100)
	AnxietyLevel.Value = newAnxiety
	
	-- Efeitos Especiais de Coleta
	if config.zenTrigger then
		-- Elementos de Bem-Estar ativam o Modo Zen!
		ToggleZenMode:FireAllClients(player, 3.5)
	end

	if config.speedMod ~= 0 then
		if config.speedMod > 0 then
			NotificationSpeed.Value = NotificationSpeed.Value * (1 + config.speedMod)
		else
			NotificationSpeed.Value = math.max(0.5, NotificationSpeed.Value + config.speedMod)
		end
	end
	
	if config.action == "Guitar" then
		-- Dispara o RemoteEvent para ativar a animação de guitarra no cliente
		local playAnimEvent = EventsFolder:FindFirstChild("PlaySpecialAnim")
		if playAnimEvent then
			playAnimEvent:FireClient(player, "GuitarAnim", 1.0)
		end
	end
	
	-- Efeito Sonoro / Partículas (opcional em 3D)
	local sound = Instance.new("Sound")
	sound.SoundId = config.anxiety > 0 and "rbxassetid://9114223178" or "rbxassetid://9114221234"
	sound.Volume = 0.5
	sound.Parent = character.HumanoidRootPart
	sound:Play()
	game:GetService("Debris"):AddItem(sound, 2)
end

-- Loop de Atualização de Física (RunService)
local RunService = game:GetService("RunService")
RunService.Heartbeat:Connect(function(deltaTime)
	if GameState.Value ~= "PLAYING" then return end
	
	for i = #activeFallingObjects, 1, -1 do
		local data = activeFallingObjects[i]
		local inst = data.instance
		
		if not inst or not inst.Parent then
			table.remove(activeFallingObjects, i)
		else
			-- Mover no eixo Y negativo escalado por notificationSpeed
			local currentCFrame = inst:IsA("Model") and inst:GetPivot() or inst.CFrame
			local currentPos = currentCFrame.Position
			local moveDist = data.speed * NotificationSpeed.Value * deltaTime
			local newPos = Vector3.new(currentPos.X, currentPos.Y - moveDist, 0)
			
			local newCFrame = CFrame.new(newPos) * CFrame.Angles(0, math.rad(deltaTime * 90), 0)
			
			if inst:IsA("Model") then
				inst:PivotTo(newCFrame)
			else
				inst.CFrame = newCFrame
			end
			
			-- Checar colisão AABB simples com os jogadores
			for _, player in ipairs(Players:GetPlayers()) do
				local char = player.Character
				if char and char:FindFirstChild("HumanoidRootPart") then
					local hrpPos = char.HumanoidRootPart.Position
					local dist = (newPos - hrpPos).Magnitude
					if dist < 3.5 then
						handleCollision(player, data)
						inst:Destroy()
						table.remove(activeFallingObjects, i)
						break
					end
				end
			end
			
			-- Despawn ao atingir o chão
			if newPos.Y < DESPAWN_HEIGHT then
				inst:Destroy()
				table.remove(activeFallingObjects, i)
			end
		end
	end
end)

-- Loop Principal de Timers e Condições de Jogo
task.spawn(function()
	while true do
		task.wait(1)
		
		if GameState.Value == "PLAYING" then
			-- Spawn aleatório de objetos
			if math.random() > 0.3 then
				spawnFallingObject()
			end
			
			-- Decrementar Timer Regressivo de 60 a 0
			if GameTimer.Value > 0 then
				GameTimer.Value -= 1
			end
			
			-- Verificar Condição de DERROTA (Ansiedade >= 100)
			if AnxietyLevel.Value >= 100 then
				GameState.Value = "DERROTA"
				EndGameEvent:FireAllClients("DERROTA", AnxietyLevel.Value)
				
				-- Iluminação de Colapso Vermelho
				Lighting.Ambient = Color3.fromRGB(150, 0, 0)
				Lighting.OutdoorAmbient = Color3.fromRGB(100, 0, 0)
				
			-- Verificar Condição de VITÓRIA (Timer <= 0)
			elseif GameTimer.Value <= 0 then
				GameState.Value = "VITORIA"
				EndGameEvent:FireAllClients("VITORIA", AnxietyLevel.Value)
			end
		end
	end
end)

-- Limpar Objetos Ativos (usado na transição para MODO ZEN)
local function clearAllFallingObjects()
	for _, data in ipairs(activeFallingObjects) do
		if data.instance and data.instance.Parent then
			data.instance:Destroy()
		end
	end
	activeFallingObjects = {}
end

-- Ouve solicitação de ativação do MODO ZEN do SASNarrativeSystem
ToggleZenMode.OnServerEvent:Connect(function(player, duration)
	clearAllFallingObjects()
	GameState.Value = "MODO_ZEN"
	
	-- Notificar todos os clientes sobre o estado Zen
	for _, p in ipairs(Players:GetPlayers()) do
		local playAnimEvent = EventsFolder:FindFirstChild("PlaySpecialAnim")
		if playAnimEvent then
			playAnimEvent:FireClient(p, "MeditateAnim", duration or 3)
		end
	end
	
	task.wait(duration or 3)
	if GameState.Value == "MODO_ZEN" then
		GameState.Value = "PLAYING"
	end
end)

print("[Sobrecarga Digital] GameManager Inicializado com Sucesso.")
`
  },
  {
    id: 'sas_narrative',
    name: 'SASNarrativeSystem.server.luau',
    path: 'ServerScriptService/SASNarrativeSystem.server.luau',
    service: 'ServerScriptService',
    type: 'Script',
    description: 'Sistema narrativo do questionário SAS-SMU. Controla o ciclo de pausas a cada 15s, mantém o SessionData dos jogadores, aplica penalidade de WalkSpeed na física e dispara o Modo Zen.',
    code: `--[[
    SOBRECARGA DIGITAL - SAS NARRATIVE SYSTEM (SERVER SCRIPT)
    Arquitetura: Roblox Studio (Luau)
    Localização: ServerScriptService/SASNarrativeSystem
    Descrição: Gerencia o ciclo de pausas narrativas, mantém estado de ansiedade e contadores
               (yesCount, noCount) por jogador e ajusta a física do personagem (WalkSpeed).
--]]

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Players = game:GetService("Players")

local SASQuestions = require(ReplicatedStorage:WaitForChild("SASQuestions"))

-- Eventos de Comunicação
local SASPauseEvent = ReplicatedStorage:FindFirstChild("SASPauseEvent") or Instance.new("RemoteEvent", ReplicatedStorage)
SASPauseEvent.Name = "SASPauseEvent"

local SASAnswerEvent = ReplicatedStorage:FindFirstChild("SASAnswerEvent") or Instance.new("RemoteEvent", ReplicatedStorage)
SASAnswerEvent.Name = "SASAnswerEvent"

local ZenModeEvent = ReplicatedStorage:FindFirstChild("ZenModeEvent") or Instance.new("RemoteEvent", ReplicatedStorage)
ZenModeEvent.Name = "ZenModeEvent"

-- Tabela com estado dos jogadores
local SessionData = {}

Players.PlayerAdded:Connect(function(player)
	SessionData[player.UserId] = {
		anxietyLevel = 0,
		notificationSpeed = 1.0,
		yesCount = 0,
		noCount = 0,
		currentQuestion = nil
	}
	
	-- Inicia o ciclo de perguntas (Pausas a cada 15 segundos)
	task.spawn(function()
		while player.Parent do
			task.wait(15)
			
			local qData = SASQuestions.GetRandomQuestion()
			SessionData[player.UserId].currentQuestion = qData
			
			-- Dispara evento de pausa narrativa para o cliente
			SASPauseEvent:FireClient(player, qData.text)
		end
	end)
end)

Players.PlayerRemoving:Connect(function(player)
	SessionData[player.UserId] = nil
end)

-- Processa as respostas e aplica a física/atributos
SASAnswerEvent.OnServerEvent:Connect(function(player, answer)
	local pData = SessionData[player.UserId]
	local qData = pData and pData.currentQuestion
	
	if not pData or not qData then return end
	
	local character = player.Character
	local humanoid = character and character:FindFirstChild("Humanoid")

	if answer == "SIM" then
		pData.yesCount = pData.yesCount + 1
		pData.anxietyLevel = math.min(100, pData.anxietyLevel + qData.aSim)
		pData.notificationSpeed = pData.notificationSpeed + qData.vSim
		
		-- Penalidade Física: Quanto mais ansioso, mais lento e "pesado" fica o movimento
		if humanoid then
			humanoid.WalkSpeed = math.max(8, 16 - (pData.anxietyLevel * 0.1))
		end
		
	elseif answer == "NAO" then
		pData.noCount = pData.noCount + 1
		pData.anxietyLevel = math.max(0, pData.anxietyLevel - qData.aNao)
		
		-- Recompensa Física
		if humanoid then
			humanoid.WalkSpeed = 16
		end
		
		-- Dispara o Modo Zen se a questão for de alto impacto
		if qData.zenNao then
			pData.notificationSpeed = 1.0
			ZenModeEvent:FireClient(player)
		end
	end
	
	pData.currentQuestion = nil
end)

print("[Sobrecarga Digital] SASNarrativeSystem Server Inicializado.")
`
  },
  {
    id: 'player_controller',
    name: 'PlayerController.client.luau',
    path: 'StarterPlayer/StarterPlayerScripts/PlayerController.client.luau',
    service: 'StarterPlayerScripts',
    type: 'LocalScript',
    description: 'Controle do jogador no cliente: movimenta o avatar no eixo X (2.5D), suporte a Teclado/Gamepad, e controle de animações R15.',
    code: `--[[
    SOBRECARGA DIGITAL - PLAYER CONTROLLER (LOCAL SCRIPT)
    Arquitetura: Roblox Studio (Luau)
    Localização: StarterPlayer/StarterPlayerScripts/PlayerController
    Descrição: Gerencia o input simultâneo do Teclado (A/D, Setas) e Gamepad (D-Pad / Analógico),
               restringe o movimento no eixo X (2.5D) e executa as animações do personagem R15.
--]]

local Players = game:GetService("Players")
local UserInputService = game:GetService("UserInputService")
local RunService = game:GetService("RunService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local LocalPlayer = Players.LocalPlayer
local Camera = Workspace.CurrentCamera

-- Limite de Movimentação no Eixo X
local X_LIMIT_MIN = -25
local X_LIMIT_MAX = 25
local MOVE_SPEED = 22

-- Eventos
local EventsFolder = ReplicatedStorage:WaitForChild("Events")
local PlaySpecialAnimEvent = EventsFolder:WaitForChild("PlaySpecialAnim")

-- Carregamento de IDs de Animação R15 (Placeholders Prontos para Produção)
local ANIM_IDS = {
	Idle = "rbxassetid://507766388",
	WalkLeft = "rbxassetid://913376220",
	WalkRight = "rbxassetid://913376220",
	Guitar = "rbxassetid://507770238",
	Meditate = "rbxassetid://507776879"
}

local loadedTracks = {}
local isPlayingSpecialAnim = false

-- Carregar Animações no Humanoid
local function setupAnimations(humanoid)
	local animator = humanoid:FindFirstChildOfClass("Animator") or Instance.new("Animator", humanoid)
	
	for name, id in pairs(ANIM_IDS) do
		local anim = Instance.new("Animation")
		anim.AnimationId = id
		local track = animator:LoadAnimation(anim)
		track.Priority = (name == "Guitar" or name == "Meditate") and Enum.AnimationPriority.Action or Enum.AnimationPriority.Movement
		loadedTracks[name] = track
	end
end

-- Travar a Câmera no Modo Cinematográfico 2.5D
local function setupCamera()
	Camera.CameraType = Enum.CameraType.Scriptable
	Camera.CFrame = CFrame.new(Vector3.new(0, 8, 30), Vector3.new(0, 4, 0))
	Camera.FieldOfView = 60
end

-- Processar Entrada do Usuário (Teclado + Gamepad)
local function getHorizontalInput()
	local moveX = 0
	
	-- Teclado
	if UserInputService:IsKeyDown(Enum.KeyCode.A) or UserInputService:IsKeyDown(Enum.KeyCode.Left) then
		moveX -= 1
	end
	if UserInputService:IsKeyDown(Enum.KeyCode.D) or UserInputService:IsKeyDown(Enum.KeyCode.Right) then
		moveX += 1
	end
	
	-- Gamepad D-Pad
	if UserInputService:IsNavigationGamepadGiven() then
		if UserInputService:IsKeyDown(Enum.KeyCode.DPadLeft) then moveX -= 1 end
		if UserInputService:IsKeyDown(Enum.KeyCode.DPadRight) then moveX += 1 end
	end
	
	-- Gamepad Analógico Esquerdo
	local gamepads = UserInputService:GetConnectedGamepads()
	if #gamepads > 0 then
		local state = UserInputService:GetGamepadState(gamepads[1])
		for _, input in ipairs(state) do
			if input.KeyCode == Enum.KeyCode.Thumbstick1 then
				if math.abs(input.Position.X) > 0.2 then
					moveX = input.Position.X > 0 and 1 or -1
				end
			end
		end
	end
	
	return math.clamp(moveX, -1, 1)
end

-- Evento de Execução Especial de Animação (Café / Guitarra ou Meditação Zen)
PlaySpecialAnimEvent.OnClientEvent:Connect(function(animName, duration)
	local track = loadedTracks[animName]
	if track then
		isPlayingSpecialAnim = true
		track:Play(0.2)
		
		task.delay(duration or 1.0, function()
			track:Stop(0.2)
			isPlayingSpecialAnim = false
		end)
	end
end)

-- Loop de Movimentação no Eixo X
RunService.RenderStepped:Connect(function(deltaTime)
	local character = LocalPlayer.Character
	if not character then return end
	
	local humanoid = character:FindFirstChildOfClass("Humanoid")
	local hrp = character:FindFirstChild("HumanoidRootPart")
	
	if not humanoid or not hrp then return end
	
	-- Configurar animações e câmera se necessário
	if #loadedTracks == 0 then
		setupAnimations(humanoid)
		setupCamera()
	end
	
	if isPlayingSpecialAnim then return end
	
	local inputX = getHorizontalInput()
	
	if inputX ~= 0 then
		-- Calcular nova posição X com Clamping no intervalo [-25, +25]
		local newX = math.clamp(hrp.Position.X + (inputX * MOVE_SPEED * deltaTime), X_LIMIT_MIN, X_LIMIT_MAX)
		hrp.CFrame = CFrame.new(newX, hrp.Position.Y, 0) * CFrame.Angles(0, inputX > 0 and math.rad(90) or math.rad(-90), 0)
		
		if loadedTracks["WalkLeft"] and not loadedTracks["WalkLeft"].IsPlaying then
			loadedTracks["WalkLeft"]:Play(0.1)
		end
	else
		-- Parar animação de caminhada ao soltar os controles
		if loadedTracks["WalkLeft"] and loadedTracks["WalkLeft"].IsPlaying then
			loadedTracks["WalkLeft"]:Stop(0.1)
		end
		
		if loadedTracks["Idle"] and not loadedTracks["Idle"].IsPlaying then
			loadedTracks["Idle"]:Play(0.1)
		end
		
		-- Garantir Z fixo em 0 para simular 2.5D
		hrp.CFrame = CFrame.new(hrp.Position.X, hrp.Position.Y, 0) * CFrame.Angles(0, math.rad(180), 0)
	end
end)

print("[Sobrecarga Digital] PlayerController LocalScript Inicializado.")
`
  },
  {
    id: 'hud_controller',
    name: 'HUDController.client.luau',
    path: 'StarterGui/HUDController.client.luau',
    service: 'StarterGui',
    type: 'LocalScript',
    description: 'Interface de usuário do jogo: atualiza o Termômetro de Ansiedade com transição dinâmica de cores (Verde/Laranja/Vermelho) via TweenService e o Relógio LED.',
    code: `--[[
    SOBRECARGA DIGITAL - HUD CONTROLLER (LOCAL SCRIPT)
    Arquitetura: Roblox Studio (Luau)
    Localização: StarterGui/HUDController
    Descrição: Gerencia o Termômetro de Ansiedade dinâmico e o Relógio Digital LED na tela (HUDGui).
               Utiliza TweenService para animação suave da barra e interpolação de cores.
--]]

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")
local Players = game:GetService("Players")

local LocalPlayer = Players.LocalPlayer
local PlayerGui = LocalPlayer:WaitForChild("PlayerGui")

local HUDGui = PlayerGui:WaitForChild("HUDGui")
local ThermometerFrame = HUDGui:WaitForChild("ThermometerFrame")
local InnerBar = ThermometerFrame:WaitForChild("InnerBar")
local AnxietyPercentText = ThermometerFrame:WaitForChild("AnxietyPercentText")
local ClockText = HUDGui:WaitForChild("ClockText")

local StateFolder = ReplicatedStorage:WaitForChild("GameStateInfo")
local GameTimer = StateFolder:WaitForChild("GameTimer")
local AnxietyLevel = StateFolder:WaitForChild("AnxietyLevel")

-- Interpolação de Cor para o Termômetro de Ansiedade (0% Verde -> 50% Laranja -> 100% Vermelho)
local function getAnxietyColor(percent)
	if percent <= 50 then
		local alpha = percent / 50
		return Color3.fromRGB(46, 204, 113):Lerp(Color3.fromRGB(243, 156, 18), alpha)
	else
		local alpha = (percent - 50) / 50
		return Color3.fromRGB(243, 156, 18):Lerp(Color3.fromRGB(231, 76, 60), alpha)
	end
end

-- Listener de Mudança no Nível de Ansiedade
AnxietyLevel.Changed:Connect(function(newAnxiety)
	local clampedValue = math.clamp(newAnxiety, 0, 100)
	local targetScaleX = clampedValue / 100
	local targetColor = getAnxietyColor(clampedValue)
	
	-- Animar a Dimensão Scale da Barra
	local tweenInfo = TweenInfo.new(0.4, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)
	local sizeTween = TweenService:Create(InnerBar, tweenInfo, {
		Size = UDim2.new(targetScaleX, 0, 1, 0),
		BackgroundColor3 = targetColor
	})
	sizeTween:Play()
	
	-- Atualizar Texto Percentual
	AnxietyPercentText.Text = string.format("%d%%", clampedValue)
end)

-- Listener de Mudança no Relógio Digital LED ("00:50")
GameTimer.Changed:Connect(function(secondsRemaining)
	ClockText.Text = string.format("00:%02d", math.max(0, secondsRemaining))
	
	-- Efeito de Pulso quando o tempo está abaixo de 10s
	if secondsRemaining <= 10 then
		ClockText.TextColor3 = Color3.fromRGB(255, 50, 50)
	else
		ClockText.TextColor3 = Color3.fromRGB(0, 255, 200)
	end
end)

print("[Sobrecarga Digital] HUDController Inicializado.")
`
  },
  {
    id: 'sas_modal_controller',
    name: 'SASModalController.client.luau',
    path: 'StarterGui/SASModalController.client.luau',
    service: 'StarterGui',
    type: 'LocalScript',
    description: 'Interface de usuário para o modal Glassmorphism SAS-SMU com desfoque de profundidade (BlurEffect) e input por Teclado/Gamepad.',
    code: `--[[
    SOBRECARGA DIGITAL - SAS MODAL CONTROLLER (LOCAL SCRIPT)
    Arquitetura: Roblox Studio (Luau)
    Localização: StarterGui/SASModalController
    Descrição: Exibe a interface com estilo Glassmorphism quando o jogo pausa aos 50s, 40s, 30s, 20s e 10s.
               Ativa BlurEffect no Lighting e captura a resposta do jogador (Teclas A/D ou Gamepad D-Pad Left/Right).
--]]

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Lighting = game:GetService("Lighting")
local UserInputService = game:GetService("UserInputService")
local Players = game:GetService("Players")
local TweenService = game:GetService("TweenService")

local LocalPlayer = Players.LocalPlayer
local PlayerGui = LocalPlayer:WaitForChild("PlayerGui")

local SASModalGui = PlayerGui:WaitForChild("SASModalGui")
local ModalContainer = SASModalGui:WaitForChild("ModalContainer")
local QuestionText = ModalContainer:WaitForChild("QuestionText")
local BtnSim = ModalContainer:WaitForChild("BtnSim")
local BtnNao = ModalContainer:WaitForChild("BtnNao")

local EventsFolder = ReplicatedStorage:WaitForChild("Events")
local OpenSASModalEvent = EventsFolder:WaitForChild("OpenSASModal")
local SASAnswerEvent = EventsFolder:WaitForChild("SASAnswerEvent")

-- Efeito de Desfoque no Lighting
local blurEffect = Lighting:FindFirstChild("SASBlurEffect") or Instance.new("BlurEffect")
blurEffect.Name = "SASBlurEffect"
blurEffect.Size = 0
blurEffect.Enabled = true
blurEffect.Parent = Lighting

local currentTimerMark = nil
local isModalOpen = false

-- Abrir o Modal com Animação Glassmorphism
OpenSASModalEvent.OnClientEvent:Connect(function(data)
	currentTimerMark = data.timerMark
	QuestionText.Text = data.question
	isModalOpen = true
	
	SASModalGui.Enabled = true
	
	-- Animação de BlurEffect no Lighting (Size = 24)
	TweenService:Create(blurEffect, TweenInfo.new(0.5), { Size = 24 }):Play()
	
	-- Animação de Escala do Modal
	ModalContainer.ScaleDegree.Scale = 0.5
	TweenService:Create(ModalContainer.ScaleDegree, TweenInfo.new(0.4, Enum.EasingStyle.Back, Enum.EasingDirection.Out), { Scale = 1.0 }):Play()
end)

-- Enviar Resposta para o Servidor e Fechar Modal
local function sendResponse(answerBool)
	if not isModalOpen or not currentTimerMark then return end
	isModalOpen = false
	
	-- Desativar BlurEffect
	TweenService:Create(blurEffect, TweenInfo.new(0.4), { Size = 0 }):Play()
	
	-- Animação de Saída
	local hideTween = TweenService:Create(ModalContainer.ScaleDegree, TweenInfo.new(0.3, Enum.EasingStyle.Quad, Enum.EasingDirection.In), { Scale = 0 })
	hideTween:Play()
	
	hideTween.Completed:Connect(function()
		SASModalGui.Enabled = false
	end)
	
	-- Enviar RemoteEvent para o Servidor
	SASAnswerEvent:FireServer(currentTimerMark, answerBool)
end

-- Conectar Cliques do Mouse
BtnSim.MouseButton1Click:Connect(function() sendResponse(true) end)
BtnNao.MouseButton1Click:Connect(function() sendResponse(false) end)

-- Conectar Input do Teclado e Gamepad
UserInputService.InputBegan:Connect(function(input, gameProcessed)
	if not isModalOpen then return end
	
	if input.KeyCode == Enum.KeyCode.A or input.KeyCode == Enum.KeyCode.DPadLeft then
		sendResponse(true) -- SIM
	elseif input.KeyCode == Enum.KeyCode.D or input.KeyCode == Enum.KeyCode.DPadRight then
		sendResponse(false) -- NÃO
	end
end)

print("[Sobrecarga Digital] SASModalController Inicializado.")
`
  },
  {
    id: 'zen_banner_controller',
    name: 'ZenBannerController.client.luau',
    path: 'StarterGui/ZenBannerController.client.luau',
    service: 'StarterGui',
    type: 'LocalScript',
    description: 'Interface e efeitos visuais do MODO ZEN: exibe o banner "MODO ZEN ATIVO" e altera temporariamente o céu e pós-processamento.',
    code: `--[[
    SOBRECARGA DIGITAL - ZEN BANNER CONTROLLER (LOCAL SCRIPT)
    Arquitetura: Roblox Studio (Luau)
    Localização: StarterGui/ZenBannerController
    Descrição: Exibe o banner "MODO ZEN ATIVO" e altera o pós-processamento do Lighting
               (ColorCorrectionEffect e Skybox) durante o Modo Zen (3 segundos).
--]]

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Lighting = game:GetService("Lighting")
local TweenService = game:GetService("TweenService")
local Players = game:GetService("Players")

local LocalPlayer = Players.LocalPlayer
local PlayerGui = LocalPlayer:WaitForChild("PlayerGui")

local ZenBannerGui = PlayerGui:WaitForChild("ZenBannerGui")
local BannerFrame = ZenBannerGui:WaitForChild("BannerFrame")

local StateFolder = ReplicatedStorage:WaitForChild("GameStateInfo")
local GameState = StateFolder:WaitForChild("GameState")

-- Configuração de Pós-Processamento para o Modo Zen
local zenColorCorrection = Lighting:FindFirstChild("ZenColorCorrection") or Instance.new("ColorCorrectionEffect")
zenColorCorrection.Name = "ZenColorCorrection"
zenColorCorrection.TintColor = Color3.fromRGB(255, 255, 255)
zenColorCorrection.Saturation = 0
zenColorCorrection.Brightness = 0
zenColorCorrection.Enabled = true
zenColorCorrection.Parent = Lighting

GameState.Changed:Connect(function(newState)
	if newState == "MODO_ZEN" then
		ZenBannerGui.Enabled = true
		
		-- Transição de Iluminação Serena
		TweenService:Create(zenColorCorrection, TweenInfo.new(1.0), {
			TintColor = Color3.fromRGB(200, 240, 255),
			Saturation = 0.3,
			Brightness = 0.1
		}):Play()
		
		-- Animação do Banner Zen
		BannerFrame.Position = UDim2.new(0.5, 0, -0.2, 0)
		TweenService:Create(BannerFrame, TweenInfo.new(0.5, Enum.EasingStyle.Bounce, Enum.EasingDirection.Out), {
			Position = UDim2.new(0.5, 0, 0.15, 0)
		}):Play()
		
	else
		if ZenBannerGui.Enabled then
			-- Restaurar Iluminação Padrão
			TweenService:Create(zenColorCorrection, TweenInfo.new(0.8), {
				TintColor = Color3.fromRGB(255, 255, 255),
				Saturation = 0,
				Brightness = 0
			}):Play()
			
			local hideTween = TweenService:Create(BannerFrame, TweenInfo.new(0.4, Enum.EasingStyle.Quad, Enum.EasingDirection.In), {
				Position = UDim2.new(0.5, 0, -0.2, 0)
			})
			hideTween:Play()
			hideTween.Completed:Connect(function()
				ZenBannerGui.Enabled = false
			end)
		end
	end
end)

print("[Sobrecarga Digital] ZenBannerController Inicializado.")
`
  },
  {
    id: 'end_screen_controller',
    name: 'EndScreenController.client.luau',
    path: 'StarterGui/EndScreenController.client.luau',
    service: 'StarterGui',
    type: 'LocalScript',
    description: 'Interface de Vitória/Derrota e Diagnóstico de Estresse Digital com categorização por porcentagem (Baixo, Moderado, Alto e Colapso Digital).',
    code: `--[[
    SOBRECARGA DIGITAL - END SCREEN CONTROLLER (LOCAL SCRIPT)
    Arquitetura: Roblox Studio (Luau)
    Localização: StarterGui/EndScreenController
    Descrição: Exibe as telas finais de Vitória ou Derrota e apresenta o Diagnóstico
               de Estresse Digital personalizado conforme o nível final de ansiedade.
--]]

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Players = game:GetService("Players")
local TweenService = game:GetService("TweenService")

local LocalPlayer = Players.LocalPlayer
local PlayerGui = LocalPlayer:WaitForChild("PlayerGui")

local EndScreenGui = PlayerGui:WaitForChild("EndScreenGui")
local ContentBox = EndScreenGui:WaitForChild("ContentBox")
local TitleText = ContentBox:WaitForChild("TitleText")
local DiagnosticTitle = ContentBox:WaitForChild("DiagnosticTitle")
local DiagnosticBody = ContentBox:WaitForChild("DiagnosticBody")
local RestartBtn = ContentBox:WaitForChild("RestartBtn")

local EventsFolder = ReplicatedStorage:WaitForChild("Events")
local EndGameEvent = EventsFolder:WaitForChild("EndGameEvent")

-- Gerar o Diagnóstico de Estresse Conforme o GDD
local function generateDiagnostic(resultType, finalAnxiety)
	if resultType == "DERROTA" then
		return "COLAPSO DIGITAL (100%)",
		       "Seu nível de ansiedade atingiu o limite crítico. O fluxo ininterrupto de notificações, feeds e hiperconexão sobrecarregou sua capacidade de atenção. Recomendamos desconectar-se por algumas horas."
	else
		if finalAnxiety < 40 then
			return string.format("ESTRESSE BAIXO (%d%%)", finalAnxiety),
			       "Excelente equilíbrio digital! Você demonstrou forte controle sob o fluxo de estímulos e manteve sua mente serena diante do excesso de notificações."
		elseif finalAnxiety <= 70 then
			return string.format("ESTRESSE MODERADO (%d%%)", finalAnxiety),
			       "Alerta moderado. Você conseguiu concluir o tempo, porém acumulou tensão considerável. Fique atento ao tempo gasto em telas durante o seu dia a dia."
		else
			return string.format("ESTRESSE ALTO (%d%%)", finalAnxiety),
			       "Nível limítrofe de sobrecarga! Embora tenha evitado o colapso total, sua mente operou no limite do estresse digital. Pratique pausas conscientes."
		end
	end
end

-- Tratar Evento de Fim de Jogo do Servidor
EndGameEvent.OnClientEvent:Connect(function(resultType, finalAnxiety)
	EndScreenGui.Enabled = true
	
	local diagTitle, diagDesc = generateDiagnostic(resultType, finalAnxiety)
	
	if resultType == "VITORIA" then
		TitleText.Text = "SOBREVIVEU À SOBRECARGA!"
		TitleText.TextColor3 = Color3.fromRGB(46, 204, 113)
	else
		TitleText.Text = "COLAPSO DIGITAL!"
		TitleText.TextColor3 = Color3.fromRGB(231, 76, 60)
	end
	
	DiagnosticTitle.Text = diagTitle
	DiagnosticBody.Text = diagDesc
	
	-- Animação de Entrada do Painel Fim de Jogo
	ContentBox.ScaleDegree.Scale = 0.2
	TweenService:Create(ContentBox.ScaleDegree, TweenInfo.new(0.6, Enum.EasingStyle.Back, Enum.EasingDirection.Out), { Scale = 1.0 }):Play()
end)

RestartBtn.MouseButton1Click:Connect(function()
	-- Reiniciar o jogo via carregamento do personagem
	LocalPlayer.Character:BreakJoints()
	EndScreenGui.Enabled = false
end)

print("[Sobrecarga Digital] EndScreenController Inicializado.")
`
  },
  {
    id: 'sas_questions_module',
    name: 'SASQuestions.module.luau',
    path: 'ReplicatedStorage/SASQuestions.module.luau',
    service: 'ReplicatedStorage',
    type: 'ModuleScript',
    description: 'Banco de dados modular de 100 questões objetivas estruturadas com níveis de severidade (CRÍTICO, ALTO, MÉDIO, BAIXO) e gatilho de Modo Zen.',
    code: `local SASQuestions = {}

-- Estrutura: {id, texto, categoria, ansiedadeSim, velSim, ansiedadeNao, modoZenNao}
SASQuestions.Database = {
	-- NIVEL CRITICO (+20 Ansiedade | +0.5x Velocidade)
	{id = 1, text = "Sente ansiedade ou desconforto ao ficar desconectado por algumas horas?", cat = "CRITICO", aSim = 20, vSim = 0.5, aNao = 15, zenNao = true},
	{id = 2, text = "Sente o celular vibrar no bolso mesmo quando ele não tocou (vibração fantasma)?", cat = "CRITICO", aSim = 20, vSim = 0.5, aNao = 15, zenNao = true},
	{id = 3, text = "Fica angustiado ao pensar em como seria sua vida se a internet deixasse de existir?", cat = "CRITICO", aSim = 20, vSim = 0.5, aNao = 15, zenNao = true},
	{id = 4, text = "Sente um vazio interno ou tédio profundo quando fica sem bateria ou sem sinal?", cat = "CRITICO", aSim = 20, vSim = 0.5, aNao = 15, zenNao = true},
	{id = 5, text = "Acredita que perdeu momentos importantes da sua vida por estar olhando para uma tela?", cat = "CRITICO", aSim = 20, vSim = 0.5, aNao = 15, zenNao = true},
	{id = 6, text = "Sente pânico ao perceber que esqueceu o celular em casa ao sair para um compromisso?", cat = "CRITICO", aSim = 20, vSim = 0.5, aNao = 15, zenNao = true},
	{id = 7, text = "Sente pânico quando alguém te liga por chamada de voz sem avisar antes?", cat = "CRITICO", aSim = 20, vSim = 0.5, aNao = 15, zenNao = true},
	{id = 8, text = "Acorda no meio da noite e olha a tela para ver se há notificações?", cat = "CRITICO", aSim = 20, vSim = 0.5, aNao = 15, zenNao = true},
	{id = 9, text = "Sente culpa pelo tempo diário total que passa em frente à tela?", cat = "CRITICO", aSim = 20, vSim = 0.5, aNao = 15, zenNao = true},
	{id = 10, text = "Acha que as redes sociais estão deliberadamente viciando você?", cat = "CRITICO", aSim = 20, vSim = 0.5, aNao = 15, zenNao = true},

	-- NIVEL ALTO (+15 Ansiedade | +0.4x Velocidade)
	{id = 11, text = "Sente urgência em responder mensagens assim que a notificação toca?", cat = "ALTO", aSim = 15, vSim = 0.4, aNao = 10, zenNao = true},
	{id = 12, text = "Perdeu a noção do tempo navegando em feeds curtos recentemente?", cat = "ALTO", aSim = 15, vSim = 0.4, aNao = 10, zenNao = true},
	{id = 13, text = "Sente que a vida das pessoas nas redes parece mais interessante que a sua?", cat = "ALTO", aSim = 15, vSim = 0.4, aNao = 10, zenNao = true},
	{id = 14, text = "Sente ansiedade quando vê o ícone de aplicativo com dezenas de mensagens não lidas?", cat = "ALTO", aSim = 15, vSim = 0.4, aNao = 10, zenNao = true},
	{id = 15, text = "Consome conteúdos em vídeo curtindo, pulando ou arrastando a tela sem assistir até o final?", cat = "ALTO", aSim = 15, vSim = 0.4, aNao = 10, zenNao = true},
	{id = 16, text = "Interrompe uma tarefa importante para responder a uma mensagem que acabou de chegar?", cat = "ALTO", aSim = 15, vSim = 0.4, aNao = 10, zenNao = true},
	{id = 17, text = "Sente inveja ao ver postagens de viagens ou conquistas de conhecidos?", cat = "ALTO", aSim = 15, vSim = 0.4, aNao = 10, zenNao = true},
	{id = 18, text = "Sente frustração ao ver fotos de festas ou viagens para as quais não foi convidado?", cat = "ALTO", aSim = 15, vSim = 0.4, aNao = 10, zenNao = true},
	{id = 19, text = "Fica angustiado ao ver a bateria do celular abaixo de 20%?", cat = "ALTO", aSim = 15, vSim = 0.4, aNao = 10, zenNao = true},
	{id = 20, text = "Procura saber se o local tem Wi-Fi gratuito assim que chega a um restaurante?", cat = "ALTO", aSim = 15, vSim = 0.4, aNao = 10, zenNao = true},
	{id = 21, text = "Usa o celular como uma forma de fugir dos seus problemas diários?", cat = "ALTO", aSim = 15, vSim = 0.4, aNao = 10, zenNao = true},
	{id = 22, text = "Sente que seu humor muda drasticamente dependendo do que lê na internet?", cat = "ALTO", aSim = 15, vSim = 0.4, aNao = 10, zenNao = true},
	{id = 23, text = "Sente necessidade de checar as redes sociais para não perder nada importante do que os outros estão fazendo?", cat = "ALTO", aSim = 15, vSim = 0.4, aNao = 10, zenNao = true},
	{id = 24, text = "Fica irritado quando a conexão com a internet fica lenta ou cai?", cat = "ALTO", aSim = 15, vSim = 0.4, aNao = 10, zenNao = true},
	{id = 25, text = "Sente dificuldades de concentração em tarefas que exigem esforço mental contínuo?", cat = "ALTO", aSim = 15, vSim = 0.4, aNao = 10, zenNao = true},
	{id = 26, text = "Dificilmente consegue ler um texto longo do início ao fim sem checar a tela?", cat = "ALTO", aSim = 15, vSim = 0.4, aNao = 10, zenNao = true},
	{id = 27, text = "Já tentou fazer um 'detox digital' e desistiu nas primeiras horas?", cat = "ALTO", aSim = 15, vSim = 0.4, aNao = 10, zenNao = true},
	{id = 28, text = "Sente ansiedade se alguém que você conhece não te segue de volta?", cat = "ALTO", aSim = 15, vSim = 0.4, aNao = 10, zenNao = true},
	{id = 29, text = "Sente a necessidade de responder e-mails de trabalho fora do seu expediente?", cat = "ALTO", aSim = 15, vSim = 0.4, aNao = 10, zenNao = true},
	{id = 30, text = "Já pegou o celular para ver as horas ou uma mensagem e acabou caindo em um feed sem nem perceber?", cat = "ALTO", aSim = 15, vSim = 0.4, aNao = 10, zenNao = true},
	{id = 31, text = "Sente que a sua autoestima depende da aprovação que recebe online?", cat = "ALTO", aSim = 15, vSim = 0.4, aNao = 10, zenNao = true},
	{id = 32, text = "Adia o momento de dormir para continuar assistindo a vídeos curtos?", cat = "ALTO", aSim = 15, vSim = 0.4, aNao = 10, zenNao = true},
	{id = 33, text = "Leva o celular para a cama antes de dormir?", cat = "ALTO", aSim = 15, vSim = 0.4, aNao = 10, zenNao = true},
	{id = 34, text = "Fica incomodado se alguém demora horas para responder sua mensagem?", cat = "ALTO", aSim = 15, vSim = 0.4, aNao = 10, zenNao = true},
	{id = 35, text = "Entra em um aplicativo de fotos/vídeos sem nenhum objetivo específico?", cat = "ALTO", aSim = 15, vSim = 0.4, aNao = 10, zenNao = true},

	-- NIVEL MEDIO (+12 Ansiedade | +0.3x Velocidade)
	{id = 36, text = "Você checou o celular nos primeiros 5 minutos após acordar hoje?", cat = "MEDIO", aSim = 10, vSim = 0.3, aNao = 8, zenNao = false},
	{id = 37, text = "Você costuma usar telas e redes sociais enquanto faz as refeições?", cat = "MEDIO", aSim = 12, vSim = 0.3, aNao = 8, zenNao = false},
	{id = 38, text = "Quando assiste a um vídeo ou série, costuma usar a velocidade 1.5x ou 2.0x para terminar mais rápido?", cat = "MEDIO", aSim = 10, vSim = 0.3, aNao = 8, zenNao = false},
	{id = 39, text = "Compara sua rotina com a rotina perfeita mostrada por influenciadores?", cat = "MEDIO", aSim = 12, vSim = 0.3, aNao = 8, zenNao = false},
	{id = 40, text = "Checa o celular constantemente mesmo sem ter recebido nenhum aviso sonoro?", cat = "MEDIO", aSim = 12, vSim = 0.3, aNao = 8, zenNao = false},
	{id = 41, text = "Coloca o celular sobre a mesa enquanto almoça ou janta?", cat = "MEDIO", aSim = 10, vSim = 0.3, aNao = 8, zenNao = false},
	{id = 42, text = "Pega no celular durante uma conversa presencial com amigos ou família?", cat = "MEDIO", aSim = 12, vSim = 0.3, aNao = 8, zenNao = false},
	{id = 43, text = "Alterna entre o trabalho e as redes sociais a cada 10 ou 15 minutos?", cat = "MEDIO", aSim = 12, vSim = 0.3, aNao = 8, zenNao = false},
	{id = 44, text = "Promete usar o celular por 5 minutos e fica mais de uma hora conectado?", cat = "MEDIO", aSim = 12, vSim = 0.3, aNao = 8, zenNao = false},
	{id = 45, text = "Sente tédio quando um vídeo não chama sua atenção nos primeiros 3 segundos?", cat = "MEDIO", aSim = 10, vSim = 0.3, aNao = 8, zenNao = false},
	{id = 46, text = "Abre um aplicativo por puro reflexo, sem saber exatamente o que ia fazer nele?", cat = "MEDIO", aSim = 10, vSim = 0.3, aNao = 8, zenNao = false},
	{id = 47, text = "Sente necessidade de registrar um prato bonito antes de começar a comer?", cat = "MEDIO", aSim = 10, vSim = 0.3, aNao = 8, zenNao = false},
	{id = 48, text = "Fica desapontado se uma publicação sua não atinge certo número de curtidas?", cat = "MEDIO", aSim = 12, vSim = 0.3, aNao = 8, zenNao = false},
	{id = 49, text = "Apaga uma postagem se ela receber pouca interação nas primeiras horas?", cat = "MEDIO", aSim = 12, vSim = 0.3, aNao = 8, zenNao = false},
	{id = 50, text = "Usa o celular enquanto caminha pela rua, ignorando o trajeto?", cat = "MEDIO", aSim = 10, vSim = 0.3, aNao = 8, zenNao = false},
	{id = 51, text = "Confere o celular durante pausas em sinal de trânsito ou filas de espera?", cat = "MEDIO", aSim = 10, vSim = 0.3, aNao = 8, zenNao = false},
	{id = 52, text = "Estuda ou trabalha com dezenas de abas abertas no navegador ao mesmo tempo?", cat = "MEDIO", aSim = 12, vSim = 0.3, aNao = 8, zenNao = false},
	{id = 53, text = "Leva o dobro do tempo para terminar uma tarefa devido às distrações digitais?", cat = "MEDIO", aSim = 12, vSim = 0.3, aNao = 8, zenNao = false},
	{id = 54, text = "Sente dores no pescoço ou nos ombros por ficar olhando para baixo na tela?", cat = "MEDIO", aSim = 10, vSim = 0.3, aNao = 8, zenNao = false},
	{id = 55, text = "Sente cansaço visual ou olhos secos ao final do dia por causa do uso de telas?", cat = "MEDIO", aSim = 10, vSim = 0.3, aNao = 8, zenNao = false},
	{id = 56, text = "Atualiza o feed de notícias repetidamente para ver se há algo novo?", cat = "MEDIO", aSim = 12, vSim = 0.3, aNao = 8, zenNao = false},
	{id = 57, text = "Deixa todas as notificações de aplicativos ativadas com som e pop-up?", cat = "MEDIO", aSim = 10, vSim = 0.3, aNao = 8, zenNao = false},
	{id = 58, text = "Abre o aplicativo de mensagens apenas para 'limpar' os avisos pendentes?", cat = "MEDIO", aSim = 10, vSim = 0.3, aNao = 8, zenNao = false},
	{id = 59, text = "Pesquisa sobre tendências e memes apenas para não ficar de fora das conversas?", cat = "MEDIO", aSim = 10, vSim = 0.3, aNao = 8, zenNao = false},
	{id = 60, text = "Compara o número de seguidores das pessoas para avaliar a importância delas?", cat = "MEDIO", aSim = 12, vSim = 0.3, aNao = 8, zenNao = false},
	{id = 61, text = "Sente ansiedade quando vê que a outra pessoa está 'digitando...' por muito tempo?", cat = "MEDIO", aSim = 10, vSim = 0.3, aNao = 8, zenNao = false},
	{id = 62, text = "Usa o celular como uma 'barreira' para não conversar com estranhos em locais públicos?", cat = "MEDIO", aSim = 10, vSim = 0.3, aNao = 8, zenNao = false},
	{id = 63, text = "Sente raiva ou tédio quando um vídeo não tem legenda ou narração rápida?", cat = "MEDIO", aSim = 10, vSim = 0.3, aNao = 8, zenNao = false},
	{id = 64, text = "Troca de aplicativo imediatamente quando aparece um anúncio de 5 segundos?", cat = "MEDIO", aSim = 10, vSim = 0.3, aNao = 8, zenNao = false},
	{id = 65, text = "Fica rolando a tela sem rumo só para ver o que o algoritmo vai te mostrar a seguir?", cat = "MEDIO", aSim = 12, vSim = 0.3, aNao = 8, zenNao = false},

	-- NIVEL BAIXO (+8 Ansiedade | +0.2x Velocidade)
	{id = 66, text = "Ao ouvir um áudio longo no aplicativo de mensagens, você automaticamente acelera a reprodução?", cat = "BAIXO", aSim = 8, vSim = 0.2, aNao = 5, zenNao = false},
	{id = 67, text = "Avança o vídeo em 10 segundos quando sente que a introdução está demorada?", cat = "BAIXO", aSim = 8, vSim = 0.2, aNao = 5, zenNao = false},
	{id = 68, text = "Usa o alarme do celular e aproveita para olhar as redes sociais assim que ele toca?", cat = "BAIXO", aSim = 8, vSim = 0.2, aNao = 5, zenNao = false},
	{id = 69, text = "Pula trechos de músicas para ouvir direto o refrão?", cat = "BAIXO", aSim = 5, vSim = 0.2, aNao = 5, zenNao = false},
	{id = 70, text = "Abre um vídeo longo e vai direto para os comentários para ver o resumo?", cat = "BAIXO", aSim = 8, vSim = 0.2, aNao = 5, zenNao = false},
	{id = 71, text = "Pega o celular para ver a hora e guarda o aparelho sem ter reparado que horas eram?", cat = "BAIXO", aSim = 8, vSim = 0.2, aNao = 5, zenNao = false},
	{id = 72, text = "Guarda o celular no bolso e retira ele menos de um minuto depois?", cat = "BAIXO", aSim = 8, vSim = 0.2, aNao = 5, zenNao = false},
	{id = 73, text = "Assiste a séries ou filmes mexendo no celular ao mesmo tempo?", cat = "BAIXO", aSim = 8, vSim = 0.2, aNao = 5, zenNao = false},
	{id = 74, text = "Usa o celular no banheiro?", cat = "BAIXO", aSim = 5, vSim = 0.2, aNao = 5, zenNao = false},
	{id = 75, text = "Deixa a tela do celular virada para cima na mesa de cabeceira?", cat = "BAIXO", aSim = 5, vSim = 0.2, aNao = 5, zenNao = false},
	{id = 76, text = "Deixa o celular com o som ativado ao lado do travesseiro enquanto dorme?", cat = "BAIXO", aSim = 8, vSim = 0.2, aNao = 5, zenNao = false},
	{id = 77, text = "Usa telas com o brilho no máximo no escuro do quarto?", cat = "BAIXO", aSim = 8, vSim = 0.2, aNao = 5, zenNao = false},
	{id = 78, text = "Sente impaciência com vídeos que têm mais de 2 minutos de duração?", cat = "BAIXO", aSim = 8, vSim = 0.2, aNao = 5, zenNao = false},
	{id = 79, text = "Revisa a aba de notificações várias vezes por hora sem necessidade?", cat = "BAIXO", aSim = 8, vSim = 0.2, aNao = 5, zenNao = false},
	{id = 80, text = "Posta fotos de momentos especiais para garantir que os outros saibam que você esteve lá?", cat = "BAIXO", aSim = 8, vSim = 0.2, aNao = 5, zenNao = false},
	{id = 81, text = "Perde o fio da conversa presencial porque estava atento a uma notificação?", cat = "BAIXO", aSim = 8, vSim = 0.2, aNao = 5, zenNao = false},
	{id = 82, text = "Esquece o que ia pesquisar assim que abre o navegador devido a outros anúncios?", cat = "BAIXO", aSim = 8, vSim = 0.2, aNao = 5, zenNao = false},
	{id = 83, text = "Trabalha ou estuda ouvindo podcasts ou vídeos ao fundo para não se sentir sozinho?", cat = "BAIXO", aSim = 5, vSim = 0.2, aNao = 5, zenNao = false},
	{id = 84, text = "Desbloqueia o celular sem perceber enquanto realiza outra atividade?", cat = "BAIXO", aSim = 8, vSim = 0.2, aNao = 5, zenNao = false},
	{id = 85, text = "Utiliza filtros em fotos para esconder imperfeições antes de publicar?", cat = "BAIXO", aSim = 8, vSim = 0.2, aNao = 5, zenNao = false},
	{id = 86, text = "Sente alívio passageiro ao receber uma curtida ou comentário positivo?", cat = "BAIXO", aSim = 8, vSim = 0.2, aNao = 5, zenNao = false},
	{id = 87, text = "Ignora os alertas do sistema quando o limite diário de uso de um app é atingido?", cat = "BAIXO", aSim = 8, vSim = 0.2, aNao = 5, zenNao = false},
	{id = 88, text = "Lê apenas o título das notícias e compartilha sem abrir a matéria completa?", cat = "BAIXO", aSim = 8, vSim = 0.2, aNao = 5, zenNao = false},
	{id = 89, text = "Manda várias mensagens curtas seguidas em vez de enviar um texto único?", cat = "BAIXO", aSim = 5, vSim = 0.2, aNao = 5, zenNao = false},
	{id = 90, text = "Visualiza uma mensagem, pensa na resposta e esquece de responder?", cat = "BAIXO", aSim = 8, vSim = 0.2, aNao = 5, zenNao = false},
	{id = 91, text = "Checa a confirmação de leitura (riscos azuis) para ver se foi ignorado?", cat = "BAIXO", aSim = 8, vSim = 0.2, aNao = 5, zenNao = false},
	{id = 92, text = "Salva dezenas de postagens ou receitas que sabe que nunca mais vai olhar?", cat = "BAIXO", aSim = 5, vSim = 0.2, aNao = 5, zenNao = false},
	{id = 93, text = "Tira fotos da reunião familiar em vez de apenas aproveitar o momento?", cat = "BAIXO", aSim = 8, vSim = 0.2, aNao = 5, zenNao = false},
	{id = 94, text = "Faz refeições correndo para poder voltar a olhar o celular ou computador?", cat = "BAIXO", aSim = 8, vSim = 0.2, aNao = 5, zenNao = false},
	{id = 95, text = "Sente culpa quando passa um momento do dia sem fazer nada produtivo?", cat = "BAIXO", aSim = 8, vSim = 0.2, aNao = 5, zenNao = false},
	{id = 96, text = "Tenta ouvir podcasts enquanto faz tarefas simples para render mais?", cat = "BAIXO", aSim = 5, vSim = 0.2, aNao = 5, zenNao = false},
	{id = 97, text = "Fica impaciente quando um aplicativo demora mais de três segundos para carregar?", cat = "BAIXO", aSim = 8, vSim = 0.2, aNao = 5, zenNao = false},
	{id = 98, text = "Interrompe um momento relaxante para tirar uma foto e postar no feed?", cat = "BAIXO", aSim = 8, vSim = 0.2, aNao = 5, zenNao = false},
	{id = 99, text = "Prefere ver um resumo em vídeo de um livro do que ler a obra completa?", cat = "BAIXO", aSim = 8, vSim = 0.2, aNao = 5, zenNao = false},
	{id = 100, text = "Reconhece que este jogo refletiu de forma precisa os seus hábitos diários na internet?", cat = "BAIXO", aSim = 8, vSim = 0.2, aNao = 5, zenNao = false}
}

function SASQuestions.GetRandomQuestion()
	local index = math.random(1, #SASQuestions.Database)
	return SASQuestions.Database[index]
end

return SASQuestions
`
  },
  {
    id: 'sas_questions_ui_client',
    name: 'SASQuestionsUI.client.luau',
    path: 'StarterPlayer/StarterPlayerScripts/SASQuestionsUI.client.luau',
    service: 'StarterPlayerScripts',
    type: 'LocalScript',
    description: 'Criação dinâmica da interface modal SAS-SMU no cliente com efeito de Modo Zen / Desfoque.',
    code: `local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Players = game:GetService("Players")
local LocalPlayer = Players.LocalPlayer

local SASPauseEvent = ReplicatedStorage:WaitForChild("SASPauseEvent")
local SASAnswerEvent = ReplicatedStorage:WaitForChild("SASAnswerEvent")
local ZenModeEvent = ReplicatedStorage:WaitForChild("ZenModeEvent")

-- Criação Dinâmica da Interface Modal (Glassmorphism UI)
local ScreenGui = Instance.new("ScreenGui")
ScreenGui.Name = "SASModalGui"
ScreenGui.ResetOnSpawn = false
ScreenGui.Parent = LocalPlayer:WaitForChild("PlayerGui")

local Frame = Instance.new("Frame")
Frame.Size = UDim2.new(0.5, 0, 0.35, 0)
Frame.Position = UDim2.new(0.25, 0, 0.325, 0)
Frame.BackgroundColor3 = Color3.fromRGB(20, 20, 30)
Frame.BackgroundTransparency = 0.2
Frame.Visible = false
Frame.Parent = ScreenGui

local UICorner = Instance.new("UICorner", Frame)
UICorner.CornerRadius = UDim.new(0, 16)

local QuestionText = Instance.new("TextLabel")
QuestionText.Size = UDim2.new(0.9, 0, 0.5, 0)
QuestionText.Position = UDim2.new(0.05, 0, 0.08, 0)
QuestionText.TextColor3 = Color3.fromRGB(255, 255, 255)
QuestionText.TextScaled = true
QuestionText.BackgroundTransparency = 1
QuestionText.Font = Enum.Font.GothamBold
QuestionText.Parent = Frame

local BtnYes = Instance.new("TextButton")
BtnYes.Size = UDim2.new(0.4, 0, 0.25, 0)
BtnYes.Position = UDim2.new(0.08, 0, 0.65, 0)
BtnYes.BackgroundColor3 = Color3.fromRGB(220, 50, 50)
BtnYes.Text = "SIM"
BtnYes.TextColor3 = Color3.fromRGB(255, 255, 255)
BtnYes.Font = Enum.Font.GothamBlack
BtnYes.TextSize = 20
BtnYes.Parent = Frame
Instance.new("UICorner", BtnYes).CornerRadius = UDim.new(0, 8)

local BtnNo = Instance.new("TextButton")
BtnNo.Size = UDim2.new(0.4, 0, 0.25, 0)
BtnNo.Position = UDim2.new(0.52, 0, 0.65, 0)
BtnNo.BackgroundColor3 = Color3.fromRGB(40, 180, 90)
BtnNo.Text = "NÃO"
BtnNo.TextColor3 = Color3.fromRGB(255, 255, 255)
BtnNo.Font = Enum.Font.GothamBlack
BtnNo.TextSize = 20
BtnNo.Parent = Frame
Instance.new("UICorner", BtnNo).CornerRadius = UDim.new(0, 8)

-- Manipulação dos Eventos
SASPauseEvent.OnClientEvent:Connect(function(text)
	QuestionText.Text = text
	Frame.Visible = true
end)

BtnYes.MouseButton1Click:Connect(function()
	Frame.Visible = false
	SASAnswerEvent:FireServer("SIM")
end)

BtnNo.MouseButton1Click:Connect(function()
	Frame.Visible = false
	SASAnswerEvent:FireServer("NAO")
end)

-- Efeito Visual do Modo Zen
ZenModeEvent.OnClientEvent:Connect(function()
	local Lighting = game:GetService("Lighting")
	local Blur = Instance.new("BlurEffect")
	Blur.Size = 18
	Blur.Parent = Lighting
	
	task.wait(3)
	Blur:Destroy()
end)
`
  },
  {
    id: 'studio_installer',
    name: 'InstallerCommandBar.luau',
    path: 'RobloxStudio/CommandBarInstaller.luau',
    service: 'ReplicatedStorage',
    type: 'Setup',
    description: 'Script automatizado de 1 clique para executar no Command Bar do Roblox Studio! Cria instantaneamente todas as pastas, RemoteEvents, Gui elements e serviços.',
    code: `--[[
    SOBRECARGA DIGITAL - INSTALADOR AUTOMÁTICO DO ROBLOX STUDIO
    Instruções: Copie todo este script e cole na "Command Bar" (Barra de Comandos) do Roblox Studio.
    Aperte ENTER para criar automaticamente toda a estrutura do projeto!
--]]

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local ServerScriptService = game:GetService("ServerScriptService")
local StarterGui = game:GetService("StarterGui")

print("=== INICIANDO MONTAGEM AUTOMÁTICA DE SOBRECARGA DIGITAL ===")

-- 1. Pasta Events e RemoteEvents
local eventsFolder = ReplicatedStorage:FindFirstChild("Events") or Instance.new("Folder")
eventsFolder.Name = "Events"
eventsFolder.Parent = ReplicatedStorage

local remoteNames = { "SASAnswerEvent", "ToggleZenMode", "EndGameEvent", "OpenSASModal", "PlaySpecialAnim" }
for _, name in ipairs(remoteNames) do
	if not eventsFolder:FindFirstChild(name) then
		local re = Instance.new("RemoteEvent")
		re.Name = name
		re.Parent = eventsFolder
	end
end

-- 2. Pasta Assets com Templates Padrão
local assetsFolder = ReplicatedStorage:FindFirstChild("Assets") or Instance.new("Folder")
assetsFolder.Name = "Assets"
assetsFolder.Parent = ReplicatedStorage

local itemConfigs = {
	{ name = "Feed", color = Color3.fromRGB(60, 120, 240) },
	{ name = "Like", color = Color3.fromRGB(255, 80, 140) },
	{ name = "Wifi", color = Color3.fromRGB(0, 230, 255) },
	{ name = "Geometric", color = Color3.fromRGB(255, 170, 0) },
	{ name = "Exercise", color = Color3.fromRGB(34, 197, 94) },
	{ name = "Outdoor", color = Color3.fromRGB(16, 185, 129) },
	{ name = "Disconnect", color = Color3.fromRGB(6, 182, 212) },
	{ name = "Coffee", color = Color3.fromRGB(139, 69, 19) },
	{ name = "Book", color = Color3.fromRGB(46, 139, 87) }
}

for _, item in ipairs(itemConfigs) do
	if not assetsFolder:FindFirstChild(item.name) then
		local part = Instance.new("Part")
		part.Name = item.name
		part.Size = Vector3.new(2, 2, 2)
		part.Color = item.color
		part.Material = Enum.Material.SmoothPlastic
		part.Anchored = false
		part.CanCollide = false
		part.Parent = assetsFolder
	end
end

-- 3. Criar HUDGui no StarterGui
local function createHUDGui()
	local hud = StarterGui:FindFirstChild("HUDGui") or Instance.new("ScreenGui")
	hud.Name = "HUDGui"
	hud.ResetOnSpawn = false
	hud.Parent = StarterGui

	-- Thermometer Container
	local therm = hud:FindFirstChild("ThermometerFrame") or Instance.new("Frame")
	therm.Name = "ThermometerFrame"
	therm.Size = UDim2.new(0, 320, 0, 32)
	therm.Position = UDim2.new(0, 20, 0, 20)
	therm.BackgroundColor3 = Color3.fromRGB(30, 30, 40)
	therm.Parent = hud
	
	local uiCorner = Instance.new("UICorner", therm)
	uiCorner.CornerRadius = UDim.new(0, 16)

	local inner = therm:FindFirstChild("InnerBar") or Instance.new("Frame")
	inner.Name = "InnerBar"
	inner.Size = UDim2.new(0, 0, 1, 0)
	inner.BackgroundColor3 = Color3.fromRGB(46, 204, 113)
	inner.Parent = therm
	Instance.new("UICorner", inner).CornerRadius = UDim.new(0, 16)

	local text = therm:FindFirstChild("AnxietyPercentText") or Instance.new("TextLabel")
	text.Name = "AnxietyPercentText"
	text.Size = UDim2.new(1, 0, 1, 0)
	text.BackgroundTransparency = 1
	text.Text = "0%"
	text.TextColor3 = Color3.fromRGB(255, 255, 255)
	text.Font = Enum.Font.FredokaOne
	text.TextSize = 18
	text.Parent = therm

	-- Relógio LED
	local clock = hud:FindFirstChild("ClockText") or Instance.new("TextLabel")
	clock.Name = "ClockText"
	clock.Size = UDim2.new(0, 180, 0, 40)
	clock.Position = UDim2.new(1, -200, 0, 20)
	clock.BackgroundTransparency = 1
	clock.Text = "00:60"
	clock.TextColor3 = Color3.fromRGB(0, 255, 200)
	clock.Font = Enum.Font.Code
	clock.TextSize = 32
	clock.Parent = hud
end

createHUDGui()

print("=== ESTRUTURA BASE CRIADA COM SUCESSO NO ROBLOX STUDIO! ===")
`
  }
];
