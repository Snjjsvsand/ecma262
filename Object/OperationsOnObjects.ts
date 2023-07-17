import { OrdinaryObject } from "./OrdinaryObject";

type ExoticObject = any
type Object = OrdinaryObject | ExoticObject

export function makeBasicObject(internalSlotsList): Object {
    let obj = {}
    // Let obj be a newly created object with an internal slot for each name in internalSlotsList.
    internalSlotsList.forEach(k => obj[k])

    if(internalSlotsList.includes('[[Extensible]]')) obj['[[Extensible]]'] = true
    
    return obj
}

export function Get(o , p) {
    return o.Get(p)
}