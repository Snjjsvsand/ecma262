import { EnvironmentRecord, FunctionEnvironmentRecord, PrivateEnvironmentRecord } from "../Environment Records/Environment Records";
import { newFunctionEnvironment } from "../Environment Records/Environment Record Operations";
import { ECMAScriptCodeExecutionContext } from "./ExecutionContext";
import { RealmRecord } from "./Realm";
import { agent } from "./Agent";
import { functionDeclarationInstantiation } from "./DeclarationInstantiation";


class FunctionObject {
  call: Function
  construct: Object
  constructorKind: 'base' | 'derived'
  sourceText: String
  formalParameters: Array<any>
  ECMAScriptCode: string
  strict: Boolean
  thisMode: 'lexical' | 'strict' | 'global'
  isClassConstructor: Boolean
  environment: EnvironmentRecord
  privateEnvironment: PrivateEnvironmentRecord | null
  scriptOrModule: any
  realm: RealmRecord
  fields: Array<any>
  privateMethod: Array<any>
  classFieldInitializerName: any
  length: number
  name: string
  
  ['[[Prototype]]']: any
  homeObject: Object | undefined

  constructor(proto) {
    this['[[Prototype]]'] = proto
  }
}



function call(thisArgument , argumentList) {
  let f = this as FunctionObject
  let callerContext = agent.runningExecutionContext
  
  // Now calleeContext is the running execution context.
  let calleeContext = prepareForOrdinaryCall(f , undefined)

  if(f.isClassConstructor) {
    // ...
  }

  ordinaryCallBindThis(f , calleeContext , thisArgument)

  let result = ordinaryCallEvaluationBody(f , argumentList) as any

  agent.executionContextStack.pop()
  agent.executionContextStack.push(callerContext)
  agent.runningExecutionContext = callerContext

  if(result.value) return result.value
}

function prepareForOrdinaryCall(f: FunctionObject , newTarget: any) {
  let callerContext = agent.runningExecutionContext // suspend
  let calleeContext = new ECMAScriptCodeExecutionContext()

  calleeContext.function = f
  calleeContext.realm = f.realm
  calleeContext.scriptOrModule = f.scriptOrModule


  /*
    This step contains partial core of closure，
    this new local environment's outerEnv is a pointer to function object's environment
    where the function object instantiated.

    newFunctionEnvironment(f: FunctionObject , newTarget: any) {
      ...
      let env = new FunctionEnvironmentRecord()
      env.outerEnv = f.environment
    }
  */
  let localEnv = newFunctionEnvironment(f , newTarget)

  calleeContext.lexicalEnvironment = localEnv
  calleeContext.variableEnvironment = localEnv
  calleeContext.privateEnvironment = f.privateEnvironment

  agent.executionContextStack.push(calleeContext)
  agent.runningExecutionContext = calleeContext

  return calleeContext
}

function ordinaryFunctionCreate(functionPrototype , sourceText , parameterList , body: string , thisMode , env , privateEnv) {
  let f = new FunctionObject(functionPrototype)
  f.call = call
  f.sourceText = sourceText
  f.formalParameters = parameterList
  f.ECMAScriptCode = body as string
  let strict = body.includes('use strict')
  f.strict = strict
  
  // thisMode 
  if(thisMode === 'lexical') f.thisMode = 'lexical'
  else if (strict) f.thisMode = 'strict'
  else f.thisMode = 'global'

  f.isClassConstructor = false
  f.environment = env
  f.privateEnvironment = privateEnv

  // 15. Set F.[[ScriptOrModule]] to GetActiveScriptOrModule().
  // 16. Set F.[[Realm]] to the current Realm Record.

  f.homeObject = undefined
  f.fields = []
  f.privateMethod = []
  let len = parameterList.length as number
  f.length = len

  return f
}

function instantiateOrdinaryFunctionObject(env: EnvironmentRecord , privateEnv: PrivateEnvironmentRecord | null): FunctionObject {
  let name = 'functionName'
  let sourceText = 'functtion functionName(function parameters) {function Code}'
  let f = ordinaryFunctionCreate(
    Function.prototype , 
    sourceText , 
    ['function parameters'] , 
    '{function Code}' , 
    'non-lexical-this' , 
    env, 
    privateEnv
  ) 
  // 5. Perform MakeConstructor(F).
  f.name = name
  return f
}

function instantiateFunctionObject(env: EnvironmentRecord , privateEnv: PrivateEnvironmentRecord | null) {
  return instantiateOrdinaryFunctionObject(env , privateEnv)
}

function ordinaryCallBindThis(f: FunctionObject, calleeContext: ECMAScriptCodeExecutionContext, thisArgument: any) {
  let thisMode = f.thisMode
  if(thisMode === 'lexical') return 

  let calleeRealm = f.realm
  let localEnv = calleeContext.lexicalEnvironment as FunctionEnvironmentRecord
  let thisValue

  if(thisMode === 'strict') thisValue = thisArgument
  else {
    if(thisArgument === null || thisArgument === undefined) {
      let globalEnv = calleeRealm.globalEnv
      thisValue = globalEnv?.globalThisValue
    }else {
      thisValue = Object(thisArgument)
    }
  }

  localEnv.bindThisValue(thisValue)
} 

function ordinaryCallEvaluationBody(f: FunctionObject, argumentList: any) {
  functionDeclarationInstantiation(f , argumentList)
  //Return ?Evaluation of FunctionStatementList.
}


export {
  FunctionObject,
  instantiateFunctionObject,
  ordinaryFunctionCreate,
  prepareForOrdinaryCall,
  call
}