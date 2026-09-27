(async function () {
    /**
     * 
     * Hand crank charger minigame copy for Casualties:Unknown Wiki. Original game by Orsoniks
     * 
     * Author of the copy: L30p4rd3n
     * 
     * Source code also available here: 
     * https://github.com/L30p4rd3n/CU-minigames-replicas
     * 
     * Casualties:Unknown Wiki is available here:
     * https://casualtiesunknown.miraheze.org
     * 
     */


	const RETRO_FONT_URL = "https://static.wikitide.net/casualtiesunknownwiki/a/a7/Retro_Gaming.woff2";
    const crankImageURL = "https://static.wikitide.net/casualtiesunknownwiki/9/96/HandCrankCrank.png";
    const smallBatteryURL = "https://static.wikitide.net/casualtiesunknownwiki/7/74/SmallBattery.png";
    const mediumBatteryURL = "https://static.wikitide.net/casualtiesunknownwiki/f/f7/MediumBattery.png";
    const largeBatteryURL = "https://static.wikitide.net/casualtiesunknownwiki/5/5a/LargeBattery.png";
    const uiBackgroundImageURL = "https://static.wikitide.net/casualtiesunknownwiki/b/b4/Uigradientblack.png";
    const handcrankImageURL = "https://static.wikitide.net/casualtiesunknownwiki/5/56/Handcrank.png";

    const crankLoopURL = "https://static.wikitide.net/casualtiesunknownwiki/f/fa/HandCrankLoop.ogg";
    const exhaustedLoopURL = "https://static.wikitide.net/casualtiesunknownwiki/d/d5/ExhaustedLoop.ogg";

    // consts
    const WIDTH = 350;
    const HEIGHT = 350;
    const SCALE = 3;

    // stats
    let characterStats = window.CUCanvasBase.characterStats;
    let int = characterStats.int;

    // helper funcs
    let loadImage = window.CUCanvasBase.loadImage;
    let drawHandUpper = window.CUCanvasBase.drawHandUpper;
	let updateHandPhysics = window.CUCanvasBase.updateHandPhysics;
    let magnitude = window.CUCanvasBase.magnitude;
    let clamp = window.CUCanvasBase.clamp;
    let vectorFromAngle = window.CUCanvasBase.vectorFromAngle;
    let normalised = window.CUCanvasBase.normalised;
    let conditionToGradient = window.CUCanvasBase.conditionToGradient
    function vectorToAngle(dir) { // override
        let num = Math.atan2(-dir.x, dir.y) * 57.29578;
        return num;
    }

    // hand
    let handClass = window.CUCanvasBase.Hand;
    let hand;
    let handType = window.CUCanvasBase.HAND_TYPES.GRASP;

    // rendering + stats
    let loopId = 0, lastT = 0;
    let physicsUpdateTime = 0;
    let hiddenStatsEl = null;

    // images
    let crankImage;
    let uiBackgroundImage;
    let handIdleImage;
    let handClickImage;
    let handcrankImage;

    // sounds
    let exhaustedLoop;
    let player;
    let isToneInited = false;

    // minigame + init vals
    let mouse;
    let minigame;
    let battery;

    
    class Crank {
        constructor(x, y, rot) {
            this.x = x;
            this.y = y;
            this.rotation = rot;
        }
    }


    class HandCrankMinigame {
        constructor(crank, hand) {
            this.crank = crank;
            this.handle = null;
            this.held = false;

            this.attachedHand = hand;
            this.attachedMouse = null;

            this.attachedBatteryCharge = 0;
            this.attachedBatteryMaxCharge = 50;
            this.attachedBatteryType = 0; // small | medium | large

            this.trackStamina = 100;
        }

        initState(mouse, battery) {
            // reset rotation
            this.crank.rotation = 0;

            // handle init
            let vector = vectorFromAngle(this.crank.rotation);
            this.handle = {x: vector.x * 137 * SCALE, y: -vector.y * 137 * SCALE};
            this.held = false;

            // battery init
            this.attachedBatteryCharge = battery.charge;
            this.attachedBatteryMaxCharge = battery.maxcharge;
            this.attachedBatteryType = battery.type;
            this.attachedMouse = mouse;

            // stamina reset
            this.trackStamina = 100;
        }

        Update() {
            if(!this.attachedMouse.clicked) {
                this.held = false;
                return;
            } if(this.trackStamina < 15)
                return;
            if(!this.held)
                this.held = (magnitude({x: ((this.attachedHand.handPos.x - WIDTH * SCALE / 2) - this.handle.x) / SCALE, y: ((this.attachedHand.handPos.y - HEIGHT * SCALE / 2) - this.handle.y) / SCALE})) < 33;
        }

        PhysicsUpdate() {
            if(this.held) {
                let offset = {x: this.attachedHand.handPos.x - this.crank.x, y: this.attachedHand.handPos.y - this.crank.y}
                if(magnitude(offset) > 1e-5)
                    this.attachedHand.handPos = {x: this.crank.x + normalised(offset).x * 137 * SCALE, y: this.crank.y + normalised(offset).y * 137 * SCALE};
                this.attachedHand.handVelocity = {x: this.attachedHand.handVelocity.x * 0.9, y: this.attachedHand.handVelocity.y * 0.9};

                let oldRotation = this.crank.rotation;
                let newPosVector = {x: this.crank.x - this.attachedHand.handPos.x, y: this.crank.y - this.attachedHand.handPos.y};

                this.crank.rotation = vectorToAngle(normalised(newPosVector));
                let newRotationVector = vectorFromAngle(this.crank.rotation);
                this.handle = {x: newRotationVector.x * 137 * SCALE, y: -newRotationVector.y * 137 * SCALE};

                let delta = clamp((oldRotation - this.crank.rotation) - Math.floor((oldRotation - this.crank.rotation) / 360) * 360, 0, 360);
                if(delta > 180)
                    delta -= 360;
                let deltaAngle = Math.abs(delta);
                this.attachedBatteryCharge = clamp(this.attachedBatteryCharge + (3.3e-5 * deltaAngle * 57.29578) / (this.attachedBatteryMaxCharge * 0.01), 0, this.attachedBatteryMaxCharge);

                this.trackStamina -= 0.015 * deltaAngle;
                if (deltaAngle < 1e-5)
                    deltaAngle = 0;

                player.volume.value = - 1 / (deltaAngle * 0.1);
                player.playbackRate = 0.75 + deltaAngle * 0.08;
            } else {
                player.volume.value = -Infinity;
                return;
            } 
        }
    }

    function getMousePos(e, canvas) {
        let rect = canvas.getBoundingClientRect();
        return {
            x: ((e.clientX - rect.left) * (canvas.width / rect.width)),
            y: ((e.clientY - rect.top) * (canvas.height / rect.height))
        };
    }

    async function bindInput(canvas) {
        if (canvas.dataset.cuInputBound)
			return;
        canvas.dataset.cuInputBound = "1";
        canvas.addEventListener("pointermove", function (e) {
            let pos = getMousePos(e, canvas);
            mouse.x = pos.x;
            mouse.y = pos.y;
        });

        canvas.addEventListener("pointerdown", async function (e) {
            mouse.clicked = true;
            if(Tone.context.state != "running" && !isToneInited) {
                isToneInited = true;
                await Tone.start();
                player.start();
            }
        });

        canvas.addEventListener("pointerup", function () {
            mouse.clicked = false;
        });

        canvas.addEventListener("pointerleave", function () {
			mouse.clicked = false;
		});
        canvas.style.touchAction = "none";
    }

    function drawBase(ctx, canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.globalAlpha = 0.75;
        ctx.fillStyle = "#000";
        ctx.fillRect(100, 50, canvas.width - 200, canvas.height - 100);
        ctx.fillRect(100, 20, canvas.width - 200, 150);

        ctx.globalAlpha = 1;
        ctx.drawImage(uiBackgroundImage, 0, 0, canvas.width, canvas.height);
    }

    function drawTopText(ctx, canvas) {
        ctx.fillStyle = "#fff";
        ctx.font = '20px "Retro Gaming"';
		ctx.textAlign = "center";
        ctx.fillText("Grab the handle and rotate it to charge.", canvas.width / 2, 64);   
    }
    
    function drawCrankerText(ctx, canvas) {
        let x = 150;
        let charge = (minigame.attachedBatteryCharge / minigame.attachedBatteryMaxCharge * 100);

        ctx.font = '14px "Retro Gaming"';
        ctx.textAlign = "left";
        ctx.fillStyle = "#fff";
        if(int < 9) {
            ctx.fillText("Something...", x, 96);
            return;
        }

        ctx.fillText("Hand crank charger", x, 96);
        ctx.fillText("(", x, 114);
        x += ctx.measureText("(").width;

        ctx.fillStyle = conditionToGradient(minigame.attachedBatteryCharge / minigame.attachedBatteryMaxCharge * 100);
        ctx.fillText((charge < 1 && charge > 0.01 ? "<1" : charge.toFixed(0)) + "%", x, 114);
        x += ctx.measureText((charge < 1 && charge > 0.01 ? "<1" : charge.toFixed(0)) + "%").width;

        ctx.fillStyle = "#fff";
        ctx.fillText(")", x, 114);
    }

    function drawCranker(ctx, canvas) {
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(minigame.crank.rotation * (Math.PI / 180));
        ctx.drawImage(crankImage, (-crankImage.width / 2) * SCALE, -crankImage.height * SCALE, crankImage.width * SCALE, crankImage.height * SCALE);
        ctx.restore();

        ctx.drawImage(handcrankImage, 114, 78, handcrankImage.width * 2, handcrankImage.height * 2);
    }

    function drawAll(ctx, canvas) {
        drawBase(ctx, canvas);
        drawCranker(ctx, canvas);
        drawCrankerText(ctx, canvas);
        drawTopText(ctx, canvas); 
        hand.drawHandUpper(ctx, mouse.clicked ? handClickImage : handIdleImage);
    }

    function createControlPanel(el) {
		if (el.querySelector(".cu-canvas-panel"))
			return;
		
		el.classList.add("cu-canvas--shrapnel");
		
		var panel = document.createElement("div");
		panel.className = "cu-canvas-panel";
		panel.innerHTML =
            '<div class="cu-canvas-panel-row">' +
			'<button type="button" data-cu-action="restart">Restart minigame</button>' +
            '<button type="button" data-cu-action="reset">Reset stamina</button>' +
            '<div class="cu-canvas-panel-row">' +
            `<button type="button" class="nowrap" data-cu-action="BatteryS"><img src=${smallBatteryURL} alt="Small" height="16"></img>Small</button>` + 
            `<button type="button" class="nowrap" data-cu-action="BatteryM"><img src=${mediumBatteryURL} alt="Medium" height="20"></img>Medium</button>` + 
            `<button type="button" class="nowrap" data-cu-action="BatteryL"><img src=${largeBatteryURL} alt="Large" height="32"></img>Large</button>` + 
            '</div>' +
            '<div class="cu-canvas-panel-row">' +
            '<button type="button" class="nowrap" data-cu-action="INT+"> +1 INT </button>' + 
            '<button type="button" class="nowrap" data-cu-action="INT-"> -1 INT </button>' + 
            '</div>' +
			'<div class="cu-canvas-hidden-stats"></div>';

		hiddenStatsEl = panel.querySelector(".cu-canvas-hidden-stats");
		panel.addEventListener("click", async function (e) {
			var btn = e.target.closest("[data-cu-action]");
			if (!btn)
				return;
			switch (btn.dataset.cuAction) {
				case "restart":
					minigame.initState(mouse, battery);
					break;
                case "reset":
                    minigame.trackStamina = 100;
                    break;
                case "BatteryS":
                    battery = {charge: 0, type: 0, maxcharge: 50};
                    minigame.initState(mouse, battery);
                    break;
                case "BatteryM":
                    battery = {charge: 0, type: 1, maxcharge: 100};
                    minigame.initState(mouse, battery);
                    break;
                case "BatteryL":
                    battery = {charge: 0, type: 2, maxcharge: 300};
                    minigame.initState(mouse, battery);
                    break;
                case "INT+":
                    int++;
                    break;
                case "INT-":
                    int--;
                    break;
			}
		});
		
		el.appendChild(panel);
	}

    function tickAction(delta) {
        minigame.Update();
        minigame.PhysicsUpdate();
        minigame.trackStamina = clamp(minigame.trackStamina + delta * 1.4, 0, 100);

        if(minigame.trackStamina < 50) {
            exhaustedLoop.volume = clamp(1 - minigame.trackStamina * 0.02, 0, 1);
        } else {
            exhaustedLoop.volume = 0;
        }
    }

    function tick(delta) {
        physicsUpdateTime += delta * 60;
        while (physicsUpdateTime > 1) {
            hand.updateHandPhysics(mouse.x, mouse.y, 1 / 60);
			physicsUpdateTime -= 1;
		}
    }

    function startLoop(canvas, ctx) {
		if (loopId) {
			cancelAnimationFrame(loopId);
		}
		
		lastT = 0;
		
		function frame(now) {
			if (!lastT) {
				lastT = now;
				loopId = requestAnimationFrame(frame);
				return;
			}
			
			let delta = Math.min((now - lastT) / 1000, 0.1); // cap big pauses
			lastT = now;
            tick(delta);
            tickAction(delta);
			drawAll(ctx, canvas);
			// writeStats();
			
			loopId = requestAnimationFrame(frame);
		}
		
		loopId = requestAnimationFrame(frame);
	}

    async function loadRetroFont() {
		if (window._cuRetroFontLoaded) {
			return;
		}
		
		let font = new FontFace("Retro Gaming", "url(" + RETRO_FONT_URL + ")", {
			weight: "normal",
			style: "normal",
		});
		
		await font.load();
		document.fonts.add(font);
		window._cuRetroFontLoaded = true;
	}

    async function startHandCrank(canvas, ctx, cfg, el) {
		await loadRetroFont();
		console.log("startHandCrank retro font is ready:", document.fonts.check('42px "Retro Gaming"'));
        await addScript('/wiki/MediaWiki:Gadget-utils-Tone.js?action=raw&ctype=text/javascript');
		
		canvas.width = WIDTH * SCALE;
		canvas.height = HEIGHT * SCALE;   
		ctx.imageSmoothingEnabled = false;

        hand = new handClass();
		hand.handPos = { x: canvas.width / 2, y: canvas.height / 2 };

        mouse = { x: 0, y: 0, clicked: false };
		
		handIdleImage = await loadImage(handType.idle);
		handClickImage = await loadImage(handType.click);
        crankImage = await loadImage(crankImageURL);
        uiBackgroundImage = await loadImage(uiBackgroundImageURL);
        handcrankImage = await loadImage(handcrankImageURL);

        player = new Tone.Player(crankLoopURL).toDestination();
        //pitchShift = new Tone.PitchShift({pitch: 0}).toDestination();

        //player.connect(pitchShift);
        player.loop = true;
        player.volume.value = -Infinity;

        exhaustedLoop = new Audio(exhaustedLoopURL);
        exhaustedLoop.volume = 0;
        exhaustedLoop.loop = true;
        exhaustedLoop.play();

        createControlPanel(el);
		bindInput(canvas);        
        
        minigame = new HandCrankMinigame(new Crank(canvas.width / 2, canvas.height / 2, 0), hand);
        battery = {charge: 0, type: 0, maxcharge:50};
        minigame.initState(mouse, battery);
		startLoop(canvas, ctx);
	} 

    async function addScript(url) {
        return new Promise((resolve, reject) => {
            // console.log("Download", url);
            const script = document.createElement("script");
            script.type = "text/javascript";
            script.onload = function () {
                // console.log(`Download done (${url})`);
                resolve(1);
            };

            script.src = url;
            document.head.append(script);
        });
    }
    window.CUCanvas.register("handcrank", function (canvas, ctx, cfg, el) {
            startHandCrank(canvas, ctx, cfg, el).catch(function (err) {
                console.error("handcrank failed:", err);
            });
        });
})();
