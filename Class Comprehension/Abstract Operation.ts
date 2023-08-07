import { agent } from "../Closure Comprehension/Agent"
import { ECMAScriptCodeExecutionContext, ExecutionContext, getGlobalObject, resolveBinding } from "../Closure Comprehension/ExecutionContext"
import { ReferenceRecord, newDeclarativeEnvironment, newPrivateEnvironment } from "../Environment Records/Environment Record Operations"
import { EnvironmentRecord, FunctionEnvironmentRecord, GlobalEnvironmentRecord } from "../Environment Records/Environment Records"
import { FunctionObject , ordinaryFunctionCreate , prepareForOrdinaryCall } from "../Object/FunctionObject"

function makeBasicObject(internalSlotsList) {
  let obj = new Object()
  for(let k in internalSlotsList) obj[k] // internal slot
  if(internalSlotsList.includes('Extensible')) obj['[[Extensible]]'] = true
  return obj
}

function ordinaryObjectCreate(proto , additionalInternalSlotsList = []) {
  let internalSlotsList = ['Prototype' , 'Extensible']
  internalSlotsList = [...internalSlotsList , ...additionalInternalSlotsList]
  let o = makeBasicObject(internalSlotsList)
  o['[[Prototype]]'] = proto
  return o
}

function ordinaryCallBindThis(f: FunctionObject , calleeContext: ECMAScriptCodeExecutionContext , thisArgument: any) {
  let thisMode = f["[[ThisMode]]"]
  if(thisMode === 'lexical') return 

  let calleeRealm = f["[[Realm]]"]
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

export function initializeInstanceElements(o: Object , constructor: FunctionObject) {
  // omit private methods 
  let fields = constructor["[[Fields]]"]
  for(let fieldRecord of fields) {
    defineField(o , fieldRecord)
  }
}


function isUnresolvableReference(v: ReferenceRecord) {
  return v.base === 'unresolvable'
}

function isPropertyReference(v: ReferenceRecord) {
  if(v.base === 'unresolvable' || v.base instanceof EnvironmentRecord) return false
  return true
}

function putValue(v: ReferenceRecord , w: any) {
  if(!(v instanceof ReferenceRecord)) throw ReferenceError()
  if(isUnresolvableReference(v)) {
    if(!v.strict) {
      let globalObj = getGlobalObject() as Object
      globalObj[v.referenceName] = w
      return 
    }else throw ReferenceError()
  }
  if(isPropertyReference(v)) {
    // omit private property
    let baseObj = Object(v.base)
    try {
      baseObj[v.referenceName] = w
    } catch (error) {
      throw new ReferenceError()
    }
    return 
  }else {
    let base = v.base as EnvironmentRecord
    // base is Environment Record
    base.setMutableBinding(v.referenceName , w , v.strict)
  }
}

function initializeBoundName(name , value , environment) {
  if(environment !== undefined) environment.initializeBinding(name , value)
  else {
    let lhs = resolveBinding(name)
    putValue(lhs , value)
  }
}


// Execution class expression 
function bindingClassDeclarationEvaluation() {
  let className = 'StringValue of BindingIdentifier'
  let value = classDefinitionEvaluation(className , className)
  let env = (agent.runningExecutionContext as ECMAScriptCodeExecutionContext).lexicalEnvironment
  initializeBoundName(className , value , env)
  return value
}

function isStatic(v: any) {
  return v.static // static a = 123; static func() {}; return true
}

export class ClassFieldDefinitionRecord {
  name: String
  initializer: FunctionObject

  constructor(name , initializer) {
    this.name = name
    this.initializer = initializer
  }
}

class ClassStaticBlockDefinitionRecord {
  // omit static block situation...
}

function makeMethod(F , homeObject) {
  F.homeObject = homeObject
  return undefined
}

function defineField(receiver , fieldRecord: ClassFieldDefinitionRecord) {
  let fieldName = fieldRecord.name
  let initializer = fieldRecord.initializer

  let initValue

  if(initializer) {
    initValue = initializer["[[Call]]"](receiver)
  }
  // omit private name

  if(typeof fieldName === 'string' || typeof fieldName === 'symbol') {
    Object.defineProperty(receiver , fieldName , {
      value: initValue,
      writable: true,
      enumerable: true,
      configurable: true
    })
  }
}

// The function created for initializer is never directly accessible to ECMAScript code.
function classFieldDefinitionEvaluation(homeObject) {
  let name = 'ClassElementName'
  let context = (agent.runningExecutionContext) as ECMAScriptCodeExecutionContext
  let env = context.lexicalEnvironment
  let privateEnv = context.privateEnvironment
  let initializer
  
  if('Initializeropt is present') {
    initializer = ordinaryFunctionCreate(
      Function.prototype,
      'sourceText',
      [],
      '= AssignmentExpression',
      'non-lexical-this',
      env,
      privateEnv
    )
    makeMethod(initializer , homeObject)
  } else initializer = undefined

  initializer['[[ClassFieldInitializerName]]'] = name

  return new ClassFieldDefinitionRecord(name , initializer)  
}

function defineMethod(object , functionPrototype?) {
  // MethodDefinition : ClassElementName ( UniqueFormalParameters ) { FunctionBody }
  let propKey = 'ClassElementName'
  let context = (agent.runningExecutionContext) as ECMAScriptCodeExecutionContext
  let env = context.lexicalEnvironment
  let privateEnv = context.privateEnvironment
 
  let prototype
  if(functionPrototype) prototype = functionPrototype
  else prototype = Function.prototype
  
  let closure = ordinaryFunctionCreate(
    prototype,
    'sourceText',
    ['UniqueFormalParameters'],
    'FunctionBody',
    'non-lexical-this',
    env,
    privateEnv
  )

  return {
    ['[[Key]]']: propKey,
    ['[[Closure]]']: closure
  }
 
}

function setFunctionName(F: FunctionObject, name: string | Symbol, prefix?: string) {
  if(typeof name === 'symbol') {
    let description = name['[[Description]]']
    if(description === undefined) name = ''
    else name = `[${description}]`
  } else if('name is a Private Name') {
    name = name['[[Description]]']
  }

  if(F['[[InitialName]]']) F['[[InitialName]]'] = name
  if(prefix) {
    name = prefix + ' ' + name
    if(F['[[InitialName]]']) F['[[InitialName]]'] = name
  }

  Object.defineProperty(F , 'name' , {
    value: name,
    writable: false,
    enumerable: false,
    configurable: true
  })
  
  return undefined

}

function defineMethodProperty(homeObject , key , closure , enumerable) {
  // Omit private situation ... 

  Object.defineProperty(homeObject , key , {
    value: closure,
    writable: true,
    enumerable,
    configurable: true
  })

  return undefined
}

function methodDefinitionEvaluation(object , enumerable) {
  let methodDef = defineMethod(object)
  setFunctionName(methodDef["[[Closure]]"] , methodDef["[[Key]]"])      
  defineMethodProperty(object , methodDef['[[Key]]'] , methodDef["[[Closure]]"] , enumerable)
}

function classElementEvaluation(object: any) {
  // property and static property
  if('ClassElement is [static] FieldDefinition') return classFieldDefinitionEvaluation(object) 
  // method and static method
  else if('ClassElement is [static] MethodDefinition') return methodDefinitionEvaluation(object , false)
}

function classDefinitionEvaluation(classBinding: string | undefined , className: string) {
  let runningExecutionContext = agent.runningExecutionContext as ECMAScriptCodeExecutionContext
  let env = runningExecutionContext.lexicalEnvironment
  let classEnv = newDeclarativeEnvironment(env)

  if(classBinding !== undefined) classEnv.createImmutableBinding(classBinding , true)

  let outerPrivateEnvironment = runningExecutionContext.privateEnvironment
  let classPrivateEnvironment = newPrivateEnvironment(outerPrivateEnvironment)

  // bind class elements to privateEnvironment
  for(let dn of ['private bound identifiers of class body']) {
    // if(!classPrivateEnvironment.names.includes(dn))
    classPrivateEnvironment.names.push(dn)
  }

  let protoParent , constructorParent

  if('ClassHeritage is not present') {
    protoParent = Object.prototype
    constructorParent = Function.prototype
  }else {
    runningExecutionContext.lexicalEnvironment = classEnv
    // b. NOTE: The running execution context's PrivateEnvironment is outerPrivateEnvironment when evaluating ClassHeritage.

    // handle extends statement.
    let superClass = new Function('GetValue(Evaluation of ClassHeritage)')

    if(superClass === null) {
      protoParent = null
      constructorParent = Function.prototype
    }else if(Boolean('IsConstructor(superclass)') === false) {
      throw new TypeError()
    }else {
      protoParent = superClass.prototype
      if(typeof protoParent !== 'object' && protoParent !== null) throw new TypeError()
      constructorParent = superClass
    }
  }

  let proto = ordinaryObjectCreate(protoParent)

  let constructor = new Function('ClassBody.constructor || undefined')

  runningExecutionContext.lexicalEnvironment = classEnv
  runningExecutionContext.privateEnvironment = classPrivateEnvironment

  let F: FunctionObject

  if(constructor === undefined) {
    if('ClassHeritage') F = 'constructor(...args) { super(...args) }'
    else F = 'constructor() {}'
  }else {
    // 

    F = ordinaryFunctionCreate(
      constructorParent,
      'source text of constructor',
      ['function parameters'],
      '{function Code}' , 
      'non-lexical-this' , 
      env,
      classPrivateEnvironment
    )

    F["[[HomeObject]]"] = proto
    F["[[IsClassConstructor]]"] = true
    F['[[name]]'] = className
    F["[[Construct]]"] = ''    
  }

  Object.defineProperty(F , 'prototype' , {
    value: proto,
    writable: false,
    enumerable: false,
    configurable: false
  })

  if('ClassHeritage') F["[[ConstructorKind]]"] = 'derived'
  
  Object.defineProperty(proto , 'constructor' , {
    value: F,
    writable: true,
    enumerable: false,
    configurable: true
  })
  
  let elements

  if(!'ClassBody') elements = []
  else elements = ['Elements of ClassBody without Constructor'] 

  let instancePrivateMethods = []
  let staticPrivateMethods = []

  type StaticOrBlockFieldRecord = ClassFieldDefinitionRecord | ClassStaticBlockDefinitionRecord
  let instanceFields: ClassFieldDefinitionRecord[] = []
  let staticElements: StaticOrBlockFieldRecord[] = []

  // handle class elements
  for(let e of elements) {
    let element

    if(!isStatic(e)) {
      element = classElementEvaluation(proto)
    }else {
      element = classElementEvaluation(F)
    }

    if('element is an abrupt completion') {
      runningExecutionContext.lexicalEnvironment = env
      runningExecutionContext.privateEnvironment = outerPrivateEnvironment
      return element
    }

    // omit private field definition situation...

    if(element instanceof ClassFieldDefinitionRecord) {
      if(!isStatic(e)) instanceFields.push(element)
      else staticElements.push(element)
    }else if(element instanceof ClassStaticBlockDefinitionRecord) {
      staticElements.push(element)
    }
  }

  runningExecutionContext.lexicalEnvironment = env
  if(classBinding === undefined) classEnv.initializeBinding('classBinding' , F)

  F['[[PrivateMethods]]'] = instancePrivateMethods
  F['[[Fields]]'] = instanceFields

  for(let privateElement of staticPrivateMethods) {
    // omit private element 
  }

  try {
    for(let elementRecord of staticElements) {
      if(elementRecord instanceof ClassFieldDefinitionRecord) {
        defineField(F , elementRecord)
      }else {
        // ClassStaticBlockDefinitionRecord
        // Call(elementRecord.[[BodyFunction]], F)
      }
    }
  } catch (error) {
    runningExecutionContext.privateEnvironment = outerPrivateEnvironment
  }

  runningExecutionContext.privateEnvironment = outerPrivateEnvironment
  
  return F
}



// Construct

function getPrototypeFromConstructor (constructor , intrinsicDefaultProto) {
  let proto = constructor.prototype
  if(typeof proto !== 'object') {
    // Set proto to realm's intrinsic object named intrinsicDefaultProto.
  }
  return proto
}

function ordinaryCreateFromConstructor(constructor , intrinsicDefaultProto , internalSlotsList?) {
  let proto = getPrototypeFromConstructor(constructor , intrinsicDefaultProto)
  let slotList = []
  if(internalSlotsList) slotList = internalSlotsList
  return ordinaryObjectCreate(proto , slotList)
}

type Constructor = any

function construct(F: FunctionObject , argumentList: string[] , newTarget: Constructor) {
  const callerContext = agent.runningExecutionContext as ECMAScriptCodeExecutionContext
  let kind = F["[[ConstructorKind]]"]
  let thisArgument

  if(kind === 'base') thisArgument = ordinaryCreateFromConstructor(newTarget , Object.prototype)

  let calleeContext = prepareForOrdinaryCall(F , newTarget)

  if(kind === 'base') {
    ordinaryCallBindThis(F , calleeContext , thisArgument)

    // initialize no-static class property
    let initializeResult
    try {
      initializeResult = initializeInstanceElements(thisArgument , F)
    } catch (error) {
      agent.executionContextStack.pop()
      agent.runningExecutionContext = callerContext
      return initializeResult
    }
  }

  let constructorEnv = calleeContext.lexicalEnvironment as FunctionEnvironmentRecord
  
  // this step include super() statement
  let result = 'OrdinaryCallEvaluateBody(F, argumentsList)' // functionDeclarationInstantiation -> evaluate function body

  agent.executionContextStack.pop()
  agent.runningExecutionContext = callerContext

  // constructor has return statement situation
  if(result['[[Type]]'] === 'return') {
    if(typeof result['[[Value]]'] === 'object') return result['[[Value]]']
    if(kind === 'base') return thisArgument
    if(result['[[Value]]'] === undefined) throw new TypeError()
  }
  // Else, ReturnIfAbrupt(result).

  let thisBinding = constructorEnv.getThisBinding()
  return thisBinding
} 


