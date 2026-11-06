(async function () {
    /**
     * 
     * Key-pad minigame copy for Casualties:Unknown Wiki. Original game by Orsoniks
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

    // init constants

    const RETRO_FONT_URL = "https://static.wikitide.net/casualtiesunknownwiki/a/a7/Retro_Gaming.woff2";

    const SCALE = 1;
    const WIDTH = 942;
    const HEIGHT = 843;

    const audios = await window.CUCanvasBase.audioCtrl.preloadMany({
        explosion: "https://static.wikitide.net/casualtiesunknownwiki/2/29/Explosion.ogg",
        beep0: "https://static.wikitide.net/casualtiesunknownwiki/d/d1/Beep0.ogg",
        beep1: "https://static.wikitide.net/casualtiesunknownwiki/8/8d/Beep1.ogg",
        beep2: "https://static.wikitide.net/casualtiesunknownwiki/1/14/Beep2.ogg",
        beep3: "https://static.wikitide.net/casualtiesunknownwiki/e/e8/Beep3.ogg",
        beep4: "https://static.wikitide.net/casualtiesunknownwiki/6/6f/Beep4.ogg",
        beep5: "https://static.wikitide.net/casualtiesunknownwiki/d/df/Beep5.ogg",
        beep6: "https://static.wikitide.net/casualtiesunknownwiki/4/40/Beep6.ogg",
        beep7: "https://static.wikitide.net/casualtiesunknownwiki/8/8f/Beep7.ogg",
        beep8: "https://static.wikitide.net/casualtiesunknownwiki/c/ca/Beep8.ogg",
        beep9: "https://static.wikitide.net/casualtiesunknownwiki/9/97/Beep9.ogg",
    });

        // All active components
    const globalButtons = [
        {
            x: 127,
            y: 558,
            width: 118,
            height: 118,
            output: 1
        },
        {
            x: 270,
            y: 558,
            width: 118, 
            height: 118,
            output: 2
        },
        {
            x: 412,
            y: 558,
            width: 118, 
            height: 118,
            output: 3
        },
        {
            x: 554,
            y: 558,
            width: 118, 
            height: 118,
            output: 4
        },
        {
            x: 697,
            y: 558,
            width: 118, 
            height: 118,
            output: 5
        },
        {
            x: 127,
            y: 699,
            width: 118,
            height: 118,
            output: 6
        },
        {
            x: 270,
            y: 699,
            width: 118, 
            height: 118,
            output: 7
        },
        {
            x: 412,
            y: 699,
            width: 118, 
            height: 118,
            output: 8
        },
        {
            x: 554,
            y: 699,
            width: 118, 
            height: 118,
            output: 9
        },
        {
            x: 697,
            y: 699,
            width: 118, 
            height: 118,
            output: 0
        },
        {
            x: 845,
            y: 391,
            width: 94,
            height: 94,
            output: -2
        }
    ];
    
    const globalCodeboxes = [
        { // Stored code
            x: 127,
            y: 66,
            width: 688,
            height: 82,
            stored_code: ""
        }, 
        { // Entered code
            x: 127,
            y: 371,
            width: 688,
            height: 134,
            stored_code: ""
        }
    ];

    let loopId = 0, lastT = 0;
    let physicsUpdateTime = 0;
    let showHidden = false;
    let hiddenStatsEl = null;

    let handIdleImage;
    let handClickImage;

    let loadImage = window.CUCanvasBase.loadImage;
    let handPos = window.CUCanvasBase.handPos;

    let randRange = window.CUCanvasBase.randRange;
    let dashFill = window.CUCanvasBase.dashFill;
    let inRange = window.CUCanvasBase.inRange;
    let lerpVec2 = window.CUCanvasBase.lerpVec2;
    
    //hand
	let handType = window.CUCanvasBase.HAND_TYPES.POINT;
	let handClass = window.CUCanvasBase.Hand;
	let hand;

    //stats
    let characterStats = window.CUCanvasBase.characterStats;

    let trackBleeding = 0;
    let trackSkinDamage = 0;
    let trackMuscleDamage = 0;
    
    let mouse = {x: 0, y: 0, captured_output: 0, clicked: false};
    let keypad;
    
    class KeypadContext {
        constructor() {
            this.stored_code = "1";
            this.entered_code = "";
            this.buttons = [];
            this.codeboxes = [];
            this.beaten = 0;
        }

        clearCtx() {
            // logs.innerHTML = ""; -- test it later
            this.entered_code = "";
            this.codeboxes[1].stored_code = "";
        }

        reset(isRegenNeeded) {
            this.beaten = 0;
            if(isRegenNeeded) {
                this.generateCode();
            }

            this.clearCtx();

            trackBleeding = 0;
            trackMuscleDamage = 0;
            trackSkinDamage = 0;
        }

        generateCode() {
            let num = randRange(6, 13);
            let code = "";

            for (let i = 0; i < num; ++i) {
                code += (randRange(1, 10));
            }

            this.stored_code = code;
            this.codeboxes[0].stored_code = dashFill(this.stored_code);
        }

        checkClick(mouse) {
            if (mouse.clicked) {
                return;
            }
            
            mouse.captured_output = -3;

            for (let i = 0; i < this.buttons.length; i++) {
                if (inRange(hand.handPos.x, this.buttons[i].x, this.buttons[i].x + this.buttons[i].width) 
                 && inRange(hand.handPos.y, this.buttons[i].y, this.buttons[i].y + this.buttons[i].height)) {
                    mouse.captured_output = this.buttons[i].output;

                    break;
                }
            }

            mouse.clicked = true;
            this.handleClick(mouse);
        }

        handleClick(mouse) {
            if (this.beaten == -1) { // check to make the explosion go away
                trackBleeding = 0;
                trackMuscleDamage = 0;
                trackSkinDamage = 0;
                this.beaten = 0;
            }

            if(mouse.captured_output != -3) {
                if (!(inRange(mouse.captured_output, 0, 9)))
                {
                    audios.beep0.play();

                    //quickfire(`assets/sound/beep0.ogg`);
                    this.reset(mouse.captured_output == -1);
                }
                else
                {
                    audios['beep' + mouse.captured_output].play();

                    // quickfire(`assets/sound/beep${mouse.captured_output}.ogg`);
                    if( this.entered_code.length >= this.stored_code.length) {
                        return;
                    }

                    this.entered_code += mouse.captured_output;
                    this.codeboxes[1].stored_code = dashFill(this.entered_code);
                    hand.handVelocity.x *= 0.3;
                    hand.handVelocity.y *= 0.3;
                    this.checkMegalovania();

                    if (this.checkWinCondition()) {
                        this.endMinigame(false);
                    }
                }
            }
        }

        checkWinCondition() {
            return this.entered_code == this.stored_code;
        }

        async checkMegalovania() {            
            if ((this.entered_code.includes("2296")) && !(this.stored_code.includes("2296"))) {
                trackBleeding = (Math.random() > 0.9 ? Math.random() * 2 * 0.015 : 0);
                trackMuscleDamage = Math.random() > 0.5 ? Math.random() * (10-7) + 7 : 0;
                trackSkinDamage = Math.random() * (10-8) + 8;  

                audios.explosion.play();
                this.endMinigame(true);
            }
            
            return;
        }

        endMinigame(fail) {
            if (fail) {
                this.beaten = -1;
                this.clearCtx();
                // same in game (just closes the interface, keeping the code)
            } else {
                this.beaten = 1;
            }
        } 
    }

    function updateHandPhysics(x, y, delta) {
        hand.handVelocity.x *= 0.9;
        hand.handVelocity.y *= 0.9;
        hand.handPos = lerpVec2(hand.handPos, {x: mouse.x, y: mouse.y}, delta * 10);
    }
    
    function getMousePos(e, canvas){
        let rect = canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) * (canvas.width / rect.width),
            y: (e.clientY - rect.top) * (canvas.height / rect.height)
        };
    }

    function bindInput(canvas) {
        if (canvas.dataset.cuInputBound)
            return;
        
        canvas.dataset.cuInputBound = "1";
        canvas.addEventListener("pointermove", function (e){
            let pos = getMousePos(e, canvas);
            mouse.x = pos.x;
            mouse.y = pos.y;
        });

        canvas.addEventListener("pointerdown",function (){
            keypad.checkClick(mouse);
        });

        canvas.addEventListener("pointerup", function (){
            mouse.clicked = false;
            mouse.captured_output = -3;
        });

        canvas.addEventListener("pointerleave", function (){
            mouse.clicked = false;
        });
        canvas.style.touchAction = "none";
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


    function renderBox(ctx, src) {
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = "#FFF";
        ctx.fillRect(src.x - 3*SCALE, src.y - 3*SCALE, src.width + 6*SCALE, src.height + 6*SCALE);
        ctx.globalAlpha = 1;
        ctx.fillStyle = "#000";
        ctx.fillRect(src.x, src.y, src.width, src.height);

        if ("output" in src) {
            ctx.textAlign = 'center';
            ctx.font = '64px Retro Gaming';
            ctx.fillStyle = "#FFF";
            ctx.fillText(src.output == -2 ? "C" : src.output.toString(), src.x + src.width / 2 * SCALE, src.y + (src.height + 48) / 2 * SCALE);
        }
    }

    function drawBase(ctx, keypad, canvas) {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#FFF";
        ctx.font = "22px Retro Gaming";
        ctx.textAlign = 'center';
        ctx.fillText("Match the code to open.", canvas.width / 2, 32);

        for (let button = 0; button < keypad.buttons.length; button++) { 
            renderBox(ctx, globalButtons[button]);
        }

        for (let codebox = 0; codebox < keypad.codeboxes.length; codebox++) {
            renderBox(ctx, globalCodeboxes[codebox]);
        }

        ctx.fillStyle = "#FFF";
        ctx.font = '42px Retro Gaming';
        ctx.textAlign = 'center';
        ctx.fillText(keypad.codeboxes[0].stored_code, canvas.width / 2 * SCALE, (keypad.codeboxes[0].y + keypad.codeboxes[0].height / 2 + 16 * SCALE));

        ctx.fillStyle = "#FFF";
        ctx.font = '70px Retro Gaming';
        let wrap_flag = false;
        let piece1 = "";
        let piece2 = "";

        for (let i = 0; i < keypad.codeboxes[1].stored_code.length; i++) {
            if (ctx.measureText(keypad.codeboxes[1].stored_code.slice(0, i+1)).width < 700 * SCALE) {
                piece1 += keypad.codeboxes[1].stored_code[i];
            } else {
                wrap_flag = true;
                piece2 += keypad.codeboxes[1].stored_code[i];
            }
        }

        if (piece2.startsWith("-")) {
            piece1 = keypad.codeboxes[1].stored_code.slice(0, piece1.lastIndexOf('-') + 1);
            piece2 = keypad.codeboxes[1].stored_code.slice(piece1.lastIndexOf('-') + 1);
        }

        if (wrap_flag) {
            ctx.fillText(piece1, canvas.width / 2 * SCALE, (keypad.codeboxes[1].y + keypad.codeboxes[1].height / 2 - 8) * SCALE);
            ctx.fillText(piece2, canvas.width / 2 * SCALE, (keypad.codeboxes[1].y + keypad.codeboxes[1].height / 2 + 58) * SCALE);
        } else {
            ctx.fillText(piece1, canvas.width / 2 * SCALE, (keypad.codeboxes[1].y + keypad.codeboxes[1].height / 2 + 20) * SCALE);
        }
    }

    function drawAll(ctx, keypad, canvas) {
        drawBase(ctx, keypad, canvas);

        if (mouse.clicked) {
            hand.drawHandUpper(ctx, handClickImage);
        } else {
            hand.drawHandUpper(ctx, handIdleImage);
        }
    }

    function writeStats() {
        if (!hiddenStatsEl)
            return;

        if (keypad.beaten == 1) {
            hiddenStatsEl.innerHTML =
            "<dl><div>" +
            "<dt>Unlocked. Press 'Restart minigame' to try again.</dt>" +
            "</div></dl>";
        } else if(keypad.beaten == -1) {
            hiddenStatsEl.innerHTML =
            "<dl><div>" +
            "<dt>An explosion has occured with following parameters:</dt>" + 
            `<dt>${(trackBleeding).toFixed(3)} L/m of bleeding</dt>` + 
            `<dt>${(trackSkinDamage).toFixed(0)} skin damage</dt>` + 
            `<dt>${(trackMuscleDamage).toFixed(0)} muscle damage</dt>` + 
            "</div></dl>";
        } else {
            hiddenStatsEl.innerHTML = "";
        }
    }

    function createControlPanel(el) {
        if (el.querySelector(".cu-canvas-panel"))
            return;
        
        el.classList.add("cu-canvas--keypad");
        
        var panel = document.createElement("div");
        panel.className = "cu-canvas-panel";
        panel.innerHTML =
            '<button type="button" data-cu-action="restart">Restart minigame</button>' +
            '<div class="cu-canvas-hidden-stats"></div>';
        hiddenStatsEl = panel.querySelector(".cu-canvas-hidden-stats");

        panel.addEventListener("click", function (e) {
            var btn = e.target.closest("[data-cu-action]");
            if (!btn)
                return;
                
            switch (btn.dataset.cuAction) {
                case "restart":
                    keypad.reset(true);
                    break;
            }
        });
        
        el.appendChild(panel);
    }

    function tick(delta){
        physicsUpdateTime += delta * 60;
        while (physicsUpdateTime > 1) {
            updateHandPhysics(mouse.x, mouse.y, 1/60);
            // hand.updateHandPhysics(mouse.x, mouse.y, 1 / 60);

            physicsUpdateTime -= 1;
        }
    }

    function startLoop(canvas, keypad, ctx) {
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
            drawAll(ctx, keypad, canvas);
            writeStats();
            
            loopId = requestAnimationFrame(frame);
        }
        
        loopId = requestAnimationFrame(frame);
    }

    async function startKeypad(canvas, ctx, cfg, el) {
        await loadRetroFont();
        console.log("startKeypad retro font is ready:", document.fonts.check('42px "Retro Gaming"'));
        
        canvas.width = WIDTH * SCALE;
        canvas.height = HEIGHT * SCALE;
        
		hand = new handClass();
		//set hand pos after canvas init
		hand.handPos = { x: canvas.width / 2, y: canvas.height / 2 };
        
        ctx.imageSmoothingEnabled = false;
        
        handIdleImage = await loadImage(handType.idle);
        handClickImage = await loadImage(handType.click);
        keypad = new KeypadContext();

        createControlPanel(el);
        bindInput(canvas);
        
        keypad.buttons = globalButtons;
        keypad.codeboxes = globalCodeboxes;
        keypad.reset(true);

        startLoop(canvas, keypad, ctx);
    }

    window.CUCanvas.register("keypad", function (canvas, ctx, cfg, el) {
        startKeypad(canvas, ctx, cfg, el).catch(function (err) {
            console.error("keypad failed:", err);
        });
    });
})();
