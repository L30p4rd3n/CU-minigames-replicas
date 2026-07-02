function inRange(source: number, lowbound: number, highbound: number) : boolean{
    return (lowbound <= source) && (source <= highbound);
}

function randrange(a: number, b: number): number{ // a <= b
    return Math.floor(Math.random() * (Math.floor(b) - Math.floor(a)) + Math.floor(a));
}

export {inRange, randrange};