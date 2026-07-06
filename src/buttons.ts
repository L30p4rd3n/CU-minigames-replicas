interface Button{
    x: number;
    y: number; 
    width: number;
    height: number;
    output: number;
}

interface Codebox{
    x: number;
    y: number;
    width: number;
    height: number;
    stored_code: string;
}

interface ActiveComponent {
    cx: number;
    cy: number;
    angle: number;
}

export type {Button, Codebox, ActiveComponent}