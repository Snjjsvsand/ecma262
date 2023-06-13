import { FunctionObject } from "../Closure Comprehension/Function Object"

abstract class EnvironmentRecord {
  outerEnv: EnvironmentRecord | null

  // abstract methods
  abstract hasBinding(n: string): boolean

  abstract createMutableBinding(n: string , d: boolean): void
  abstract createImmutableBinding(n: string , s: boolean): void

  abstract initializeBinding(n: string, v: any): void

  abstract setMutableBinding(n: string , v: any , s: boolean): void
  abstract getBindingValue(n: string , s: boolean): any

  abstract deleteBinding(n: string): boolean

  abstract hasThisBinding(): boolean /* Return whether the Environment establish a 'this' binding. */
  abstract hasSuperBinding(): boolean 
  abstract withBaseObject(): any /* About with statement. */
}

class DeclarativeEnvironmentRecord extends EnvironmentRecord {
  // There isn't a bindingList field in specification , just for ease of understanding.
  bindingList: Record<string , any>

  hasBinding(n: string): boolean {
    return this.bindingList[n] !== undefined
  }

  createMutableBinding(n: string, d: boolean): void {
    // assert this.bindingList[n] === undefined

    this.bindingList[n] = {
      uninitialized: true,
      mayBeDelete: d
    }
  }

  createImmutableBinding(n: string, s: boolean): void {
    // assert this.bindingList[n] === undefined

    this.bindingList[n] = {
      immutable: true,
      unintialized: true,
      strictBinding: s
    }
  }

  initializeBinding(n: string, v: any): void {
    // assert this.bindingList[n] && this.bindingList[n].unintialized === true

    this.bindingList[n].value = v
    this.bindingList.uninitialized = false
    this.bindingList.initialized = true
  }

  setMutableBinding(n: string, v: any, s: boolean): void {
    if(this.bindingList[n] === undefined) {
      if(s) throw new ReferenceError()
      this.createMutableBinding(n , true)
      this.initializeBinding(n , v)
      return 
    }

    if(this.bindingList[n].strictBinding) s = true
    if(this.bindingList[n].uninitialized) throw new ReferenceError()
    else if (!this.bindingList[n].immutable) this.bindingList[n].value = v
    else if(this.bindingList[n].immutable && s) throw new TypeError()
  }

  getBindingValue(n: string, s: boolean) {
    // assert this.bindingList[n] !== undefined

    if(this.bindingList[n].uninitialized) throw new ReferenceError()
    return this.bindingList[n].value
  }

  deleteBinding(n: string) {
    // assert this.bindingList[n] !== undefined
    try {
      this.bindingList[n] = undefined
    } catch (error) {
      return false
    }
    return true
  }

  hasThisBinding() {
    return false  
  }
  hasSuperBinding() {
    return false
  }
  withBaseObject() {
    return undefined
  }
} 

class ObjectEnvironmentRecord extends EnvironmentRecord {
  bindingObject: Object
  isWithStatement: boolean

  hasBinding(n: string): boolean {
    let bindingObject = this.bindingObject
    let foundBinding = bindingObject[n] !== undefined
    if(!foundBinding) return false
    if(!this.isWithStatement) return true

    // handle withStatement case.
    // ... 
    return true
  }

  createMutableBinding(n: string, d: boolean): void {
    let bindingObject = this.bindingObject
    try {
      Object.defineProperty(bindingObject , n , {
        value: undefined,
        writable: true,
        enumerable: true,
        configurable: d
      })
    } catch (error) {
      throw new TypeError()
    }
  }

  createImmutableBinding(n: string, s: boolean): void {
    // The CreateImmutableBinding concrete method of an Object Environment Record is never used within this specification.
  }

  setMutableBinding(n: string, v: any, s: boolean): void {
    let bindingObject = this.bindingObject
    let stillExists = bindingObject[n] !== undefined
    if(!stillExists && s) throw new ReferenceError()

    // stillExists || !stillExists && !s
    try {
      bindingObject[n] = v
    } catch (error) {
      throw new TypeError()
    }
  }

  initializeBinding(n: string, v: any): void {
    this.setMutableBinding(n , v , false)
  }

  getBindingValue(n: string, s: boolean) {
    let bindingObject = this.bindingObject
    let value = bindingObject[n] !== undefined
    if(!value) {
      if(s) throw new ReferenceError()
      return undefined
    }

    return bindingObject[n]
  }

  deleteBinding(n: string) {
    let bindingObject = this.bindingObject
    try {
      delete bindingObject[n]
    } catch (error) {
      return false
    }
    return true
  }

  hasThisBinding() {
    return false  
  }

  hasSuperBinding() {
    return false
  }

  withBaseObject() {
    if(this.isWithStatement) return this.bindingObject
    return undefined
  }
  
}

class GlobalEnvironmentRecord extends EnvironmentRecord {
  outerEnv: null
  objectRecord: ObjectEnvironmentRecord
  declarativeRecord: DeclarativeEnvironmentRecord
  globalThisValue: Object
  varNames: string[]

  hasBinding(n: string) {
    let decRec = this.declarativeRecord
    if(decRec.hasBinding(n)) return true
    let objRec = this.objectRecord
    return objRec.hasBinding(n)
  }

  createMutableBinding(n: string, d: boolean): void {
    let decRec = this.declarativeRecord
    if(decRec.hasBinding(n)) throw new TypeError()
    return decRec.createMutableBinding(n , d)
  }

  createImmutableBinding(n: string, s: boolean): void {
    let decRec = this.declarativeRecord
    if(decRec.hasBinding(n)) throw new TypeError()
    return decRec.createImmutableBinding(n , s)
  }

  initializeBinding(n: string, v: any): void {
    let decRec = this.declarativeRecord
    if(decRec.hasBinding(n)) return decRec.initializeBinding(n , v)

    // Assert: If the binding exists, it must be in the Object Environment Record.
    let objRec = this.objectRecord
    return objRec.initializeBinding(n , v)
  }

  setMutableBinding(n: string, v: any, s: boolean): void {
    let decRec = this.declarativeRecord
    if(decRec.hasBinding(n)) return decRec.setMutableBinding(n , v , s) 

    let objRec = this.objectRecord
    return objRec.setMutableBinding(n , v , s)
  }

  getBindingValue(n: string, s: boolean) {
    let decRec = this.declarativeRecord
    if(decRec.hasBinding(n)) return decRec.getBindingValue(n , s) 

    let objRec = this.objectRecord
    return objRec.getBindingValue(n , s)
  } 

  deleteBinding(n: string): boolean {
    let decRec = this.declarativeRecord
    if(decRec.hasBinding(n)) return decRec.deleteBinding(n) 

    let objRec = this.objectRecord
    let globalObject = objRec.bindingObject
    let existingProp = globalObject.hasOwnProperty(n)

    if(existingProp) {
      let status = objRec.deleteBinding(n)
      if(status && this.varNames.find(e => e === n)) this.varNames = this.varNames.filter(e => e !== n)
      return status
    }

    return true
  }

  hasThisBinding() {
    return true
  }
  hasSuperBinding() {
    return false
  }
  withBaseObject() {
    return undefined
  }

  getThisBinding() {
    return this.globalThisValue
  }

  hasVarDeclaration(n: string) {
    return this.varNames.find(e => e === n) !== undefined
  }

  hasLexicalDeclaration(n: string) {
    return this.declarativeRecord.hasBinding(n)
  }

  hasRestrictedGlobalProperty(n: string) {
    let globalObject = this.objectRecord.bindingObject
    let existingProp = globalObject.hasOwnProperty(n)
    if(!existingProp) return false
    return !globalObject[n].configurable
  }

  canDeclareGlobalVar(n: string) {
    let globalObject = this.objectRecord.bindingObject
    let hasProperty = globalObject.hasOwnProperty(n)
    if(hasProperty) return true

    return !Object.isSealed(globalObject)
  }

  canDeclareGlobalFunction(n: string) {
    let globalObject = this.objectRecord.bindingObject
    let existingProp = globalObject.hasOwnProperty(n)
    if(!existingProp) return !Object.isSealed(globalObject)
    if(globalObject[n].configurable) return true
    // If IsDataDescriptor(existingProp) is true and existingProp has attribute values { [[Writable]]: true, [[Enumerable]]: true }, return true.
    return false    
  }
  
  createGlobalVarBinding(n: string , d: boolean) {
    let globalObject = this.objectRecord.bindingObject
    let hasProperty = globalObject.hasOwnProperty(n)
    let extensible = !Object.isSealed(globalObject)

    if(!hasProperty && extensible) {
      this.objectRecord.createMutableBinding(n , d)
      this.objectRecord.initializeBinding(n , undefined)
    }

    if(this.varNames.find(e => e === n) === undefined) this.varNames.push(n)
  }

  createGlobalFunctionBinding(n: string , v: any , d: boolean) {
    let globalObject = this.objectRecord.bindingObject
    let hasProperty = globalObject.hasOwnProperty(n)
    let desc
    if(!hasProperty || globalObject[n].configurable) {
      desc = {
        value: v,
        writable: true,
        enumable: true,
        configurable: d
      }
    } else desc = { value: v }

    try {
      Object.defineProperty(globalObject , n , desc)
    } catch (error) {
      throw new TypeError()
    }

    if(this.varNames.find(e => e === n) === undefined) this.varNames.push(n)
  }
}

class FunctionEnvironmentRecord extends DeclarativeEnvironmentRecord {
  thisValue: any

  // If the value is lexical, this is an ArrowFunction and does not have a local this value.
  thisBindingStatus: 'lexical' | 'initialized' | 'uninitialized'

  functionObject: FunctionObject
  
  // The field is determined by whether the environment record is created by [[Construct]].
  newTarget: Object | undefined

  bindThisValue(v: any) {
    if(this.thisBindingStatus === 'lexical') return
    if(this.thisBindingStatus === 'initialized' ) throw new ReferenceError()
    
    this.thisValue = v
    this.thisBindingStatus = 'initialized'
  }

  hasThisBinding(): boolean {
    return this.thisBindingStatus !== 'lexical'
  }

  getThisBinding(): any {
    if(this.thisBindingStatus === 'lexical') return 
    if(this.thisBindingStatus === 'uninitialized') throw new ReferenceError()
    return this.thisValue
  }

  hasSuperBinding(): boolean {
    if(this.thisBindingStatus === 'lexical' || this.functionObject.homeObject === undefined) return false
    return true 
  }

  getSuperBase() {
    let home = this.functionObject.homeObject
    if(home === undefined) return undefined
    if(typeof home === 'object' && home !== null) return home.getPrototypeOf()
  }

}

class ModuleEnvironmentRecord extends DeclarativeEnvironmentRecord {
  outerEnv: GlobalEnvironmentRecord
}

class PrivateEnvironmentRecord {
  // ...
}

export {
  EnvironmentRecord,
  DeclarativeEnvironmentRecord,
  ObjectEnvironmentRecord,
  FunctionEnvironmentRecord,
  GlobalEnvironmentRecord,
  ModuleEnvironmentRecord,
  PrivateEnvironmentRecord
}
