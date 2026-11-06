(async function () {
    /**
     * 
     * Bandaging minigame copy for Casualties:Unknown Wiki. Original game by Orsoniks
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
    
    const bandageRollImageURL = "https://static.wikitide.net/casualtiesunknownwiki/8/83/BandageRoll.png";
    const bandageCircleInnerImageURL = "https://static.wikitide.net/casualtiesunknownwiki/4/40/BandageCircleInner.png";
    const bandageOuterCircleImageURL = "https://static.wikitide.net/casualtiesunknownwiki/5/58/BandageOuter.png";
    const bandageStickImageURL = "https://static.wikitide.net/casualtiesunknownwiki/f/f9/BandageStick.png";

    const smallBleedingImageURL = "https://static.wikitide.net/casualtiesunknownwiki/6/67/Smallbleeding.png";
    const midBleedingImageURL = "https://static.wikitide.net/casualtiesunknownwiki/e/e5/MidBleeding.png";
    const bleedingImageURL = "https://static.wikitide.net/casualtiesunknownwiki/3/33/Bleeding.png";
    const strongBleedImageURL = "https://static.wikitide.net/casualtiesunknownwiki/d/d9/Strongbleed.png";

    const smallBleedingbandagedImageURL = "https://static.wikitide.net/casualtiesunknownwiki/e/ed/Smallbleedingbandaged.png";
    const midBleedingbandagedImageURL = "https://static.wikitide.net/casualtiesunknownwiki/f/f9/MidBleedingbandaged.png";
    const bleedingbandagedImageURL = "https://static.wikitide.net/casualtiesunknownwiki/7/7b/Bleedingbandaged.png";
    const strongBleedbandagedImageURL = "https://static.wikitide.net/casualtiesunknownwiki/a/a5/Strongbleedbandaged.png";

    const bleedGradient = [
        {pos: 0,    color: [0xff, 0xff, 0xff]}, // NOTE fallback -- in-game it's likely to be #000000, but then the evaluateGradient is likely to be different
        {pos: 5,    color: [0xff, 0xff, 0xff]},
        {pos: 10,   color: [0xFF, 0xFF, 0x00]},
        {pos: 20,   color: [0xBC, 0x85, 0x00]},
        {pos: 45,   color: [0x89, 0x1A, 0x00]},
        {pos: 100,  color: [0x35, 0x07, 0x00]}
    ];

    const bandageSlowDatalistHTML = `
        <datalist id="bandageslow-values">
            <option value=0.5>Hand</option>
            <option value=0.7>Forearm</option>
            <option value=0.95>Upper arm</option>
            <option value=1>Head</option>
            <option value=1.15>Thigh</option>
            <option value=1.5>Belly</option>
            <option value=1.75>Thorax</option>
        </datalist>
    `;
    
	
    let player;
    let isToneInited = false;

    // consts
    const WIDTH = 350;
    const HEIGHT = 350;
    const SCALE = 3;

    const CENTER = {x: WIDTH * SCALE / 2, y: HEIGHT * SCALE / 2};
    
    debugger;

    // stats
    let characterStats = window.CUCanvasBase.characterStats;
    let int = characterStats.int;

    // helper funcs
    let loadImage = window.CUCanvasBase.loadImage;
    let drawHandUpper = window.CUCanvasBase.drawHandUpper;
	let updateHandPhysics = window.CUCanvasBase.updateHandPhysics;
    let audioCtrl = window.CUCanvasBase.audioCtrl;
    let magnitude = window.CUCanvasBase.magnitude;
    let lerp = window.CUCanvasBase.lerp;
    let lerpVec2 = window.CUCanvasBase.lerpVec2;
    let clamp = window.CUCanvasBase.clamp;
    let normalised = window.CUCanvasBase.normalised;
    let moveTowards = window.CUCanvasBase.moveTowards;
    let repaintImage = window.CUCanvasBase.repaintImage;

    // helper funcs that have different definitions from ones in base file
    function vectorToAngle(dir) {
        let num = Math.atan2(dir.x, -dir.y) * 57.29578;
        if (num < 0) {
            num += 360;
        }
        return num;
    }

    function vectorFromAngle(angle) {
        return {x: Math.sin(angle * (Math.PI / 180)), y: -Math.cos(angle * (Math.PI / 180))};
    }

    function Dot(lhs, rhs) {
        return lhs.x * rhs.x + lhs.y * rhs.y;
    }

    function getRelativeCoordinates(target, origin) {
        /**
         * Gets coordinates relative to origin point
         */

        return {x: target.x - origin.x, y: target.y - origin.y};
    }

    function evaluateBleedGradient(bleedAmount) {
        // Likely a colorLerp?
        // TODO: make a separate function for any version of param and gradient

        let outColor = "#";
        let closest = 0;
        let t = 0;
        for(let i = 0; i < bleedGradient.length; i++) {
            if(bleedAmount <= bleedGradient[i].pos){
                closest = i; 
                break;
            } 
        }
        for(let i = 0; i < 3; i++) {
            if(closest) {
                t = clamp((bleedAmount - bleedGradient[closest - 1].pos) / (bleedGradient[closest].pos - bleedGradient[closest - 1].pos), 0, 1);
                outColor += Math.round(lerp(bleedGradient[closest - 1].color[i], bleedGradient[closest].color[i], t)).toString(16).padStart(2, "0");
            } else {
                outColor = "#FFF";
                break;
            }
        }
        return outColor;

    }

    // TODO: rewrite
    function getBleedImage(bleedAmount, bandageSlowAmount) {
        let idx = 0;
        if(bleedAmount > 20) {
            idx=3;
        } else if(bleedAmount > 8) {
            idx=2;
        } else if(bleedAmount > 3.75) {
            idx=1;
        } else if(bleedAmount > 0) {
            idx = 0;
        } else {
            idx = -1;
        }

        if(bandageSlowAmount <= 0.5) {
            if(idx != -1) {
                return repaintedBleedingImages.get(idx).nobandage;
            } return null;
        }
        if(idx != -1) {
            return repaintedBleedingImages.get(idx).bandage;
        } return null;
    }

    // hand
    let handClass = window.CUCanvasBase.Hand;
    let hand;
    let handType = window.CUCanvasBase.HAND_TYPES.GRASP;

    // rendering + stats
    let loopId = 0, lastT = 0;
    let physicsUpdateTime = 0;
    let showHidden = false;
    let hiddenStatsEl = null;
    let bodyParamsEl = null;

    let damagePanelEnabled = false;
    let damagePanelEl = null;

    // images
    let uiBackgroundImage;
    let handIdleImage;
    let handClickImage;

    let bandageRollImage;
    let bandageCircleInnerImage;
    let bandageOuterCircleImage;
    let bandageStickImage;
    let repaintedImages;

    let smallBleedingImage;
    let midBleedingImage;
    let bleedingImage;
    let smallBleedingbandagedImage;
    let midBleedingbandagedImage;
    let bleedingbandagedImage;
    let strongBleedImage;
    let strongBleedbandagedImage;
    let repaintedBleedingImages;

    

    // sounds
    // TODO

    // minigame + init vals
    let mouse;
    let mouseClickedBefore = false;
    let minigame;
    

    class Roll {
        constructor(x, y, rot){
            this.x = x;
            this.y = y;
            this.rotation = rot;
            this.scale = 1;
            this.fillAmount = 0;
        }
    }


    class Bandage {
        /**
         * 
         * @param {number} angleFraction       - angle fraction for modifier to apply
         * @param {number} skinHealAmount      - skin health increase
         * @param {number} bandageSlowAmount   - skin bleeding decrease from bandage
         * @param {number} painDecrease        - pain decrease
         * @param {number} boneHealDecrease    - bone heal timer decrease
         * @param {number} dislocationDecrease - bone dislocation timer decrease
         * @param {number} muscleHealIncrease  - muscle healtth increase
         * @param {number} opiateIncrease      - added opiate reception
         * @param {number} setDisinfect        - added disinfection
         * @param {string} color               - color of bandage sprite
         */
        constructor(angleFraction = 0, skinHealAmount = 0, bandageSlowAmount = 0,
                    painDecrease = 0, boneHealDecrease = 0, dislocationDecrease = 0,
                    muscleHealIncrease = 0, opiateIncrease = 0, setDisinfect = 0,
                    color="#fff") {
            this.condition = 1;
            this.onUse = function(normalAngle) {
                let angleModifier = normalAngle / angleFraction ;

                this.condition -= angleModifier;
                this.skinHealAmount = angleModifier * skinHealAmount;
                this.bandageSlowAmount = angleModifier * bandageSlowAmount;
                this.painDecrease = angleModifier * painDecrease;
                this.boneHealDecrease = angleModifier * boneHealDecrease;
                this.dislocationDecrease = angleModifier * dislocationDecrease;
                this.muscleHealIncrease = angleModifier * muscleHealIncrease;
                this.opiateIncrease = angleModifier * opiateIncrease;
                this.setDisinfect = angleModifier * setDisinfect;

                this.color = color;
                applyBandageEffects(minigame.limb, this);
            };
            // additional values are to be checked
        }
    }

    const Bandages = new Map([
        ["Bandage", new Bandage(12, 30, 45, 60, 20, 20, 0, 0, 0, "#ffffff")],
        ["Ripped dressing", new Bandage(8, 8, 18, 40, 5, 5, 0, 0, 0, "#e6e6e6")],
        ["Bruise kit", new Bandage(10, 100, 0, 80, 0, 80, 1, 0, 0, "#00ff00")],
        ["Analgetic gauze", new Bandage(15, 20, 50, 300, 0, 0, 0, 28, 0, "#9ea7c2")],
        ["Old rag", new Bandage(8, 8, 10, 25, 5, 5, 0, 0, 0, "#8f7e8b")],
        ["Sterilized bandage", new Bandage(12, 30, 45, 60, 20, 20, 0, 0, 900, "#808080")],
        ["Plastic bandage", new Bandage(12, 60, 72, 100, 30, 30, 0, 0, 0, "#6196cc")],
        ["Wrapvine", new Bandage(2.5, 8, 10, 0, 0, 0, 0, 0, 0, "#e28897")],
        ["Alginate dressing", new Bandage(15, 125, 72.5, 80, 0, 0, 0, 0, 800, "#ffffff")]
    ]);

    const LocaleLimbParams = new Map([
        ["muscleHealth", {"entry": "Muscle health", "href": "Limb_health#Muscle_health", "param": ""}],
        ["skinHealth", {"entry": "Skin health", "href": "Limb_health#Skin_health", "param": ""}],
        ["pain", {"entry": "Limb pain", "href": "Pain", "param": ""}],
        ["boneHealTimer", {"entry": "Bone healing time", "href": "Dislocation#Broken_bone", "param": ""}],
        ["dislocationTimer", {"entry": "Dislocation healing time", "href": "Dislocation", "param": ""}],
        ["disinfectionTime", {"entry": "Disinfection effect duration", "href": "Infection#Lowering_infection", "param": ""}],
        ["opiateAmount", {"entry": "Opiate amount", "href": "Opiates#Opiate_Amount", "param": ""}],
        ["bleedAmount", {"entry": "Bleeding", "href": "Blood_(mechanic)#Bleeding", "param": ""}],
    ]);


    class LimbBase {
        constructor(muscleHealth = 100, skinHealth=100, skinHealAmount = 0,
                    bandageMinigameSpeedMult = 1,
                    bandageSlowAmount = 0, pain = 0,
                    boneHealTimer = 0, dislocationTimer = 0,
                    disinfectionTime = 0, opiateAmount = 0, bleedAmount = 0) {
            this.muscleHealth = muscleHealth;
            this.skinHealth = skinHealth;

            this.bandageMinigameSpeedMult = bandageMinigameSpeedMult;

            this.skinHealAmount = skinHealAmount;
            this.bandageSlowAmount = bandageSlowAmount;

            
            this.pain = pain;
            this.boneHealTimer = boneHealTimer;
            this.dislocationTimer = dislocationTimer;
            this.disinfectionTime = disinfectionTime;

            this.opiateAmount = opiateAmount;   
            this.bleedAmount = bleedAmount;     
            
            this.dislocationHealSpeed = 0.07;
            this.boneHealSpeed = 0.043;

        }

        get muscleHealRate() {
            // this sucks
            return 0.016 * 0.08 * (this.muscleHealth > 10 ? 1 : 0.25);
            }

        get skinHealRate() {
            return 0.016 * 0.055 * (this.skinHealth > 10 ? 1 : 0.25);
        }

        get limbParams() {
            return {
                "muscleHealth":     this.muscleHealth,
                "skinHealth":       this.skinHealth,
                "pain":             this.pain,
                "boneHealTimer":    this.boneHealTimer,
                "dislocationTimer": this.dislocationTimer,
                "disinfectionTime": this.disinfectionTime,
                "opiateAmount":     this.opiateAmount,
                "bleedAmount":      this.bleedAmount
                };
        }
    }

    function applyBandageEffects(limb, bandage) {
        // TODO: check for multipliers
        limb.muscleHealth += bandage.muscleHealIncrease;
        limb.skinHealAmount += bandage.skinHealAmount;

        limb.bandageSlowAmount += bandage.bandageSlowAmount;
        limb.pain -= bandage.painDecrease;

        limb.boneHealTimer -= bandage.boneHealDecrease;
        limb.dislocationTimer -= bandage.dislocationDecrease;

        limb.disinfectionTime += bandage.setDisinfect;
        limb.opiateAmount += bandage.opiateAmount ? bandage.opiateAmount : 0;
    }

    function updateLimb(limb, delta) {
        let target = 15 - (limb.skinHealth * 0.15);
        limb.pain = clamp(moveTowards(limb.pain, target, limb.pain > target ? delta : delta * 0.6), 0, 100);

        limb.dislocationTimer = clamp(limb.dislocationTimer - delta * limb.dislocationHealSpeed, 0, 100);
        limb.boneHealTimer = clamp(limb.boneHealTimer - delta * limb.boneHealSpeed, 0, 100);

        // Note: 0.025 is the ideal value for blood clotting
        limb.bleedAmount = clamp(limb.bleedAmount - delta * 0.025 - (limb.bandageSlowAmount ? delta * 1.25 : 0), 0, 100 - limb.skinHealth); 

        limb.bandageSlowAmount = Math.max(limb.bandageSlowAmount - delta * 1.25, 0);
        limb.skinHealAmount = Math.max(limb.skinHealAmount - delta * 0.5, 0);
        limb.disinfectionTime = Math.max(limb.disinfectionTime - delta, 0);

        if((limb.dislocationTimer > 0 || limb.boneHealTimer > 0) && limb.muscleHealth >= 50) {
            limb.muscleHealth = 50;
        } limb.muscleHealth = clamp(limb.muscleHealth, 0, 100);
        limb.skinHealth = clamp(limb.skinHealth + (limb.skinHealAmount > 0 ? delta * 0.5 : 0), 0, 100);
    }
    

    class BandageMinigame {
        constructor(hand, mouse, dressing, dressingName, limb, roll) {
            this.attachedHand = hand;
            this.attachedMouse = mouse;

            this.attachedBandageRoll = roll;
            this.bandage = dressing;
            this.bandageName = dressingName;

            this.held = false;
            this.limb = null;
            this.color = "";
            this.holdingBandage = false;
            this.didWrap = false;
            this.bandageAngle = 0;
            this.lastActionAngle = 0;
            this.sizeMultiplier = 0.9;
            this.scale = 1;

            this.limb = limb;

            this.finished = false;
        }

        initState(limb, dressing, dressingName, bleedAmount) {
            this.limb = limb;
            this.bandage = dressing;
            this.bandageName = dressingName;
            this.limb.bleedAmount = bleedAmount;
            this.sizeMultiplier = 0.9;
            this.scale = 1;

            this.bandage.condition = 1;
            this.holdingBandage = false;
            this.didWrap = false;

            this.bandageAngle = 0;
            this.lastActionAngle = 0;

            this.finished = false;
        }

        Update() {
            if(this.finished) {
                this.holdingBandage = false;
                return;
            }

            if(this.attachedMouse.clicked) {
                let actualHandPos = normalised(getRelativeCoordinates(this.attachedHand.handPos, CENTER));
                let bandagePos = vectorFromAngle(this.bandageAngle);
                this.holdingBandage = (mouseClickedBefore && Dot(bandagePos, actualHandPos) > 0.9);
            }
            else
                this.holdingBandage = false;

            // apply more fillAmount or something
            this.attachedBandageRoll.fillAmount = this.didWrap ? 1 : this.bandageAngle / 360;
            this.scale = this.sizeMultiplier;

            this.bandageGrabReticleAngle = this.bandageAngle;

            let t = 1 - (1 - this.bandage.condition) * (1 - this.bandage.condition);
            let num = lerp(253, 390, t);
            this.attachedBandageRoll.scale = t;

            let vec = vectorFromAngle(this.bandageAngle);
            this.attachedBandageRoll.x = vec.x * num;
            this.attachedBandageRoll.y = vec.y * num;

            this.attachedBandageRoll.angle = -3 * this.bandageAngle;
        }

        PhysicsUpdate(delta) {
            let actualHandPos = getRelativeCoordinates(this.attachedHand.handPos, CENTER);
            if(this.holdingBandage) {
                this.attachedHand.handVelocity = lerpVec2(normalised(actualHandPos), {x: 0, y: 0}, delta * 34 * 1); // this.limb.bandageMinigameSpeedMult);

                let angleFromVector = vectorToAngle(normalised(actualHandPos));
                let deltaAngle = angleFromVector - this.bandageAngle;
                let actionDeltaAngle = angleFromVector - this.lastActionAngle;
                if(deltaAngle < 20) {
                    if(this.bandageAngle > 350 && (angleFromVector < 90 || angleFromVector == 360)) {
                        this.bandageAngle -= 360;
                        this.lastActionAngle -= 360;
                        this.didWrap = true;
                        // sound;
                        this.doBandageAction();
                    } else if(actionDeltaAngle > 20) {
                        this.doBandageAction();
                    }
                        
                    this.bandageAngle = angleFromVector;
                }   
            } if(magnitude(getRelativeCoordinates(this.attachedHand.handPos, CENTER)) >= 250)
                return;


            this.attachedHand.handVelocity.x += normalised(actualHandPos).x * delta * 25;
            this.attachedHand.handVelocity.y += normalised(actualHandPos).y * delta * 25;
        

            this.attachedHand.handPos.x = normalised(actualHandPos).x * 250 + CENTER.x;
            this.attachedHand.handPos.y = normalised(actualHandPos).y * 250 + CENTER.y;
            if(this.holdingBandage)
                return;
            this.attachedHand.handVelocity = {x: this.attachedHand.handVelocity.x * 0.9, y: this.attachedHand.handVelocity.y * 0.9};
        }

        doBandageAction() {
            this.bandage.onUse(5 / 90);
            this.lastActionAngle += 20;
            if(this.bandage.condition <= 0) {
                this.finished = true;
            }

            if(!this.didWrap) 
                return;
            this.sizeMultiplier += 0.0015;
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
            // if(Tone.context.state != "running" && !isToneInited){
            //     isToneInited = true;
            //     await Tone.start();
            //     player.start();
            // }
            mouseClickedBefore = true;
        });

        canvas.addEventListener("pointerup", function () {
            mouse.clicked = false;
            mouseClickedBefore = false;
        });

        canvas.addEventListener("pointerleave", function () {
			mouse.clicked = false;
            mouseClickedBefore = false;
		});
        canvas.style.touchAction = "none";
    }

    // Actual rendering

    function drawBase(ctx, canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.globalAlpha = 0.75;
        ctx.fillStyle = "#000";
        ctx.fillRect(100, 50, canvas.width - 200, canvas.height - 100);
        ctx.globalAlpha = 1;
    }


    function drawInnerCircle(ctx, canvas) {
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.drawImage(bandageCircleInnerImage, - bandageCircleInnerImage.width * SCALE / 2, - bandageCircleInnerImage.height * SCALE / 2, bandageCircleInnerImage.width * SCALE, bandageCircleInnerImage.height * SCALE);
        ctx.restore();
    }

    function drawAppliedBandageCircle(ctx, canvas) {
        ctx.save();
        ctx.beginPath();
        
        if(!minigame.didWrap) {
            let start = -Math.PI / 2;
            let end = start + minigame.attachedBandageRoll.fillAmount * Math.PI * 2;
            
            ctx.moveTo(canvas.width/2, canvas.height / 2);
            ctx.arc(canvas.width/2, canvas.height / 2, bandageOuterCircleImage.width * SCALE / 2, start, end, false);

            ctx.closePath();
            ctx.clip();            

        } ctx.drawImage(repaintedImages.get(minigame.bandageName).outerCircle, canvas.width/2-bandageOuterCircleImage.width * minigame.scale * SCALE / 2, canvas.height/2-bandageOuterCircleImage.width * minigame.scale * SCALE / 2, bandageOuterCircleImage.width * minigame.scale * SCALE, bandageOuterCircleImage.width * minigame.scale * SCALE);

        ctx.restore();
    }

    function drawBandageRoll(ctx, canvas) {
        ctx.save();
        ctx.translate(canvas.width / 2 + minigame.attachedBandageRoll.x , canvas.height / 2 + minigame.attachedBandageRoll.y );
        ctx.rotate(-minigame.attachedBandageRoll.angle * Math.PI / 180);
        ctx.drawImage(
            repaintedImages.get(minigame.bandageName).roll,
            - bandageRollImage.width / 2 * SCALE * minigame.attachedBandageRoll.scale,
            - bandageRollImage.height / 2 * SCALE * minigame.attachedBandageRoll.scale,
            bandageRollImage.width * SCALE * minigame.attachedBandageRoll.scale,
            bandageRollImage.height * SCALE * minigame.attachedBandageRoll.scale
        );

        ctx.restore();
    }

    function drawGrabReticle(ctx, canvas) {
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(-minigame.attachedBandageRoll.angle * Math.PI / 180 / 3);

        ctx.drawImage(
            bandageStickImage,
            -bandageStickImage.width / 2 * SCALE,
            -bandageStickImage.height / 2 * SCALE,
            bandageStickImage.width * SCALE,
            bandageStickImage.height * SCALE
        );

        ctx.restore();
    }

    function drawBleedingSprite(ctx, canvas) {
        let sprite = getBleedImage(minigame.limb.bleedAmount, minigame.limb.bandageSlowAmount);
        if(!sprite) return;

        ctx.drawImage(
            repaintImage(sprite, evaluateBleedGradient(minigame.limb.bleedAmount)),  // TODO: change function name, maybe add *0.01
            canvas.width / 2 -sprite.width / 2 * SCALE * 1.5,
            canvas.height / 2 -sprite.height / 2 * SCALE * 1.5 + 119, // TODO: Double-check this value
            sprite.width * SCALE * 1.5,
            sprite.height * SCALE * 1.5
        );   
    }

    function drawAll(ctx, canvas) {
        drawBase(ctx, canvas);
        drawBandageRoll(ctx, canvas);
        drawAppliedBandageCircle(ctx, canvas);
        drawInnerCircle(ctx, canvas);
        drawGrabReticle(ctx, canvas);
        drawBleedingSprite(ctx, canvas);
        hand.drawHandUpper(ctx, mouse.clicked ? handClickImage : handIdleImage);
    }

    

    /* Effect logging section */
    function createBodyParams() {
        if(!showHidden) {
            document.getElementsByClassName("cu-canvas-hidden-stats")[0].innerHTML = "";
            return;
        }
            
        
        bodyParamsEl = document.createElement("div");
        bodyParamsEl.className = "cu-canvas-panel";
        
        let bodyParams = minigame.limb.limbParams;
        for (const param in bodyParams) {
            // take param from localeParams
            let paramEl = document.createElement("div");
            paramEl.className = "cu-canvas-panel-row";

            let paramTooltip = document.createElement("a");
            paramTooltip.href = LocaleLimbParams.get(param).href;
            paramTooltip.innerHTML = "[?]";

            let paramElText = document.createElement("p");
            paramElText.className = "cu-canvas-limb-stat";
            paramElText.id = param;
            paramElText.textContent = `${LocaleLimbParams.get(param).entry}: ${minigame.limb.limbParams[param]}${LocaleLimbParams.get(param).param}`;

            paramEl.append(paramElText);
            paramEl.append(paramTooltip);

            bodyParamsEl.append(paramEl);
            
        }
        
        document.getElementsByClassName("cu-canvas-hidden-stats")[0].innerHTML = bodyParamsEl.innerHTML;
    }

    function updateBodyParams() {
        if(!showHidden)
            return;

        for (const param in minigame.limb.limbParams) {
            // take param from localeParams
            let paramEl = document.getElementById(param);
            if(paramEl && paramEl.textContent == `${LocaleLimbParams.get(param).entry}: ${minigame.limb.limbParams[param]}${LocaleLimbParams.get(param).param}`) {
                continue;
            } paramEl.textContent = `${LocaleLimbParams.get(param).entry}: ${minigame.limb.limbParams[param].toFixed(2)}${LocaleLimbParams.get(param).param}`;
        }
    }

    /* Effect addition panel */

        /* Pregens */
        function breakBone() {
            // NOTE: no internal bleeding tracking, since this is outside of the minigame scope
            if(minigame.limb["boneHealTimer"] > 0) {
                minigame.limb["boneHealTimer"] = 100;
                return;
            }

            minigame.limb["skinHealth"] -= 33;
            minigame.limb["bleedAmount"] += Math.random() * 20;
            minigame.limb["pain"] += Math.random() * 40 + 60;
            minigame.limb["boneHealTimer"] = 100;
        }
        function dislocate() {

            if(minigame.limb["dislocationTimer"] > 0) {
                 minigame.limb["dislocationTimer"] = 100;
                 return;
            }
            minigame.limb["dislocationTimer"] = Math.random() * 20 + 80;
            minigame.limb["pain"] = Math.random() * 40 + 40;
        }
        function explodeOnLandmine() {
            // NOTE: shrapnel not accounted for

            minigame.limb["muscleHealth"] -= Math.random() * 60;

            if(Math.random() < 0.2) {
                minigame.limb["skinHealth"] -= Math.random() * 75;
            } if(Math.random() < 0.06) {
                breakBone();
            } if(Math.random() < 0.135) {
                dislocate();
            } if(Math.random() < 0.15) {
                minigame.limb["bleedAmount"] += Math.random() * 26 + 4;
            }
            // maybe disfigurement if on head
        }

    function handleSlider(e) {
        const slider = e.target.closest('input[type="range"]');
        const label = document.getElementsByClassName("bleedAmountValue")[0]; // TODO: possible optimisation
        label.textContent = (e.target.value * 0.015).toFixed(2).padEnd(2) + "L/m";
    }   

    function createDamagePanel() {
        if(!damagePanelEnabled) {
            return;
        }

        let damageButtonsPanel = document.createElement("div");
        damageButtonsPanel.className = "cu-canvas-panel-row";

        let bleedingPanelEl = document.createElement("div");
        bleedingPanelEl.className = "cu-canvas-panel-row";
        bleedingPanelEl.id = "cu-bandage-bleeding-panel";

        let boneBreakButton = document.createElement("button");
        let dislocateButton = document.createElement("button");
        let explodeButton = document.createElement("button");

        let bleedAmountSlider = document.createElement("input");
        let bleedAmountValue = document.createElement("p");
        bleedAmountValue.className = "bleedAmountValue";
        let applyBleedButton = document.createElement("button");

        bleedAmountSlider.type = "range";
        bleedAmountSlider.className = "cu-canvas-slider";
        bleedAmountSlider.id = "applyBleedAmount";
        bleedAmountSlider.min = 0;
        bleedAmountSlider.max = 100;
        bleedAmountSlider.value = 0;
        bleedAmountSlider.step = 0.1;
        bleedAmountSlider.style.width = "45em";

        // TODO: eventListener similar to one found in syringe
        bleedAmountValue.textContent = bleedAmountSlider.value * 0.015 + "L/m";

        boneBreakButton.textContent = "Break a bone";
        boneBreakButton.setAttribute("data-cu-action", "bonebreak");

        dislocateButton.textContent = "Dislocate a bone";
        dislocateButton.setAttribute("data-cu-action", "dislocate");

        explodeButton.textContent = "Explode on a landmine";
        explodeButton.setAttribute("data-cu-action", "explode");

        applyBleedButton.textContent = "Apply bleeding"; // TODO: Either add a separate input for skin health, or just set it to 0
        applyBleedButton.setAttribute("data-cu-action", "bleed");

        damageButtonsPanel.append(boneBreakButton, dislocateButton, explodeButton);
        bleedingPanelEl.append(bleedAmountSlider, bleedAmountValue, applyBleedButton);
        damagePanelEl.append(damageButtonsPanel, bleedingPanelEl);
        damagePanelEl.addEventListener("click", async function (e) {
			var btn = e.target.closest("[data-cu-action]");
			if (!btn)
				return;
			switch (btn.dataset.cuAction) {
				case "bonebreak":
					breakBone();
					break;
                case "dislocate":
					dislocate();
					break;
                case "explode": 
					explodeOnLandmine();
					break;
                case "bleed":
                    minigame.limb.skinHealth = 0;
                    minigame.limb.bleedAmount = parseFloat(document.getElementById("applyBleedAmount").value); // holy shitcode
                    break;
			}
		});

        damagePanelEl.addEventListener("input", e => {handleSlider(e)});
    }
    function removeDamagePanel() {
        damagePanelEl.removeEventListener("input", e => {handleSlider(e)});
        damagePanelEl.removeEventListener("click", async function (e) {
			var btn = e.target.closest("[data-cu-action]");
			if (!btn)
				return;
			switch (btn.dataset.cuAction) {
				case "bonebreak":
					breakBone();
					break;
                case "dislocate":
					dislocate();
					break;
                case "explode":
					explodeOnLandmine();
					break;
			}
		});
    }

    function toggleDamagePanel() {
        if(damagePanelEnabled) {
            createDamagePanel();
        } else {
            removeDamagePanel();
            damagePanelEl.innerHTML = "";
        }
    }

    /* Control panel */
    function createControlPanel(el) {
		if (el.querySelector(".cu-canvas-panel"))
			return;
		
		el.classList.add("cu-canvas--shrapnel");
		
		var panel = document.createElement("div");
		panel.className = "cu-canvas-panel";
		panel.innerHTML =
            '<div class="cu-canvas-panel-row">' +
			'<button type="button" data-cu-action="restart">Restart minigame</button>' +
            '<button type="button" data-cu-action="restart-bandage">Restore dressing</button>' +
            '<button type="button" data-cu-action="show-hidden">Show hidden info</button>' +
            '<button type="button" data-cu-action="toggle-damage">Toggle damage panel</button>' +
            '</div>' +
            '<br></br>' +
            '<div class="cu-canvas-panel-row">' +
            '<button type="button" data-cu-action="dressing" id="1"> <img src="https://static.wikitide.net/casualtiesunknownwiki/0/0c/Bandage.png" height="16px" width="16px"></img></button>' +
            '<button type="button" data-cu-action="dressing" id="2"> <img src="https://static.wikitide.net/casualtiesunknownwiki/4/45/Rippeddressing.png" height="16px" width="16px"></img></button>' +
            '<button type="button" data-cu-action="dressing" id="3"> <img src="https://static.wikitide.net/casualtiesunknownwiki/f/fa/Bruisekit.png" height="16px" width="16px"></img></button>' +
            '<button type="button" data-cu-action="dressing" id="4"> <img src="https://static.wikitide.net/casualtiesunknownwiki/3/3c/Gauze.png" height="16px" width="16px"></img></button>' +
            '<button type="button" data-cu-action="dressing" id="5"> <img src="https://static.wikitide.net/casualtiesunknownwiki/3/34/Rag.png" height="16px" width="16px"></img></button>' +
            '<button type="button" data-cu-action="dressing" id="6"> <img src="https://static.wikitide.net/casualtiesunknownwiki/9/95/Sterilizedbandage.png" height="16px" width="16px"></img></button>' +
            '<button type="button" data-cu-action="dressing" id="7"> <img src="https://static.wikitide.net/casualtiesunknownwiki/6/63/Plasticbandage.png" height="16px" width="16px"></img></button>' +
            '<button type="button" data-cu-action="dressing" id="8"> <img src="https://static.wikitide.net/casualtiesunknownwiki/2/26/Musharm.png" height="16px" width="16px"></img></button>' +
            '<button type="button" data-cu-action="dressing" id="9"> <img src="https://static.wikitide.net/casualtiesunknownwiki/b/be/Alginate.png" height="16px" width="16px"></img></button>' +
            '</div>' +
			'<div class="cu-canvas-hidden-stats"></div>' +
            '<div class="cu-canvas-damage-panel"></div>';

		hiddenStatsEl = panel.querySelector(".cu-canvas-hidden-stats");
        damagePanelEl = panel.querySelector(".cu-canvas-damage-panel");
		panel.addEventListener("click", async function (e) {
			var btn = e.target.closest("[data-cu-action]");
			if (!btn)
				return;
			switch (btn.dataset.cuAction) {
				case "restart":
					minigame.initState(new LimbBase(), minigame.bandage, minigame.bandageName, 0);
					break;
                case "restart-bandage":
					minigame.initState(minigame.limb, minigame.bandage, minigame.bandageName, minigame.limb.bleedAmount);
					break;
                case "show-hidden":
                    showHidden = !showHidden;
                    createBodyParams();
                    break;
                case "toggle-damage":
                    damagePanelEnabled = !damagePanelEnabled;
                    toggleDamagePanel();
                    break;
                case `dressing`:
                    let bandageListID = parseInt(btn.id) - 1;
                    let selectedBandage = Bandages.get(Array.from(Bandages.keys())[bandageListID]);
                    let selectedBandageName = Array.from(Bandages.keys())[bandageListID];

                    minigame.initState(minigame.limb, selectedBandage, selectedBandageName, minigame.limb.bleedAmount);
			}
		});
		
		el.appendChild(panel);
	}

    function tickAction(delta) {
        minigame.Update();
        updateLimb(minigame.limb, delta);
        updateBodyParams();

        if(mouseClickedBefore && !minigame.holdingBandage) {
            mouseClickedBefore = false;
        }
    }

    function tick(delta) {
        physicsUpdateTime += delta * 60;
        while (physicsUpdateTime > 1) {
            minigame.PhysicsUpdate(delta);
            hand.updateHandPhysics(mouse.x, mouse.y, 1 / 60, minigame.limb.pain);
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

    async function startBandage(canvas, ctx, cfg, el) {
		await loadRetroFont();
		console.log("startBandage retro font is ready:", document.fonts.check('42px "Retro Gaming"'));
        await addScript('/wiki/MediaWiki:Gadget-utils-Tone.js?action=raw&ctype=text/javascript');
		
		canvas.width = WIDTH * SCALE;
		canvas.height = HEIGHT * SCALE;   
		ctx.imageSmoothingEnabled = false;

        hand = new handClass();
		hand.handPos = { x: 0, y: 0 };

        mouse = { x: 0, y: 0, clicked: false };
		
		handIdleImage = await loadImage(handType.idle);
		handClickImage = await loadImage(handType.click);

        // uiBackgroundImage = await loadImage(uiBackgroundImageURL);
        bandageCircleInnerImage = await loadImage(bandageCircleInnerImageURL);
        bandageRollImage = await loadImage(bandageRollImageURL);
        bandageStickImage = await loadImage(bandageStickImageURL);
        bandageOuterCircleImage = await loadImage(bandageOuterCircleImageURL);

        smallBleedingImage = await loadImage(smallBleedingImageURL);
        midBleedingImage = await loadImage(midBleedingImageURL);
        bleedingImage = await loadImage(bleedingImageURL);
        smallBleedingbandagedImage = await loadImage(smallBleedingbandagedImageURL);
        midBleedingbandagedImage = await loadImage(midBleedingbandagedImageURL);
        bleedingbandagedImage = await loadImage(bleedingbandagedImageURL);

        strongBleedImage = await loadImage(strongBleedImageURL);
        strongBleedbandagedImage = await loadImage(strongBleedbandagedImageURL);

        // repaintedImages inited once correct image is loaded
        repaintedImages = new Map([
            ["Bandage", {roll: repaintImage(bandageRollImage, "#ffffff"), outerCircle: repaintImage(bandageOuterCircleImage, "#ffffff")}],
            ["Ripped dressing", {roll: repaintImage(bandageRollImage, "#e6e6e6"), outerCircle: repaintImage(bandageOuterCircleImage, "#e6e6e6")}],
            ["Bruise kit", {roll: repaintImage(bandageRollImage, "#00ff00"), outerCircle: repaintImage(bandageOuterCircleImage, "#00ff00")}],
            ["Analgetic gauze", {roll: repaintImage(bandageRollImage, "#9ea7c2"), outerCircle: repaintImage(bandageOuterCircleImage, "#9ea7c2")}],
            ["Old rag", {roll: repaintImage(bandageRollImage, "#8f7e8b"), outerCircle: repaintImage(bandageOuterCircleImage, "#8f7e8b")}],
            ["Sterilized bandage", {roll: repaintImage(bandageRollImage, "#808080"), outerCircle: repaintImage(bandageOuterCircleImage, "#808080")}],
            ["Plastic bandage", {roll: repaintImage(bandageRollImage, "#6196cc"), outerCircle: repaintImage(bandageOuterCircleImage, "#6196cc")}],
            ["Wrapvine", {roll: repaintImage(bandageRollImage, "#e28897"), outerCircle: repaintImage(bandageOuterCircleImage, "#e28897")}],
            ["Alginate dressing", {roll: repaintImage(bandageRollImage, "#ffffff"), outerCircle: repaintImage(bandageOuterCircleImage, "#ffffff")}]
        ]);

        repaintedBleedingImages = new Map([
            [0, {nobandage: smallBleedingImage, bandage: smallBleedingbandagedImage}],
            [1, {nobandage: midBleedingImage, bandage: midBleedingbandagedImage}],
            [2, {nobandage: bleedingImage, bandage: bleedingbandagedImage}],
            [3, {nobandage: strongBleedImage, bandage: strongBleedbandagedImage}]
        ]);

        //player = new Tone.Player(crankLoopURL).toDestination();
        //player.volume.value = -Infinity;

        createControlPanel(el);
		bindInput(canvas);        
        
        minigame = new BandageMinigame(hand, mouse, Bandages.get("Bandage"), "Bandage", new LimbBase(), new Roll(canvas.width / 2, canvas.height / 2, 90));
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
    window.CUCanvas.register("bandage", function (canvas, ctx, cfg, el) {
            startBandage(canvas, ctx, cfg, el).catch(function (err) {
                console.error("bandage failed:", err);
            });
        });
})();
