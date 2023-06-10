import { DeclarativeEnvironmentRecord, EnvironmentRecord, FunctionEnvironmentRecord, ObjectEnvironmentRecord } from './Environment Records'

class ReferenceRecord {
  constructor(
    public base: EnvironmentRecord | 'unresolvable',
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
    f: Function & {homeObject: {getPrototypeOf: Function} , thisMode: 'lexical' | string , environment: EnvironmentRecord} , 
    newTarget: Object | undefined
  ) {
  let env = new FunctionEnvironmentRecord
  env.functionObject = f
  if(f.thisMode === 'lexical') env.thisBindingStatus = 'lexical'
  else env.thisBindingStatus = 'uninitialized'

  env.newTarget = newTarget
  env.outerEnv = f.environment

  return env
}
