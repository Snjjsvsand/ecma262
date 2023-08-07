import { ClassFieldDefinitionRecord, initializeInstanceElements } from '../Class Comprehension/Abstract Operation'
import { agent } from '../Closure Comprehension/Agent'
import { ECMAScriptCodeExecutionContext, ExecutionContext } from '../Closure Comprehension/ExecutionContext'
import { RealmRecord } from '../Closure Comprehension/Realm'
import { newFunctionEnvironment } from '../Environment Records/Environment Record Operations'
import { EnvironmentRecord, FunctionEnvironmentRecord, GlobalEnvironmentRecord, PrivateEnvironmentRecord } from '../Environment Records/Environment Records'
import { CompletionRecord } from '../Specification Types'
import { OrdinaryObject, ordinaryCreateFromConstructor, ordinaryObjectCreate } from './OrdinaryObject'

/*
 !! FunctionObject is not a subclass of OrdinaryObject
    FunctionObject and OrdinaryObject both part of Object.
    FunctionObject is a OridnaryObject and has the same internal slots and the same internal methods as OrdinaryObject. 
    However, FunctionObject has additional internal methods such as call and construct.

    Using keyword extends is just for convenience.
*/
export class FunctionObject extends OrdinaryObject{

    ['[[Call]]']

    ['[[Construct]]']

    /* 
        The Environment field point to outer environment when evaluating FunctionDeclaration: 
        FunctionDeclaration : function BindingIdentifier ( FormalParameters ) { FunctionBody }
        The expression will call OrdinaryFunctionCreate to create a FunctionObject and save LexicalEnvironment
        in Environment field , it is the key factor of "closure". 
    */
    ['[[Environment]]']: EnvironmentRecord

    ['[[PrivateEnvironment]]']: PrivateEnvironmentRecord | null

    ['[[FormalParameters]]']
    ['[[ECMAScriptCode]]']

    ['[[ConstructorKind]]']: 'base' | 'derived'

    ['[[Realm]]']: RealmRecord

    ['[[ScriptOrModule]]']

    /*
        ThisMode field have an impact on the value of keyword this.
    */
    ['[[ThisMode]]']: 'lexical' | 'strict' | 'global'

    ['[[Strict]]']: Boolean

    ['[[HomeObject]]']: Object | undefined

    ['[[SourceText]]']

    // This field representing the non-static fields and initializers of a class.
    ['[[Fields]]']: ClassFieldDefinitionRecord[]

    ['[[PrivateMethods]]']

    ['[[ClassFieldInitializerName]]']

    ['[[IsClassConstructor]]']
}


export function ordinaryFunctionCreate(functionPrototype: Object, 
    sourceText: string , 
    parameterList: any[] , 
    body: string , 
    thisMode: 'lexical-this' | 'non-lexical-this' , 
    env: EnvironmentRecord , 
    privateEnv: PrivateEnvironmentRecord
): FunctionObject {
    let internalSlotsList = [
        '[[Environment]]',
        '[[PrivateEnvironment]]',
        '[[FormalParameters]]',
        '[[ECMAScriptCode]]',
        '[[ConstructorKind]]',
        '[[Realm]]',
        '[[ScriptOrModule]]',
        '[[ThisMode]]',
        '[[Strict]]',
        '[[HomeObject]]',
        '[[SourceText]]',
        '[[Fields]]',
        '[[PrivateMethods]]',
        '[[ClassFieldInitializerName]]',
        '[[IsClassConstructor]]',
    ]

    let F = ordinaryObjectCreate(functionPrototype , internalSlotsList) as FunctionObject
    
    F['[[Call]]'] = call
    F['[[SourceText]]'] = sourceText
    F['[[FormalParameters]]'] = parameterList
    F['[[ECMAScriptCode]]'] = body

    if(body.includes('use strict')) F['[[Strict]]'] = true
    else F['[[Strict]]'] = false

    if(thisMode === 'lexical-this') F['[[ThisMode]]'] = 'lexical'
    else if(F['[[Strict]]']) F['[[ThisMode]]'] = 'strict'
    else F['[[ThisMode]]'] = 'global'

    F['[[IsClassConstructor]]'] = false

    // save outer EnvironmentRecord
    F['[[Environment]]'] = env
    F['[[PrivateEnvironment]]'] = privateEnv

    // Set F.[[ScriptOrModule]] to GetActiveScriptOrModule().
    // Set F.[[Realm]] to the current Realm Record.
    F['[[HomeObject]]'] = undefined
    F['[[Fields]]'] = []
    F['[[PrivateMethods]]'] = []
    F['[[ClassFieldInitializerName]]'] = undefined

    Object.defineProperty(F , length , {
        value: parameterList.length,
        writable: false,
        enumerable: false,
        configurable: true
    })

    return F
}

export function call(thisArgument , argumentList) {
    let callerContext = agent.runningExecutionContext

    // create new execution context and push to stack
    let calleeContext = prepareForOrdinaryCall(this as FunctionObject , undefined)

    // if（F.isClassConstructor) omit

    // bind this
    oridnaryCallBindThis(this as FunctionObject , calleeContext , thisArgument)

    // evaluate body
    let res = ordinaryCallEvaluateBody(this as FunctionObject , argumentList)

    return res
}

export function prepareForOrdinaryCall(f: FunctionObject , newTarget: any) {
    let callerContext = agent.runningExecutionContext // suspend
    let calleeContext = new ECMAScriptCodeExecutionContext()
  
    calleeContext.function = f
    calleeContext.realm = f['[[Realm]]']
    calleeContext.scriptOrModule = f['[[ScriptOrModule]]']
  
  
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
    calleeContext.privateEnvironment = f['[[PrivateEnvironment]]']
  
    agent.executionContextStack.push(calleeContext)
    agent.runningExecutionContext = calleeContext
  
    return calleeContext
}

export function oridnaryCallBindThis(f: FunctionObject , calleeContext: ECMAScriptCodeExecutionContext , thisArgument: any) {
    let thisMode = f['[[ThisMode]]']
    if(thisMode === 'lexical') return 
  
    let calleeRealm = f['[[Realm]]']
    let localEnv = calleeContext.lexicalEnvironment as FunctionEnvironmentRecord
  
    let thisValue
    if(thisMode === 'strict') thisValue = thisArgument
    else {
      if(thisArgument === undefined || thisArgument === null) {
        let globalEnv = calleeRealm.globalEnv as GlobalEnvironmentRecord
        thisValue = globalEnv.globalThisValue
      }else thisValue = Object(thisArgument)
    }
  
    // 7. Assert: localEnv is a Function Environment Record.
    // 8. Assert: The next step never returns an abrupt completion because localEnv.[[ThisBindingStatus]] is not initialized.
    localEnv.bindThisValue(thisValue)
}

export function ordinaryCallEvaluateBody(F: FunctionObject , argumentList) {
    //  EvaluateBody of F.[[ECMAScriptCode]] with arguments F and argumentsList.
    return new CompletionRecord()
}

export function construct(this: FunctionObject , argumentList , newTarget) {
    let callerContext = agent.runningExecutionContext as ECMAScriptCodeExecutionContext
    let kind = this['[[ConstructorKind]]']
    let thisArgument
    
    if(kind === 'base') {
        thisArgument = ordinaryCreateFromConstructor(newTarget , 'Object.prototype')
    }
    let calleeContext = prepareForOrdinaryCall(this , newTarget) 

    if(kind === 'base') {
        oridnaryCallBindThis(this , calleeContext , thisArgument)
        let initializeResult
        try {
            initializeResult = initializeInstanceElements(thisArgument , this)
        } catch (error) {
            agent.executionContextStack.pop()
            agent.runningExecutionContext = callerContext
            return initializeResult
        }
    }

    let constructorEnv = callerContext.lexicalEnvironment as FunctionEnvironmentRecord

    // this step include constructor body statments execution like super()
    let result = ordinaryCallEvaluateBody(this , argumentList)

    if(result['[[Type]]'] === 'return') {
        if(typeof result['[[Value]]'] === 'object') return result['[[Value]]']
        if(kind === 'base') return thisArgument
        if(result['[[Value]]'] !== undefined) throw new TypeError()
    }

    let thisBinding = constructorEnv.getThisBinding()
    // Assert: thisBinding is an Object.
    return thisBinding
}


function OrdinaryFunctionCreate(
    functionPrototype: Object, 
    sourceText: string , 
    parameterList: any[] , 
    body: string , 
    thisMode: 'lexical-this' | 'non-lexical-this' , 
    env: EnvironmentRecord , 
    privateEnv: PrivateEnvironmentRecord
): FunctionObject {

}