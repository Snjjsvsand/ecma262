import { FunctionObject, call, instantiateFunctionObject } from "../Closure Comprehension/Function Object"
import { Get, makeBasicObject } from "./OperationsOnObjects"
import { PropertyAttributes } from "./PropertyAttributes"

type PropertyDescriptor = PropertyAttributes
type PropertyKey = string | number | symbol

export class OrdinaryObject {
    ['[[Prototype]]']: OrdinaryObject | null
    ['[[Extensible]]']: Boolean

    GetPrototypeOf() {
        return ordinaryGetPrototypeOf(this)
    }

    SetPrototypeOf(v: OrdinaryObject | null) {
        return ordinarySetPrototypeOf(this , v)
    }

    IsExtensible() {
        return ordinaryIsExtensible(this)
    }

    PreventExtensions() {
        return ordinaryPreventExtensions(this)
    }

    GetOwnProperty(p: PropertyKey) {
        return ordinaryGetOwnProperty(this , p)
    }

    DefineOwnProperty(p: PropertyKey , decs: PropertyDescriptor) {
        ordinaryDefineOwnProperty(this , p , decs)
    }

    HasProperty(p: PropertyKey) {
        return ordinaryHasProperty(this , p)
    }

    Get(p: PropertyKey , receiver) {
        return ordinaryGet(this , p , receiver)
    }

    Set(p: PropertyKey , v: any , receiver) {
        return ordinarySet(this , p , v , receiver)
    }

    Delete(p: PropertyKey) {
        return ordinaryDelete(this , p)
    }

    OwnPropertyKeys() {
        return ordinaryOwnPropertyKeys(this)
    }
}

function ordinaryGetPrototypeOf(o: OrdinaryObject) {
    return o["[[Prototype]]"]
}

function ordinarySetPrototypeOf(o: OrdinaryObject , v: OrdinaryObject | null) {
    let current = o["[[Prototype]]"]
    if(current === v) return true
    if(!o["[[Extensible]]"]) return false

    let p = v
    let done = false

    while(!done) {
        if(p === null) done = true
        else if(p === o) return false
        else {
            if(!(o.GetPrototypeOf(p) instanceof OrdinaryObject)) done = true
            else p = p["[[Prototype]]"]
        }
    }
    
    o["[[Prototype]]"] = v

    return true
}

function ordinaryIsExtensible(o: OrdinaryObject) {
    return o['[[Extensible]]']
}

function ordinaryPreventExtensions(o: OrdinaryObject) {
    o["[[Extensible]]"] = false
    return true
}

function ordinaryGetOwnProperty(o: OrdinaryObject , p: PropertyKey) {
    if(!o.hasOwnProperty(p)) return undefined
    // omit difference about data property and accessor property
    return Object.getOwnPropertyDescriptor(o , p)
}

function ordinaryDefineOwnProperty(o: OrdinaryObject , p: PropertyKey , desc: PropertyDescriptor | any) {
    // omit
    Object.defineProperty(o , p , desc)
}

function ordinaryHasProperty(o: OrdinaryObject , p: PropertyKey) {
    if(o.GetOwnProperty(p)) return true

    let parent = o.GetPrototypeOf()
    if(parent !== null) return parent.HasProperty(p)

    return false
}

function ordinaryGet(o: OrdinaryObject , p: PropertyKey , receiver: any) {
    let desc = o.GetOwnProperty(p)
    
    if(desc === undefined) {
        let parent = o.GetPrototypeOf()
        if(parent === null) return undefined
        
        // Receiver is always the thing that invocated Get operation.
        return parent.Get(p , receiver)
    }

    if(desc.value !== undefined || desc.writable) return desc.value

    let getter 

    if(desc.get || desc.set) getter = desc.get
    if(getter === undefined) return undefined

    return call(desc.get , receiver)
}

function ordinarySet(o: OrdinaryObject , p: PropertyKey , v: any , receiver) {
    let ownDesc = o.GetOwnProperty(p)
    ordinarySetWithOwnDescriptor(o , p , v , receiver , ownDesc)
}

function isDataDescriptor(desc: globalThis.PropertyDescriptor) {
    if(desc === undefined) return false
    if(desc.hasOwnProperty('value')) return true
    if(desc.hasOwnProperty('writable')) return true
    return false
}

function isAccessorDescriptor(desc: globalThis.PropertyDescriptor) {
    if(desc === undefined) return false
    if(desc.hasOwnProperty('get')) return true
    if(desc.hasOwnProperty('set')) return true
    return false
}

function ordinarySetWithOwnDescriptor(o: OrdinaryObject , p: PropertyKey , v , receiver , ownDesc?: globalThis.PropertyDescriptor) {
    if(ownDesc === undefined) {
        let parent = o.GetPrototypeOf()
        if(parent !== null) return parent.Set(p , v, receiver)
        else {
            ownDesc = {
                value: undefined,
                writable: true,
                enumerable: true,
                configurable: true
            }
        }
    }
    // Data Descriptor
    if(isDataDescriptor(ownDesc)) {
        if(!ownDesc.writable) return false
        if(typeof receiver !== 'object') return false

        let existingDescriptor = receiver.GetOwnProperty(p)
        if(existingDescriptor !== undefined) {
            if(isAccessorDescriptor(existingDescriptor)) return false
            if(!existingDescriptor.writable) return false

            let valueDesc = {value: v}
            return receiver.DefineOwnProperty(p , valueDesc)
        }else {
            return receiver.DefineOwnProperty(p , {
                value: v,
                writable: true,
                enumerable: true,
                configurable: true
            })
        }
    }

    // AccessorDescriptor
    let setter = ownDesc.set
    if(setter === undefined) return false
    call(setter , receiver , [v])
    
    return true
}

function ordinaryDelete(o: OrdinaryObject , p: PropertyKey) {
    let desc = o.GetOwnProperty(p)
    if(desc === undefined) return true
    if(desc.configurable) {
        delete o[p]
        return true 
    }
    return false
}

function ordinaryOwnPropertyKeys(o: OrdinaryObject) {
    const keys: PropertyKey[] = []
    for(let k in ['array index' , 'string'  , 'symbol']) keys.push(k)
    return keys
}


export function ordinaryObjectCreate(proto , additionalInternalSlotsList?): OrdinaryObject & any {
    let internalSlotsList = ['[[Prototype]]' , '[[Extensible]]']
    if(additionalInternalSlotsList) internalSlotsList.push(...additionalInternalSlotsList)
    let o = makeBasicObject(internalSlotsList)
    o['[[Prototype]]'] = proto
    return o
}

function getPrototypeFromConstructor(constructor: FunctionObject , intrinsicDefaultProto: string) {
    // Assert: intrinsicDefaultProto is this specification's name of an intrinsic object. The corresponding object must be an intrinsic that is intended to be used as the [[Prototype]] value of an object.
    let proto = Get(constructor , 'prototype')
    if(typeof proto !== 'object') {
        proto = constructor.realm[intrinsicDefaultProto]
    }
    return proto
}


export function ordinaryCreateFromConstructor(constructor: FunctionObject , intrinsicDefaultProto: string , internalSlotsList?) {
    // Assert: intrinsicDefaultProto is this specification's name of an intrinsic object. The corresponding object must be an intrinsic that is intended to be used as the [[Prototype]] value of an object.
    let proto = getPrototypeFromConstructor(constructor , intrinsicDefaultProto)
    let slotsList = []
    if(internalSlotsList) slotsList = internalSlotsList
    return ordinaryObjectCreate(proto , slotsList)
}



