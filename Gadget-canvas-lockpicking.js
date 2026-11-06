(async function () {
    /**
     * 
     * Lock-picking minigame copy for Casualties:Unknown Wiki. Original game by Orsoniks
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

    const LockArchImageURL = "https://static.wikitide.net/casualtiesunknownwiki/7/70/LockpickArch.png";
    const LockRectImageURL = "https://static.wikitide.net/casualtiesunknownwiki/6/65/LockpickLock.png?20260714061718";

    const pickLoop = new Audio("https://static.wikitide.net/casualtiesunknownwiki/2/2f/LockpickLoop.ogg");
    const unlockSound = new Audio("https://static.wikitide.net/casualtiesunknownwiki/b/bb/Unlock.ogg");
    const goreSound = new Audio("https://static.wikitide.net/casualtiesunknownwiki/7/77/Gore2.ogg");

    const SCALE = 2.4;
    const WIDTH = 400;
    const HEIGHT = 300;

    let characterStats = window.CUCanvasBase.characterStats;

    //hand
    let handType = window.CUCanvasBase.HAND_TYPES.POINT;
    let handClass = window.CUCanvasBase.Hand;
    let hand;

    let loadImage = window.CUCanvasBase.loadImage;
    
    let moveTowards = window.CUCanvasBase.moveTowards;
    let randRange = window.CUCanvasBase.randRange;
    let clamp01 = window.CUCanvasBase.clamp01;
    let clamp = window.CUCanvasBase.clamp;
    let handAngle = window.CUCanvasBase.handAngle;
    let inRange = window.CUCanvasBase.inRange;
    let magnitude = window.CUCanvasBase.magnitude;

    // constants and class definitions
    let containers = [1, 2.5, 8]; // container, medical, lifepod

    let LockArchImage;
    let LockRectImage;
    
    let loopId = 0, lastT = 0;
    let physicsUpdateTime = 0;
    let showHidden = false;
    let showAngles = false;
    let hiddenStatsEl = null;

    let int;
    let useLockpick;
    let containerType;
    let minigame;

    let mouse = {x: 0, y: 0, captured_output: 0, clicked: false};
    let handIdleImage;
    let handClickImage;

    let lockRect = {
        cx: WIDTH * SCALE / 2,
        cy: 400,
        angle: 0
    };

    class Lock {
        constructor() {
            this.pickLevel = -1;

            this.anglePrecision = 0;
            this.correctAngle = 180;

            this.lockProgress = 0;
            this.lockRect = null;
            this.timeWasStuck = 0;

            this.justClickedX = 0;
            this.justClickedY = 0;

            this.innerText = "";

            this.trackPain = 0;
            this.trackClawHealth = 100;
            this.trackLockpick = 0;

            this.beaten = false;
            this.failed = false;

            this.lockJitterX = 0;
            this.lockJitterY = 0;
        }
        initState(lockRect, useLockpick, int, containerType) { 
            this.lockRect = lockRect;
            this.correctAngle = randRange(5, 175);
            this.anglePrecision = containers[containerType];
            this.lockProgress = 0;
            this.timeWasStuck = 0;
            this.innerText = `Lock precision: ${this.anglePrecision.toFixed(1)} degree${this.anglePrecision > 1.0 ? "s" : ""}`;

            this.beaten = false;
            this.failed = false;
            this.useLockpick = useLockpick;
            this.pickLevel = useLockpick && int >= 10 ? int - 10 : -1;
            this.trackClawHealth = 100;
            this.trackPain = 0; 
            this.trackLockpick = 1;

        }

        clickingInside() {
            return handAngle(this.justClickedX, this.justClickedY) > 0 
                && handAngle(this.justClickedX, this.justClickedY) < 180 
                && inRange(magnitude({x: this.justClickedX, y: this.justClickedY}), 195 * SCALE / 2, 247 * SCALE / 2);
        }

        maxTurnProgress() {
            let num = Math.abs(handAngle(this.justClickedX, this.justClickedY) - this.correctAngle);

            if (num < this.anglePrecision) {
                num = 0;
            }

            return clamp01(1 - num / 90);
        }
        
        handleClick(mouse, delta) {
            let num = this.pickLevel + 1;

            if(mouse.clicked && this.clickingInside() && !this.beaten && !this.failed) {
                hand.handVelocity = {x: 0, y: 0};
                hand.handPos = {x: this.justClickedX + lockRect.cx, y: this.justClickedY + lockRect.cy};

                pickLoop.play();
                pickLoop.loop = true;

                pickLoop.volume = moveTowards(pickLoop.volume, 1, delta*5);
                this.lockProgress += delta * (0.66 + num * 0.065);
                if(this.lockProgress >= this.maxTurnProgress()) {
                    this.lockProgress = this.maxTurnProgress();
                    if (this.lockProgress == 1) {
                        this.beaten = false;
                        this.endMinigame(false);
                    } else {
                        this.timeWasStuck += delta;
                        this.anglePrecision += delta * 0.03;

                        const radius = Math.sqrt(Math.random() * 10 * this.timeWasStuck);
                        const angle = Math.random() * 2 * Math.PI;
                        this.lockJitterX = Math.cos(angle) * radius;
                        this.lockJitterY = Math.sin(angle) * radius;

                        if( this.timeWasStuck > 0.5) {
                            if(!this.useLockpick && this.pickLevel < 0) {
                                this.trackPain += 20;
                                this.trackClawHealth -= 15;
                                if (this.trackPain > 105) {
                                    this.endMinigame(true);
                                }
                            } else {
                                if (this.trackLockpick > 0) {
                                    this.trackLockpick -= 0.03;
                                    if(this.trackLockpick <= 0) this.endMinigame(true);
                                } else {
                                    this.endMinigame(true);
                                }
                            }
                            goreSound.play();
                            this.timeWasStuck = 0;
                        }
                    }
                }
            } else
                this.lockProgress = moveTowards(this.lockProgress, 0, delta*clamp(2-num*0.4, 0.1, 2));

            this.innerText = `Lock precision: ${this.anglePrecision.toFixed(1)} degree${Number(this.anglePrecision.toFixed(1)) >= 1.1 ? "s" : ""}`;
            this.lockRect.angle = (0 - this.lockProgress) * 180 / 57.29578;

            if (mouse.clicked == false) {
                this.timeWasStuck = 0;
                pickLoop.pause();
            }
        }

        checkWin() {
            return this.lockProgress;
        }

        endMinigame(fail) {
            pickLoop.volume = 0;
            if(fail) {
                this.failed = true;
            } else {
                if (!this.beaten) {
                    this.beaten = true;

                    unlockSound.play();
                }
            }
        }
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

    function getMousePos(e, canvas) {
        let rect = canvas.getBoundingClientRect();

        return {
            x: ((e.clientX - rect.left) * (canvas.width / rect.width)) - lockRect.cx,
            y: ((e.clientY - rect.top) * (canvas.height / rect.height)) - lockRect.cy
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

            minigame.justClickedX = hand.handPos.x - lockRect.cx;
            minigame.justClickedY = hand.handPos.y - lockRect.cy;

        });

        canvas.addEventListener("pointerup", function (){
            mouse.clicked = false;
        });

        canvas.addEventListener("pointerleave", function (){
            mouse.clicked = false;
        });

        canvas.style.touchAction = "none";
    }

    function drawBase(ctx, canvas) {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        if (!minigame.beaten) {
            ctx.drawImage(LockArchImage, 
                        lockRect.cx - LockArchImage.width / 2 * SCALE * 1.5,
                        lockRect.cy - LockArchImage.height * SCALE * 1.5,
                        LockArchImage.width * SCALE * 1.5,
                        LockArchImage.height * SCALE * 1.5
                        );

            ctx.fillStyle = "#ffffff";
            ctx.font = "32px Retro Gaming";
            ctx.textAlign = "center";
            ctx.fillText(minigame.innerText, canvas.width / 2, 50);

            ctx.save();
            
            ctx.translate(lockRect.cx, lockRect.cy);
            ctx.rotate(- minigame.lockRect.angle);
            ctx.drawImage(LockRectImage,
                        0 - LockRectImage.width / 2 * SCALE * 1.5 + minigame.lockJitterX,
                        0 - LockRectImage.height / 2 * SCALE * 1.5 + minigame.lockJitterY,
                        LockRectImage.width * SCALE * 1.5, 
                        LockRectImage.height * SCALE * 1.5);
            ctx.restore();
        }
    }

    function draw_all(ctx, canvas) {
        drawBase(ctx, canvas);
        hand.drawHandUpper(ctx, mouse.clicked ? handClickImage : handIdleImage);
    }
    
    function writeStats() {
        if (!hiddenStatsEl)
            return;

        if(minigame.beaten) {
                hiddenStatsEl.innerHTML =
                "<dl><div>" +
                "<dt>Unlocked. Press 'Restart minigame' to try again.</dt>" +
                "</div></dl>";
                return;
        } else if(minigame.failed) {
                hiddenStatsEl.innerHTML =
                "<dl><div>" +
                "<dt>Minigame failed due to a high pain level </dt>" +
                "<dt>or due to the fact that the lock-picking kit broke.</dt>" +
                "<dt>Press 'Restart minigame' to try again.</dt>" +
                "</div></dl>";
                return;
        } 

        if (showHidden) {
            hiddenStatsEl.innerHTML = `
            <p>INT: ${int}</p>
            <p>${showAngles ? "correctAngle: " + minigame.correctAngle : ""}</p>
            <p>${showAngles ? "currentAngle: " + handAngle(minigame.justClickedX, minigame.justClickedY).toFixed(2) : ""}</p>
            <p>${showAngles ? "lockProgress:" + minigame.lockProgress.toFixed(2) : ""}</p>
            <p>${(useLockpick && int >= 10) ? "" : "Pain: " + minigame.trackPain.toFixed(0)}</p>
            <p>${(useLockpick && int >= 10) ? "" : "Claw Health: " + minigame.trackClawHealth.toFixed(0)}</p>
            <p>${(useLockpick && int >= 10) ? "Lock picking kit durability: " + minigame.trackLockpick.toFixed(2) : ""}</p>
            `;
        } else {
            hiddenStatsEl.innerHTML = "";
        }
    }
    function createControlPanel(el) {
        if (el.querySelector(".cu-canvas-panel"))
            return;
        
        el.classList.add("cu-canvas--lockpick");
        
        var panel = document.createElement("div");
        panel.className = "cu-canvas-panel";
        panel.innerHTML =
            '<div class="cu-canvas-panel-row">' +
            '<button type="button" data-cu-action="restart">Restart minigame</button>' +
            '<button type="button" data-cu-action="use-lockpick">Use lock-picking kit</button>' +
            '</div>' +
            '<div class="cu-canvas-panel-row">' +
            '<button type="button" data-cu-action="add-int">INT+1</button>' + 
            '<button type="button" data-cu-action="sub-int">INT-1</button>' +
            '<button type="button" data-cu-action=type1>Container crate</button>' +
            '<button type="button" data-cu-action=type2>Medical crate</button>' +
            '<button type="button" data-cu-action=type3>Lifepod chest</button>' +
            '</div>' +
            '<div class="cu-canvas-panel-row">' +
            '<button type="button" data-cu-action=toggle-hidden>Toggle hidden info</button>' +
            '<button type="button" data-cu-action=toggle-cheat>Toggle angle data</button>' +
            '</div>' +
            '<div class="cu-canvas-hidden-stats"></div>';
        hiddenStatsEl = panel.querySelector(".cu-canvas-hidden-stats");


        panel.addEventListener("click", async function (e) {
            var btn = e.target.closest("[data-cu-action]");
            if (!btn)
                return;
            switch (btn.dataset.cuAction) {
                case "restart":
                    minigame.initState(lockRect, useLockpick, int, containerType);
                    break;
                case "add-int":
                    int++;
                    if (int >= 10 && useLockpick) {
                        handType = useLockpick ? window.CUCanvasBase.HAND_TYPES.LOCKPICK : window.CUCanvasBase.HAND_TYPES.POINT;
                        handIdleImage = await loadImage(handType.idle);
                        handClickImage = await loadImage(handType.click);
                    }
                    minigame.initState(lockRect, useLockpick, int, containerType);
                    break;
                case "sub-int":
                    int--;
                    if (int < 10) {
                        useLockpick = false;
                        handType = useLockpick ? window.CUCanvasBase.HAND_TYPES.LOCKPICK : window.CUCanvasBase.HAND_TYPES.POINT;
                        handIdleImage = await loadImage(handType.idle);
                        handClickImage = await loadImage(handType.click);
                    }
                    
                    minigame.initState(lockRect, useLockpick, int, containerType);
                    break;
                case "type1":
                    containerType = 0;
                    minigame.initState(lockRect, useLockpick, int, containerType);
                    break;
                case "type2":
                    containerType = 1;
                    minigame.initState(lockRect, useLockpick, int, containerType);
                    break;
                case "type3":
                    containerType = 2;
                    minigame.initState(lockRect, useLockpick, int, containerType);
                    break;
                case "use-lockpick":
                    useLockpick = !useLockpick;

                    if (int >= 10) {  
                        handType = useLockpick ? window.CUCanvasBase.HAND_TYPES.LOCKPICK : window.CUCanvasBase.HAND_TYPES.POINT;
                        handIdleImage = await loadImage(handType.idle);
                        handClickImage = await loadImage(handType.click);
                    }

                    minigame.initState(lockRect, useLockpick, int, containerType);
                    break;
                case "toggle-hidden":
                    showHidden = !showHidden;
                    writeStats();
                    break;
                case "toggle-cheat":
                    showAngles = !showAngles;
                    writeStats();
                    break;
            }
        });
        
        el.appendChild(panel);
    }

    function tickAction(delta) {
        minigame.handleClick(mouse, delta);
        minigame.trackClawHealth = clamp(minigame.trackClawHealth + delta, 0, 100);
        minigame.trackPain = clamp(minigame.trackPain - delta, 0, 105);
    }

    function tick(delta) {
        physicsUpdateTime += delta * 60;

        while (physicsUpdateTime > 1) {
            if (mouse.clicked && minigame.clickingInside()) {
                hand.updateHandPhysics(minigame.justClickedX + lockRect.cx, minigame.justClickedY + lockRect.cy, 1 / 60, minigame.trackPain);
            } else {
                hand.updateHandPhysics(mouse.x + lockRect.cx, mouse.y + lockRect.cy, 1 / 60, minigame.trackPain);
            }
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
            draw_all(ctx, canvas);
            writeStats();
            
            loopId = requestAnimationFrame(frame);
        }
        
        loopId = requestAnimationFrame(frame);
    }

    async function startLockpick(canvas, ctx, cfg, el) {
        await loadRetroFont();
        console.log("startLockpick retro font is ready:", document.fonts.check('42px "Retro Gaming"'));
        
        canvas.width = WIDTH * SCALE;
        canvas.height = HEIGHT * SCALE;       
        
        hand = new handClass();
        hand.handPos = { x: canvas.width / 2, y: canvas.height / 2 };
        
        ctx.imageSmoothingEnabled = false;
        
        handIdleImage = await loadImage(handType.idle);
        handClickImage = await loadImage(handType.click);

        LockArchImage = await loadImage(LockArchImageURL);
        LockRectImage = await loadImage(LockRectImageURL);

        int = characterStats.int;
        useLockpick = false;
        containerType = 0;
        minigame = new Lock();
        minigame.initState(lockRect, useLockpick, int, containerType);

        createControlPanel(el);
        bindInput(canvas);

        minigame.initState(lockRect, useLockpick, int, containerType);
        startLoop(canvas, ctx);
    } 

    window.CUCanvas.register("lockpicking", function (canvas, ctx, cfg, el) {
        startLockpick(canvas, ctx, cfg, el).catch(function (err) {
            console.error("lockpicking failed:", err);
        });
    });
})();
