import { FunctionObject as FunctionObjectSimple } from '../Closure Comprehension/Function Object'
import { FunctionObject } from '../Object/FunctionObject'
import { DeclarativeEnvironmentRecord, EnvironmentRecord, FunctionEnvironmentRecord, GlobalEnvironmentRecord, ObjectEnvironmentRecord, PrivateEnvironmentRecord } from './Environment Records'

class ReferenceRecord {
  constructor(
    public base: EnvironmentRecord | 'unresolvable' | 'base' | any,
    public referenceName: string,
    public strict: boolean,
    public thisValue: any,
  ) { }
}

function getIdentifierReference(env: EnvironmentRecord | null, name: string , strict: boolean) {
  if(env === null) return new ReferenceRecord('unresolvable' , name , strict , null)
  
  let exists = env.hasBinding(name)
  if(exists) return new ReferenceRecord(env , name , strict , null)

  return getIdentifierReference(env.outerEnv , name , strict)
}

function newDeclarativeEnvironment(e: EnvironmentRecord | null) { 
  let env = new DeclarativeEnvironmentRecord()
  env.outerEnv = e

  return env
}

function newObjectEnvironment(o: Object , w: boolean , e: EnvironmentRecord | null) {
  let env = new ObjectEnvironmentRecord()
  env.bindingObject = o
  env.isWithStatement = w
  env.outerEnv = e

  return env
}

function newFunctionEnvironment(
    f: FunctionObject | FunctionObjectSimple | any, 
    newTarget: Object | undefined
  ) {
  let env = new FunctionEnvironmentRecord()
  env.functionObject = f
  if(f.thisMode === 'lexical') env.thisBindingStatus = 'lexical'
  else env.thisBindingStatus = 'uninitialized'

  env.newTarget = newTarget
  env.outerEnv = f.environment

  return env
}

function newGlobalEnvironment(g: Object, thisValue: any) {
  let objRec = newObjectEnvironment(g , false , null)
  let decRec = newDeclarativeEnvironment(null)
  let env = new GlobalEnvironmentRecord()

  env.objectRecord = objRec
  env.declarativeRecord = decRec
  env.globalThisValue = thisValue
  env.varNames = []
  env.outerEnv = null

  return env
}

function newPrivateEnvironment(outerPrivEnv: PrivateEnvironmentRecord | null) {
  let names = []
  let env = new PrivateEnvironmentRecord()
  env.outerPrivateEnvironment = outerPrivEnv, env.names = names
  return env
}

function resolvePrivateIdentifier(privEnv: PrivateEnvironmentRecord | null, identifier: string) {
  if(privEnv === null) return 

  let names = privEnv.names
  for(let name of names) {
    if(name === identifier) return name
  }

  return resolvePrivateIdentifier(privEnv.outerPrivateEnvironment , identifier)
}

export {
  newDeclarativeEnvironment,
  newObjectEnvironment,
  newFunctionEnvironment,
  newGlobalEnvironment,
  getIdentifierReference,
  newPrivateEnvironment,
  resolvePrivateIdentifier,
  ReferenceRecord
}