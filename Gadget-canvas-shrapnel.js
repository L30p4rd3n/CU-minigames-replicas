(async function () {
    /**
     * 
     * Shrapnel removal minigame copy for Casualties:Unknown Wiki. Original game by Orsoniks
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
    // static links
	const RETRO_FONT_URL = "https://static.wikitide.net/casualtiesunknownwiki/a/a7/Retro_Gaming.woff2";

    const backgroundImageURL = "https://static.wikitide.net/casualtiesunknownwiki/8/85/MinigameShrapnel.png";
    const shrapnelImageURL = "https://static.wikitide.net/casualtiesunknownwiki/7/76/ShrapnelPiece.png";
    const shrapnelProstheticImageURL = "https://static.wikitide.net/casualtiesunknownwiki/2/2b/Shrapnelprosthesis.png";

    debugger;

    // stats
    let characterStats = window.CUCanvasBase.characterStats;

    //hand
	let handClass = window.CUCanvasBase.Hand;
	let hand;

    // consts
    const WIDTH = 400;
    const HEIGHT = 256;
    const SCALE = 2.4;

    // helper functions
    let loadImage = window.CUCanvasBase.loadImage;
    let drawHandUpper = window.CUCanvasBase.drawHandUpper;
	let updateHandPhysics = window.CUCanvasBase.updateHandPhysics;
    let audioCtrl = window.CUCanvasBase.audioCtrl;
    let clamp = window.CUCanvasBase.clamp;
    let inRange = window.CUCanvasBase.inRange;
    let randrange = window.CUCanvasBase.randRange;
    let moveTowards = window.CUCanvasBase.moveTowards;

    function* yieldRect(amount, startPoint) {
        for(let i = 0; i < amount; i++) {
            yield new Rect(startPoint, 0, 0, 0);
            startPoint += shrapnelImage.width * SCALE + 20;
        }
    }

    // audio definitions
    const audios = await audioCtrl.preloadMany({
        gore1: "https://static.wikitide.net/casualtiesunknownwiki/9/9d/Gore1.ogg",
        gore2: "https://static.wikitide.net/casualtiesunknownwiki/7/77/Gore2.ogg",
        gore3: "https://static.wikitide.net/casualtiesunknownwiki/7/71/Gore3.ogg",
        gore4: "https://static.wikitide.net/casualtiesunknownwiki/4/42/Gore4.ogg",
        gore5: "https://static.wikitide.net/casualtiesunknownwiki/9/91/Gore5.ogg",
        steel: "https://static.wikitide.net/casualtiesunknownwiki/a/ae/Steel.ogg",
        prosthesisbreak: "https://static.wikitide.net/casualtiesunknownwiki/3/30/ProstheticBreak.ogg"
    });
    let squelchAudio;

    // variables
    let loopId = 0, lastT = 0;
    let physicsUpdateTime = 0;
    let showHidden = true;
    let hiddenStatsEl = null;

    let mouse;
    let handIdleImage;
	let handClickImage;
    let handType = window.CUCanvasBase.HAND_TYPES.GRASP;

    let shrapnelImage;
    let backgroundImage;
    let shrapnelProstheticImage;

    let hasTweezers = false;
    let isProsthetic = false;
    let limb = "Head";
    let shrapnelAmount = 5;

    let minigame;
    let heldOffset = {x: 0, y: 0};

    // Class for shrapnel pieces
    class Rect {
		constructor(x, y, width, height) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
        }
        getRect() { // Left-up, Right-up, Left-down, Right-down
            return {lu: { x: this.x - this.width, y: this.y - this.height }, 
                    ru: { x: this.x + this.width, y: this.y - this.height },
                    ld: { x: this.x - this.width, y: this.y + this.height },
                    rd: { x: this.x + this.width, y: this.y + this.height }};
        }
        calcOffset(mouse) {
            if("x" in mouse) {
                return {x: this.x - mouse.x, y: this.y - mouse.y};
            } return {x: this.x - mouse.handPos.x, y: this.y - mouse.handPos.y};
        }

    }

    // Minigame class
    class ShrapnelMinigame {
        constructor(hand, mouse) {
            this.attachedMouse = mouse;
            this.attachedHand = hand;

            this.limb = "";
            this.hasTweezers = false;

            this.shrapnelAmount = 0;
            this.objects = [];

            this.trackPain = 0;
            
            this.trackSkinHealth = 100;
            this.trackMuscleHealth = 100; // prosthetics
            this.trackBleedAmount = 0;

            this.trackBrainHealth = 100;

            this.currentlyHeld = null;
            this.ended = false;
        }

        isShrapnelOut(shrapnelPiece) {
             return (shrapnelPiece.y) >= 86; // 35 * SCALE[2.4] + 2 :sob:
        }

        initState(hasTweezers, limb, shrapnelAmount, attachAMouse) {
            this.attachedMouse = attachAMouse;
            this.attachedHand = hand;

            this.hasTweezers = hasTweezers;
            this.limb = limb;
            this.trackBleedAmount = 0;
            this.trackPain = 0;
            this.trackSkinHealth = 100;
            this.trackBrainHealth = 100;
            this.trackMuscleHealth = 100; // prosthetics

            this.shrapnelAmount = shrapnelAmount;
            this.objects = Array.from(yieldRect(5, -200));
            
            let num = 5 - shrapnelAmount;
            this.objects.forEach(element => {
                element.width = shrapnelImage.width * SCALE / 1.75;
                element.height = shrapnelImage.height * SCALE / 1.75;

                const radius = Math.sqrt(Math.random()) * 25;
                const angle = Math.random() * 2 * Math.PI;
                element.x += Math.cos(angle) * radius * SCALE / 2;
                element.y += -250 + Math.sin(angle) * radius;
                if(num > 0){
                    num--;
                    element.y += 8000;
                }
            });

            this.ended = false;
        }

        BreakGrasp() {
            if(!this.currentlyHeld)
                return;
            this.currentlyHeld = null;
            this.attachedMouse.clicked = false;

            let skinDamage = (Math.random() * 2 + 4);
            
            if(isProsthetic) {  
                this.trackMuscleHealth = clamp(this.trackMuscleHealth - skinDamage * 0.05, 0, 100);
            } else {
                this.trackSkinHealth = clamp(this.trackSkinHealth - skinDamage, 0, 100);
                this.trackBleedAmount = clamp(this.trackBleedAmount + Math.random() * 0.6 + 0.4, 0, 100);
                this.trackPain += randrange(9, 16);
            }
            
            if(isProsthetic) {
                audios.steel.play();
            }
            else {
                audios[`gore${randrange(1, 6)}`].play();
            }
            if(this.limb == "Head" && Math.random() < 0.8) {
                this.trackBrainHealth -= Math.random();
            }

            if(isProsthetic && this.trackMuscleHealth == 0 && !minigame.ended) {
                minigame.ended = true;
                audios.prosthesisbreak.play();
            }
        }

        Update() { 
            if(this.shrapnelAmount == 0)
                return;
            /* NOTE: THIS IS A SAFEGUARD. CHANGE THIS WHEN IT'S UPDATED */
            if(this.ended) 
                return;
            if(!this.attachedMouse.clicked)
                this.currentlyHeld = null;
            
            if(this.attachedMouse.clicked && this.currentlyHeld == null && this.attachedHand.handPos.y > -102) {
                for(let element = 4; element >= 0; element--) {
                    let rect = this.objects[element].getRect();
                    if(inRange(this.attachedHand.handPos.x, rect.lu.x, rect.ru.x) && inRange(this.attachedHand.handPos.y, Math.min(rect.lu.y, rect.ld.y), Math.max(rect.lu.y, rect.ld.y))) 
                    {
                        this.currentlyHeld = this.objects[element];
                        heldOffset = this.objects[element].calcOffset(this.attachedHand);
                        break;
                    }
                }
            }
            if(this.currentlyHeld != null) {
                if(this.isShrapnelOut(this.currentlyHeld)) {
                    this.currentlyHeld.x = this.attachedHand.handPos.x + heldOffset.x;
                    this.currentlyHeld.y = this.attachedHand.handPos.y + heldOffset.y;
                } else {
                    this.currentlyHeld.y = this.attachedHand.handPos.y + heldOffset.y;
                    if(Math.abs(this.attachedHand.handVelocity.y) > 2.2 && !this.hasTweezers) {
                        this.BreakGrasp();
                        return;
                    }
                    // NOTE: changed from 42(fixed in-game size) to account for dimensions
                    if(Math.abs(this.currentlyHeld.x - this.attachedHand.handPos.x) > Math.abs(this.currentlyHeld.getRect().lu.x - this.currentlyHeld.getRect().ru.x) / 2) { 
                        this.BreakGrasp();
                        return;
                    }
                } 
                if (this.currentlyHeld.getRect().lu.y < -364 * SCALE / 1.87) { 
                    this.currentlyHeld.y = -364 * SCALE / 1.87 + this.currentlyHeld.height;
                }
            }
            let num = 0;
            this.objects.forEach(object => {
                if(!this.isShrapnelOut(object)){
                    num++;
                }
            });
            this.shrapnelAmount = num;
            if(num == 0) {
                return;
            }

            
            /*
            // this is a REMOVED safeguard
            // NOTE: UN-COMMENT THESE LINES ONCE THE BUG IS FIXED IN THE GAME!!!
            this.objects.forEach(element => {
                if(element.getRect().lu.y < -364 * SCALE / 1.87){
                    element.y = -364 * SCALE / 1.87 + element.height;
                }
            });
            */
        }
    }

    function getMousePos(e, canvas) {
        let rect = canvas.getBoundingClientRect();
        return {
            x: ((e.clientX - rect.left) * (canvas.width / rect.width)),
            y: ((e.clientY - rect.top) * (canvas.height / rect.height))
        };
    }

    function bindInput(canvas) {
        if (canvas.dataset.cuInputBound)
			return;
        canvas.dataset.cuInputBound = "1";
        canvas.addEventListener("pointermove", function (e) {
            let pos = getMousePos(e, canvas);
            mouse.x = pos.x - canvas.width / 2;
            mouse.y = -1 * (pos.y - canvas.height / 2);
        });

        canvas.addEventListener("pointerdown",function (e) {
            mouse.clicked = true;
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
        ctx.fillStyle = "#000";
        ctx.fillRect(-(canvas.width / 2), -canvas.height / 2, canvas.width, canvas.height);

        minigame.objects.forEach(element => {
            let boundingbox = element.getRect();
            ctx.drawImage((isProsthetic ? shrapnelProstheticImage : shrapnelImage), 
                          element.x - element.width,
                          -element.y - element.height, 
                          (boundingbox.ru.x - boundingbox.lu.x), 
                          Math.abs(boundingbox.lu.y - boundingbox.ld.y));
        });
        ctx.drawImage(backgroundImage, -backgroundImage.width * SCALE, 102, backgroundImage.width * SCALE * 2, backgroundImage.height * SCALE * 2);
    }

    function drawAll(ctx, canvas) {
        drawBase(ctx, canvas);

        // idk at this point
        hand.handPos.y *= -1;
        hand.drawHandUpper(ctx, mouse.clicked ? handClickImage : handIdleImage, 0, minigame.trackPain);
        hand.handPos.y *= -1;
    }
    
    function writeStats() {
		if (!hiddenStatsEl)
			return;
        if(minigame.shrapnelAmount == 0){
            hiddenStatsEl.innerHTML =
            "<dl><div>" +
            "<dt>Minigame beaten.</dt>"+
            "<dt>Click on any button</dt>" +
            "<dt>to restart...</dt>" + 
            "</div></dl>";
        }  

        if(minigame.ended) {
            hiddenStatsEl.innerHTML = 
            "<dl><div>" +
            "<dt>Minigame failed.</dt>" +
            "<dt>Prosthesis broke.</dt>" +
            "<dt>Click on any button</dt>" +
            "<dt>to restart...</dt>" + 
            "</div></dl>";
            return;
        } else if(minigame.trackBrainHealth <= 30) {
            hiddenStatsEl.innerHTML = `
            <p>You're comatose. How did you even end up here?</p>
            `;
        } else {
            if(isProsthetic) {
                hiddenStatsEl.innerHTML =
                "<dl><div>" +
                `<dt>Prosthesis integrity: ${minigame.trackMuscleHealth.toFixed(2)}</dt>` +
                `<dt>Shards remaining: ${minigame.shrapnelAmount}</dt>` +
                "</div></dl>";
            } else {
                hiddenStatsEl.innerHTML =
                "<dl><div>" +
                `<dt>Pain: ${minigame.trackPain.toFixed(0)}</dt>` +
                `<dt>Bleeding: ${(minigame.trackBleedAmount * 0.015).toFixed(3)} L/m</dt>` +
                `<dt>Skin health: ${minigame.trackSkinHealth.toFixed(2)}</dt>` +
                `<dt>${minigame.isLimbAHead ? "Brain health: " + minigame.trackBrainHealth.toFixed(2) : ""}</dt>` +
                `<dt>Shards remaining: ${minigame.shrapnelAmount}</dt>` +
                "</div></dl>";
            }
           
        }
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
            '<button type="button" data-cu-action="use-tweezers">Toggle tweezers use</button>' + 
            '<div class="cu-canvas-panel-row">' +
            '<button type="button" data-cu-action="add-shr">Add 1 shrapnel</button>' + 
            '<button type="button" data-cu-action="sub-shr">Subtract 1 shrapnel</button>' + 
            '</div>' +
            '<button type="button" data-cu-action="toggle-limb">Toggle between head and other limbs</button>' + 
            '<button type="button" data-cu-action="toggle-prosthesis">Toggle prosthesis</button>' + 
			'<div class="cu-canvas-hidden-stats"></div>';
		hiddenStatsEl = panel.querySelector(".cu-canvas-hidden-stats");

        
		panel.addEventListener("click", async function (e) {
			var btn = e.target.closest("[data-cu-action]");
			if (!btn)
				return;
			switch (btn.dataset.cuAction) {
				case "restart":
					minigame.initState(hasTweezers, limb, shrapnelAmount, mouse);
					break;
                case "add-shr":
                    shrapnelAmount = clamp(shrapnelAmount + 1, 0, 5);
                    minigame.initState(hasTweezers, limb, shrapnelAmount, mouse);
                    break;
                case "sub-shr":
                    shrapnelAmount = clamp(shrapnelAmount - 1, 0, 5);
                    minigame.initState(hasTweezers, limb, shrapnelAmount, mouse);
                    break;
                case "toggle-limb":
                    if(isProsthetic) 
                        isProsthetic = false;
                    limb = `${minigame.isLimbAHead ? "HandF" : "Head"}`;
                    minigame.isLimbAHead = !minigame.isLimbAHead;
                    minigame.initState(hasTweezers, limb, shrapnelAmount, mouse);
                    break;
                case "use-tweezers":
                    hasTweezers = !hasTweezers;
                    handType = hasTweezers ? window.CUCanvasBase.HAND_TYPES.TWEEZERS : window.CUCanvasBase.HAND_TYPES.GRASP;
                    handIdleImage = await loadImage(handType.idle);
		            handClickImage = await loadImage(handType.click);
                    minigame.initState(hasTweezers, limb, shrapnelAmount, mouse);
                    break;
                case "toggle-prosthesis":
                    isProsthetic = !isProsthetic;
                    minigame.initState(hasTweezers, limb, shrapnelAmount, mouse);
			}
		});
		
		el.appendChild(panel);
	}

    function tickAction(delta) {
        minigame.Update();
        if(!isProsthetic)
            squelchAudio.volume = moveTowards(squelchAudio.volume, !minigame.currentlyHeld || Math.abs(minigame.attachedHand.handVelocity.y) < 0.2 || minigame.isShrapnelOut(minigame.currentlyHeld) ? 0 : 1, delta * 5);
        minigame.trackPain = clamp(minigame.trackPain - delta, 0, 100);
    }

    function tick(delta) {
        physicsUpdateTime += delta * 60;
        while (physicsUpdateTime > 1) {
            hand.updateHandPhysics(mouse.x, mouse.y, 1 / 60, minigame.trackPain);
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
			writeStats();
			
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

    async function startShrapnel(canvas, ctx, cfg, el) {
		await loadRetroFont();
		console.log("startShrapnel retro font is ready:", document.fonts.check('42px "Retro Gaming"'));
		
		canvas.width = WIDTH * SCALE;
		canvas.height = HEIGHT * SCALE;   

        ctx.translate(canvas.width / 2, canvas.height / 2);
		ctx.imageSmoothingEnabled = false;

        hand = new handClass();
		hand.handPos = { x: canvas.width / 2, y: canvas.height / 2 };

        mouse = { x: 0, y: 0, clicked: false };
		
		handIdleImage = await loadImage(handType.idle);
		handClickImage = await loadImage(handType.click);

        backgroundImage = await loadImage(backgroundImageURL);
        shrapnelImage = await loadImage(shrapnelImageURL);
        shrapnelProstheticImage = await loadImage(shrapnelProstheticImageURL);

        squelchAudio = new Audio("https://static.wikitide.net/casualtiesunknownwiki/e/ee/SquelchLoop.ogg");
        squelchAudio.volume = 0;
        squelchAudio.play();
        squelchAudio.loop = true;

        createControlPanel(el);
		bindInput(canvas);

        minigame = new ShrapnelMinigame(hand, mouse);
        minigame.initState(hasTweezers, limb, shrapnelAmount, mouse);
		startLoop(canvas, ctx);
	} 


    window.CUCanvas.register("shrapnel", function (canvas, ctx, cfg, el) {
            startShrapnel(canvas, ctx, cfg, el).catch(function (err) {
                console.error("shrapnel failed:", err);
            });
        });
})();
