
export function inherits(constructor: any, superConstructor: any) {
    Object.setPrototypeOf(constructor.prototype, superConstructor.prototype);
    constructor.super_ = superConstructor;
}

export default { inherits };
