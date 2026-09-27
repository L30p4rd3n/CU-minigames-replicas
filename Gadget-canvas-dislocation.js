(async function () {
    /**
     * 
     * Dislocation minigame copy for Casualties:Unknown Wiki. Original game by Orsoniks
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

    // NOTE: The natural decrease of dislocationTimer is omitted here to allow for actual minigame progress 
    // (and also the percentage does not drop when in minigame)
    debugger;
    // static links
	const RETRO_FONT_URL = "https://static.wikitide.net/casualtiesunknownwiki/a/a7/Retro_Gaming.woff2";

    const boneStaticImageURL = "https://static.wikitide.net/casualtiesunknownwiki/c/c8/DislocationBoneBase.png?20260717103507";
    const boneImageURL = "https://static.wikitide.net/casualtiesunknownwiki/2/25/DislocationBoneMove.png?20260717103506";
    const uiBackgroundImageURL = "https://static.wikitide.net/casualtiesunknownwiki/b/b4/Uigradientblack.png?20260717103508";
    const boneShadowImageURL = "https://static.wikitide.net/casualtiesunknownwiki/c/c2/DislocationBoneGhost.png";

    let uiBackgroundImage;
    let boneImage;
    let boneStaticImage;
    let boneShadowImage;

    // stats
    let characterStats = window.CUCanvasBase.characterStats;

    //hand
	let handClass = window.CUCanvasBase.Hand;
	let hand;

    // consts
    const WIDTH = 450;
    const HEIGHT = 300;
    const SCALE = 2.4;

    // helper functions
    let loadImage = window.CUCanvasBase.loadImage;
    let drawHandUpper = window.CUCanvasBase.drawHandUpper;
	let updateHandPhysics = window.CUCanvasBase.updateHandPhysics;
    let audioCtrl = window.CUCanvasBase.audioCtrl;
    let clamp = window.CUCanvasBase.clamp;
    let inRange = window.CUCanvasBase.inRange;
    let magnitude = window.CUCanvasBase.magnitude;
    let lerpVec2 = window.CUCanvasBase.lerpVec2;
    let randrange = window.CUCanvasBase.randRange;

    let loopId = 0, lastT = 0;
    let physicsUpdateTime = 0;
    let showHidden = false;
    let hiddenStatsEl = null;

    let mouse;
    let handIdleImage;
	let handClickImage;
    let handType = window.CUCanvasBase.HAND_TYPES.GRASP;

    let minigame;
    let unchipped = false;
    let hasWrench = false;

    const audios = await audioCtrl.preloadMany({
        boneHit: "https://static.wikitide.net/casualtiesunknownwiki/e/ed/BoneHit.ogg",
        boneBreak1: "https://static.wikitide.net/casualtiesunknownwiki/d/da/BoneBreak1.ogg",
        boneBreak2: "https://static.wikitide.net/casualtiesunknownwiki/e/e5/BoneBreak2.ogg",
        boneBreak3: "https://static.wikitide.net/casualtiesunknownwiki/a/ac/BoneBreak3.ogg",
        moodup: "https://static.wikitide.net/casualtiesunknownwiki/a/af/Moodup.ogg"
    });

    // same rect class as with shrapnel, don't think it should be in main file (it can only be used in 1 more minigame)
    class Rect {
		constructor(x, y, width, height) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
        }
        getRect() {
            return {lu: { x: this.x - this.width, y: this.y - this.height }, 
                    ru: { x: this.x + this.width, y: this.y - this.height },
                    ld: { x: this.x - this.width, y: this.y + this.height },
                    rd: { x: this.x + this.width, y: this.y + this.height }};
        }
    }

    // minigame class
    class dislocationMinigame {
        constructor(hand) {
            this.hasWrench = false;
            this.boneVelocity = {x: 0, y: 0};
            this.bone = null;
            this.boneBreak = false;
            this.finishSpot = {x: 420, y: 354.6}; // {x: 375, y: 54.6}
            this.remainingText = "";
            this.dislocationTimer = 0;
            this.trackPain = 0; 
            this.attachedMouse = null;
            this.attachedHand = hand;
            this.beaten = false;
        }

        getRandomPointOnRightQuarter() {
            let f = Math.random() * Math.PI / 3 * 2 - Math.PI / 3;
            return {x: Math.cos(f), y: Math.sin(f)};
        }

        initState(mouse, hasWrench) {
            this.dislocationTimer = Math.random() * 20 + 80;
            this.bone = new Rect(this.finishSpot.x + this.getRandomPointOnRightQuarter().x * this.dislocationTimer * 5,
                                 this.finishSpot.y + this.getRandomPointOnRightQuarter().y * this.dislocationTimer * 5,
                                 boneImage.width * SCALE,
                                 boneImage.height * SCALE
                                );
            this.boneVelocity = {x: 0, y: 0};

            this.remainingText = `${this.dislocationTimer}%`;
            this.trackPain = 0;
            this.attachedMouse = mouse;
            this.attachedMouse.clicked = false;

            this.hasWrench = hasWrench;
            this.beaten = false;
            this.boneBreak = false;
        }

        checkForHit() {
            if(this.trackPain > 75 || magnitude(this.boneVelocity) > 60 || !this.attachedMouse.clicked || magnitude(this.attachedHand.handVelocity) < 4) {
                return;
            }
            let rect = this.bone.getRect();

            if(!inRange(this.attachedHand.handPos.x, this.bone.x, this.bone.x + this.bone.width) || !inRange(this.attachedHand.handPos.y, this.bone.y - this.bone.height / 2, this.bone.y + this.bone.height / 2))
                return;
            /* if(!inRange(this.attachedMouse.x, this.bone.x, this.bone.x + this.bone.width) || !inRange(this.attachedMouse.y, this.bone.y - this.bone.height / 2, this.bone.y + this.bone.height / 2))
                    return;
            */

            if(this.hasWrench) {
                this.boneVelocity.x += this.attachedHand.handVelocity.x * 24;
                this.boneVelocity.y += this.attachedHand.handVelocity.y * 24;

                this.trackPain += randrange(4, 10);
            } else {
                this.boneVelocity.x += this.attachedHand.handVelocity.x * (Math.random() * 0.6 + 0.7) * 20;
                this.boneVelocity.y += this.attachedHand.handVelocity.y * (Math.random() * 0.6 + 0.7) * 20;
                this.trackPain += randrange(15, 24);
                if(Math.random() > 0.995) {
                    audios[`boneBreak${randrange(1, 4)}`].play();
                    this.boneBreak = true;
                }
            }
            // this.attachedHand.handVelocity.x *= -0.2; // NOTE: probably needs a render update
            // this.attachedHand.handVelocity.y *= -0.2; 
            mouse.clicked = false;
            audios.boneHit.play();
        }

        Update(delta) {
            if(this.boneBreak)
                return;
            if(this.beaten)
                return;

            this.checkForHit();

            this.bone.x += this.boneVelocity.x * delta * 3.5;
            this.bone.y += this.boneVelocity.y * delta * 3.5;
            this.boneVelocity = lerpVec2(this.boneVelocity, {x: 0, y: 0}, delta * 3.5);
            this.bone.x = clamp(this.bone.x, -500, 900);
            this.bone.y = clamp(this.bone.y, -50, 600);

            if(this.trackPain > 75) {
                this.remainingText = "Too much pain!";
            } else {
                this.remainingText = `${this.dislocationTimer.toFixed(0)}%`;
            }
            this.dislocationTimer = clamp(magnitude({x: this.bone.x - this.finishSpot.x, y: this.bone.y - this.finishSpot.y}) * 0.2 * 1.12, 0, 100); // 1.12 is an arbitrary number to scale it all down.
            if(this.dislocationTimer >= 3)
                return;
            minigame.beaten = true;
            audios.moodup.play();
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
            mouse.x = pos.x;
            mouse.y = pos.y;
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
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(uiBackgroundImage, -canvas.width / 2, -canvas.width / 2, canvas.width * 4, canvas.height * 4);
        ctx.drawImage(boneStaticImage, 80, canvas.height / SCALE, boneStaticImage.width * SCALE, boneStaticImage.height * SCALE);  
        ctx.drawImage(boneShadowImage, boneStaticImage.width * SCALE + 90, canvas.height / SCALE - 16, boneShadowImage.width * SCALE, boneShadowImage.height * SCALE);
    }

    function drawAll(ctx, canvas) {
        drawBase(ctx, canvas);
        ctx.drawImage(boneImage, minigame.bone.x, minigame.bone.y - boneImage.height / 2 * SCALE, boneImage.width * SCALE, boneImage.height * SCALE);
        let gbColor = (1 - minigame.dislocationTimer * 0.01) * 255;
        ctx.fillStyle = "#" + "ff" + Math.round(gbColor).toString(16).padStart(2, "0") + Math.round(gbColor).toString(16).padStart(2, "0");
        if(!unchipped) {
            ctx.font = '42px "Retro Gaming"';
		    ctx.textAlign = "center";
            ctx.fillText(minigame.remainingText, canvas.width / 2, canvas.height - 64);   
        }
        hand.drawHandUpper(ctx, mouse.clicked ? handClickImage : handIdleImage);
    }
    
    function writeStats() {
		if (!hiddenStatsEl)
			return;
        if(minigame.beaten){
            hiddenStatsEl.innerHTML =
            "<dl><div>" +
            "<dt>Minigame beaten.</dt>" +
            "<dt>Click on 'Restart'</dt>" +
            "<dt>to restart...</dt>" + 
            "</div></dl>";
        } else if(minigame.boneBreak) {
            hiddenStatsEl.innerHTML =
            "<dl><div>" +
            "<dt>Minigame failed.</dt>"+
            "<dt>You broke a bone!.</dt>" +
            "<dt>Click on 'Restart'</dt>" +
            "<dt>to restart...</dt>" + 
            "</div></dl>";
        } else {
            hiddenStatsEl.innerHTML =
                "<dl><div>" +
                `<dt>Pain: ${minigame.trackPain.toFixed(0)}</dt>` +
                `<dt>Unchipped: ${unchipped}` +
                "</div></dl>";
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
            '<button type="button" data-cu-action="use-wrench">Toggle wrench use</button>' + 
            '<button type="button" data-cu-action="toggle-unchipped">Toggle unchipped</button>' + 
            '</div>' +
			'<div class="cu-canvas-hidden-stats"></div>';
		hiddenStatsEl = panel.querySelector(".cu-canvas-hidden-stats");

        
		panel.addEventListener("click", async function (e) {
			var btn = e.target.closest("[data-cu-action]");
			if (!btn)
				return;
			switch (btn.dataset.cuAction) {
				case "restart":
					minigame.initState(mouse, hasWrench);
					break;
                case "toggle-unchipped":
                    unchipped = !unchipped;
                    break;
                case "use-wrench":
                    hasWrench = !hasWrench;
                    handType = hasWrench ? window.CUCanvasBase.HAND_TYPES.WRENCH : window.CUCanvasBase.HAND_TYPES.GRASP;
                    handIdleImage = await loadImage(handType.idle);
		            handClickImage = await loadImage(handType.click);
                    minigame.initState(mouse, hasWrench);
                    break;
			}
		});
		
		el.appendChild(panel);
	}

    function tickAction(delta) {
        minigame.Update(delta);
        minigame.trackPain = clamp(minigame.trackPain - delta, 0, 105);
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

    async function startDislocation(canvas, ctx, cfg, el) {
		await loadRetroFont();
		console.log("startDislocation retro font is ready:", document.fonts.check('42px "Retro Gaming"'));
		
		canvas.width = WIDTH * SCALE;
		canvas.height = HEIGHT * SCALE;   
        
		ctx.imageSmoothingEnabled = false;

        hand = new handClass();
		hand.handPos = { x: canvas.width / 2, y: canvas.height / 2 };

        mouse = { x: 0, y: 0, clicked: false };
		
		handIdleImage = await loadImage(handType.idle);
		handClickImage = await loadImage(handType.click);

        uiBackgroundImage = await loadImage(uiBackgroundImageURL);
        boneImage = await loadImage(boneImageURL);
        boneStaticImage = await loadImage(boneStaticImageURL);
        boneShadowImage = await loadImage(boneShadowImageURL);

        createControlPanel(el);
		bindInput(canvas);

        minigame = new dislocationMinigame(hand);
        minigame.initState(mouse, false);
		startLoop(canvas, ctx);
	} 
    
    window.CUCanvas.register("dislocation", function (canvas, ctx, cfg, el) {
            startDislocation(canvas, ctx, cfg, el).catch(function (err) {
                console.error("dislocation failed:", err);
            });
        });
})();
