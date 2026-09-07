(async function () {
    const RETRO_FONT_URL = "https://static.wikitide.net/casualtiesunknownwiki/a/a7/Retro_Gaming.woff2";

    const eyeURL = "https://static.wikitide.net/casualtiesunknownwiki/1/1f/Minigameeye.png";
    const eyePupilURL = "https://static.wikitide.net/casualtiesunknownwiki/a/a7/MinigamePupil.png";
    const eyeGoneURL = "https://static.wikitide.net/casualtiesunknownwiki/6/68/Minigameeyegone.png";
    const dragImageURL = "https://static.wikitide.net/casualtiesunknownwiki/e/e1/Selfharmdrag.png";
    const uiBackgroundImageURL = "https://static.wikitide.net/casualtiesunknownwiki/b/b4/Uigradientblack.png?20260717103508";

    const scarySoundURL = "https://static.wikitide.net/casualtiesunknownwiki/4/44/WarningLoop.ogg";
    const selfHarmTapURL = "https://static.wikitide.net/casualtiesunknownwiki/1/10/Selfharmtap.ogg";

    // consts
    const WIDTH = 450;
    const HEIGHT = 300;
    const SCALE = 2.4;

    // helper functions
    let loadImage = window.CUCanvasBase.loadImage;
    let audioCtrl = window.CUCanvasBase.audioCtrl;
    let lerpVec2 = window.CUCanvasBase.lerpVec2;
    let lerp = window.CUCanvasBase.lerp;
    let clamp = window.CUCanvasBase.clamp;

    // hand
    let handClass = window.CUCanvasBase.Hand;
    handClass.handOffsetX = 0;
    handClass.handOffsetY = 0;
	let hand;
    let handType = window.CUCanvasBase.HAND_TYPES.SELFHARM;
    
    // rendering + stats
    let loopId = 0, lastT = 0;
    let physicsUpdateTime = 0;
    let soundEnabled = false;
    let hiddenStatsEl = null;

    // images
    let eyeimage;
    let eyepupilimage;
    let eyegoneimage;
    let dragImage;
    let uiBackgroundImage;

    let handIdleImage;
    let handClickImage;
    
    // minigame + init vals
    let mouse;
    let minigame;

    let isEye = false;
    let cutsLeft = 0;
    let suicide = false;

    let cuts = [];
    
    // sounds
    const audios = await audioCtrl.preloadMany({
        cut1: "https://static.wikitide.net/casualtiesunknownwiki/1/12/Cut1.ogg",
        cut2: "https://static.wikitide.net/casualtiesunknownwiki/0/07/Cut2.ogg",
        cut3: "https://static.wikitide.net/casualtiesunknownwiki/f/fa/Cut3.ogg",
        cut4: "https://static.wikitide.net/casualtiesunknownwiki/3/3a/Cut4.ogg",
        cut5: "https://static.wikitide.net/casualtiesunknownwiki/b/b1/Cut5.ogg",
        cuteye: "https://static.wikitide.net/casualtiesunknownwiki/8/8b/Cuteye.ogg",
    });
    let warningLoop;
    let selfHarmTap;

    // Tone.js for pitch
    let scarySource;
    let isToneInited = false;


    // class for cuts and eye pupil
    class ActiveComponent {
		constructor(x, y, width, height, currentImageFill) {
            this.staticX = x;
            this.staticY = y;
            this.currentFrameX = x;
            this.currentFrameY = y;
            this.width = width;
            this.height = height;
            this.currentImageFill = currentImageFill;
            this.lostEye = false;
        }
    }


    class SelfHarmMinigame {
        constructor(hand) {
            this.cutsLeft = 5;
            this.cutsDone = 0;
            this.cutTime = 0;
            this.triesLeft = 15;
            this.isEye = false;
            this.cutting = false;
            this.attachedMouse = null;
            this.attachedHand = hand;
            this.activeObjects = [];
            this.lostEye = false;
            this.done = false;
            this.eye = null;
        }

        initState(cutsLeft, isEye, mouse) {
            this.cutsLeft = cutsLeft;
            this.isEye = isEye;
            this.attachedMouse = mouse;
            this.cutsDone = 0;
            this.cutting = false;
            this.cutTime = 0;
            this.triesLeft = 15;
            this.done = false;
            this.eye = new ActiveComponent(0, 0, 0, 0, 1);
            this.lostEye = false;
            cuts = [];
        }

        startCut() {
            this.cutTime = 0.25;
            this.cutting = true;
            cuts.push(new ActiveComponent(this.attachedHand.handPos.x - handIdleImage.width / 2, this.attachedHand.handPos.y, dragImage.width * SCALE, dragImage.height * SCALE, 0));

            if(this.isEye) {
                if(soundEnabled)
                    audios.cuteye.play();
                this.lostEye = true;
            } else {
                if(soundEnabled)
                    audios[`cut${this.cutsDone + 1}`].play();
            } 
            this.cutsLeft -= 1;
            this.cutsDone += 1;
        }

        endCut() {
            this.cutting = false;
            if (this.cutsLeft != 0)
                return;
            this.done = true;
        }

        Update(delta) {
            if(this.done)
                return;
            this.cutTime -= delta;
            if (this.cutting) {
                // safeguard
                for(let i = 0; i < this.cutsDone - 1; i++) {
                    cuts[i].currentImageFill = 1;
                }
                cuts[this.cutsDone - 1].currentImageFill = (1 - 4 * this.cutTime);
            }
            if (this.cutTime < 0 && this.cutting)
                this.endCut();
            if (this.isEye) {
                this.eye.currentFrameX = this.eye.staticX + (Math.random() - 0.5) * (15 - this.triesLeft);
                this.eye.currentFrameY = this.eye.staticY + (Math.random() - 0.5) * (15 - this.triesLeft);
            }
            if(!this.attachedMouse.clicked || this.cutTime >= -0.25)
                return;
            if (this.triesLeft > 0 && this.attachedMouse.justClicked) {
                this.attachedHand.handVelocity.x += (Math.random() * 2 - 1) * (19 - this.triesLeft) * 0.8;
                this.attachedHand.handVelocity.y += (Math.random() * 2 - 1) * (19 - this.triesLeft) * 0.8; 
                if(soundEnabled) {
                    scarySource.volume.value = lerp(-45, 0, (15 - this.triesLeft - 1) / 15); // so that it reaches 0 at last click
                    scarySource.playbackRate = 1.5 - (15 - this.triesLeft) / 15;
                    scarySource.start();
                }
                --this.triesLeft;
            } else if(this.triesLeft <= 0)
                this.startCut();
            this.attachedMouse.justClicked = false;
        }

        physicsUpdate(delta) {
            if(Math.random() < 0.4) {
                this.attachedHand.handVelocity = {x: this.attachedHand.handVelocity.x + (Math.random() * 2 - 1), y: this.attachedHand.handVelocity.y + (Math.random() * 2 - 1)};
            }
            if (this.cutting) {
                this.attachedHand.handVelocity = lerpVec2(this.attachedHand.handVelocity, {x: 0, y: 48}, 0.7);
            } else {
                if(!this.isEye) 
                    return;
                this.attachedHand.handPos.x = lerp(this.attachedHand.handPos.x, 480, 0.3 * (15 - this.triesLeft * 0.5) / 15); // in game: (0, 360)
                this.attachedHand.handPos.y = lerp(this.attachedHand.handPos.y, 360, 0.3 * (15 - this.triesLeft * 0.5) / 15);
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
            if(Tone.context.state != "running" && !isToneInited){
                isToneInited = true;
                await Tone.start();
            }
            mouse.clicked = true;
            mouse.justClicked = true;
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
         
        if(minigame.cutting) {
            ctx.fillStyle = "#F00";
            ctx.fillRect(50, 25, canvas.width - 100, canvas.height - 50);
        } 
        ctx.fillStyle = "#000";
        ctx.fillRect(240, 50, canvas.width - 480, canvas.height - 100);
        ctx.drawImage(uiBackgroundImage, canvas.width / 2 - 3 * uiBackgroundImage.width, canvas.height / 2 - 3 * uiBackgroundImage.height, uiBackgroundImage.width * 6, uiBackgroundImage.height * 6);
    }

    function drawAll(ctx, canvas) {
        drawBase(ctx, canvas);
        if(isEye) {
            ctx.drawImage(eyeimage, canvas.width / 2 - eyeimage.width / 2 * SCALE, canvas.height / 2 - eyeimage.height / 2 * SCALE, eyeimage.width * SCALE, eyeimage.height * SCALE);
            if (!minigame.lostEye) {
                ctx.drawImage(eyepupilimage, (canvas.width - minigame.eye.currentFrameX) / SCALE + 10, canvas.height / 2 - minigame.eye.currentFrameY / 2 - eyepupilimage.height * SCALE / 2 - 5, eyepupilimage.width * SCALE, eyepupilimage.height * SCALE);
            } else {
                ctx.drawImage(eyegoneimage, canvas.width / 2 - eyeimage.width / 2 * SCALE, canvas.height / 2 - eyeimage.height / 2 * SCALE, eyeimage.width * SCALE, eyeimage.height * SCALE);
            }
        }

        for(const comp of cuts) {
            ctx.drawImage(dragImage, 0, 0, dragImage.width, dragImage.height * comp.currentImageFill, comp.currentFrameX, comp.currentFrameY, dragImage.width * SCALE, dragImage.height * SCALE * comp.currentImageFill);
        }

        hand.drawHandUpper(ctx, minigame.cutting ? handClickImage : handIdleImage);
    }
    /*
    function writeStats() {
		if (!hiddenStatsEl)
			return;
        //...
    }
    */

    function createControlPanel(el) {
		if (el.querySelector(".cu-canvas-panel"))
			return;
		
		el.classList.add("cu-canvas--selfharm");
		
		var panel = document.createElement("div");
		panel.className = "cu-canvas-panel";
		panel.innerHTML =
            '<div class="cu-canvas-panel-row">' +
			'<button type="button" data-cu-action="restart">Restart minigame</button>' +
            '<button type="button" data-cu-action="toggle-eye">Toggle eye/usual</button>' + 
            '<button type="button" data-cu-action="toggle-suicide">Toggle suicide/selfharm</button>' + 
            '<button type="button" data-cu-action="toggle-sound">Toggle sound</button>' +
            '</div>' +
			'<div class="cu-canvas-hidden-stats"></div>';
		hiddenStatsEl = panel.querySelector(".cu-canvas-hidden-stats");

        
		panel.addEventListener("click", async function (e) {
			var btn = e.target.closest("[data-cu-action]");
			if (!btn)
				return;
			switch (btn.dataset.cuAction) {
				case "restart":
					minigame.initState(cutsLeft, isEye, mouse);
					break;
                case "toggle-eye":
                    suicide = true;
                    isEye = !isEye;
                    cutsLeft = isEye ? 1 : 5;
                    minigame.initState(cutsLeft, isEye, mouse);
                    break;
                case "toggle-suicide":
                    suicide = !suicide;
                    if(suicide)
                        minigame.initState(isEye ? 1 : 5, isEye, mouse);
                    else {
                        cutsLeft = 1;
                        isEye = false;
                        minigame.initState(cutsLeft, isEye, mouse);
                    }
                    break;
                case "toggle-sound":
                    soundEnabled = !soundEnabled;
			}
		});
		
		el.appendChild(panel);
	}

    function tickAction(delta) {
        minigame.Update(delta);
        minigame.physicsUpdate(delta);
        warningLoop.volume = soundEnabled ? clamp(warningLoop.volume + delta*delta, 0, 1) : 0;
    }

    function tick(delta) {
        physicsUpdateTime += delta * 60;
        while (physicsUpdateTime > 1) {
            hand.updateHandPhysics(mouse.x, mouse.y, 1 / 60, 0);
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
			//writeStats();
			
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

    async function startSelfharm(canvas, ctx, cfg, el) {
		await loadRetroFont();
		console.log("startSelfharm retro font is ready:", document.fonts.check('42px "Retro Gaming"'));
        await addScript('/wiki/MediaWiki:Gadget-utils-Tone.js?action=raw&ctype=text/javascript');

		canvas.width = WIDTH * SCALE;
		canvas.height = HEIGHT * SCALE;   
        
		ctx.imageSmoothingEnabled = false;

        hand = new handClass();
		hand.handPos = { x: canvas.width / 2, y: canvas.height / 2 };

        mouse = { x: 0, y: 0, clicked: false, justClicked: false };
		
		handIdleImage = await loadImage(handType.idle);
		handClickImage = await loadImage(handType.click);

        eyeimage = await loadImage(eyeURL);
        eyepupilimage = await loadImage(eyePupilURL);
        eyegoneimage = await loadImage(eyeGoneURL);
        dragImage = await loadImage(dragImageURL);
        uiBackgroundImage = await loadImage(uiBackgroundImageURL);

        createControlPanel(el);
		bindInput(canvas);

        scarySource = new Tone.Player(selfHarmTapURL).toDestination();
        scarySource.volume.value = -Infinity;

        warningLoop = new Audio(scarySoundURL);
        warningLoop.loop = true;
        warningLoop.volume = 0;
        warningLoop.play();

        minigame = new SelfHarmMinigame(hand);
        minigame.initState(5, false, mouse);
        minigame.eye.staticX = canvas.width / 2;
        minigame.eye.staticY = canvas.height / 2;
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

    window.CUCanvas.register("selfharm", function (canvas, ctx, cfg, el) {
            startSelfharm(canvas, ctx, cfg, el).catch(function (err) {
                console.error("selfharm load failed:", err);
            });
        });
})();
