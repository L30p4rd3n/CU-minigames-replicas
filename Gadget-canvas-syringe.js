(async function () {
    // this version might get cleaned up and refactored

    // static links
	const RETRO_FONT_URL = "https://static.wikitide.net/casualtiesunknownwiki/a/a7/Retro_Gaming.woff2";

    const syringeMinigameImageURL = "https://static.wikitide.net/casualtiesunknownwiki/0/08/MinigameSyringe.png";
    const syringeGroundImageURL = "https://static.wikitide.net/casualtiesunknownwiki/c/c1/MinigameSyringeGround.png";

    const syringeImageURL = "https://static.wikitide.net/casualtiesunknownwiki/1/17/Syringe.png";
    const syringeImage150URL = "https://static.wikitide.net/casualtiesunknownwiki/4/4e/Heroin.png";
    const syringeImage750URL = "https://static.wikitide.net/casualtiesunknownwiki/e/e3/Saline.png";

    const syringeUseURL  = "https://static.wikitide.net/casualtiesunknownwiki/2/21/Syringe.ogg";
    const syringeLoopURL = "https://static.wikitide.net/casualtiesunknownwiki/d/d1/SyringeLoop.ogg";
    const bulletHitURL = "https://static.wikitide.net/casualtiesunknownwiki/7/7e/Bullethit.ogg";

    // stats
    let characterStats = window.CUCanvasBase.characterStats;

    debugger;

    //hand
	let handClass = window.CUCanvasBase.Hand;
	let hand;

    // consts
    const WIDTH = 400;
    const HEIGHT = 256;
    const SCALE = 3;

    // helper functions
    let loadImage = window.CUCanvasBase.loadImage;
    let drawHandUpper = window.CUCanvasBase.drawHandUpper;
	let updateHandPhysics = window.CUCanvasBase.updateHandPhysics;
    let clamp = window.CUCanvasBase.clamp;
    let clamp01 = window.CUCanvasBase.clamp01;
    let inRange = window.CUCanvasBase.inRange;
    let lerp = CUCanvasBase.lerp;
    let conditionToGradient = window.CUCanvasBase.conditionToGradient;

    function colorLerp(a, b, t) {
        let red = lerp(parseInt(a.slice(1, 3), 16), parseInt(b.slice(1,3), 16), t);
        let green = lerp(parseInt(a.slice(3, 5), 16), parseInt(b.slice(3, 5), 16), t);
        let blue = lerp(parseInt(a.slice(5), 16), parseInt(b.slice(5), 16), t);
        return `#${Math.round(red).toString(16).padStart(2, "0")}${Math.round(green).toString(16).padStart(2, "0")}${Math.round(blue).toString(16).padStart(2, "0")}`;
    }

    // variables
    let loopId = 0, lastT = 0;
    let physicsUpdateTime = 0;
    let showHidden = false;
    let hiddenStatsEl = null;
    let liquidControlEl = null;

    let liquidControlIsEnabled = false;
    let liquidsToAdd = [];
    let liquidsToAddAmounts = [];

    let mouse;
    let handIdleImage;
	let handClickImage;
    let handType = window.CUCanvasBase.HAND_TYPES.GRASP;

    let syringeMinigameImage;
    let syringeGroundImage;
    let syringeImage;
    let syringeImage150;
    let syringeImage750;

    let minigame;
    let body;
    let heldOffset = {x: 0, y: 0};

    // audio
    let syringeUse;
    let bulletHit;
    let syringeLoop;
    let isToneInited = false;


    class SyringeLiquid {
        constructor(clr, onUse, fillAmount, name, injectionSickness = 1) {
            this.clr = clr;
            this.onUse = onUse;
            this.injectionSickness = injectionSickness;
            this.fillAmount = fillAmount;
            this.name = name;
        }
    }

    const liquids = new Map([
        ["alcohol", new SyringeLiquid("#76e667", function(ml){  }, 0, "Alcohol", 0.75)],
        ["alienblood", new SyringeLiquid("#ffeb12", function(ml){ body.addEffects([new Effect("bloodVolume", 26 * ml / 750), new Effect("septicShock", 10 * ml / 750), new Effect("sicknessAmount", 20 * ml / 750)]) }, 0, "Alien blood", 0)],
        ["amiodarone", new SyringeLiquid("#ffdcd4", function(ml){}, 0, "Amiodarone", 0)],
        ["antibiotics", new SyringeLiquid("#9e5dec", function(ml){  }, 0, "Antibiotics", 0.5)],
        ["antidepressants", new SyringeLiquid("#64a185", function(ml){  }, 0, "Antidepressants", 0)],
        ["antirad", new SyringeLiquid("#fbc106", function(ml){  }, 0, "Anti-rad", 0)],
        ["antiserum", new SyringeLiquid("#753e5d", function(ml){ body.addEffects([new Effect("septicShock", -10 * ml * 0.02), new Effect("bloodVolume", 3 * ml * 0.02), new Effect("antibioticImmunityTime", 300 * ml * 0.02)]) }, 0, "Antiserum", 0)],
        ["antivenom", new SyringeLiquid("#4dff70", function(ml){ body.addEffects([new Effect("venomTotal", -ml * 0.02 * 40)]) }, 0, "Antivenom", 0)],
        ["applejuice", new SyringeLiquid("#c5ff61", function(ml){  }, 0, "Apple juice", 0.4)],
        ["biochem", new SyringeLiquid("#b3ff25", function(ml){ body.addEffects([new Effect("sicknessAmount", ml * 0.01 * 100)]) }, 0, "Bio-chem fluid", 2)],
        ["bleach", new SyringeLiquid("#ffffff", function(ml){  }, 0, "Bleach", 5)],
        ["blood", new SyringeLiquid("#ffc900", function(ml){ body.addEffects([new Effect("bloodVolume", 30 * ml / 750)]) }, 0, "Blood", 0)],
        ["braingrow", new SyringeLiquid("#c0535e", function(ml){  }, 0, "Braingrow", 0)],
        ["carbonatedwater", new SyringeLiquid("#66a6ff", function(ml){  }, 0, "Carbonated water", 0)],
        ["ceftriaxone", new SyringeLiquid("#46cf30", function(ml){ body.addEffects([new Effect("antibioticImmunityTime", 1125 * ml * 0.01)]) }, 0, "Ceftriaxone", 0)],
        ["cereal", new SyringeLiquid("#ffdb9c", function(ml){  }, 0, "Cereal mix", 0.9)],
        ["chloroform", new SyringeLiquid("#bad1a7", function(ml){body.addEffect(new Effect("consciousness", 0, true, 180 * 0.01 * ml)); body.effects["consciousness"].desc = `consciousness -> 0 [-8/s]`}, 0, "Chloroform", 0)],
        ["chocolatemilk", new SyringeLiquid("#8f5c37", function(ml){  }, 0, "Chocolate milk", 1)],
        ["coffee", new SyringeLiquid("#50321e", function(ml){  }, 0, "Coffee", 0.7)],
        ["dirtywater", new SyringeLiquid("#997e43", function(ml){  }, 0, "Dirty water", 2)],
        ["disinfectant", new SyringeLiquid("#c8ffff", function(ml){  }, 0, "Antiseptic", 1.25)],
        ["energydrink", new SyringeLiquid("#bb00ff", function(ml){  }, 0, "Energy drink", 0.7)],
        ["epinephrine", new SyringeLiquid("#a1ffe9", function(ml){}, 0, "Epinephrine", 0)],
        ["fat", new SyringeLiquid("#d1be3f", function(ml){  }, 0, "Fat", 2)],
        ["fentanyl", new SyringeLiquid("#57f2ff", function(ml){ body.addEffects([new Effect("GetOrAddComponent<Painkillers>().opiateAmount", ml * 0.1 * 420)]) }, 0, "Fentanyl", 0)],
        ["groundwater", new SyringeLiquid("#598ad4", function(ml){  }, 0, "Groundwater", 0.15)],
        ["heroin", new SyringeLiquid("#ebebeb", function(ml){ body.addEffects([new Effect("GetOrAddComponent<Painkillers>().opiateAmount", ml * 0.01 * 130), new Effect("sicknessAmount", ml * 0.01 * 50)]) }, 0, "Heroin", 0)],
        ["highgradestimulant", new SyringeLiquid("#ffffff", function(ml){body.addEffect(new Effect("highgradestimulant", 0, true, ml * 2))}, 0, "Medical-grade stimulant", 0)],
        ["hotsauce", new SyringeLiquid("#ff0000", function(ml){  }, 0, "Hot sauce", 1)],
        ["icecream", new SyringeLiquid("#edffbd", function(ml){  }, 0, "Ice cream", 1)],
        ["icetea", new SyringeLiquid("#fa8734", function(ml){  }, 0, "Iced tea bottle", 0.4)],
        ["keratinbooster", new SyringeLiquid("#ffd154", function(ml){if(body.effects["clawRegrowTime"] && body.effects["clawRegrowTime"].value > 3600) {body.addEffects([new Effect("sicknessAmount", ml * 0.02 * 10), new Effect("clawRegrowTime", 1400 * ml * 0.02 * 0.1)])} else {body.addEffect(new Effect("clawRegrowTime", 1400 * ml * 0.02))}}, 0, "Keratin-booster", 0)],
        ["ketchup", new SyringeLiquid("#ff2b2b", function(ml){  }, 0, "Ketchup", 0)],
        ["lemonade", new SyringeLiquid("#fff761", function(ml){  }, 0, "Lemonade", 0.4)],
        ["lowgradestimulant", new SyringeLiquid("#909090", function(ml){body.addEffect(new Effect("lowgradestimulant", 0, true, ml * 2))}, 0, "Off-brand stimulant", 0)],
        ["lrdserum", new SyringeLiquid("#d4cb87", function(ml){  }, 0, "L.R.D. Serum", 0)],
        ["lumalgae", new SyringeLiquid("#219900", function(ml){  }, 0, "Lumalgae", 1.6)],
        ["mercury", new SyringeLiquid("#4d4d4d", function(ml){  }, 0, "Mercury", 10)],
        ["midgradestimulant", new SyringeLiquid("#d1d1d1", function(ml){body.addEffect(new Effect("midgradestimulant", 0, true, ml * 2))}, 0, "Hard stimulant", 0)],
        ["milk", new SyringeLiquid("#ffffff", function(ml){  }, 0, "Milk", 0.4)],
        ["mindwipe", new SyringeLiquid("#21485e", function(ml){  }, 0, "Mindwipe", 0)],
        ["mold", new SyringeLiquid("#3f4f32", function(ml){  }, 0, "Mold", 3)],
        ["morphine", new SyringeLiquid("#967b5f", function(ml){ body.addEffects([new Effect("GetOrAddComponent<Painkillers>().opiateAmount", ml * 0.01 * 90)]) }, 0, "Morphine", 0)],
        ["naltrexone", new SyringeLiquid("#ffffff", function(ml){  }, 0, "Naltrexone", 0)],
        ["oil", new SyringeLiquid("#473215", function(ml){  }, 0, "Oil", 5)],
        ["oliveoil", new SyringeLiquid("#818707", function(ml){  }, 0, "Olive oil", 1)],
        ["opium", new SyringeLiquid("#ffeb51", function(ml){ body.addEffects([new Effect("GetOrAddComponent<Painkillers>().opiateAmount", ml * 0.01 * 40)]) }, 0, "Opium", 0)],
        ["orangejuice", new SyringeLiquid("#ff8929", function(ml){  }, 0, "Orange juice", 0.4)],
        ["oxyline", new SyringeLiquid("#4dffde", function(ml){}, 0, "Oxyline", 0)],
        ["painkillers", new SyringeLiquid("#ffffff", function(ml){  }, 0, "Painkillers", 0)],
        ["powderedmilk", new SyringeLiquid("#f2f2f2", function(ml){  }, 0, "Powdered milk", 1)],
        ["producejuice", new SyringeLiquid("#fffeb5", function(ml){  }, 0, "Produce juice", 0.9)],
        ["radwater", new SyringeLiquid("#79e0dd", function(ml){  }, 0, "Clean water", 0.2)],
        ["redblood", new SyringeLiquid("#c70a0a", function(ml){ body.addEffects([new Effect("bloodVolume", 30 * ml / 750), new Effect("sicknessAmount", 50 * ml / 750), new Effect("septicShock", 40 * ml / 750)]) }, 0, "Red blood", 0)],
        ["refinedjuice", new SyringeLiquid("#ffe173", function(ml){  }, 0, "Refined juice", 0.7)],
        ["reliefcream", new SyringeLiquid("#bd5bc9", function(ml){}, 0, "Relief cream", 0.75)],
        ["ringersolution", new SyringeLiquid("#ededed", function(ml){ body.addEffects([new Effect("bloodVolume", 35 * ml / 700), new Effect("bloodViscosity", -40 * ml / 700), new Effect("thirst", 60 * ml / 700)]) }, 0, "Ringer's solution", 0)],
        ["saline", new SyringeLiquid("#c4c4c4", function(ml){ body.addEffects([new Effect("bloodVolume", 40 * ml / 750), new Effect("bloodViscosity", -50 * ml / 750), new Effect("thirst", 70 * ml / 750)]) }, 0, "Saline", 0)],
        ["sap", new SyringeLiquid("#f7bd34", function(ml){  }, 0, "Tree sap", 2)],
        ["sleepingpills", new SyringeLiquid("#8ca893", function(ml){  }, 0, "Sleeping pills", 0)],
        ["soap", new SyringeLiquid("#a1ffba", function(ml){ }, 0, "Soap", 1.6)],
        ["soda", new SyringeLiquid("#705e49", function(ml){  }, 0, "Soda", 0.6)],
        ["sodiumnitroprusside", new SyringeLiquid("#cf5829", function(ml){ body.addEffects([new Effect("bloodPressureChangeFromMedicine", ml / 20 * 120)]) }, 0, "Sodium nitroprusside", 0)],
        ["soup", new SyringeLiquid("#7d5100", function(ml){  }, 0, "Soup", 0.6)],
        ["sportsdrink", new SyringeLiquid("#0a3bff", function(ml){  }, 0, "Sports drink", 0.4)],
        ["streptokinase", new SyringeLiquid("#427e82", function(ml){ body.addEffects([new Effect("bloodViscosity", -50 * ml / 33.334), new Effect("sicknessAmount", 5 * ml / 33.334)]) }, 0, "Streptokinase", 0)],
        ["procoagulant", new SyringeLiquid("#bd5660", function(ml){body.addEffects([new Effect("internalBleeding", 0, true, 12 * ml / 33.34), new Effect("bloodViscosity", 1.75, true, 12 * ml / 33.34), new Effect("strokeAmount", -10, true, 12 * ml / 33.34), new Effect("bleedAmount", 0, true, 12 * ml / 33.34)]); body.effects["internalBleeding"].desc = "*= 0.95"; body.effects["bleedAmount"].desc = "*= 0.96"}, 0, "Procoagulant", 0)],
        ["urine", new SyringeLiquid("#ffda54", function(ml){  }, 0, "Lemonade", 2)],
        ["vasopressin", new SyringeLiquid("#ffffff", function(ml){ body.addEffects([new Effect("bloodPressureChangeFromMedicine", -ml / 20 * 120)]) }, 0, "Vasopressin", 0)],
        ["water", new SyringeLiquid("#75d1ff", function(ml){  }, 0, "Water", 0)],
        ["woundglue", new SyringeLiquid("#c9c9c9", function(ml){ }, 0, "Wound glue", 0.75)],
        ["yogurt", new SyringeLiquid("#d5ebf0", function(ml){  }, 0, "Yogurt", 1)]
    ]);

    class Effect {
        constructor(name, value, timed = false, duration = 0) {
            this.name = name;
            this.value = value;
            this.timed = timed;
            this.duration = duration;
            this.desc = ""; // for the doTimedOp and if() conditions.
        }
    }


    class Body {
        constructor(){
            this.effects = {};
        }

        addEffect(effect, timed=false) {
            if(this.effects[effect.name]) {
                if(timed) {
                    this.effects[effect.name].duration += effect.duration; // doTimedOp's duration. Example - stimulants
                } else {
                    this.effects[effect.name].value += effect.value; // general value. Example - biochem
                }
            } else {
                this.effects[effect.name] = effect;
                return;
            }

        }

        addEffects(effects) {
            effects.forEach(effect => {
                this.addEffect(effect, effect.timed);
            });
        }
    }


    class Rect {
		constructor(x, y, width, height) {
            this.x = x;
            this.y = y;
            this.fixedX = x;

            this.width = width;
            this.height = height;
            this.imageRotation = 0;
        }
        calcOffset(mouse) {
            if("x" in mouse) {
                return {x: this.x - mouse.x, y: this.y - mouse.y};
            } return {x: this.x - mouse.handPos.x, y: this.y - mouse.handPos.y};
        }

    }


    class SyringeContainer {
        constructor(liquids=[], volume=0) {
            this.volume = volume;
            this.liquids = liquids;
        }

        calculateDrain(amount) { // Unity: public List<float> CalculateDrain(float amount)
            let currentTotal = this.calculateTotal();
            
            if(currentTotal <= 0 || amount == 0) {
                return [];
            }

            let num = Math.min(amount, currentTotal);
            let list = [];

            for(let i = 0; i < this.liquids.length; i++) {
                list[i] = this.liquids[i].fillAmount * (num / currentTotal);
            }

            return list;
        }

        Drain(toRemove) {
            if(toRemove.length == this.liquids.length) {
                for(let i = 0; i < this.liquids.length; i++)
                    this.liquids[i].fillAmount -= toRemove[i];

                let newLiquidList = [];
                for(const liquid of this.liquids) {
                    if(liquid.fillAmount >= 0.5) 
                        newLiquidList.push(liquid);
                }

                this.liquids = newLiquidList;
            }
        }

        Inject(amount) {
            let list = this.calculateDrain(amount);
            if(list.length == 0) 
                return;
            for(let i = 0; i < list.length; i++) {
                if(this.liquids[i].injectionSickness) {
                    body.addEffects([new Effect("sicknessAmount", this.liquids[i].injectionSickness * 0.35 * list[i]), new Effect("bloodViscosity", this.liquids[i].injectionSickness * 0.1)]);
                }

                this.liquids[i].onUse(list[i]); 
            }

            this.Drain(list);
        }

        addLiquid(toAdd, amount = 0) {
            let currentTotal = this.calculateTotal();

            if(currentTotal >= this.volume)
                return;

            let toFill = Math.min(amount, this.volume - currentTotal);
            for(let i = 0; i < this.liquids.length; i++){
                if(this.liquids[i].name == toAdd.name) {
                    this.liquids[i].fillAmount += toFill;
                    return;
                }
            }
            this.liquids.push(new SyringeLiquid(toAdd.clr, toAdd.onUse, toFill, toAdd.name, toAdd.injectionSickness)); 
            minigame.syringe.recalculateColor(); // Todo: fact-check with LiquidStack.cs
        }

        calculateTotal() {
            let currentTotal = 0;
            this.liquids.forEach(liquid => {
                currentTotal += liquid.fillAmount;
            });
            return currentTotal;
        }
    }


    class SyringeComposer {

        /**
         * rect: Rect; Collision checks, rendering coordinates
         * storage: SyringeContainer; checks for buoyancy and liquid handling
         * storage.liquids: Array<SyringeLiquid>; handles effects from liquids, amounts of liquids inside a syringe, color of said liquids
         * */ 

        constructor(liquids=[], volume=0) {
            this.rect = new Rect(0, 0, syringeMinigameImage.width * SCALE, syringeMinigameImage.height * SCALE);
            this.storage = new SyringeContainer(liquids, volume);
            this._condition = 0;
            this.averageColor = "#ffffff";
            if(liquids != [] && volume) {
                if(liquids.length == 1) {
                    this.averageColor = liquids[0].clr;
                } else {
                    for(const liquid of liquids) {
                        this.averageColor = liquid != liquids[0] ? colorLerp(this.averageColor, liquid.clr, (liquid.fillAmount / volume) * 0.5) : liquid.clr;
                    }
                }
            }  
        }

        recalculateColor() {
            this.averageColor = "#ffffff";
            let liquids = this.storage.liquids;
            let volume = this.storage.volume;
            if(liquids != [] && volume) {
                if(liquids.length == 1) {
                    this.averageColor = liquids[0].clr;
                } else {
                    for(const liquid of liquids) {
                        this.averageColor = liquid != liquids[0] ? colorLerp(this.averageColor, liquid.clr, (liquid.fillAmount / volume) * 0.5) : liquid.clr;
                    }
                }
            }   
        }
        get condition() {
            this._condition = this.storage.calculateTotal() / this.storage.volume;
            return this._condition;
        }
        
    }


    class SyringeMinigame {
        constructor(hand, mouse) {
            this.syringe = null;
            this.attachedHand = hand;
            this.attachedMouse = mouse;
            this.holdingSyringe = false;
            this.wasInjectingBefore = false;
            this.isNeedleSnapped = false;
        }

        initState(syringe) {
            this.syringe = syringe;
            this.syringe.recalculateColor();
            this.holdingSyringe = false;
            this.isNeedleSnapped = false; 
            body = new Body();
        }

        Update(delta) {
            if(this.isNeedleSnapped)
                return;
            if(this.attachedMouse.justClicked) { // Todo: check for attachedHand instead of attachedMouse
                if(!this.holdingSyringe && inRange(this.attachedMouse.x, this.syringe.rect.x - this.syringe.rect.width / 2, this.syringe.rect.x + this.syringe.rect.width / 2) && inRange(this.attachedMouse.y, this.syringe.rect.y, this.syringe.rect.y + this.syringe.rect.height)) {
                    this.holdingSyringe = true;
                    heldOffset = this.syringe.rect.calcOffset(this.attachedHand);
                }
            }
            if(this.holdingSyringe) {
                this.syringe.rect.x = this.attachedHand.handPos.x + heldOffset.x;
                this.syringe.rect.y = this.attachedHand.handPos.y + heldOffset.y;

                if(this.syringe.rect.y < -219) {
                    if(!this.syringe.rect.fixedX) {
                        this.syringe.rect.fixedX = this.syringe.rect.x;
                    }
                    this.syringe.rect.x = this.syringe.rect.fixedX;

                    let syringeXOffset = this.syringe.rect.fixedX - heldOffset.x - this.attachedHand.handPos.x;
                    this.syringe.rect.imageRotation = -Math.atan2(syringeXOffset, this.syringe.rect.height);
                    if(Math.abs(syringeXOffset) > 80) {
                        bulletHit.play();
                        this.isNeedleSnapped = true;
                        return;
                    } if(!this.wasInjectingBefore) {
                        this.wasInjectingBefore = true;
                        syringeUse = new Audio(syringeUseURL);
                        syringeUse.play();
                    } if(this.syringe.condition > 0.001) {
                        let injectionSpeed = (this.syringe.rect.y - (-219)) / (-345 - (-219)); // remap

                        syringeLoop.volume.value = - 12 + clamp01(injectionSpeed) * 12;
                        this.syringe.storage.Inject(injectionSpeed * delta * 100);
                    } else {
                        syringeLoop.volume.value = -Infinity;
                    }
                } else {
                    this.syringe.rect.fixedX = 0;
                    if(this.wasInjectingBefore)
                        this.wasInjectingBefore = false;
                    syringeLoop.volume.value = -Infinity;

                    this.syringe.rect.imageRotation *= delta * 50; // override, delta * 4 in-game
                    if(Math.abs(this.syringe.rect.imageRotation) < 1e-5)
                        this.syringe.rect.imageRotation = 0;
                } if(this.syringe.rect.y < -345) {
                    this.syringe.rect.y = -345;
                    this.syringe.rect.x = this.syringe.rect.fixedX;
                    
                    this.attachedHand.handPos.y = this.syringe.rect.y - heldOffset.y;
                    if(this.attachedHand.handVelocity.y < 0)
                        this.attachedHand.handVelocity.y = 0;
                }
            } else
                syringeLoop.volume.value = -Infinity;

            syringeLoop.playbackRate = 1.6 - (this.syringe.condition);
            if(minigame.attachedMouse.clicked)
                return;
            this.holdingSyringe = false;
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
            mouse.x = pos.x - canvas.width / 2;
            mouse.y = -1 * (pos.y - canvas.height / 2);
        });

        canvas.addEventListener("pointerdown", async function (e) {
            mouse.clicked = true;
            mouse.justClicked = true;
            if(Tone.context.state != "running" && !isToneInited){
                isToneInited = true;
                await Tone.start();
                syringeLoop.start();
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
        ctx.drawImage(syringeGroundImage, -syringeGroundImage.width * SCALE, 219, syringeGroundImage.width * SCALE * 2, syringeGroundImage.height * SCALE * 2);
    }

    function drawSyringeImage(ctx, canvas) {
        ctx.save();    
        
        ctx.translate(minigame.syringe.rect.x, -minigame.syringe.rect.y);
        ctx.rotate(minigame.syringe.rect.imageRotation);

        ctx.fillStyle = minigame.syringe.averageColor;
        ctx.fillRect(-minigame.syringe.rect.width / 2 + 12, -126 - 36, minigame.syringe.rect.width - 24, -(minigame.syringe.condition) * 78 * SCALE);
        ctx.drawImage(syringeMinigameImage,
                    - minigame.syringe.rect.width / 2,
                    - minigame.syringe.rect.height,
                      minigame.syringe.rect.width,
                      minigame.syringe.rect.height
                    );

        ctx.restore();
    }

    function drawItemInfo(ctx, canvas) {
        ctx.save();
        ctx.translate(-canvas.width / 2, -canvas.height / 2);

        let x = 150;

        let textContent = ""

        ctx.font = '14px "Retro Gaming"';
        ctx.textAlign = "left";
        ctx.fillStyle = "#fff";
        if(characterStats.int < 4) {
            ctx.fillText("Something...", x, 96);
            return;
        }

        switch(minigame.syringe.storage.volume){
            case 100:
                textContent = "Syringe"; 
                break;
            case 150:
                textContent = "Heroin syringe";
                break;
            case 750:
                textContent = "IV bag";
                break;
        }

        ctx.fillText(textContent + "(", x, 96);
        x += ctx.measureText(textContent + "(").width;

        let perc = minigame.syringe.condition * 100;
        ctx.fillStyle = conditionToGradient(perc);
        ctx.fillText((perc < 1 && perc > 0.01 ? "<1" : perc.toFixed(0)) + "%", x, 96);
        x += ctx.measureText((perc < 1 && perc > 0.01 ? "<1" : perc.toFixed(0)) + "%").width;
        ctx.fillStyle = "#fff";
        ctx.fillText(")", x, 96);

        switch(minigame.syringe.storage.volume){
            case 100:
                ctx.drawImage(syringeImage, 132, 78, syringeImage.width * 2, syringeImage.height * 2);
                break;
            case 150:
                ctx.drawImage(syringeImage150, 132, 78, syringeImage150.width * 2, syringeImage150.height * 2);
                break;
            case 750:
                ctx.drawImage(syringeImage750, 132, 78, syringeImage750.width * 2, syringeImage750.height * 2);
                break;
        }
        ctx.restore();
    }

    function drawAll(ctx, canvas) {
        ctx.clearRect(-canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
        drawSyringeImage(ctx, canvas);
        drawBase(ctx, canvas);
        drawItemInfo(ctx, canvas);

        hand.handPos.y *= -1;
        hand.drawHandUpper(ctx, mouse.clicked ? handClickImage : handIdleImage, -70);
        hand.handPos.y *= -1;
    }


    // liquid controls
    function createLiquidRow(name) {
        if(!liquidControlIsEnabled)
            return;
        liquidsToAdd.forEach(liquid => {
            if(liquid == name) {
                return;
            }
        });
        // liquid card div
        let liquidCard = document.createElement("div");
        liquidCard.id = ("lc--" + name);
        liquidCard.className = "cu-canvas-panel";
        liquidCard.style = "flex-direction: row; gap: 2em";

        // color stripe on left side of the card
        let liquidCardColorTooltip = document.createElement("div");
        liquidCardColorTooltip.className = "cu-canvas-liquid-color";
        liquidCardColorTooltip.style = `background-color: ${liquids.get(name).clr}; height: 3em; width: 0.5em`;

        // name tooltip
        let liquidCardNameLabel = document.createElement("p");
        liquidCardNameLabel.innerHTML = liquids.get(name).name;

        // liquid help page
        let liquidCardInfoLink = document.createElement("a");
        liquidCardInfoLink.href = `/${liquids.get(name).name} (liquid)`;
        liquidCardInfoLink.innerHTML = "[?]";
        liquidCardInfoLink.style.paddingLeft = "-1em";

        // liquid card fill amount slider
        let liquidCardInput = document.createElement("input");
        liquidCardInput.type = "range";
        liquidCardInput.className = "liquid-control__add-input";
        liquidCardInput.id = `${liquidsToAdd.length}-update`;
        liquidCardInput.min = "0";
        liquidCardInput.max = minigame ? minigame.syringe.storage.volume : "100";
        liquidCardInput.value = liquidsToAddAmounts[liquidsToAdd.indexOf(name)];
        liquidCardInput.step = 1;

        // "output" for the slider
        let label = document.createElement("p");
        label.id = 'll-slider';
        label.innerHTML = liquidsToAddAmounts[liquidsToAdd.indexOf(name)] + "mL";

        // deleter button
        let btn = document.createElement("button");
        btn.className = "ll-btn";
        btn.innerHTML = "-";
        btn.type="button";
        btn.setAttribute("data-cu-action", "pop-liquid");
        btn.id = name;

        liquidCard.append(liquidCardColorTooltip, liquidCardNameLabel, liquidCardInfoLink, liquidCardInput, label, btn);
        document.getElementsByClassName("liquid-control-cards")[0].append(liquidCard);
    }

    function removeLiquidRow(name) {
        if(!document.getElementById("lc--" + name))
            return;
        document.getElementById("lc--" + name).remove();
    }

    function handleSlider(e) {
        const slider = e.target.closest('input[type="range"]');
        const label = slider.closest(".cu-canvas-panel").querySelector('#ll-slider');
        label.textContent = e.target.value + "mL";
        liquidsToAddAmounts[liquidsToAdd.indexOf(slider.closest(".cu-canvas-panel").querySelector(".ll-btn").id)] = parseFloat(e.target.value);
    }
    
    function createLiquidControlList() {
        if(!liquidControlEl)
            return;
        if(!liquidControlIsEnabled) {
            liquidControlEl.removeEventListener('input', e => {handleSlider(e)});
            liquidControlEl.innerHTML = "";
            return;
        }

        let liquidNames = Array.from(liquids.keys());

        let tableHeader = document.createElement("div");
        tableHeader.style = "background: black; height: 2.25em; border: 2px solid white; display: flex; justify-content: center";

        let tableHeaderText = document.createElement("header");
        tableHeaderText.style = "color: yellow; font-size: 1.05em; height: 4em";
        tableHeaderText.textContent = "Liquids";
        tableHeader.append(tableHeaderText);

        liquidControlEl.append(tableHeader);

        let buttonList = document.createElement("div");
        buttonList.className = "liquid-control-liquidlist";
        buttonList.style = "fill: transparent; border: 2px solid white; margin: -2px 0 0.25em 0";
        liquidControlEl.append(buttonList);

        for(let i = 0; i < liquidNames.length; i++) {
            let button = document.createElement("button");
            button.style.border = "2px solid transparent";
            liquidsToAdd.forEach(liquid => {
                if(liquid == liquidNames[i]) {
                     button.style.border = "2px solid yellow";
                }
            });
            button.className = "button-small";
            button.setAttribute("data-cu-action", "spawn-liquid-html");
            button.id = liquidNames[i];

            let text = document.createElement("p");
            text.style = `color:${liquids.get(liquidNames[i]).clr}`;
            text.textContent = liquids.get(liquidNames[i]).name;

            button.append(text);
            buttonList.append(button);
        }
        liquidControlEl.innerHTML += '<div class="cu-canvas-panel-row">' +
        '<button type="button" data-cu-action="pour-liquids">Add liquids to the syringe</button>' +
        '<button type="button" data-cu-action="clear-liquids">Clear liquid list</button></div>';
        liquidControlEl.innerHTML += '</div><div class="liquid-control-cards">';
        if(liquidsToAdd.length) {
            liquidsToAdd.forEach(liquid => {
                createLiquidRow(liquid);
            });
        }

        liquidControlEl.addEventListener('input', e => {handleSlider(e)});
    }

    // other functions
    function writeStats() {
		if (!hiddenStatsEl)
			return;
        if(minigame.isNeedleSnapped) {
            hiddenStatsEl.innerHTML =
            "<dl><div>" +
            "<dt>You snapped a needle!</dt>"+
            "<dt>Click on 'Restart minigame'</dt>" +
            "<dt>to restart...</dt>" + 
            "</div></dl>";
        } else {
            if(body.effects.length != 0 && showHidden) {
                hiddenStatsEl.innerHTML = "<dl><div>";
                for(let key in body.effects) {
                    if(body.effects.hasOwnProperty(key)) {
                        hiddenStatsEl.innerHTML += `<dt>${body.effects[key].name}: ${body.effects[key].value != 0 ? "Amount: " + body.effects[key].value.toFixed(4) + "; " : ""} ${body.effects[key].timed ? "Duration: " + body.effects[key].duration.toFixed(4) + "; " : ""} ${body.effects[key].desc ? "Additional info: " + body.effects[key].desc : ""}</dt>`;
                    }
                }
                hiddenStatsEl.innerHTML += "</div></dl>";
            } else {
                hiddenStatsEl.innerHTML = "<dl><div></div></dl>";
            }
        }
        
    }

    function createControlPanel(el) {
		if (el.querySelector(".cu-canvas-panel"))
			return;
		
		el.classList.add("cu-canvas--syringe");
		
		var panel = document.createElement("div");
		panel.className = "cu-canvas-panel";
		panel.innerHTML = // 100, 150, 750
            '<div class="cu-canvas-panel-row">' +
			'<button type="button" data-cu-action="restart">Restart minigame</button>' +
            '<button type="button" data-cu-action="show-hidden">Show hidden info</button>' + 
            '<button type="button" data-cu-action="add-liquids">Add liquids</button>' +
            '<button type="button" data-cu-action="100">100mL</button>' +
            '<button type="button" data-cu-action="150">150mL</button>' +
            '<button type="button" data-cu-action="750">750mL</button>' +
            '</div>' +
			'<div class="cu-canvas-hidden-stats"></div>' + 
            '<div class="cu-canvas-input-liquids"></div>';
		hiddenStatsEl = panel.querySelector(".cu-canvas-hidden-stats");
        liquidControlEl = panel.querySelector(".cu-canvas-input-liquids");

        
		panel.addEventListener("click", async function (e) {
			var btn = e.target.closest("[data-cu-action]");
			if (!btn)
				return;
			switch (btn.dataset.cuAction) {
				case "restart":
					minigame.initState(new SyringeComposer([], minigame.syringe.storage.volume));
                    minigame.syringe.recalculateColor();
					break;
                case "show-hidden":
                    showHidden = !showHidden;
                    break;
                case "add-liquids":
                    liquidControlIsEnabled = !liquidControlIsEnabled;
                    createLiquidControlList();
                    break;
                case "100":
                    liquidControlIsEnabled = false;
                    createLiquidControlList();
                    minigame.initState(new SyringeComposer([], 100));
                    minigame.syringe.recalculateColor();
                    break;
                case "150":
                    liquidControlIsEnabled = false;
                    createLiquidControlList();
                    minigame.initState(new SyringeComposer([], 150));
                    minigame.syringe.recalculateColor();
                    break;
                case "750":
                    liquidControlIsEnabled = false;
                    createLiquidControlList();
                    minigame.initState(new SyringeComposer([], 750));
                    minigame.syringe.recalculateColor();
                    break;
                case "spawn-liquid-html":
                    if(!liquidControlIsEnabled)
                        break;
                    let f = false;
                    liquidsToAdd.forEach(liquid => {
                        if(liquid == btn.id) {
                            liquidsToAdd.splice(liquidsToAdd.indexOf(btn.id), 1);
                            liquidsToAddAmounts.splice(liquidsToAddAmounts.indexOf(btn.id), 1);
                            removeLiquidRow(btn.id);
                            f = true;
                            btn.style.border = "2px solid transparent";
                        }
                    });
                    if(!f) {
                        btn.style.border = "2px solid yellow";
                        liquidsToAdd.push(btn.id);
                        liquidsToAddAmounts.push(0);
                        createLiquidRow(btn.id);
                    }
                    break;
                case "pop-liquid":
                    liquidsToAdd.splice(liquidsToAdd.indexOf(btn.id), 1);
                    liquidsToAddAmounts.splice(liquidsToAddAmounts.indexOf(btn.id), 1);
                    removeLiquidRow(btn.id);

                    liquidControlEl.querySelector(`#${btn.id}`).style.border = "2px solid transparent";
                    break;
                case "pour-liquids":
                    for(let i = 0; i < liquidsToAdd.length; i++) {
                        minigame.syringe.storage.addLiquid(liquids.get(liquidsToAdd[i]), liquidsToAddAmounts[i]);
                    }
                    while(liquidsToAdd.length) {
                        removeLiquidRow(liquidsToAdd[liquidsToAdd.length - 1]);
                        liquidControlEl.querySelector(`#${liquidsToAdd[liquidsToAdd.length - 1]}`).style.border = "2px solid transparent";
                        liquidsToAdd.pop();
                        liquidsToAddAmounts.pop();
                    }
                    // just in case
                    liquidsToAdd = [];
                    liquidsToAddAmounts = [];
                    break;
                case "clear-liquids":
                    while(liquidsToAdd.length) {
                        removeLiquidRow(liquidsToAdd[liquidsToAdd.length - 1]);
                        liquidControlEl.querySelector(`#${liquidsToAdd[liquidsToAdd.length - 1]}`).style.border = "2px solid transparent";
                        liquidsToAdd.pop();
                        liquidsToAddAmounts.pop();
                    }
                    // just in case
                    liquidsToAdd = [];
                    liquidsToAddAmounts = [];
                    break;
			}
		});
		
		el.appendChild(panel);
	}

    function tickAction(delta) {
        minigame.Update(delta);
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
            if(mouse.justClicked)
                mouse.justClicked = false;
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

     async function startSyringe(canvas, ctx, cfg, el) {
		await loadRetroFont();
		console.log("startSyringe retro font is ready:", document.fonts.check('42px "Retro Gaming"'));
		await addScript('/wiki/MediaWiki:Gadget-utils-Tone.js?action=raw&ctype=text/javascript');

		canvas.width = WIDTH * SCALE;
		canvas.height = HEIGHT * SCALE;   

        ctx.translate(canvas.width / 2, canvas.height / 2);
		ctx.imageSmoothingEnabled = false;

        hand = new handClass();
		hand.handPos = { x: canvas.width / 2, y: canvas.height / 2 };

        mouse = { x: 0, y: 0, clicked: false, justClicked: false };
        body = new Body();
		
		handIdleImage = await loadImage(handType.idle);
		handClickImage = await loadImage(handType.click);

        syringeGroundImage = await loadImage(syringeGroundImageURL);
        syringeMinigameImage = await loadImage(syringeMinigameImageURL);

        syringeImage = await loadImage(syringeImageURL);
        syringeImage150 = await loadImage(syringeImage150URL);
        syringeImage750 = await loadImage(syringeImage750URL);        

        syringeLoop = new Tone.Player(syringeLoopURL).toDestination();
        syringeLoop.volume.value = -Infinity;
        syringeLoop.loop = true;

        bulletHit = new Audio(bulletHitURL);

        createControlPanel(el);
		bindInput(canvas);

        minigame = new SyringeMinigame(hand, mouse);
        minigame.initState(new SyringeComposer([], 100));
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

    window.CUCanvas.register("syringe", function (canvas, ctx, cfg, el) {
            startSyringe(canvas, ctx, cfg, el).catch(function (err) {
                console.error("syringe failed:", err);
            });
        });
})();